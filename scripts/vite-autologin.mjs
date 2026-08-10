import fs from "node:fs";
import path from "node:path";

const STORAGE_KEYS = {
  accessToken: "link.accessToken",
  refreshToken: "link.refreshToken",
  identityProvider: "link.identityProvider",
  projectId: "projectId",
  landingLevel: "landingLevel",
};

function readAppId(root) {
  try {
    const src = fs.readFileSync(path.join(root, "config.js"), "utf8");
    return src.match(/appId:\s*"([^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export default function autoLogin({ projectId, root = process.cwd() } = {}) {
  const appId = readAppId(root);

  return {
    name: "greycollar-tunnel-autologin",
    apply: "serve",
    transformIndexHtml(html) {
      if (!appId || !projectId) {
        console.warn(
          "[tunnel] auto-login skipped: could not resolve appId or projectId."
        );
        return html;
      }

      const script = `
(async () => {
  var K = ${JSON.stringify(STORAGE_KEYS)};
  try {
    if (localStorage.getItem(K.accessToken)) return;
    var res = await fetch("/api/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: ${JSON.stringify(appId)},
        projectId: ${JSON.stringify(projectId)},
        username: "admin",
        password: "admin",
        identityProvider: "DEMO",
      }),
    });
    if (!res.ok) {
      console.warn("[tunnel] auto-login failed:", res.status, await res.text());
      return;
    }
    var d = await res.json();
    localStorage.setItem(K.accessToken, d.accessToken);
    localStorage.setItem(K.refreshToken, d.refreshToken);
    localStorage.setItem(K.identityProvider, "DEMO");
    localStorage.setItem(K.projectId, ${JSON.stringify(projectId)});
    localStorage.setItem(K.landingLevel, "1");
    location.reload();
  } catch (e) {
    console.warn("[tunnel] auto-login error:", e);
  }
})();
`.trim();

      return {
        html,
        tags: [{ tag: "script", children: script, injectTo: "head-prepend" }],
      };
    },
  };
}
