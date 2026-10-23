#!/usr/bin/env sh
# Tanatasa REST API: search products and read one product's details.
# No API key needed. Prices are integer SGD cents (3000 = S$30).
set -eu
API="${TANATASA_API_URL:-https://tanatasa.sg}/agent/v1"

echo "# In-stock cleansers under S\$30"
curl -fsS "$API/products?q=cleanser&in_stock=true&max_price=3000&limit=5"
echo

echo "# Product details by variant slug"
curl -fsS "$API/products/cerave-foaming-cleanser-236ml"
echo
