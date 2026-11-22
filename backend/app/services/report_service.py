"""
Reporting Module - Section 16 of the abstract.
Generates a structured PDF farm/crop report using reportlab.
"""
from datetime import datetime
from pathlib import Path
from typing import List, Dict

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

REPORTS_DIR = Path(__file__).resolve().parent.parent / "generated_reports"
REPORTS_DIR.mkdir(exist_ok=True)


def generate_farm_report(farm_name: str, farm_summary: Dict, crops: List[Dict], tasks: List[Dict]) -> str:
    filename = f"farm_report_{farm_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = REPORTS_DIR / filename

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleGreen", parent=styles["Title"], textColor=colors.HexColor("#1B4332"))
    heading_style = ParagraphStyle("HeadingGreen", parent=styles["Heading2"], textColor=colors.HexColor("#2F6B4F"))

    doc = SimpleDocTemplate(str(filepath), pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    elements = [
        Paragraph("Smart Crop Advisor - Farm Report", title_style),
        Paragraph(f"Farm: {farm_name}", styles["Normal"]),
        Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]),
        Spacer(1, 0.6 * cm),
        Paragraph("Farm Summary", heading_style),
    ]

    summary_data = [[k.replace("_", " ").title(), str(v)] for k, v in farm_summary.items()]
    summary_table = Table([["Metric", "Value"]] + summary_data, colWidths=[8 * cm, 8 * cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F6B4F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F4EE")]),
    ]))
    elements += [summary_table, Spacer(1, 0.6 * cm), Paragraph("Crops", heading_style)]

    if crops:
        crop_rows = [["Crop", "Variety", "Stage", "Status", "Area (acres)"]]
        for c in crops:
            crop_rows.append([c.get("crop_type", ""), c.get("variety") or "-", c.get("growth_stage", ""),
                               c.get("status", ""), str(c.get("area_acres", 0))])
        crop_table = Table(crop_rows, colWidths=[3.5 * cm, 3.5 * cm, 3.5 * cm, 3 * cm, 3 * cm])
        crop_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#B08245")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F4EE")]),
        ]))
        elements.append(crop_table)
    else:
        elements.append(Paragraph("No crops recorded.", styles["Normal"]))

    elements += [Spacer(1, 0.6 * cm), Paragraph("Open Tasks", heading_style)]
    if tasks:
        task_rows = [["Title", "Category", "Due Date", "Status"]]
        for t in tasks:
            task_rows.append([t.get("title", ""), t.get("category", ""),
                               str(t.get("due_date") or "-"), "Done" if t.get("is_completed") else "Pending"])
        task_table = Table(task_rows, colWidths=[5 * cm, 3.5 * cm, 3.5 * cm, 3 * cm])
        task_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8B94A")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F4EE")]),
        ]))
        elements.append(task_table)
    else:
        elements.append(Paragraph("No tasks recorded.", styles["Normal"]))

    doc.build(elements)
    return str(filepath)
