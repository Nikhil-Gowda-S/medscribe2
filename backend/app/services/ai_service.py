import json
import httpx
from typing import Optional
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.document import ClinicalFactExtract

SYSTEM_STRICT_PROMPT = """You are an expert AI clinical documentation assistant.
CRITICAL MANDATE:
1. You must ONLY extract facts directly supported by the source transcript.
2. DO NOT invent, infer, or extrapolate symptoms, examination findings, diagnoses, medications, dosages, or follow-up plans that are NOT present in the transcript.
3. If a section or detail is missing from the transcript, write explicitly: "Not documented".
4. Output must be concise, clinically structured, and evidence-grounded.
"""

def generate_llm_completion(system_prompt: str, user_prompt: str, is_json: bool = False) -> str:
    """Uses Groq API (Llama 3.3) and enforces structured extraction."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "dummy_key":
        raise HTTPException(status_code=500, detail="AI generation service not configured. Please set GROQ_API_KEY.")

    try:
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "openai/gpt-oss-20b",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1
        }
        if is_json:
            payload["response_format"] = {"type": "json_object"}
            
        with httpx.Client(timeout=30.0) as client:
            res = client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"]
            raise HTTPException(status_code=502, detail="AI provider could not generate a document")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Groq API call error: {e}")
        raise HTTPException(status_code=502, detail="AI generation service is temporarily unavailable")


def generate_clinical_document(
    transcript: str,
    template_body: Optional[str] = None,
    doc_type: str = "SOAP Note",
    patient_name: str = "",
    doctor_name: str = "",
    consultation_date: str = "",
) -> str:
    user_prompt = f"""Transcribed Patient Encounter Transcript:
\"\"\"
{transcript}
\"\"\"

Extract the clinical facts and return a structured JSON object strictly matching this schema:
{{
    "chief_complaint": "string or 'Not documented'",
    "history_of_present_illness": "string or 'Not documented'",
    "past_medical_history": "string or 'Not documented'",
    "medications": ["string"],
    "allergies": ["string"],
    "examination": ["string"],
    "investigations": ["string"],
    "assessment": ["string"],
    "plan": ["string"],
    "follow_up": "string or 'Not documented'"
}}
"""
    
    raw_json = generate_llm_completion(SYSTEM_STRICT_PROMPT, user_prompt, is_json=True)
    try:
        parsed_data = json.loads(raw_json)
        # Validate against schema
        facts = ClinicalFactExtract(**parsed_data)
        
        # Render into markdown template
        if template_body:
            doc_str = template_body
            values = facts.model_dump()
            values.update({
                "chiefComplaint": facts.chief_complaint,
                "historyOfPresentIllness": facts.history_of_present_illness,
                "pastMedicalHistory": facts.past_medical_history,
                "followUp": facts.follow_up,
                "patientName": patient_name,
                "doctorName": doctor_name,
                "consultationDate": consultation_date,
            })
            for key, val in values.items():
                val_str = "\\n- ".join(val) if isinstance(val, list) and val else (str(val) if not isinstance(val, list) else "Not documented")
                doc_str = doc_str.replace(f"{{{{{key}}}}}", val_str)
            return doc_str
        else:
            # Default rendering
            meds = "\\n- ".join(facts.medications) if facts.medications else "Not documented"
            allergies = "\\n- ".join(facts.allergies) if facts.allergies else "Not documented"
            exam = "\\n- ".join(facts.examination) if facts.examination else "Not documented"
            inv = "\\n- ".join(facts.investigations) if facts.investigations else "Not documented"
            ass = "\\n- ".join(facts.assessment) if facts.assessment else "Not documented"
            plan = "\\n- ".join(facts.plan) if facts.plan else "Not documented"
            
            return f"""CHIEF COMPLAINT\n{facts.chief_complaint}\n\nHISTORY OF PRESENT ILLNESS\n{facts.history_of_present_illness}\n\nPAST MEDICAL HISTORY\n{facts.past_medical_history}\n\nMEDICATIONS\n- {meds}\n\nALLERGIES\n- {allergies}\n\nEXAMINATION\n- {exam}\n\nINVESTIGATIONS\n- {inv}\n\nASSESSMENT\n- {ass}\n\nPLAN\n- {plan}\n\nFOLLOW-UP\n{facts.follow_up}"""
    except Exception as e:
        print(f"Failed to parse JSON or render doc: {e}")
        raise HTTPException(status_code=502, detail="AI returned an invalid clinical-document format. Please retry generation.")
