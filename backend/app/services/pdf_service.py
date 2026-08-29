import io
import html
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

class NumberedCanvas:
    def __init__(self, *args, **kwargs):
        pass

def generate_clinical_pdf(
    doc_title: str,
    patient_name: str,
    mrn: str,
    dob: str,
    gender: str,
    doctor_name: str,
    specialty: str,
    consultation_date: str,
    content_text: str
) -> bytes:
    doc_title = html.escape(str(doc_title or "Document"))
    patient_name = html.escape(str(patient_name or "Unknown Patient"))
    mrn = html.escape(str(mrn or "N/A"))
    dob = html.escape(str(dob or "N/A"))
    gender = html.escape(str(gender or "N/A"))
    doctor_name = html.escape(str(doctor_name or "Doctor"))
    specialty = html.escape(str(specialty or "General Medicine"))
    consultation_date = html.escape(str(consultation_date or ""))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch
    )

    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'HospitalHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    
    sub_header_style = ParagraphStyle(
        'HospitalSubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10,
        alignment=1
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # 1. Hospital Header
    story.append(Paragraph(f"{settings.HOSPITAL_NAME.upper()}", header_style))
    story.append(Paragraph("100 Healthcare Boulevard, Suite 400 | Phone: (555) 019-2831 | Email: records@medicalcenter.org", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1e40af'), spaceAfter=15))

    # 2. Document Title
    story.append(Paragraph(doc_title.upper(), title_style))
    story.append(Spacer(1, 5))

    # 3. Patient Information Table
    patient_data = [
        [
            Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient_name, body_style),
            Paragraph("<b>MRN:</b>", body_style), Paragraph(mrn or "N/A", body_style)
        ],
        [
            Paragraph("<b>Date of Birth:</b>", body_style), Paragraph(dob or "N/A", body_style),
            Paragraph("<b>Gender:</b>", body_style), Paragraph(gender or "N/A", body_style)
        ],
        [
            Paragraph("<b>Attending Doctor:</b>", body_style), Paragraph(f"Dr. {doctor_name}", body_style),
            Paragraph("<b>Specialty:</b>", body_style), Paragraph(specialty or "General Medicine", body_style)
        ],
        [
            Paragraph("<b>Consultation Date:</b>", body_style), Paragraph(consultation_date, body_style),
            Paragraph("<b>Status:</b>", body_style), Paragraph("FINALIZED & SIGNED", body_style)
        ]
    ]

    t = Table(patient_data, colWidths=[1.5 * inch, 2.2 * inch, 1.3 * inch, 2.5 * inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # 4. Clinical Body Content
    paragraphs = content_text.split('\n')
    for p in paragraphs:
        if p.strip():
            safe_text = html.escape(p.strip())
            # Restore basic formatting if the AI used markdown bold **text**
            safe_text = safe_text.replace("**", "<b>", 1).replace("**", "</b>", 1) if safe_text.count("**") >= 2 else safe_text
            
            if p.isupper() or p.endswith(':'):
                sec_style = ParagraphStyle(
                    'SecHeader',
                    parent=body_style,
                    fontName='Helvetica-Bold',
                    fontSize=11,
                    textColor=colors.HexColor('#0f172a'),
                    spaceBefore=8,
                    spaceAfter=4
                )
                story.append(Paragraph(safe_text, sec_style))
            else:
                story.append(Paragraph(safe_text, body_style))
                story.append(Spacer(1, 4))

    story.append(Spacer(1, 20))

    # 5. Signature Block
    sig_data = [
        [Paragraph(f"<b>Prepared by:</b> Dr. {doctor_name}", body_style), Paragraph("<b>Authorized Signature:</b>", body_style)],
        [Paragraph("<i>Electronic Medical Record System Verified</i>", sub_header_style), Paragraph("____________________________", body_style)]
    ]
    sig_table = Table(sig_data, colWidths=[3.75 * inch, 3.75 * inch])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_table)

    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#64748b'))
        canvas.drawString(0.5 * inch, 0.3 * inch, f"Confidential — {settings.HOSPITAL_NAME} | Medical Record")
        canvas.drawRightString(8.0 * inch, 0.3 * inch, f"Page {doc.page} of 1")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
