import fs from "node:fs";

const url = process.env.TUNNEL_URL;
const root = process.env.TUNNEL_ROOT;

if (!url || !root) {
  console.error("TUNNEL_URL and TUNNEL_ROOT are required.");
  process.exit(1);
}

const edits = [];

function openForPatch(path) {
  try {
    return fs.openSync(path, "r+");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function patch(rel, fn) {
  const fd = openForPatch(`${root}/${rel}`);
  if (fd === null) return false;
  try {
    const before = fs.readFileSync(fd, "utf8");
    const after = fn(before);
    if (after === before) return false;
    fs.ftruncateSync(fd, 0);
    fs.writeSync(fd, after, 0);
    return true;
  } finally {
    fs.closeSync(fd);
  }
}

if (
  patch("dashboard/config.js", (s) =>
    s.replace(
      /(redirectUri:\s*")https?:\/\/[^"]*(\/dashboard\/callback")/,
      `$1${url}$2`
    )
  )
) {
  edits.push("dashboard/config.js: project.github.redirectUri");
}

const viteRel = "dashboard/vite.config.ts";
const autoLoginProjectId = process.env.TUNNEL_PROJECT_ID;

const vitePatched = patch(viteRel, (s) => {
  let out = s.replace(
    /^(\s*)return defineConfig\(config\);/m,
    (_m, indent) =>
      `${indent}config.server = {\n` +
      `${indent}  ...config.server,\n` +
      `${indent}  allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.io", ".ngrok-free.dev"],\n` +
      `${indent}};\n` +
      (autoLoginProjectId
        ? `${indent}config.plugins = [\n` +
          `${indent}  ...(config.plugins ?? []),\n` +
          `${indent}  autoLogin({\n` +
          `${indent}    projectId: ${JSON.stringify(autoLoginProjectId)},\n` +
          `${indent}    root: ${JSON.stringify(`${root}/dashboard`)},\n` +
          `${indent}  }),\n` +
          `${indent}];\n`
        : "") +
      `${indent}return defineConfig(config);`
  );

  if (out !== s && autoLoginProjectId) {
    out = `import autoLogin from "../scripts/vite-autologin.mjs";\n` + out;
  }

  return out;
});

if (vitePatched) {
  edits.push(
    `${viteRel}: server.allowedHosts` +
      (autoLoginProjectId ? " + auto-login plugin" : "")
  );
} else if (fs.existsSync(`${root}/${viteRel}`)) {
  console.error(
    `  WARNING: could not patch ${viteRel} (expected shape not found).\n` +
      "  Without server.allowedHosts, vite will reject tunnel requests with a 403."
  );
}

if (
  patch(".env.local", (s) =>
    s.replace(
      /^(GOOGLE_REDIRECT_URI|GDRIVE_REDIRECT_URI)=https?:\/\/[^/\s]+(\S*)$/gm,
      (_m, key, path) => `${key}=${url}${path}`
    )
  )
) {
  edits.push(".env.local: GOOGLE_REDIRECT_URI, GDRIVE_REDIRECT_URI");
}

for (const e of edits) console.log("  patched -> " + e);
