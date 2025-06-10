'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white hover:text-purple-400 transition-colors">
          pumptge.fun
        </Link>
        <WalletMultiButtonDynamic className="!bg-purple-600 hover:!bg-purple-700 transition-colors" />
      </div>
    </header>
  );
}; 