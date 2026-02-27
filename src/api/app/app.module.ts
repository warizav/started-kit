import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DemoModule } from '../demo/demo.module';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DemoModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'client'),
      exclude: ['/api/(.*)']
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
