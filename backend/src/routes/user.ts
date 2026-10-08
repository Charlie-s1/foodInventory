import Fastify, { FastifyInstance } from "fastify";
import db from "../db.js";

const app = Fastify({ logger: true });

const userRoutes = async (app: FastifyInstance) => {
  app.get("/users", async () => {
    return db.prepare("SELECT * FROM users").all();
  });

  app.post<{ Body: { name: string } }>("/users", async (req, reply) => {
    const info = db.prepare("INSERT INTO users (name) VALUES (?)").run(req.body.name);
    reply.code(201);
    return { id: Number(info.lastInsertRowid), name: req.body.name };
  });
};

export { userRoutes };
