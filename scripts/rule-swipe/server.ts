import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");
const PAGE_PATH = join(import.meta.dir, "index.html");
const STORE_PATH = join(import.meta.dir, "reviews.json");
const PORT = Number(process.env.RULE_SWIPE_PORT ?? 5179);
const HOST = process.env.RULE_SWIPE_HOST ?? "127.0.0.1";
const MAX_DEPTH = 4;
const MAX_UPLOAD_BYTES = 1024 * 1024;
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "coverage", "tmp", "oracle", "security-report"]);
const RULE_HEADING = /^### `[^`]+`/m;
const EXAMPLE_LABEL = /^(Correct|Incorrect):\s*$/m;
const KEY_PATTERN = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;

type ReviewRecord = Record<string, unknown> & { id: string; doc: string };

type UploadedSource = {
  key: string;
  name: string;
  text: string;
  uploadedAt: string;
};

type StoreFile = {
  reviews: Record<string, ReviewRecord>;
  uploads: Record<string, UploadedSource>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadStore(): Promise<StoreFile> {
  try {
    const parsed: unknown = JSON.parse(await readFile(STORE_PATH, "utf8"));

    if (!isObject(parsed)) {
      return { reviews: {}, uploads: {} };
    }

    return {
      reviews: isObject(parsed.reviews) ? (parsed.reviews as StoreFile["reviews"]) : {},
      uploads: isObject(parsed.uploads) ? (parsed.uploads as StoreFile["uploads"]) : {},
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { reviews: {}, uploads: {} };
    }

    throw new Error(`Failed to read ${STORE_PATH}`, { cause: error });
  }
}

const store = await loadStore();
let pendingWrite: Promise<void> = Promise.resolve();

function persist(): Promise<void> {
  pendingWrite = pendingWrite
    .catch(() => undefined)
    .then(async () => {
      const tempPath = `${STORE_PATH}.tmp`;

      await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`);
      await rename(tempPath, STORE_PATH);
    });

  return pendingWrite;
}

function keyForPath(relativePath: string) {
  return relativePath
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/\//g, ":")
    .replace(/[^a-z0-9_\-.~:@+]/g, "-");
}

async function findCatalogs(dir: string, depth: number): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (depth >= MAX_DEPTH || entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) {
          return [];
        }

        return findCatalogs(fullPath, depth + 1);
      }

      if (!entry.name.toLowerCase().endsWith(".md")) {
        return [];
      }

      const text = await readFile(fullPath, "utf8");

      return RULE_HEADING.test(text) && EXAMPLE_LABEL.test(text) ? [fullPath] : [];
    })
  );

  return nested.flat();
}

async function listSources() {
  const catalogPaths = await findCatalogs(ROOT, 0);

  const catalogs = await Promise.all(
    catalogPaths.sort().map(async (fullPath) => {
      const name = relative(ROOT, fullPath);

      return {
        key: keyForPath(name),
        name,
        origin: "repo",
        text: await readFile(fullPath, "utf8"),
      };
    })
  );

  const uploads = Object.values(store.uploads).map((upload) => ({ ...upload, origin: "upload" }));

  return [...catalogs, ...uploads];
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

function listReviews(doc: string | null) {
  if (!doc) {
    return store.reviews;
  }

  return Object.fromEntries(Object.entries(store.reviews).filter(([, record]) => record.doc === doc));
}

async function saveReview(id: string, request: Request) {
  if (!KEY_PATTERN.test(id)) {
    return Response.json({ error: "INVALID_REVIEW_ID" }, { status: 400 });
  }

  const body = await readJson(request);

  if (!isObject(body) || body.id !== id || typeof body.doc !== "string") {
    return Response.json({ error: "INVALID_REVIEW" }, { status: 400 });
  }

  store.reviews[id] = body as ReviewRecord;
  await persist();

  return Response.json(store.reviews[id]);
}

async function removeReview(id: string) {
  delete store.reviews[id];
  await persist();

  return new Response(null, { status: 204 });
}

async function saveUpload(key: string, request: Request) {
  if (!KEY_PATTERN.test(key)) {
    return Response.json({ error: "INVALID_SOURCE_KEY" }, { status: 400 });
  }

  const body = await readJson(request);

  if (!isObject(body) || typeof body.name !== "string" || typeof body.text !== "string") {
    return Response.json({ error: "INVALID_SOURCE" }, { status: 400 });
  }

  if (body.text.length > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "SOURCE_TOO_LARGE" }, { status: 413 });
  }

  store.uploads[key] = {
    key,
    name: body.name,
    text: body.text,
    uploadedAt: new Date().toISOString(),
  };
  await persist();

  return new Response(null, { status: 204 });
}

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  routes: {
    "/": () => new Response(Bun.file(PAGE_PATH), { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    "/api/health": () => Response.json({ ok: true }),
    "/api/sources": { GET: async () => Response.json(await listSources()) },
    "/api/sources/:key": { PUT: (request) => saveUpload(request.params.key, request) },
    "/api/reviews": {
      GET: (request) => Response.json(listReviews(new URL(request.url).searchParams.get("doc"))),
    },
    "/api/reviews/:id": {
      PUT: (request) => saveReview(request.params.id, request),
      DELETE: (request) => removeReview(request.params.id),
    },
  },
  fetch: () => new Response("Not found", { status: 404 }),
  error: (error) => {
    console.error(error);

    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  },
});

console.log(`Rule swipe: ${server.url}`);
console.log(`Reviews: ${relative(ROOT, STORE_PATH)}`);
