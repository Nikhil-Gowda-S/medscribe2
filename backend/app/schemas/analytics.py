from pydantic import BaseModel
from typing import Dict, List, Optional

class DoctorAnalyticsResponse(BaseModel):
    total_consultations: int
    total_documents: int
    finalized_documents: int
    total_prescriptions: int
    estimated_hours_saved: float
    specialty_distribution: Dict[str, int]
    recent_activity_count: int

class AdminAnalyticsResponse(BaseModel):
    total_doctors: int
    total_patients: int
    total_consultations: int
    total_reports: int
    total_prescriptions: int
    active_doctors_count: int
    average_consultations_per_doctor: float
    documents_per_specialty: Dict[str, int]
