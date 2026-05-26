"""CustodyCore AI Summariser — Flask microservice."""

import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

from summariser import summarise_case

app = Flask(__name__)


@app.route("/summarise", methods=["POST"])
def summarise():
    body = request.get_json(silent=True)
    if not body or "case_id" not in body:
        return jsonify({"error": "case_id is required"}), 400

    case_id = body["case_id"]
    provider = body.get("provider")
    try:
        result = summarise_case(case_id, provider)
        if "error" in result:
            return jsonify(result), 404
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "custodycore-ai"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
