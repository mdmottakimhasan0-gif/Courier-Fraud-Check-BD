import { randomUUID } from "node:crypto";
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export type CorrelatedRequest = Request & {
  correlationId: string;
};

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.headers["x-correlation-id"]?.toString().trim();
    const correlationId = incoming && incoming.length > 0 ? incoming : randomUUID();

    (request as CorrelatedRequest).correlationId = correlationId;
    response.setHeader("x-correlation-id", correlationId);
    next();
  }
}
