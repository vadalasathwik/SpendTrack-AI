import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import express from "express";

// Load environment variables (.env.local first, fallback to .env)
const cwd = process.cwd();
const envLocalPath = path.resolve(cwd, ".env.local");
const envPath = path.resolve(cwd, ".env");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { createExpressApp } from "./server/app.js";

const app = createExpressApp();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === "development";

function serveStatic(expressApp: express.Application) {
  const distPath = path.resolve(cwd, "dist");
  expressApp.use(express.static(distPath));
  expressApp.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

async function setupVite(expressApp: express.Application) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  expressApp.use(vite.middlewares);

  expressApp.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(cwd, "index.html"), "utf8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).type("html").send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

async function start() {
  if (isDev) {
    await setupVite(app);
  } else {
    serveStatic(app);
  }

  app.listen(PORT, () => {
    console.log(`SpendTrack AI running in ${isDev ? "development" : "production"} mode at http://localhost:${PORT}`);
  });
}

start();