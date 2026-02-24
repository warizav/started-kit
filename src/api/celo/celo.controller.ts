import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  Sse,
  MessageEvent
} from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { CeloService } from './celo.service';

@Controller('api/celo')
export class CeloController {
  constructor(private readonly celoService: CeloService) {}

  /**
   * GET /api/celo/price
   * Snapshot actual del precio de CELO y cUSD.
   */
  @Get('price')
  async getPrice() {
    return this.celoService.getPrice();
  }

  /**
   * GET /api/celo/price/stream
   * Server-Sent Events: emite el precio cada 30 s.
   * Cualquier app puede subscribirse con EventSource('/api/celo/price/stream').
   */
  @Sse('price/stream')
  priceStream(): Observable<MessageEvent> {
    return interval(30_000).pipe(
      switchMap(() => this.celoService.getPrice()),
      map(
        (price) =>
          ({
            data: JSON.stringify(price),
            type: 'celo-price'
          }) as MessageEvent
      )
    );
  }

  /**
   * GET /api/celo/network?net=testnet
   */
  @Get('network')
  async getNetwork(@Query('net') net = 'testnet') {
    return this.celoService.getNetworkInfo(this.parseNet(net));
  }

  /**
   * GET /api/celo/wallet/:address?net=testnet
   * Devuelve saldos CELO + cUSD de una wallet.
   */
  @Get('wallet/:address')
  async getWallet(
    @Param('address') address: string,
    @Query('net') net = 'testnet'
  ) {
    try {
      return await this.celoService.getWalletInfo(address, this.parseNet(net));
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  private parseNet(net: string): 'mainnet' | 'testnet' {
    if (net === 'mainnet' || net === 'testnet') return net;
    throw new BadRequestException('net debe ser "mainnet" o "testnet"');
  }
}
