from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.document import Document, DocumentVersion, DocumentAddendum
from app.models.template import DocumentTemplate
from app.schemas.document import DocumentGenerateRequest, DocumentUpdate, DocumentResponse, AddendumCreate
from app.core.deps import get_current_user, require_doctor
from app.services.ai_service import generate_clinical_document
from app.services.pdf_service import generate_clinical_pdf
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/documents", tags=["Documents"])

def assert_document_access(doc: Document, current_user: User) -> None:
    if current_user.role == "PATIENT" and (doc.patient_id != current_user.patient_id or not doc.is_finalized):
        raise HTTPException(status_code=403, detail="Forbidden: Patients can only view finalized reports")
    if current_user.role == "DOCTOR" and doc.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    finalized_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document)
    if current_user.role == "DOCTOR":
        query = query.filter(Document.doctor_id == current_user.id)
    elif current_user.role == "PATIENT":
        query = query.filter(Document.patient_id == current_user.patient_id, Document.is_finalized.is_(True))
    if finalized_only:
        query = query.filter(Document.is_finalized.is_(True))
    return query.order_by(Document.created_at.desc()).limit(100).all()

@router.post("/generate", response_model=DocumentResponse)
def generate_document(
    gen_in: DocumentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    consultation = db.query(Consultation).filter(Consultation.id == gen_in.consultation_id, Consultation.deleted_at.is_(None)).first()
    if not consultation or consultation.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if not (consultation.transcript or "").strip():
        raise HTTPException(status_code=400, detail="Consultation transcript is required before document generation")
    existing_doc = db.query(Document).filter(Document.consultation_id == consultation.id).first()
    if existing_doc:
        raise HTTPException(status_code=409, detail="A document already exists for this consultation")

    template_body = None
    if gen_in.template_id:
        tmpl = db.query(DocumentTemplate).filter(DocumentTemplate.id == gen_in.template_id).first()
        if not tmpl or (tmpl.doctor_id and tmpl.doctor_id != current_user.id):
            raise HTTPException(status_code=404, detail="Template not found")
        template_body = tmpl.body

    # Generate document content with AI
    content_text = generate_clinical_document(
        transcript=consultation.transcript or "",
        template_body=template_body,
        doc_type=gen_in.document_type,
        patient_name=f"{consultation.patient.first_name} {consultation.patient.last_name}",
        doctor_name=current_user.name,
        consultation_date=consultation.consultation_date.strftime("%Y-%m-%d"),
    )

    doc = Document(
        consultation_id=consultation.id,
        patient_id=consultation.patient_id,
        doctor_id=current_user.id,
        template_id=gen_in.template_id,
        type=gen_in.document_type,
        content=content_text,
        status="DRAFT",
        is_finalized=False
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Save initial version
    version = DocumentVersion(
        document_id=doc.id,
        author_id=current_user.id,
        version_number=1,
        content=content_text
    )
    db.add(version)
    db.commit()

    log_audit_event(db, current_user.id, "generate_document", "Document", doc.id, f"Generated {doc.type}")
    return doc

@router.get("/by-consultation/{consultation_id}", response_model=DocumentResponse)
def get_document_by_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.consultation_id == consultation_id).order_by(Document.created_at.desc()).first()
    if not doc:
        raise HTTPException(status_code=404, detail="No document found for this consultation")

    assert_document_access(doc, current_user)

    return doc

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    assert_document_access(doc, current_user)

    return doc

@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: str,
    doc_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.is_finalized or doc.status == "FINALIZED":
        raise HTTPException(status_code=400, detail="Cannot edit a finalized document. Use addendums for corrections.")

    doc.content = doc_in.content
    doc.updated_at = datetime.utcnow()

    # Track edit version
    latest_ver = db.query(DocumentVersion).filter(DocumentVersion.document_id == doc.id).order_by(DocumentVersion.version_number.desc()).first()
    next_ver_num = (latest_ver.version_number + 1) if latest_ver else 1
    
    version = DocumentVersion(
        document_id=doc.id,
        author_id=current_user.id,
        version_number=next_ver_num,
        content=doc_in.content
    )
    db.add(version)
    db.commit()
    db.refresh(doc)

    log_audit_event(db, current_user.id, "update_document", "Document", doc.id, f"Saved draft version {next_ver_num}")
    return doc

@router.post("/{document_id}/finalize", response_model=DocumentResponse)
def finalize_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.is_finalized:
        raise HTTPException(status_code=400, detail="Document is already finalized")

    doc.is_finalized = True
    doc.status = "FINALIZED"
    doc.finalized_at = datetime.utcnow()
    consultation = db.query(Consultation).filter(Consultation.id == doc.consultation_id).first()
    if consultation:
        consultation.status = "finalized"
    db.commit()
    db.refresh(doc)

    log_audit_event(db, current_user.id, "finalize_document", "Document", doc.id, "Marked document as finalized and immutable")
    return doc

@router.post("/{document_id}/addendum")
def create_addendum(
    document_id: str,
    addendum_in: AddendumCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.is_finalized:
        raise HTTPException(status_code=400, detail="Addenda can only be added to finalized documents")

    addendum = DocumentAddendum(
        document_id=doc.id,
        author_id=current_user.id,
        content=addendum_in.content
    )
    db.add(addendum)
    db.commit()
    log_audit_event(db, current_user.id, "addendum_document", "Document", doc.id, "Added post-finalization addendum")
    return {"message": "Addendum added successfully"}

@router.get("/{document_id}/pdf")
def export_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    assert_document_access(doc, current_user)

    patient = db.query(Patient).filter(Patient.id == doc.patient_id).first()
    doctor = db.query(User).filter(User.id == doc.doctor_id).first()
    addenda = db.query(DocumentAddendum).filter(DocumentAddendum.document_id == doc.id).order_by(DocumentAddendum.created_at.asc()).all()
    addendum_text = "".join(
        f"\n\nADDENDUM ({item.created_at.strftime('%Y-%m-%d %H:%M UTC')})\n{item.content}"
        for item in addenda
    )

    pdf_bytes = generate_clinical_pdf(
        doc_title=doc.type,
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else "Patient",
        mrn=patient.medical_record_number if patient else "N/A",
        dob=patient.date_of_birth.strftime("%Y-%m-%d") if patient and patient.date_of_birth else "N/A",
        gender=patient.gender if patient else "N/A",
        doctor_name=doctor.name if doctor else "Doctor",
        specialty=doctor.specialty if doctor else "General Medicine",
        consultation_date=doc.created_at.strftime("%Y-%m-%d"),
        content_text=f"{doc.content}{addendum_text}"
    )

    log_audit_event(db, current_user.id, "export_pdf", "Document", doc.id, "Generated PDF export")
    return Response(
        content=pdf_bytes, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f'inline; filename="{doc.type}.pdf"'}
    )
