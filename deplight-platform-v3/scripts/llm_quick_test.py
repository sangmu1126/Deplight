#!/usr/bin/env python3
import os
import sys

import requests


def main() -> int:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("error: OPENAI_API_KEY is not set")
        return 2

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    try:
        response = requests.get(
            f"{base_url}/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15,
        )
        response.raise_for_status()
        print("OpenAI API authentication succeeded")
        return 0
    except requests.RequestException as exc:
        print(f"OpenAI API authentication failed: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
