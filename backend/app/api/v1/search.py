from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=List[DocumentResponse])
def search_documents(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)
    if current_user.role == "DOCTOR":
        query = query.filter(Document.doctor_id == current_user.id)
    elif current_user.role == "PATIENT":
        query = query.filter(Document.patient_id == current_user.patient_id, Document.is_finalized == True)
    
    return query.filter(Document.content.ilike(f"%{q}%")).limit(20).all()
