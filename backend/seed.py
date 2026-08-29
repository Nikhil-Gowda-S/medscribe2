from datetime import datetime
from app.db.session import SessionLocal
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor_patient import DoctorPatient
from app.models.consultation import Consultation
from app.models.template import DocumentTemplate
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # 1. Create Doctor Account
        doc_user = db.query(User).filter(User.email == "doctor@medscribe.com").first()
        if not doc_user:
            doc_user = User(
                name="Dr. John Smith",
                email="doctor@medscribe.com",
                password_hash=get_password_hash("password123"),
                role="DOCTOR",
                specialty="Cardiology",
                phone="+1-555-0100"
            )
            db.add(doc_user)
            db.commit()
            db.refresh(doc_user)
            print(f"Created Doctor: {doc_user.email}")

        # 2. Create Admin Account
        admin_user = db.query(User).filter(User.email == "admin@medscribe.com").first()
        if not admin_user:
            admin_user = User(
                name="Admin Administrator",
                email="admin@medscribe.com",
                password_hash=get_password_hash("password123"),
                role="ADMIN"
            )
            db.add(admin_user)
            db.commit()
            print(f"Created Admin: {admin_user.email}")

        # 3. Create Sample Patients
        p1 = db.query(Patient).filter(Patient.medical_record_number == "MRN-001").first()
        if not p1:
            p1 = Patient(
                first_name="Jane",
                last_name="Doe",
                date_of_birth=datetime(1985, 5, 15),
                gender="Female",
                phone="+1-555-0101",
                email="jane.doe@email.com",
                medical_record_number="MRN-001"
            )
            db.add(p1)
            db.commit()
            db.refresh(p1)
            
            dp1 = DoctorPatient(doctor_id=doc_user.id, patient_id=p1.id)
            db.add(dp1)
            db.commit()
            print("Created Patient Jane Doe")

        # 4. Create Patient User Account linked to Jane Doe
        pat_user = db.query(User).filter(User.email == "patient@medscribe.com").first()
        if not pat_user:
            pat_user = User(
                name="Jane Doe",
                email="patient@medscribe.com",
                password_hash=get_password_hash("password123"),
                role="PATIENT",
                patient_id=p1.id
            )
            db.add(pat_user)
            db.commit()
            print(f"Created Patient Account: {pat_user.email}")

        # 5. Create Default Templates
        tmpl = db.query(DocumentTemplate).filter(DocumentTemplate.name == "Standard SOAP Note").first()
        if not tmpl:
            tmpl = DocumentTemplate(
                name="Standard SOAP Note",
                description="Comprehensive Subjective, Objective, Assessment, Plan template",
                type="SOAP Note",
                specialty="General Medicine",
                body="""SUBJECTIVE:
Chief Complaint: {{chiefComplaint}}
History of Present Illness: Patient presents with symptoms discussed during encounter.

OBJECTIVE:
Vital Signs: BP 120/80, HR 72, Temp 98.6F.
Physical Examination: Systemic examination unremarkable.

ASSESSMENT:
Diagnosis: {{diagnosis}}

PLAN:
1. Continue current medications.
2. Follow-up in 2 weeks.
""",
                variables='["{{patientName}}", "{{dateOfBirth}}", "{{consultationDate}}", "{{doctorName}}"]',
                status="active"
            )
            db.add(tmpl)
            db.commit()
            print("Created Standard SOAP Note template")

        print("\nSeeding complete!")
        print("Doctor Login:  doctor@medscribe.com / password123")
        print("Admin Login:   admin@medscribe.com / password123")
        print("Patient Login: patient@medscribe.com / password123")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
