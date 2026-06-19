/**
 * botforge-embed — Simple embedding server
 * POST /embed  { text: string }  =>  { embedding: number[] }
 * Uses OpenAI-compatible API config from parent .env
 */
const http = require("http");
const { createHash } = require("crypto");

// ── Load env (same as dotenv would, but without importing it) ──
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.EMBEDDING_PORT || "8001", 10);
const API_URL = process.env.EMBEDDING_API_URL || "https://api.openai.com/v1/embeddings";
const API_KEY = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || "";
const MODEL = process.env.EMBEDDING_MODEL || "text-embedding-ada-002";

async function getEmbedding(text) {
  const url = new URL(API_URL);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: MODEL,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding || null;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", model: MODEL }));
    return;
  }

  if (req.method === "POST" && req.url === "/embed") {
    try {
      const { text, input } = await parseBody(req);
      const content = text || input;
      if (!content) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "text or input field required" }));
        return;
      }

      const embedding = await getEmbedding(content);
      if (!embedding) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to generate embedding" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ embedding }));
    } catch (err) {
      console.error("[embed-server] Error:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[botforge-embed] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[botforge-embed] Model: ${MODEL}`);
  console.log(`[botforge-embed] API: ${API_URL}`);
});
