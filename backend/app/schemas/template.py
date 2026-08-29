from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str # SOAP, Discharge Summary, Progress Note, Custom
    specialty: Optional[str] = None
    body: str
    required_sections: Optional[List[str]] = None
    variables: Optional[List[str]] = None

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    specialty: Optional[str] = None
    body: Optional[str] = None
    status: Optional[str] = None

class TemplateResponse(BaseModel):
    id: str
    doctor_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: str
    specialty: Optional[str] = None
    body: str
    required_sections: Optional[str] = None
    variables: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
