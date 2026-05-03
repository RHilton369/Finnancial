import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      // Zod Validation Errors
      if (error instanceof ZodError) {
        logger.warn({
          msg: "Validation error",
          errors: error.errors,
          url: request.url,
          method: request.method,
          traceId: request.id,
        });

        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          details: error.errors,
        });
      }

      // Tratamento genérico de falhas não previstas (Fail Fast / Global Catcher)
      logger.error({
        msg: "Unhandled Internal Server Error",
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        traceId: request.id,
      });

      return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  );
}
