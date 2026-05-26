"""Template-based fallback summary generator — no LLM dependency."""


def generate_summary(case: dict) -> str:
    case_num = case.get("case_number", "N/A")
    priority = case.get("case_priority", "N/A")
    title = case.get("title", "N/A")
    prosecutor = case.get("prosecutor_name", "N/A")
    evidence_count = case.get("evidence_count", 0)
    completed_tests = case.get("completed_lab_tests", 0)
    test_types = case.get("test_types", "none") or "none"
    opened = case.get("opened_date", "N/A")
    closed = case.get("closed_date", "N/A")

    return (
        f"Case {case_num} ({priority} priority) — {title}. "
        f"Prosecuted by {prosecutor}. "
        f"The case involved {evidence_count} evidence item(s) "
        f"with {completed_tests} completed lab test(s) ({test_types}). "
        f"Case was opened on {opened} and closed on {closed}. "
        f"All evidence has been disposed in accordance with standard procedure."
    )
