import requests


def generate(prompt: str, config: dict) -> str | None:
    api_key = config.get("openai", {}).get("api_key", "")
    if not api_key:
        print("  OpenAI API key not configured")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": config.get("openai", {}).get("model", "gpt-4o-mini"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": config.get("temperature", 0.7),
        "max_tokens": config.get("max_tokens", 500),
    }
    url = config.get("openai", {}).get("url", "https://api.openai.com/v1/chat/completions")
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  OpenAI error: {e}")
        return None
