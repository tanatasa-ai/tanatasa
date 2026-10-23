// Tanatasa MCP server: connect with the official MCP TypeScript SDK.
// Run: npm install && node search.mjs "cerave cleanser"
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.TANATASA_MCP_URL ?? "https://tanatasa.sg/mcp");
const client = new Client({ name: "tanatasa-example", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(url));

const { tools } = await client.listTools();
console.log("Tools:", tools.map((t) => t.name).join(", "));

// Prices are integer SGD cents: 3000 = S$30.
const result = await client.callTool({
  name: "search_products",
  arguments: { q: process.argv[2] ?? "cleanser", in_stock: true, max_price: 3000, limit: 5 },
});
for (const p of result.structuredContent.products) {
  console.log(`${p.variant_id}\tS$${(p.unit_price / 100).toFixed(2)}\t${p.name}\t${p.url}`);
}
await client.close();
