import { Injectable, Logger } from '@nestjs/common';
import { createPublicClient, http, formatEther, isAddress } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';

export interface CeloPrice {
  celo_usd: number;
  celo_eur: number;
  cusd_usd: number;
  timestamp: number;
  change_24h: number;
}

export interface WalletInfo {
  address: string;
  network: string;
  balances: { CELO: string; cUSD: string };
}

const CUSD = {
  mainnet: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`,
  testnet: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as `0x${string}`
};

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

@Injectable()
export class CeloService {
  private readonly logger = new Logger(CeloService.name);
  private cachedPrice: CeloPrice | null = null;
  private lastFetch = 0;
  private readonly CACHE_TTL = 30_000; // 30s

  private getClient(network: 'mainnet' | 'testnet') {
    return createPublicClient({
      chain: network === 'mainnet' ? celo : celoAlfajores,
      transport: http()
    });
  }

  // ─── Price Feed ─────────────────────────────────────────────────────────────

  async getPrice(): Promise<CeloPrice> {
    const now = Date.now();
    if (this.cachedPrice && now - this.lastFetch < this.CACHE_TTL) {
      return this.cachedPrice;
    }

    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=celo,celo-dollar&vs_currencies=usd,eur&include_24hr_change=true'
      );
      const data = await res.json();

      this.cachedPrice = {
        celo_usd: data?.celo?.usd ?? 0,
        celo_eur: data?.celo?.eur ?? 0,
        cusd_usd: data?.['celo-dollar']?.usd ?? 1,
        change_24h: data?.celo?.usd_24h_change ?? 0,
        timestamp: now
      };
      this.lastFetch = now;
      return this.cachedPrice;
    } catch (err) {
      this.logger.warn('CoinGecko fetch failed, using cached or fallback');
      return (
        this.cachedPrice ?? {
          celo_usd: 0,
          celo_eur: 0,
          cusd_usd: 1,
          change_24h: 0,
          timestamp: now
        }
      );
    }
  }

  // ─── Wallet Info ─────────────────────────────────────────────────────────────

  async getWalletInfo(
    address: string,
    network: 'mainnet' | 'testnet' = 'testnet'
  ): Promise<WalletInfo> {
    if (!isAddress(address)) throw new Error('Invalid Celo address');
    const client = this.getClient(network);
    const addr = address as `0x${string}`;

    const [celoBalance, cusdBalance] = await Promise.all([
      client.getBalance({ address: addr }),
      client.readContract({
        address: CUSD[network],
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [addr]
      })
    ]);

    return {
      address,
      network,
      balances: {
        CELO: formatEther(celoBalance),
        cUSD: formatEther(cusdBalance)
      }
    };
  }

  // ─── Network Info ─────────────────────────────────────────────────────────────

  async getNetworkInfo(network: 'mainnet' | 'testnet' = 'testnet') {
    const client = this.getClient(network);
    const [blockNumber, chainId] = await Promise.all([
      client.getBlockNumber(),
      client.getChainId()
    ]);
    return {
      network,
      chainId,
      blockNumber: blockNumber.toString(),
      explorer:
        network === 'mainnet'
          ? 'https://explorer.celo.org'
          : 'https://alfajores.celoscan.io'
    };
  }
}
