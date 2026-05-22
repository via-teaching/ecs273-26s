import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Vite's default public middleware can mis-resolve paths when filenames contain
 * reserved URI characters (e.g. "58%"). The request then falls through to the
 * SPA shell (index.html) with 200. This only handles /data/stocknews/** with
 * full decodeURIComponent and a safe path join.
 */
function stockNewsPublicMiddleware(rootDir) {
  const newsRoot = path.join(rootDir, "public", "data", "stocknews");

  return function stocknews(req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const pathPart = (req.url ?? "").split("?")[0];
    if (!pathPart.startsWith("/data/stocknews/")) return next();

    let pathname;
    try {
      pathname = decodeURIComponent(pathPart);
    } catch {
      return next();
    }

    const rel = pathname.replace(/^\/data\/stocknews\/?/, "");
    if (!rel || rel.includes("..")) return next();

    const candidate = path.normalize(path.join(newsRoot, rel));
    const relToNews = path.relative(newsRoot, candidate);
    if (relToNews.startsWith("..") || path.isAbsolute(relToNews)) return next();

    fs.stat(candidate, (err, st) => {
      if (err || !st.isFile()) return next();
      if (req.method === "HEAD") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Content-Length", String(st.size));
        res.end();
        return;
      }
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      const stream = fs.createReadStream(candidate);
      stream.on("error", () => next());
      stream.pipe(res);
    });
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "stocknews-public-decode",
      enforce: "pre",
      configureServer(server) {
        server.middlewares.use(stockNewsPublicMiddleware(server.config.root));
      },
      configurePreviewServer(server) {
        server.middlewares.use(stockNewsPublicMiddleware(server.config.root));
      },
    },
    react(),
    tailwindcss(),
  ],
});
