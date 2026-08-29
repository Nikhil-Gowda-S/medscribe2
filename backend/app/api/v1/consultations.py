from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.doctor_patient import DoctorPatient
from app.schemas.consultation import ConsultationCreate, ConsultationUpdate, ConsultationResponse
from app.core.deps import get_current_user, require_doctor, require_doctor_patient_access
from app.services.stt_service import transcribe_audio_file
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/consultations", tags=["Consultations"])

@router.get("", response_model=List[ConsultationResponse])
def list_consultations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Consultation)
    
    if current_user.role == "ADMIN":
        return query.filter(Consultation.deleted_at.is_(None)).all()
    elif current_user.role == "DOCTOR":
        return query.filter(Consultation.doctor_id == current_user.id, Consultation.deleted_at.is_(None)).all()
    elif current_user.role == "PATIENT":
        if not current_user.patient_id:
            return []
        return query.filter(Consultation.patient_id == current_user.patient_id, Consultation.deleted_at.is_(None)).all()
    
    return []

@router.post("", response_model=ConsultationResponse)
def create_consultation(
    cons_in: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    patient = db.query(Patient).filter(Patient.id == cons_in.patient_id, Patient.deleted_at.is_(None)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    require_doctor_patient_access(db, current_user.id, patient.id)

    consultation = Consultation(
        patient_id=cons_in.patient_id,
        doctor_id=current_user.id,
        transcript=cons_in.transcript or "",
        status="in_progress"
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    log_audit_event(db, current_user.id, "create_consultation", "Consultation", consultation.id, "Initiated consultation encounter")
    return consultation

@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.deleted_at.is_(None)).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if current_user.role == "PATIENT" and consultation.patient_id != current_user.patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "DOCTOR" and consultation.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return consultation

@router.post("/{consultation_id}/audio", response_model=ConsultationResponse)
async def upload_consultation_audio(
    consultation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.deleted_at.is_(None)).first()
    if not consultation or consultation.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consultation not found")

    allowed_extensions = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".mp4"}
    extension = (file.filename or "").lower().rsplit(".", 1)
    extension = f".{extension[-1]}" if len(extension) == 2 else ""
    if extension not in allowed_extensions or not (file.content_type or "").startswith("audio/"):
        raise HTTPException(status_code=400, detail="Upload a supported audio file")
    contents = await file.read()
    if not contents or len(contents) > 4 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file must be between 1 byte and 4 MB")
    transcript_text = transcribe_audio_file(contents, file.filename)
    
    consultation.transcript = transcript_text
    consultation.transcription_status = "completed"
    db.commit()
    db.refresh(consultation)

    log_audit_event(db, current_user.id, "upload_audio", "Consultation", consultation.id, "Uploaded audio and transcribed")
    return consultation
