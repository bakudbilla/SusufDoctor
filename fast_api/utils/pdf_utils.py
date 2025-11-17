import io
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet

def create_proper_pdf(report_text: str, patient_info: dict, is_edited: bool=False) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    story = []
    title = "SuSufDoctor Radiology Report"
    if is_edited:
        title += " (Edited)"
    story.append(Paragraph(title, styles["Heading1"]))
    story.append(Spacer(1, 20))

    info = f"""
    <b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}<br/>
    <b>Patient:</b> {patient_info['patient_name']}<br/>
    <b>Radiologist:</b> {patient_info['radiologist_name']}<br/>
    <b>Age:</b> {patient_info['age']}<br/>
    <b>Sex:</b> {patient_info['sex']}<br/>
    <b>BMI:</b> {patient_info['bmi']}
    """

    story.append(Paragraph(info, styles["Normal"]))
    story.append(Spacer(1, 20))

    for line in report_text.split("\n"):
        story.append(Paragraph(line, styles["Normal"]))
        story.append(Spacer(1, 8))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
