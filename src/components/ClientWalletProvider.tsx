'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection, ConnectionConfig } from '@solana/web3.js';
import dynamic from 'next/dynamic';

interface Props {
  children: ReactNode;
}

// Create WalletProvider without SSR
const WalletProviderComponent = dynamic(
  () => Promise.resolve(WalletProvider),
  { ssr: false }
);

// Connection configuration
const HELIUS_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=d535999d-be82-433e-9ab3-861a5da950bc';
const connectionConfig: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
  wsEndpoint: undefined,
  httpHeaders: {
    'Content-Type': 'application/json',
  },
};

export const ClientWalletProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => HELIUS_RPC_ENDPOINT, []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProviderComponent wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProviderComponent>
    </ConnectionProvider>
  );
}; 