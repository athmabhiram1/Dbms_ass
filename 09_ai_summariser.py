"""
CUSTODYCORE — AI Summariser (Stretch Goal)
Standalone Python script that queries closed cases, constructs a prompt from
case metadata, calls an LLM backend, and stores the summary in ai_summaries.

Usage:
    python 09_ai_summariser.py --provider ollama
    python 09_ai_summariser.py --provider claude --api-key sk-...
    python 09_ai_summariser.py --provider openai --api-key sk-...
    python 09_ai_summariser.py --provider template   # No-LLM fallback

Config file (config.json):
{
    "provider": "template",
    "model": "llama3",
    "endpoint": "http://localhost:11434/api/generate",
    "api_key": "",
    "temperature": 0.7,
    "max_tokens": 500
}
"""

import json
import os
import sys
import argparse
from datetime import datetime
from string import Template

try:
    import psycopg2
    import requests
except ImportError:
    print("Install dependencies: pip install psycopg2-binary requests")
    sys.exit(1)

# Default config
DEFAULT_CONFIG = {
    "provider": "template",
    "model": "llama3",
    "endpoint": "http://localhost:11434/api/generate",
    "api_key": "",
    "temperature": 0.7,
    "max_tokens": 500,
}

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "summariser_config.json")

DB_CONFIG = {
    "host": "localhost",
    "port": 54322,
    "dbname": "custodycore",
    "user": "postgres",
    "password": "postgres",
}


def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            cfg = json.load(f)
            return {**DEFAULT_CONFIG, **cfg}
    return dict(DEFAULT_CONFIG)


def get_closed_cases_without_summary(conn):
    """Return closed cases that don't yet have an AI summary."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                c.case_id,
                c.case_number,
                c.case_priority,
                c.title,
                c.opened_date,
                c.closed_date,
                p.name AS prosecutor_name,
                COUNT(DISTINCT ei.evidence_item_id) AS evidence_count,
                COUNT(DISTINCT lt.lab_test_id) FILTER (WHERE lt.status = 'completed') AS completed_lab_tests,
                STRING_AGG(DISTINCT lt.test_type::text, ', ') FILTER (WHERE lt.status = 'completed') AS test_types
            FROM cases c
            JOIN personnel p ON c.prosecutor_id = p.personnel_id
            LEFT JOIN evidence_items ei ON c.case_id = ei.case_id
            LEFT JOIN lab_tests lt ON ei.evidence_item_id = lt.evidence_item_id
            WHERE c.status = 'closed'
              AND NOT EXISTS (
                  SELECT 1 FROM ai_summaries a WHERE a.case_id = c.case_id
              )
            GROUP BY c.case_id, c.case_number, c.case_priority, c.title,
                     c.opened_date, c.closed_date, p.name
            ORDER BY c.closed_date DESC
        """)
        return cur.fetchall()


def build_prompt(case):
    """Construct a prompt from case metadata."""
    return (
        f"Generate a concise forensic case summary for the following closed case:\n\n"
        f"Case Number: {case[1]}\n"
        f"Priority: {case[2]}\n"
        f"Title: {case[3]}\n"
        f"Prosecutor: {case[6]}\n"
        f"Opened: {case[4]}, Closed: {case[5]}\n"
        f"Evidence Items: {case[7]}\n"
        f"Completed Lab Tests: {case[8]} ({case[9] or 'N/A'})\n\n"
        f"Summary:"
    )


def call_ollama(prompt, config):
    """Call local Ollama LLM."""
    payload = {
        "model": config["model"],
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": config["temperature"],
            "num_predict": config["max_tokens"],
        },
    }
    try:
        resp = requests.post(config["endpoint"], json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json().get("response", "")
    except Exception as e:
        print(f"  Ollama error: {e}")
        return None


def call_claude(prompt, config):
    """Call Anthropic Claude API."""
    headers = {
        "x-api-key": config["api_key"],
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": config["max_tokens"],
        "messages": [{"role": "user", "content": prompt}],
    }
    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers, json=payload, timeout=30
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]
    except Exception as e:
        print(f"  Claude error: {e}")
        return None


def call_openai(prompt, config):
    """Call OpenAI API."""
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": config["temperature"],
        "max_tokens": config["max_tokens"],
    }
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers, json=payload, timeout=30
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  OpenAI error: {e}")
        return None


def template_summary(case):
    """No-LLM fallback: generate a template-based summary."""
    case_num = case[1]
    priority = case[2]
    title = case[3]
    pros = case[6]
    evidence_count = case[7]
    completed_tests = case[8]
    test_types = case[9] or "none"

    return (
        f"Case {case_num} ({priority} priority) — {title}. "
        f"Prosecuted by {pros}. "
        f"The case involved {evidence_count} evidence item(s) "
        f"with {completed_tests} completed lab test(s) ({test_types}). "
        f"Case was opened on {case[4]} and closed on {case[5]}. "
        f"All evidence has been disposed in accordance with standard procedure."
    )


def store_summary(conn, case_id, summary, model_used, prompt_version):
    """Insert the generated summary into ai_summaries."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO ai_summaries (case_id, summary_text, model_used, prompt_version, generated_at) "
            "VALUES (%s, %s, %s, %s, %s)",
            (case_id, summary, model_used, prompt_version, datetime.now()),
        )
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description="CUSTODYCORE AI Summariser")
    parser.add_argument("--provider", choices=["ollama", "claude", "openai", "template"],
                        help="LLM provider (overrides config)")
    parser.add_argument("--api-key", help="API key for Claude or OpenAI")
    parser.add_argument("--case-number", help="Generate summary for a specific case only")
    args = parser.parse_args()

    config = load_config()
    if args.provider:
        config["provider"] = args.provider
    if args.api_key:
        config["api_key"] = args.api_key

    print(f"CUSTODYCORE AI Summariser — Provider: {config['provider']}")
    print(f"Config: {json.dumps(config, indent=2)}")
    print()

    try:
        conn = psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"Database connection failed: {e}")
        sys.exit(1)

    try:
        cases = get_closed_cases_without_summary(conn)
        if args.case_number:
            cases = [c for c in cases if c[1] == args.case_number]

        if not cases:
            print("No closed cases without summaries found.")
            return

        print(f"Found {len(cases)} case(s) to summarise.\n")

        for case in cases:
            case_id, case_number = case[0], case[1]
            print(f"Processing {case_number}...")

            prompt = build_prompt(case)
            model_used = config["model"]

            if config["provider"] == "ollama":
                summary = call_ollama(prompt, config)
            elif config["provider"] == "claude":
                summary = call_claude(prompt, config)
            elif config["provider"] == "openai":
                summary = call_openai(prompt, config)
            else:
                summary = template_summary(case)
                model_used = "template"

            if summary is None:
                print(f"  LLM call failed, using template fallback.")
                summary = template_summary(case)
                model_used = "template"

            store_summary(conn, case_id, summary, model_used, "v1.0")
            print(f"  Summary stored in ai_summaries.")
            print(f"  [{summary[:120]}...]")
            print()

        # Show stored summaries
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.case_id, c.case_number, a.model_used, a.generated_at,
                       LEFT(a.summary_text, 100) AS summary_preview
                FROM ai_summaries a
                JOIN cases c ON a.case_id = c.case_id
                ORDER BY a.generated_at DESC
            """)
            rows = cur.fetchall()
            print(f"\nStored summaries ({len(rows)}):")
            for r in rows:
                print(f"  {r[1]} | model={r[2]} | {r[4]}...")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
