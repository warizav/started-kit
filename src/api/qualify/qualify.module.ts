import { Module } from '@nestjs/common';
import { QualifyController } from './qualify.controller';
import { QualifyService } from './qualify.service';

@Module({
  controllers: [QualifyController],
  providers: [QualifyService]
})
export class QualifyModule {}
