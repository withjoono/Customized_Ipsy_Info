import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:3012';
  app.enableCors({ origin: [frontendUrl], credentials: true });

  const port = config.get<number>('PORT') ?? 4012;
  await app.listen(port);
  new Logger('Bootstrap').log(`infocast-backend listening on :${port}`);
}

bootstrap();
