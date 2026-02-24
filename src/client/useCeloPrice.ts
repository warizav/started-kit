/**
 * useCeloPrice
 *
 * Hook reutilizable cross-module para recibir precios de CELO en tiempo real
 * via SSE + REST. Se puede copiar/exportar a cualquier app que use el mismo
 * CeloModule de NestJS.
 *
 * Uso:
 *   const { price, loading, error } = useCeloPrice();
 */
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCeloStore } from './celoStore';

const BASE = import.meta.env.VITE_API_URL ?? '';

export function useCeloPrice() {
  const [price, loading, error, setPrice, setLoading, setError] = useCeloStore(
    useShallow((s) => [s.price, s.loading, s.error, s.setPrice, s.setLoading, s.setError])
  );

  useEffect(() => {
    let sse: EventSource | null = null;
    let mounted = true;

    // 1. Snapshot inicial vía REST
    setLoading(true);
    fetch(`${BASE}/api/celo/price`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) {
          setPrice(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('No se pudo cargar el precio de CELO');
          setLoading(false);
        }
      });

    // 2. Stream en tiempo real via SSE (actualiza cada 30 s desde el servidor)
    sse = new EventSource(`${BASE}/api/celo/price/stream`);
    sse.addEventListener('celo-price', (e) => {
      if (mounted) {
        try {
          setPrice(JSON.parse(e.data));
        } catch {
          // ignore parse errors
        }
      }
    });
    sse.onerror = () => {
      if (mounted) setError('SSE desconectado, usando último precio guardado');
    };

    return () => {
      mounted = false;
      sse?.close();
    };
  }, []);

  return { price, loading, error };
}

/**
 * useCeloWallet
 *
 * Hook para consultar saldos de una wallet Celo.
 * Uso:
 *   const { wallet, fetchWallet } = useCeloWallet();
 *   fetchWallet('0xabc...', 'testnet');
 */
export function useCeloWallet() {
  const [wallet, loading, error, setWallet, setLoading, setError] = useCeloStore(
    useShallow((s) => [s.wallet, s.loading, s.error, s.setWallet, s.setLoading, s.setError])
  );

  const fetchWallet = async (address: string, network: 'mainnet' | 'testnet' = 'testnet') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/celo/wallet/${address}?net=${network}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? 'Error al consultar wallet');
      }
      setWallet(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { wallet, loading, error, fetchWallet };
}
