from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.consultation import Consultation
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse
from app.core.deps import get_current_user, require_doctor, require_doctor_patient_access
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("", response_model=List[PrescriptionResponse])
def list_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "ADMIN":
        return db.query(Prescription).all()
    elif current_user.role == "DOCTOR":
        return db.query(Prescription).filter(Prescription.doctor_id == current_user.id).all()
    elif current_user.role == "PATIENT":
        if not current_user.patient_id:
            return []
        return db.query(Prescription).filter(Prescription.patient_id == current_user.patient_id).all()
    return []

@router.post("", response_model=PrescriptionResponse)
def create_prescription(
    rx_in: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    patient = db.query(Patient).filter(Patient.id == rx_in.patient_id, Patient.deleted_at.is_(None)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    require_doctor_patient_access(db, current_user.id, patient.id)
    if rx_in.consultation_id:
        consultation = db.query(Consultation).filter(Consultation.id == rx_in.consultation_id).first()
        if not consultation or consultation.patient_id != patient.id or consultation.doctor_id != current_user.id:
            raise HTTPException(status_code=400, detail="Consultation does not belong to this patient and doctor")

    rx = Prescription(
        patient_id=rx_in.patient_id,
        doctor_id=current_user.id,
        consultation_id=rx_in.consultation_id,
        medication=rx_in.medication,
        dosage=rx_in.dosage,
        route=rx_in.route,
        frequency=rx_in.frequency,
        duration=rx_in.duration,
        instructions=rx_in.instructions,
        status="active"
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)

    log_audit_event(db, current_user.id, "create_prescription", "Prescription", rx.id, f"Issued prescription for {rx.medication}")
    return rx

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if current_user.role == "PATIENT" and rx.patient_id != current_user.patient_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "DOCTOR" and rx.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return rx
