from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PrescriptionCreate(BaseModel):
    patient_id: str
    consultation_id: Optional[str] = None
    medication: str
    dosage: str
    route: str = "oral"
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionUpdate(BaseModel):
    medication: Optional[str] = None
    dosage: Optional[str] = None
    route: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    consultation_id: Optional[str] = None
    medication: str
    dosage: str
    route: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
