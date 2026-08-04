import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";

type RequestWithContext = Request & {
  correlationId?: string;
  user?: {
    id: string;
  };
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const method = request.method;
    const path = request.url;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        const userId = request.user?.id ?? "anonymous";
        const correlationId = request.correlationId ?? "unknown";
        this.logger.log(`${method} ${path} ${response.statusCode} ${durationMs}ms correlationId=${correlationId} userId=${userId}`);
      })
    );
  }
}
