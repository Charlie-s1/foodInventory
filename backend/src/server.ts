import Fastify from "fastify";
import { userRoutes } from "./routes/user.js";
import fastifyStatic from "@fastify/static";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const app = Fastify({ logger: true });

app.get("/api/health", async () => {
  return { status: "ok" };
});
app.register(userRoutes, { prefix: "/api" });

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
if (existsSync(publicDir)) {
  await app.register(fastifyStatic, { root: publicDir });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api")) {
      reply.status(404).send({ error: "Not Found" });
    }
    return reply.sendFile("index.html");
  });
}

try {
  await app.listen({ port: 3000, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
