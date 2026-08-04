export type AppEnvironment = "development" | "test" | "production";

export type AppConfig = {
  appName: string;
  apiVersion: string;
  corsOrigins: string[];
  environment: AppEnvironment;
  port: number;
  queue: {
    defaultAttempts: number;
    retryBackoffMs: number;
  };
  redis: {
    keyPrefix: string;
    url: string;
  };
  requestBodyLimit: string;
};

const allowedEnvironments = new Set<AppEnvironment>(["development", "test", "production"]);

function readString(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readStringList(name: string, fallback: string[]): string[] {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readPort(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const port = Number(rawValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }

  return port;
}

function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

function readEnvironment(): AppEnvironment {
  const value = readString("NODE_ENV", "development");
  if (!allowedEnvironments.has(value as AppEnvironment)) {
    throw new Error("NODE_ENV must be one of development, test, or production.");
  }

  return value as AppEnvironment;
}

export function loadAppConfig(): AppConfig {
  return {
    apiVersion: readString("API_VERSION", "1"),
    appName: readString("APP_NAME", "Courier Fraud Check BD"),
    corsOrigins: readStringList("CORS_ORIGINS", ["http://localhost:3000"]),
    environment: readEnvironment(),
    port: readPort("BACKEND_PORT", 4000),
    queue: {
      defaultAttempts: readPositiveInteger("QUEUE_DEFAULT_ATTEMPTS", 3),
      retryBackoffMs: readPositiveInteger("QUEUE_RETRY_BACKOFF_MS", 5000)
    },
    redis: {
      keyPrefix: readString("REDIS_KEY_PREFIX", "cfcb"),
      url: readString("REDIS_URL", "redis://localhost:6379")
    },
    requestBodyLimit: readString("REQUEST_BODY_LIMIT", "1mb")
  };
}
