import io
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.template import DocumentTemplate
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse
from app.core.deps import get_current_user, require_doctor
from app.services.audit_service import log_audit_event
from docx import Document as DocxDocument

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("", response_model=List[TemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "PATIENT":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Return system templates (doctor_id null) + user custom templates
    return db.query(DocumentTemplate).filter(
        (DocumentTemplate.doctor_id == None) | (DocumentTemplate.doctor_id == current_user.id)
    ).filter(DocumentTemplate.status == "active").all()

@router.post("", response_model=TemplateResponse)
def create_template(
    tmpl_in: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    req_secs = json.dumps(tmpl_in.required_sections) if tmpl_in.required_sections else None
    vars_json = json.dumps(tmpl_in.variables) if tmpl_in.variables else None

    tmpl = DocumentTemplate(
        doctor_id=current_user.id,
        name=tmpl_in.name,
        description=tmpl_in.description,
        type=tmpl_in.type,
        specialty=tmpl_in.specialty,
        body=tmpl_in.body,
        required_sections=req_secs,
        variables=vars_json,
        status="active"
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)

    log_audit_event(db, current_user.id, "create_template", "Template", tmpl.id, f"Created template {tmpl.name}")
    return tmpl

@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: str,
    tmpl_in: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    tmpl = db.query(DocumentTemplate).filter(DocumentTemplate.id == template_id).first()
    if not tmpl or (tmpl.doctor_id and tmpl.doctor_id != current_user.id):
        raise HTTPException(status_code=404, detail="Template not found or unauthorized")

    update_data = tmpl_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(tmpl, field, val)

    db.commit()
    db.refresh(tmpl)
    log_audit_event(db, current_user.id, "update_template", "Template", tmpl.id, "Updated template body")
    return tmpl

@router.delete("/{template_id}")
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    tmpl = db.query(DocumentTemplate).filter(DocumentTemplate.id == template_id).first()
    if not tmpl or tmpl.doctor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Template not found")

    tmpl.status = "archived"
    db.commit()
    log_audit_event(db, current_user.id, "delete_template", "Template", tmpl.id, "Archived template")
    return {"message": "Template deleted successfully"}

@router.post("/import", response_model=TemplateResponse)
async def import_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    allowed_extensions = {".txt", ".html", ".docx"}
    filename = file.filename or ""
    extension = f".{filename.lower().rsplit('.', 1)[-1]}" if "." in filename else ""
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only .txt, .html, and .docx templates are supported")
    contents = await file.read()
    if not contents or len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Template file must be between 1 byte and 2 MB")
    if extension == ".docx":
        try:
            raw_text = "\n".join(paragraph.text for paragraph in DocxDocument(io.BytesIO(contents)).paragraphs)
        except Exception:
            raise HTTPException(status_code=400, detail="The uploaded DOCX file could not be read")
    else:
        raw_text = contents.decode("utf-8", errors="strict")
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Template file does not contain readable text")

    name = filename.replace(".txt", "").replace(".docx", "").replace(".html", "").title()
    
    tmpl = DocumentTemplate(
        doctor_id=current_user.id,
        name=f"Imported - {name}",
        description="Imported from file upload",
        type="Custom",
        body=raw_text,
        variables=json.dumps(["{{patientName}}", "{{consultationDate}}", "{{doctorName}}"]),
        status="active"
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)

    log_audit_event(db, current_user.id, "import_template", "Template", tmpl.id, f"Imported template from {file.filename}")
    return tmpl
