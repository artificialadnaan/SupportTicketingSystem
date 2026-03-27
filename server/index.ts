import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = express();
  const port = Number(process.env.PORT) || 4000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // Register API routes
  registerRoutes(app);

  // In production, serve the built frontend
  if (process.env.NODE_ENV === "production") {
    const publicDir = path.resolve(__dirname, "../dist/public");
    app.use(express.static(publicDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`[Server] T Rock Support Hub running on port ${port}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

main().catch((err) => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});
