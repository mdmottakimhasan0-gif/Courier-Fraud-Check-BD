import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import type { Request } from "express";
import { map, Observable } from "rxjs";
import type { ApiResponse, ApiResponsePayload } from "../responses/api-response.types";

type CorrelatedRequest = Request & {
  correlationId?: string;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();

    return next.handle().pipe(
      map((value: ApiResponsePayload | unknown) => {
        const payload = this.normalizePayload(value);

        return {
          correlationId: request.correlationId ?? request.headers["x-correlation-id"]?.toString() ?? "unknown",
          data: payload.data,
          message: payload.message ?? "Request completed successfully.",
          meta: payload.meta ?? null,
          success: true,
          timestamp: new Date().toISOString()
        };
      })
    );
  }

  private normalizePayload(value: ApiResponsePayload | unknown): ApiResponsePayload {
    if (value && typeof value === "object" && "data" in value) {
      return value as ApiResponsePayload;
    }

    return {
      data: value
    };
  }
}
