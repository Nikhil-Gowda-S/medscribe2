from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentGenerateRequest(BaseModel):
    consultation_id: str
    template_id: Optional[str] = None
    document_type: str = "SOAP Note" # SOAP Note | Discharge Summary | Case Sheet
    instructions: Optional[str] = None

class DocumentUpdate(BaseModel):
    content: str

class AddendumCreate(BaseModel):
    content: str

class DocumentAddendumResponse(BaseModel):
    id: str
    author_id: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    consultation_id: str
    patient_id: str
    doctor_id: str
    template_id: Optional[str] = None
    type: str
    content: str
    metadata_json: Optional[str] = None
    accepted_icd10_codes: Optional[str] = None
    accepted_cpt_codes: Optional[str] = None
    pdf_url: Optional[str] = None
    status: str
    is_finalized: bool
    finalized_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    addendums: List[DocumentAddendumResponse] = []

    class Config:
        from_attributes = True

class ClinicalFactExtract(BaseModel):
    chief_complaint: Optional[str] = "Not documented"
    history_of_present_illness: Optional[str] = "Not documented"
    past_medical_history: Optional[str] = "Not documented"
    medications: List[str] = []
    allergies: List[str] = []
    examination: List[str] = []
    investigations: List[str] = []
    assessment: List[str] = []
    plan: List[str] = []
    follow_up: Optional[str] = "Not documented"
