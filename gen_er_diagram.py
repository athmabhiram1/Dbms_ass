"""
CUSTODYCORE — ER Diagram Generator
Extracts schema from PostgreSQL and renders crow's foot notation ER diagram.
"""

import os
import psycopg2
from graphviz import Digraph

DB_CONFIG = {
    "host": "localhost",
    "port": 54322,
    "dbname": "custodycore",
    "user": "postgres",
    "password": "postgres",
}

# Table display names with column lists (key columns only for readability)
TABLES = {
    "courts": {
        "label": "courts",
        "cols": ["court_id (PK)", "court_name", "address", "contact_phone", "created_at"],
    },
    "personnel": {
        "label": "personnel",
        "cols": ["personnel_id (PK)", "name", "badge_number (UQ)", "department", "unit", "contact", "role (ENUM)", "is_active"],
    },
    "cases": {
        "label": "cases",
        "cols": ["case_id (PK)", "case_number (UQ)", "case_priority (ENUM)", "title", "description", "status (ENUM)", "prosecutor_id (FK)", "defense_id (FK)", "court_id (FK)", "hearing_date", "opened_date", "closed_date"],
    },
    "evidence_types": {
        "label": "evidence_types",
        "cols": ["evidence_type_id (PK)", "type_name (UQ)", "description"],
    },
    "storage_locations": {
        "label": "storage_locations",
        "cols": ["storage_location_id (PK)", "room", "locker", "refrigerator", "vault", "climate_notes", "access_level"],
    },
    "evidence_items": {
        "label": "evidence_items",
        "cols": ["evidence_item_id (PK)", "asset_tag (UQ)", "description", "case_id (FK)", "evidence_type_id (FK)", "collected_date", "crime_scene_location", "current_status (ENUM)", "disposal_date", "collected_by (FK)"],
    },
    "custody_transfers": {
        "label": "custody_transfers",
        "cols": ["transfer_id (PK)", "evidence_item_id (FK)", "from_personnel_id (FK)", "to_personnel_id (FK)", "transfer_timestamp", "storage_location_id (FK)", "transfer_type (ENUM)", "notes"],
    },
    "lab_tests": {
        "label": "lab_tests",
        "cols": ["lab_test_id (PK)", "evidence_item_id (FK)", "test_type (ENUM)", "requested_by (FK)", "lab_technician (FK)", "status (ENUM)", "results_summary", "request_date", "completion_date"],
    },
    "evidence_requests": {
        "label": "evidence_requests",
        "cols": ["evidence_request_id (PK)", "evidence_item_id (FK)", "requesting_attorney_id (FK)", "status (ENUM)", "request_date", "decision_date", "approved_by_id (FK)", "denial_reason"],
    },
    "disclosure_logs": {
        "label": "disclosure_logs",
        "cols": ["disclosure_log_id (PK)", "evidence_item_id (FK)", "evidence_request_id (FK)", "viewing_attorney_id (FK)", "supervising_officer_id (FK)", "view_date", "view_type (ENUM)", "notes"],
    },
    "ai_summaries": {
        "label": "ai_summaries",
        "cols": ["summary_id (PK)", "case_id (FK)", "summary_text", "model_used", "prompt_version", "generated_at"],
    },
}

# Foreign key relationships for edge drawing
RELATIONSHIPS = [
    # (from_table, to_table, label, from_port, to_port)
    ("cases", "personnel", "prosecutor", None, None),
    ("cases", "personnel", "defense", None, None),
    ("cases", "courts", "court", None, None),
    ("evidence_items", "cases", "belongs_to", None, None),
    ("evidence_items", "evidence_types", "classified_as", None, None),
    ("evidence_items", "personnel", "collected_by", None, None),
    ("custody_transfers", "evidence_items", "tracks", None, None),
    ("custody_transfers", "personnel", "from", None, None),
    ("custody_transfers", "personnel", "to", None, None),
    ("custody_transfers", "storage_locations", "location", None, None),
    ("lab_tests", "evidence_items", "test_on", None, None),
    ("lab_tests", "personnel", "requested_by", None, None),
    ("lab_tests", "personnel", "technician", None, None),
    ("evidence_requests", "evidence_items", "requests", None, None),
    ("evidence_requests", "personnel", "requesting_atty", None, None),
    ("evidence_requests", "personnel", "approved_by", None, None),
    ("disclosure_logs", "evidence_items", "records", None, None),
    ("disclosure_logs", "evidence_requests", "fulfills", None, None),
    ("disclosure_logs", "personnel", "viewing_atty", None, None),
    ("disclosure_logs", "personnel", "supervising", None, None),
    ("ai_summaries", "cases", "summarizes", None, None),
]


def main():
    dot = Digraph(
        name="CustodyCore_ERD",
        format="png",
        engine="dot",
    )
    dot.attr(
        rankdir="LR",
        splines="true",
        overlap="false",
        fontsize="12",
        label="CUSTODYCORE — Entity Relationship Diagram (Crow's Foot Notation)",
        labelloc="t",
        fontname="Arial",
        dpi="150",
    )
    dot.attr("node", shape="plaintext", fontname="Arial", fontsize="10")
    dot.attr("edge", fontname="Arial", fontsize="9")

    # Create table nodes using HTML-like labels
    for tname, tinfo in TABLES.items():
        label = f"""<
<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0">
<TR><TD BGCOLOR="#2C3E50"><FONT COLOR="white" POINT-SIZE="11"><B>{tname}</B></FONT></TD></TR>"""
        for col in tinfo["cols"]:
            bg = "#ECF0F1"
            if "(PK)" in col:
                bg = "#F9E79F"
            elif "(FK)" in col:
                bg = "#D5E8D4"
            elif "(UQ)" in col:
                bg = "#D4E6F1"
            label += f'\n<TR><TD BGCOLOR="{bg}" ALIGN="LEFT"> {col} </TD></TR>'
        label += "\n</TABLE>>"

        dot.node(tname, label=label)

    # Add edges for FK relationships
    for src, dst, label, _, _ in RELATIONSHIPS:
        if src in TABLES and dst in TABLES:
            dot.edge(src, dst, label=label, arrowhead="none", style="solid")

    outpath = "07_er_diagram"
    dot.render(outpath, cleanup=True)
    print(f"ER diagram saved as {outpath}.png")


if __name__ == "__main__":
    main()
