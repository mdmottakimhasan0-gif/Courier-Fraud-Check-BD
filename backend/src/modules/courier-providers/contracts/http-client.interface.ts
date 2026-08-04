export type ProviderHttpHeaders = Readonly<Record<string, string>>;

export type ProviderHttpRequest = {
  body?: unknown;
  headers?: ProviderHttpHeaders;
  method: "GET" | "POST";
  timeoutMs: number;
  url: string;
};

export type ProviderHttpResponse<TBody = unknown> = {
  body: TBody;
  headers: ProviderHttpHeaders;
  statusCode: number;
};

export interface ProviderHttpClient {
  send<TBody = unknown>(request: ProviderHttpRequest): Promise<ProviderHttpResponse<TBody>>;
}
