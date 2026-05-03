import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import { logger } from "./utils/logger";
import { errorHandlerPlugin } from "./plugins/errorHandler";
import { webhookRoutes } from "./routes/webhook";
import { transactionRoutes } from "./routes/transactions";
import { categoryRoutes } from "./routes/categories";
import { limitRoutes } from "./routes/limits";

const server = Fastify({
  logger: false,
  genReqId: () => crypto.randomUUID(),
});

// --- Plugins ---

const isDev = process.env.NODE_ENV !== "production";

server.register(cors, {
  origin: isDev ? "*" : ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

server.register(errorHandlerPlugin);

// --- Hooks de Observabilidade ---

server.addHook("onRequest", async (request) => {
  logger.info({
    msg: "Request received",
    method: request.method,
    url: request.url,
    traceId: request.id,
  });
});

server.addHook("onResponse", async (request, reply) => {
  logger.info({
    msg: "Request completed",
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: Math.round(reply.elapsedTime),
    traceId: request.id,
  });
});

// --- Healthcheck ---

server.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// --- Registro de Rotas Modulares ---

server.register(webhookRoutes);
server.register(transactionRoutes);
server.register(categoryRoutes);
server.register(limitRoutes);

// --- Bootstrap ---

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: "0.0.0.0" });
    logger.info(`Server listening on port ${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
