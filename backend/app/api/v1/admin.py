from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.document import Document
from app.models.prescription import Prescription
from app.schemas.auth import UserResponse
from app.schemas.patient import PatientResponse
from app.schemas.consultation import ConsultationResponse
from app.schemas.document import DocumentResponse
from app.schemas.prescription import PrescriptionResponse
from app.core.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Oversight"])

@router.get("/doctors", response_model=List[UserResponse])
def get_all_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(User).filter(User.role == "DOCTOR").all()

@router.get("/doctors/{doctor_id}", response_model=UserResponse)
def get_doctor_detail(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    doc = db.query(User).filter(User.id == doctor_id, User.role == "DOCTOR").first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doc

@router.get("/patients", response_model=List[PatientResponse])
def get_all_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(Patient).filter(Patient.deleted_at.is_(None)).all()

@router.get("/consultations", response_model=List[ConsultationResponse])
def get_all_consultations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(Consultation).filter(Consultation.deleted_at.is_(None)).all()

@router.get("/documents", response_model=List[DocumentResponse])
def get_all_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(Document).all()

@router.get("/prescriptions", response_model=List[PrescriptionResponse])
def get_all_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(Prescription).all()
