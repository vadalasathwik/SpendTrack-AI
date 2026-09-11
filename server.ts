import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

import { createServer as createViteServer } from "vite";
import { createExpressApp } from "./server/app.js";

const app = createExpressApp();
const PORT = process.env.PORT || 3000;

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // React fallback (LAST)
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve("index.html"), "utf8");
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