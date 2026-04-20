const http = require("http");
const fs = require("fs");
const path = require("path");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const root = __dirname;
const siteUrl = process.env.SITE_URL || "https://vibevoice.lol";
const canonicalHost = process.env.CANONICAL_HOST || "vibevoice.lol";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".manifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const escapeForJs = (value) =>
  JSON.stringify(typeof value === "string" ? value : "");

const loadEnvFile = (filename) => {
  const filepath = path.join(root, filename);
  if (!fs.existsSync(filepath)) return;

  const source = fs.readFileSync(filepath, "utf8");
  source.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
};

if (process.env.NODE_ENV === "production") {
  loadEnvFile(".env.production");
} else {
  loadEnvFile(".env.development");
}

const effectiveSiteUrl = process.env.SITE_URL || siteUrl;
const effectiveCanonicalHost = process.env.CANONICAL_HOST || canonicalHost;
const gaMeasurementId = process.env.GA_MEASUREMENT_ID || "";
const clarityProjectId = process.env.CLARITY_PROJECT_ID || "";

const send = (response, statusCode, headers, body) => {
  response.writeHead(statusCode, headers);
  response.end(body);
};

const redirect = (response, location) => {
  send(
    response,
    308,
    {
      Location: location,
      "Cache-Control": "no-cache",
      "Content-Type": "text/plain; charset=utf-8"
    },
    `Redirecting to ${location}`
  );
};

const buildAppConfig = () =>
  [
    "window.__SITE_CONFIG__ = {",
    `  siteUrl: ${escapeForJs(effectiveSiteUrl)},`,
    `  canonicalHost: ${escapeForJs(effectiveCanonicalHost)},`,
    `  gaMeasurementId: ${escapeForJs(gaMeasurementId)},`,
    `  clarityProjectId: ${escapeForJs(clarityProjectId)}`,
    "};",
    ""
  ].join("\n");

const serveFile = (requestPath, response) => {
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.join(root, safePath);

  if (!resolvedPath.startsWith(root)) {
    send(response, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, body) => {
    if (error) {
      if (error.code === "ENOENT") {
        send(response, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found");
        return;
      }

      send(response, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Internal Server Error");
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const cacheControl = ext === ".html" || ext === ".xml" || ext === ".txt" || ext === ".webmanifest"
      ? "no-cache"
      : "public, max-age=31536000, immutable";

    send(
      response,
      200,
      {
        "Cache-Control": cacheControl,
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY"
      },
      body
    );
  });
};

const redirectToCanonicalOrigin = (request, response, url) => {
  const forwardedHost = request.headers["x-forwarded-host"];
  const rawHost = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || request.headers.host || "";
  const hostname = rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const target = new URL(effectiveSiteUrl);

  if (hostname === `www.${effectiveCanonicalHost}`) {
    target.pathname = url.pathname;
    target.search = url.search;
    redirect(response, target.toString());
    return true;
  }

  if (hostname === effectiveCanonicalHost && proto === "http" && target.protocol === "https:") {
    target.pathname = url.pathname;
    target.search = url.search;
    redirect(response, target.toString());
    return true;
  }

  return false;
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  if (redirectToCanonicalOrigin(request, response, url)) {
    return;
  }

  if (pathname === "/healthz") {
    send(
      response,
      200,
      {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json; charset=utf-8"
      },
      JSON.stringify({ ok: true })
    );
    return;
  }

  if (pathname === "/app-config.js") {
    send(
      response,
      200,
      {
        "Cache-Control": "no-cache",
        "Content-Type": "text/javascript; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      },
      buildAppConfig()
    );
    return;
  }

  if (pathname === "/") {
    pathname = "/index.html";
  }

  serveFile(pathname, response);
});

server.listen(port, host, () => {
  console.log(`Static site listening on http://${host}:${port}`);
});
