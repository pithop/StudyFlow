#!/usr/bin/env python3
"""
Script pour créer de vrais fichiers de test PDF et ICS
"""

# Créer un vrai fichier ICS
ics_content = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudyFlow//Test//EN
BEGIN:VEVENT
UID:test1@studyflow
DTSTART:20251120T140000Z
DTEND:20251120T160000Z
SUMMARY:Examen de Mathématiques
DESCRIPTION:Examen final chapitre 1-5
END:VEVENT
BEGIN:VEVENT
UID:test2@studyflow
DTSTART:20251125T100000Z
SUMMARY:Rendu Projet Informatique
END:VEVENT
BEGIN:VTODO
UID:todo1@studyflow
SUMMARY:Réviser cours de Physique
DUE:20251122T180000Z
END:VTODO
END:VCALENDAR
"""

# Sauvegarder le fichier ICS
with open('test.ics', 'w', encoding='utf-8') as f:
    f.write(ics_content)
print("✅ Fichier test.ics créé")

# Créer un vrai PDF avec ReportLab (ou fpdf)
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    pdf_file = "test.pdf"
    c = canvas.Canvas(pdf_file, pagesize=letter)
    
    # Titre
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, "Calendrier du cours - Automne 2025")
    
    # Dates importantes
    c.setFont("Helvetica", 12)
    y = 700
    dates = [
        "- 20 novembre 2025: Examen partiel",
        "- 25 novembre 2025: Remise du projet final",
        "- 1er décembre 2025: Présentation orale",
        "- 10 décembre 2025: Examen final"
    ]
    
    for date in dates:
        c.drawString(100, y, date)
        y -= 30
    
    c.save()
    print("✅ Fichier test.pdf créé avec ReportLab")
    
except ImportError:
    # Fallback: utiliser fpdf si reportlab n'est pas installé
    try:
        from fpdf import FPDF
        
        pdf = FPDF()
        pdf.add_page()
        
        # Titre
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(0, 10, "Calendrier du cours - Automne 2025", ln=True)
        pdf.ln(10)
        
        # Dates
        pdf.set_font("Arial", '', 12)
        dates = [
            "- 20 novembre 2025: Examen partiel",
            "- 25 novembre 2025: Remise du projet final",
            "- 1er decembre 2025: Presentation orale",
            "- 10 decembre 2025: Examen final"
        ]
        
        for date in dates:
            pdf.cell(0, 10, date, ln=True)
        
        pdf.output("test.pdf")
        print("✅ Fichier test.pdf créé avec FPDF")
        
    except ImportError:
        print("❌ Ni reportlab ni fpdf n'est installé")
        print("Installation: pip install reportlab")
        print("ou: pip install fpdf2")
