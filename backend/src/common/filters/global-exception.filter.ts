import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

type ErrorResponse = {
  error: {
    code: string;
    correlationId: string;
    message: string;
    path: string;
    statusCode: number;
    timestamp: string;
  };
};

type CorrelatedRequest = Request & {
  correlationId?: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<CorrelatedRequest>();
    const response = context.getResponse<Response>();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const correlationId = request.correlationId ?? request.headers["x-correlation-id"]?.toString() ?? randomUUID();
    const message = this.resolveMessage(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(message);
    }

    const payload: ErrorResponse = {
      error: {
        code: this.resolveCode(statusCode),
        correlationId,
        message,
        path: request.url,
        statusCode,
        timestamp: new Date().toISOString()
      }
    };

    response.status(statusCode).json(payload);
  }

  private resolveCode(statusCode: number): string {
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return "INTERNAL_SERVER_ERROR";
    }

    return "REQUEST_ERROR";
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "string") {
        return response;
      }

      if (typeof response === "object" && response !== null && "message" in response) {
        const message = (response as { message: unknown }).message;
        return Array.isArray(message) ? message.join("; ") : String(message);
      }
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return "Unexpected application error.";
  }
}
