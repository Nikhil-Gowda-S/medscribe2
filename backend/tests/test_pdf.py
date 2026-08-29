from app.services.pdf_service import generate_clinical_pdf

def test_generate_pdf_output():
    pdf_bytes = generate_clinical_pdf(
        doc_title="SOAP Note",
        patient_name="Jane Doe",
        mrn="MRN-001",
        dob="1985-05-15",
        gender="Female",
        doctor_name="John Smith",
        specialty="Cardiology",
        consultation_date="2026-08-27",
        content_text="SUBJECTIVE:\nPatient presents with mild chest discomfort.\n\nPLAN:\nFollow up in 2 weeks."
    )
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 500
