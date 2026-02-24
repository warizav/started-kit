import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CeloModule } from '../celo/celo.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'client'),
      exclude: ['/api/(.*)']
    }),
    CeloModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
