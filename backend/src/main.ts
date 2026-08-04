import "reflect-metadata";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(AppConfigService);
  const logger = new Logger("Bootstrap");

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    })
  );
  app.enableCors({
    credentials: true,
    origin: config.corsOrigins
  });
  app.use(json({ limit: config.requestBodyLimit }));
  app.use(urlencoded({ extended: true, limit: config.requestBodyLimit }));
  app.setGlobalPrefix("api");
  app.enableVersioning({
    defaultVersion: config.apiVersion,
    type: VersioningType.URI
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );
  const documentConfig = new DocumentBuilder()
    .setTitle("Courier Fraud Check BD API")
    .setDescription("Backend API contracts for authentication, fraud search, and infrastructure health.")
    .setVersion("1.0.0")
    .addBearerAuth()
    .addApiKey({ in: "header", name: "x-api-key", type: "apiKey" }, "ApiKeyAuth")
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  await app.listen(config.port);
  logger.log(`Backend listening on port ${config.port} with API prefix /api/v${config.apiVersion}`);
}

void bootstrap();
