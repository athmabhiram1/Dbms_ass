import requests


def generate(prompt: str, config: dict) -> str | None:
    payload = {
        "model": config.get("ollama", {}).get("model", "llama3"),
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": config.get("temperature", 0.7),
            "num_predict": config.get("max_tokens", 500),
        },
    }
    url = config.get("ollama", {}).get("url", "http://localhost:11434/api/generate")
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json().get("response", "")
    except Exception as e:
        print(f"  Ollama error: {e}")
        return None
