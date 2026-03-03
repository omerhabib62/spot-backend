import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);

  app.enableCors({
    credentials: true,
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
void bootstrap();
