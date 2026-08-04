import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

type CorrelatedRequest = Request & {
  correlationId?: string;
};

export const CorrelationId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<CorrelatedRequest>();
  return request.correlationId ?? request.headers["x-correlation-id"]?.toString() ?? "unknown";
});
