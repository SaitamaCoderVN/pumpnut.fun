'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Tomorrow } from 'next/font/google';

const tomorrow = Tomorrow({
  weight: '600',
  subsets: ['latin'],
});

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-xl border-b border-white/20 shadow-2xl">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center hover:opacity-80 transition-all duration-300 group"
        >
          <img 
            src="/devfun-logo3.png" 
            alt="DevFun Logo" 
            className="h-10 w-auto mr-3 group-hover:scale-105 transition-transform duration-300"
          />
          <span 
            className="text-xl font-semibold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent"
            style={tomorrow.style}
          >
            pumpanalytics
          </span>
        </Link>
        
        <WalletMultiButtonDynamic className="!bg-gradient-to-r from-[#654358] to-[#2F0D64] hover:!from-[#2F0D64] hover:!to-[#654358] !border !border-white/20 !rounded-xl !px-6 !py-3 !text-white !font-medium !transition-all !duration-300 !shadow-2xl" />
      </div>
    </header>
  );
};
