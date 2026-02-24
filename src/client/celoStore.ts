import { create } from 'zustand';

export interface CeloPrice {
  celo_usd: number;
  celo_eur: number;
  cusd_usd: number;
  change_24h: number;
  timestamp: number;
}

export interface CeloWallet {
  address: string;
  network: string;
  balances: { CELO: string; cUSD: string };
}

interface CeloState {
  price: CeloPrice | null;
  wallet: CeloWallet | null;
  loading: boolean;
  error: string | null;
  setPrice: (price: CeloPrice) => void;
  setWallet: (wallet: CeloWallet) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

export const useCeloStore = create<CeloState>((set) => ({
  price: null,
  wallet: null,
  loading: false,
  error: null,
  setPrice: (price) => set({ price }),
  setWallet: (wallet) => set({ wallet }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
