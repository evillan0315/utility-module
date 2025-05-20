import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as express from 'express';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = [
    'https://board-api.duckdns.org',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  const configService = app.get(ConfigService);
  const NODE_ENV = configService.get<string>('NODE_ENV') || 'development';
  const port = configService.get<number>('PORT', 3000);
  const base_url =
    configService.get<string>('BASE_URL') || `http://localhost:${port}`;
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED') || false;

  //app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.error(`Blocked by CORS: ${origin}`); // Debugging
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Utility API')
    .setDescription('Utility APIs')
    .setVersion('1.0')
    //.addTag('Auth')
    //.addBearerAuth()
    //.addCookieAuth('jwt')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Graceful shutdown setup
  app.enableShutdownHooks(); // Handle graceful shutdown
  await app.listen(port);
  logger.log(`Application is running on: ${base_url}:${port}`);
}
bootstrap();
