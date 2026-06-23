import express from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const dataFile = process.env.DATA_FILE || path.join(__dirname, "data", "agenda.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname, {
  extensions: ["html"],
  setHeaders(response, filePath) {
    if (filePath.endsWith("config.js") || filePath.endsWith("app.js")) {
      response.setHeader("Cache-Control", "no-store");
    }
  },
}));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/agenda", async (_request, response) => {
  response.json(await readAgenda());
});

app.put("/api/agenda", async (request, response) => {
  const payload = normalizePayload(request.body);
  await writeAgenda(payload);
  response.json({ ok: true, payload });
});

app.post("/api/agenda", async (request, response) => {
  const payload = normalizePayload(request.body);
  await writeAgenda(payload);
  response.json({ ok: true, payload });
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Agenda Mensal rodando na porta ${port}`);
});

async function readAgenda() {
  try {
    const raw = await readFile(dataFile, "utf8");
    return normalizePayload(JSON.parse(raw));
  } catch {
    return { events: [], tasks: [], blocks: [] };
  }
}

async function writeAgenda(payload) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(payload, null, 2), "utf8");
}

function normalizePayload(payload = {}) {
  return {
    events: Array.isArray(payload.events) ? payload.events : [],
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
  };
}
