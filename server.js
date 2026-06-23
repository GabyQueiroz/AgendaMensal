import express from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const dataFile = process.env.DATA_FILE || path.join(__dirname, "data", "agenda.json");
const gistId = process.env.GIST_ID;
const gistToken = process.env.GITHUB_TOKEN;
const gistFilename = process.env.GIST_FILENAME || "agenda.json";

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
  const storage = isGistStorageEnabled() ? `GitHub Gist (${gistFilename})` : dataFile;
  console.log(`Agenda Mensal rodando na porta ${port}. Armazenamento: ${storage}`);
});

async function readAgenda() {
  if (isGistStorageEnabled()) {
    return readAgendaFromGist();
  }

  try {
    const raw = await readFile(dataFile, "utf8");
    return normalizePayload(JSON.parse(raw));
  } catch {
    return { events: [], tasks: [], blocks: [] };
  }
}

async function writeAgenda(payload) {
  if (isGistStorageEnabled()) {
    await writeAgendaToGist(payload);
    return;
  }

  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(payload, null, 2), "utf8");
}

function isGistStorageEnabled() {
  return Boolean(gistId && gistToken);
}

async function readAgendaFromGist() {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao ler Gist: ${response.status}`);
  }

  const gist = await response.json();
  const file = gist.files?.[gistFilename];
  if (!file?.content) {
    return { events: [], tasks: [], blocks: [] };
  }

  return normalizePayload(JSON.parse(file.content));
}

async function writeAgendaToGist(payload) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: githubHeaders(),
    body: JSON.stringify({
      files: {
        [gistFilename]: {
          content: JSON.stringify(normalizePayload(payload), null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar Gist: ${response.status}`);
  }
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${gistToken}`,
    "Content-Type": "application/json",
    "User-Agent": "agenda-mensal-render",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function normalizePayload(payload = {}) {
  return {
    events: Array.isArray(payload.events) ? payload.events : [],
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
  };
}
