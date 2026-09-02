from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor_patient import DoctorPatient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientActivationCreate
from app.core.deps import get_current_user, require_doctor, require_doctor_patient_access
from app.core.security import get_password_hash
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "ADMIN":
        return db.query(Patient).filter(Patient.deleted_at.is_(None)).all()
    elif current_user.role == "DOCTOR":
        patient_ids = [dp.patient_id for dp in db.query(DoctorPatient).filter(DoctorPatient.doctor_id == current_user.id).all()]
        return db.query(Patient).filter(Patient.id.in_(patient_ids), Patient.deleted_at.is_(None)).all()
    elif current_user.role == "PATIENT":
        if not current_user.patient_id:
            return []
        patient = db.query(Patient).filter(Patient.id == current_user.patient_id, Patient.deleted_at.is_(None)).first()
        return [patient] if patient else []
    
    return []

@router.post("", response_model=PatientResponse)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    # Email is optional, but when supplied it is a useful safeguard against a
    # double-click creating the same patient twice for this doctor.
    if patient_in.email:
        duplicate = db.query(Patient).join(DoctorPatient).filter(
            DoctorPatient.doctor_id == current_user.id,
            Patient.deleted_at.is_(None),
            func.lower(Patient.email) == patient_in.email.lower(),
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="A patient with this email is already assigned to you")

    patient = Patient(
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        phone=patient_in.phone,
        email=patient_in.email,
        address=patient_in.address,
        medical_record_number=patient_in.medical_record_number or f"MRN-{uuid4().hex[:10].upper()}",
    )
    db.add(patient)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This medical record number is already in use")
    db.refresh(patient)

    # Link doctor to patient
    dp = DoctorPatient(doctor_id=current_user.id, patient_id=patient.id)
    db.add(dp)
    db.commit()

    log_audit_event(db, current_user.id, "create_patient", "Patient", patient.id, f"Created patient {patient.first_name} {patient.last_name}")
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.deleted_at.is_(None)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "PATIENT" and current_user.patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own records")
    elif current_user.role == "DOCTOR":
        require_doctor_patient_access(db, current_user.id, patient.id)

    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.deleted_at.is_(None)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    require_doctor_patient_access(db, current_user.id, patient.id)

    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    log_audit_event(db, current_user.id, "update_patient", "Patient", patient.id, "Updated patient demographics")
    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.deleted_at.is_(None)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    require_doctor_patient_access(db, current_user.id, patient.id)

    patient.deleted_at = datetime.utcnow() # Soft delete
    db.commit()
    log_audit_event(db, current_user.id, "delete_patient", "Patient", patient.id, "Soft-deleted patient record")
    return {"message": "Patient deleted successfully"}

@router.post("/activate-account")
def activate_patient_account(
    act_in: PatientActivationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    patient = db.query(Patient).filter(Patient.id == act_in.patient_id, Patient.deleted_at.is_(None)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    require_doctor_patient_access(db, current_user.id, patient.id)

    existing_user = db.query(User).filter(User.email == act_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Account with email already exists")

    user = User(
        name=f"{patient.first_name} {patient.last_name}",
        email=act_in.email,
        password_hash=get_password_hash(act_in.password),
        role="PATIENT",
        patient_id=patient.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_audit_event(db, current_user.id, "activate_patient_account", "User", user.id, f"Created portal access for patient {patient.id}")
    return {"message": "Patient account activated successfully"}
