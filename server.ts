import "dotenv/config";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { createExpressApp } from "./server/app.js";

const app = createExpressApp();
const PORT = 3000;

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // API routes already exist inside createExpressApp()

  app.use(vite.middlewares);

  // React fallback (LAST)
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.readFile(path.resolve("index.html"), "utf8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).type("html").send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.listen(PORT, () => {
    console.log(`SpendTrack running at http://localhost:${PORT}`);
  });
}

start();