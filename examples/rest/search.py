"""Tanatasa REST API: product search with the Python standard library.

No API key needed. Prices are integer SGD cents (3000 = S$30).
Run: python search.py "cerave cleanser"
"""
import json
import os
import sys
import urllib.parse
import urllib.request

API = os.environ.get("TANATASA_API_URL", "https://tanatasa.sg") + "/agent/v1"


def search(q: str, max_price_cents: int = 3000, limit: int = 5) -> dict:
    query = urllib.parse.urlencode({"q": q, "in_stock": "true", "max_price": max_price_cents, "limit": limit})
    # Identify this example; the agent API also accepts urllib's default User-Agent.
    headers = {"Accept": "application/json", "User-Agent": "tanatasa-example/1.0 (+https://github.com/tanatasa-ai/tanatasa)"}
    request = urllib.request.Request(f"{API}/products?{query}", headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


if __name__ == "__main__":
    result = search(sys.argv[1] if len(sys.argv) > 1 else "cleanser")
    for p in result["products"]:
        print(f'{p["variant_id"]:>6}  S${p["unit_price"] / 100:>7.2f}  {p["brand"] or "":<16} {p["name"]}  {p["url"]}')
    print("next_page:", result["next_page"])
