"""Core summariser logic — queries DB, builds prompt, calls provider, stores result."""

import os
from datetime import datetime

import psycopg2
import yaml

from providers import ollama_client, claude_client, openai_client
from fallback import generate_summary as template_summary


def load_config():
    base = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(base, "config.yaml")
    with open(config_path) as f:
        return yaml.safe_load(f)


def get_dsn():
    return os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:54322/custodycore")


def get_provider(override=None):
    return override or os.getenv("AI_PROVIDER", "ollama")


def fetch_case_data(conn, case_id: int):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                c.case_id,
                c.case_number,
                c.case_priority,
                c.title,
                c.opened_date,
                c.closed_date,
                c.status,
                p.name AS prosecutor_name,
                COUNT(DISTINCT ei.evidence_item_id) AS evidence_count,
                COUNT(DISTINCT lt.lab_test_id) FILTER (WHERE lt.status = 'completed') AS completed_lab_tests,
                STRING_AGG(DISTINCT lt.test_type::text, ', ') FILTER (WHERE lt.status = 'completed') AS test_types
            FROM cases c
            JOIN personnel p ON c.prosecutor_id = p.personnel_id
            LEFT JOIN evidence_items ei ON c.case_id = ei.case_id
            LEFT JOIN lab_tests lt ON ei.evidence_item_id = lt.evidence_item_id
            WHERE c.case_id = %s
            GROUP BY c.case_id, c.case_number, c.case_priority, c.title,
                     c.opened_date, c.closed_date, c.status, p.name
        """, (case_id,))
        row = cur.fetchone()
        if not row:
            return None
        return {
            "case_id": row[0],
            "case_number": row[1],
            "case_priority": row[2],
            "title": row[3],
            "opened_date": str(row[4]) if row[4] else None,
            "closed_date": str(row[5]) if row[5] else None,
            "status": row[6],
            "prosecutor_name": row[7],
            "evidence_count": row[8],
            "completed_lab_tests": row[9],
            "test_types": row[10],
        }


def build_prompt(case: dict) -> str:
    return (
        f"Generate a concise forensic case summary for the following closed case:\n\n"
        f"Case Number: {case['case_number']}\n"
        f"Priority: {case['case_priority']}\n"
        f"Title: {case['title']}\n"
        f"Prosecutor: {case['prosecutor_name']}\n"
        f"Opened: {case['opened_date']}, Closed: {case['closed_date']}\n"
        f"Evidence Items: {case['evidence_count']}\n"
        f"Completed Lab Tests: {case['completed_lab_tests']} ({case['test_types'] or 'N/A'})\n\n"
        f"Summary:"
    )


def call_provider(prompt: str, config: dict, provider_name: str) -> str | None:
    if provider_name == "ollama":
        return ollama_client.generate(prompt, config)
    elif provider_name == "claude":
        return claude_client.generate(prompt, config)
    elif provider_name == "openai":
        return openai_client.generate(prompt, config)
    return None


def store_summary(conn, case_id: int, summary_text: str, model_used: str, prompt_version: str = "v1.0"):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO ai_summaries (case_id, summary_text, model_used, prompt_version, generated_at) "
            "VALUES (%s, %s, %s, %s, %s)",
            (case_id, summary_text, model_used, prompt_version, datetime.now()),
        )
    conn.commit()


def summarise_case(case_id: int, provider_override: str | None = None) -> dict:
    config = load_config()
    provider_name = get_provider(provider_override)
    dsn = get_dsn()

    conn = psycopg2.connect(dsn)
    try:
        case = fetch_case_data(conn, case_id)
        if case is None:
            return {"error": f"Case {case_id} not found"}

        prompt = build_prompt(case)

        summary = call_provider(prompt, config, provider_name)
        model_used = config.get(provider_name, {}).get("model", provider_name) if provider_name != "template" else "template"

        if summary is None:
            print("  LLM call failed, using template fallback.")
            summary = template_summary(case)
            model_used = "template"

        store_summary(conn, case_id, summary, model_used)

        return {
            "case_id": case_id,
            "case_number": case["case_number"],
            "summary_text": summary,
            "model_used": model_used,
            "generated_at": datetime.now().isoformat(),
        }
    finally:
        conn.close()
