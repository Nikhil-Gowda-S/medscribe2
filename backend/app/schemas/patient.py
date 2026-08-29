from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    medical_record_number: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    medical_record_number: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_record_number: Optional[str] = None
    has_portal_account: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientActivationCreate(BaseModel):
    patient_id: str
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
