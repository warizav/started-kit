import { Module } from '@nestjs/common';
import { CeloController } from './celo.controller';
import { CeloService } from './celo.service';

@Module({
  controllers: [CeloController],
  providers: [CeloService],
  exports: [CeloService]
})
export class CeloModule {}
