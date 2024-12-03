import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    process.env.TZ = 'America/Lima';
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(process.argv[3] ? Number(process.argv[3]) : 3001);
}
bootstrap();
