"""Tanatasa MCP server: connect with the official MCP Python SDK (v2).

Requires Python 3.11 or later.
Run: pip install "mcp>=2,<3" && python search.py "cerave cleanser"
"""
import asyncio
import os
import sys

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

URL = os.environ.get("TANATASA_MCP_URL", "https://tanatasa.sg/mcp")


async def main(query: str) -> None:
    async with streamable_http_client(URL) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print("Tools:", ", ".join(t.name for t in tools.tools))
            # Prices are integer SGD cents: 3000 = S$30.
            result = await session.call_tool(
                "search_products",
                {"q": query, "in_stock": True, "max_price": 3000, "limit": 5},
            )
            for p in result.structured_content["products"]:
                print(f'{p["variant_id"]}\tS${p["unit_price"] / 100:.2f}\t{p["name"]}\t{p["url"]}')


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "cleanser"))
