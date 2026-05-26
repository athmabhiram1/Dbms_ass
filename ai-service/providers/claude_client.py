import requests


def generate(prompt: str, config: dict) -> str | None:
    api_key = config.get("claude", {}).get("api_key", "")
    if not api_key:
        print("  Claude API key not configured")
        return None

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": config.get("claude", {}).get("model", "claude-3-5-sonnet-20241022"),
        "max_tokens": config.get("max_tokens", 500),
        "messages": [{"role": "user", "content": prompt}],
    }
    url = config.get("claude", {}).get("url", "https://api.anthropic.com/v1/messages")
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]
    except Exception as e:
        print(f"  Claude error: {e}")
        return None
