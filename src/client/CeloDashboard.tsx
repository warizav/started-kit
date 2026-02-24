import { useState } from 'react';
import { useCeloPrice, useCeloWallet } from './useCeloPrice';

export function CeloDashboard() {
  const { price, loading: priceLoading, error: priceError } = useCeloPrice();
  const { wallet, loading: walletLoading, error: walletError, fetchWallet } = useCeloWallet();
  const [inputAddress, setInputAddress] = useState('');
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');

  const change = price?.change_24h ?? 0;
  const changeColor = change >= 0 ? '#22c55e' : '#ef4444';
  const changeSign = change >= 0 ? '+' : '';

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Celo Live</h2>

      {/* Price section */}
      <div style={styles.priceRow}>
        {priceLoading && <span style={styles.muted}>Cargando precio...</span>}
        {priceError && <span style={styles.error}>{priceError}</span>}
        {price && !priceLoading && (
          <>
            <div style={styles.priceBox}>
              <span style={styles.label}>CELO</span>
              <span style={styles.value}>${price.celo_usd.toFixed(4)}</span>
              <span style={{ color: changeColor, fontSize: 12 }}>
                {changeSign}{change.toFixed(2)}% 24h
              </span>
            </div>
            <div style={styles.priceBox}>
              <span style={styles.label}>cUSD</span>
              <span style={styles.value}>${price.cusd_usd.toFixed(4)}</span>
              <span style={styles.muted}>stablecoin</span>
            </div>
            <div style={styles.priceBox}>
              <span style={styles.label}>CELO/EUR</span>
              <span style={styles.value}>€{price.celo_eur.toFixed(4)}</span>
              <span style={styles.muted}>
                {new Date(price.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Wallet lookup */}
      <div style={styles.walletSection}>
        <h3 style={styles.subtitle}>Consultar wallet</h3>
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            placeholder="0x dirección Celo..."
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
          />
          <select
            style={styles.select}
            value={network}
            onChange={(e) => setNetwork(e.target.value as any)}
          >
            <option value="testnet">Alfajores (testnet)</option>
            <option value="mainnet">Mainnet</option>
          </select>
          <button
            style={styles.btn}
            onClick={() => fetchWallet(inputAddress, network)}
            disabled={walletLoading || !inputAddress}
          >
            {walletLoading ? '...' : 'Ver saldos'}
          </button>
        </div>

        {walletError && <p style={styles.error}>{walletError}</p>}

        {wallet && (
          <div style={styles.balanceGrid}>
            <div style={styles.balanceBox}>
              <span style={styles.label}>CELO</span>
              <span style={styles.value}>{parseFloat(wallet.balances.CELO).toFixed(6)}</span>
            </div>
            <div style={styles.balanceBox}>
              <span style={styles.label}>cUSD</span>
              <span style={styles.value}>{parseFloat(wallet.balances.cUSD).toFixed(6)}</span>
            </div>
            <div style={{ ...styles.balanceBox, gridColumn: '1 / -1' }}>
              <span style={styles.muted}>
                {wallet.address} · {wallet.network}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1a1a2e',
    border: '1px solid #2d2d4e',
    borderRadius: 12,
    padding: '24px',
    maxWidth: 600,
    margin: '24px auto',
    color: '#e2e8f0',
    fontFamily: 'monospace'
  },
  title: { margin: '0 0 16px', fontSize: 20, color: '#FBCC5C' },
  subtitle: { margin: '16px 0 8px', fontSize: 14, color: '#94a3b8' },
  priceRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  priceBox: {
    flex: 1,
    minWidth: 130,
    background: '#0f0f23',
    borderRadius: 8,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  balanceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 12
  },
  balanceBox: {
    background: '#0f0f23',
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  label: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  muted: { fontSize: 11, color: '#475569' },
  error: { fontSize: 12, color: '#f87171' },
  walletSection: { marginTop: 20 },
  inputRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  input: {
    flex: 1,
    minWidth: 200,
    background: '#0f0f23',
    border: '1px solid #2d2d4e',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  select: {
    background: '#0f0f23',
    border: '1px solid #2d2d4e',
    borderRadius: 6,
    padding: '8px',
    color: '#e2e8f0',
    fontSize: 12
  },
  btn: {
    background: '#FBCC5C',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 12
  }
};
