import express from "express";
import pg from "pg";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const dataFile = process.env.DATA_FILE || path.join(__dirname, "data", "agenda.json");
const databaseUrl = process.env.DATABASE_URL;
const gistId = process.env.GIST_ID;
const gistToken = process.env.GITHUB_TOKEN;
const gistFilename = process.env.GIST_FILENAME || "agenda.json";
const githubToken = process.env.GITHUB_JSON_TOKEN || process.env.GITHUB_TOKEN;
const githubOwner = process.env.GITHUB_OWNER;
const githubRepo = process.env.GITHUB_REPO;
const githubDataPath = process.env.GITHUB_DATA_PATH || "agenda-data.json";
const githubDataBranch = process.env.GITHUB_DATA_BRANCH || "data";
const githubSourceBranch = process.env.GITHUB_SOURCE_BRANCH || "main";
const postgresPool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl }) : null;
let postgresSchemaReady;

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
  const storage = isGitHubJsonStorageEnabled()
    ? `GitHub JSON (${githubOwner}/${githubRepo}:${githubDataBranch}/${githubDataPath})`
    : postgresPool
      ? "Render Postgres"
      : isGistStorageEnabled()
        ? `GitHub Gist (${gistFilename})`
        : dataFile;
  console.log(`Agenda Mensal rodando na porta ${port}. Armazenamento: ${storage}`);
});

async function readAgenda() {
  if (isGitHubJsonStorageEnabled()) {
    return readAgendaFromGitHubJson();
  }

  if (postgresPool) {
    return readAgendaFromPostgres();
  }

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
  if (isGitHubJsonStorageEnabled()) {
    await writeAgendaToGitHubJson(payload);
    return;
  }

  if (postgresPool) {
    await writeAgendaToPostgres(payload);
    return;
  }

  if (isGistStorageEnabled()) {
    await writeAgendaToGist(payload);
    return;
  }

  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(payload, null, 2), "utf8");
}

async function ensurePostgresSchema() {
  if (!postgresSchemaReady) {
    postgresSchemaReady = postgresPool.query(`
      create table if not exists agenda_state (
        id text primary key,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
  }
  await postgresSchemaReady;
}

async function readAgendaFromPostgres() {
  await ensurePostgresSchema();
  const result = await postgresPool.query("select payload from agenda_state where id = $1", ["default"]);
  if (!result.rows.length) {
    return { events: [], tasks: [], blocks: [] };
  }
  return normalizePayload(result.rows[0].payload);
}

async function writeAgendaToPostgres(payload) {
  await ensurePostgresSchema();
  await postgresPool.query(
    `
      insert into agenda_state (id, payload, updated_at)
      values ($1, $2, now())
      on conflict (id)
      do update set payload = excluded.payload, updated_at = now()
    `,
    ["default", normalizePayload(payload)]
  );
}

function isGitHubJsonStorageEnabled() {
  return Boolean(githubToken && githubOwner && githubRepo);
}

async function readAgendaFromGitHubJson() {
  await ensureGitHubDataBranch();
  const file = await getGitHubDataFile();
  if (!file?.content) {
    return { events: [], tasks: [], blocks: [] };
  }

  const raw = Buffer.from(file.content, "base64").toString("utf8");
  return normalizePayload(JSON.parse(raw));
}

async function writeAgendaToGitHubJson(payload) {
  await ensureGitHubDataBranch();
  const existingFile = await getGitHubDataFile();
  const body = {
    message: "Atualiza dados da agenda",
    content: Buffer.from(JSON.stringify(normalizePayload(payload), null, 2), "utf8").toString("base64"),
    branch: githubDataBranch,
  };

  if (existingFile?.sha) {
    body.sha = existingFile.sha;
  }

  const response = await fetch(githubContentsUrl(), {
    method: "PUT",
    headers: githubHeaders(githubToken),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar JSON no GitHub: ${response.status}`);
  }
}

async function getGitHubDataFile() {
  const response = await fetch(`${githubContentsUrl()}?ref=${encodeURIComponent(githubDataBranch)}`, {
    headers: githubHeaders(githubToken),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Falha ao ler JSON no GitHub: ${response.status}`);
  }

  return response.json();
}

async function ensureGitHubDataBranch() {
  const dataRefResponse = await fetch(githubRefUrl(githubDataBranch), {
    headers: githubHeaders(githubToken),
  });

  if (dataRefResponse.ok) return;
  if (dataRefResponse.status !== 404) {
    throw new Error(`Falha ao verificar branch de dados: ${dataRefResponse.status}`);
  }

  const sourceRefResponse = await fetch(githubRefUrl(githubSourceBranch), {
    headers: githubHeaders(githubToken),
  });

  if (!sourceRefResponse.ok) {
    throw new Error(`Falha ao ler branch principal: ${sourceRefResponse.status}`);
  }

  const sourceRef = await sourceRefResponse.json();
  const createRefResponse = await fetch(githubRefsUrl(), {
    method: "POST",
    headers: githubHeaders(githubToken),
    body: JSON.stringify({
      ref: `refs/heads/${githubDataBranch}`,
      sha: sourceRef.object.sha,
    }),
  });

  if (!createRefResponse.ok && createRefResponse.status !== 422) {
    throw new Error(`Falha ao criar branch de dados: ${createRefResponse.status}`);
  }
}

function githubContentsUrl() {
  return `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${githubDataPath}`;
}

function githubRefUrl(branch) {
  return `${githubRefsUrl()}/heads/${encodeURIComponent(branch)}`;
}

function githubRefsUrl() {
  return `https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs`;
}

function isGistStorageEnabled() {
  return Boolean(gistId && gistToken);
}

async function readAgendaFromGist() {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: githubHeaders(gistToken),
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
    headers: githubHeaders(gistToken),
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

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
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
