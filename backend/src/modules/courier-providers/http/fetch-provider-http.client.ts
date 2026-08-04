import { Injectable } from "@nestjs/common";
import type {
  ProviderHttpClient,
  ProviderHttpRequest,
  ProviderHttpResponse
} from "../contracts/http-client.interface";

@Injectable()
export class FetchProviderHttpClient implements ProviderHttpClient {
  async send<TBody = unknown>(request: ProviderHttpRequest): Promise<ProviderHttpResponse<TBody>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(request.url, {
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        headers: request.headers,
        method: request.method,
        signal: controller.signal
      });
      const body = (await this.readBody(response)) as TBody;

      return {
        body,
        headers: Object.fromEntries(response.headers.entries()),
        statusCode: response.status
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  }
}
