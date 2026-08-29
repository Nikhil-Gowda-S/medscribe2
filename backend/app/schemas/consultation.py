from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ConsultationCreate(BaseModel):
    patient_id: str
    transcript: Optional[str] = None

class ConsultationUpdate(BaseModel):
    transcript: Optional[str] = None
    status: Optional[str] = None

class ConsultationResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    transcript: Optional[str] = None
    audio_url: Optional[str] = None
    transcription_status: str
    has_critical_flag: bool
    critical_flags: Optional[str] = None
    status: str
    consultation_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
