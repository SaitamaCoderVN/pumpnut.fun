'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';

interface AddressSearchProps {
  onAddressSubmit: (address: string) => void;
}

export const AddressSearch = ({ onAddressSubmit }: AddressSearchProps) => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate Solana address
      new PublicKey(address);
      onAddressSubmit(address + '?' + Date.now());
    } catch (_error) {
      setError('Invalid Solana address');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Solana address"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-white/20 via-white/15 to-white/20 border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-[#B873F8] focus:bg-white/25 text-lg font-medium backdrop-blur-xl shadow-2xl transition-all duration-300"
          />
          <button
            type="submit"
            className="relative px-8 py-4 overflow-hidden rounded-2xl transition-all duration-500 group pointer-events-auto flex items-center justify-center min-w-[140px]"
          > 
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-b from-[#654358] via-[#17092A] to-[#2F0D64]"></div> 
            <div className="absolute inset-[2px] bg-[#170928] rounded-2xl opacity-90"></div> 
            <div className="absolute inset-[2px] bg-gradient-to-r from-[#170928] via-[#1d0d33] to-[#170928] rounded-2xl opacity-90"></div> 
            <div className="absolute inset-[2px] bg-gradient-to-b from-[#654358]/40 via-[#1d0d33] to-[#2F0D64]/30 rounded-2xl opacity-80"></div> 
            <div className="absolute inset-[2px] bg-gradient-to-br from-[#C787F6]/10 via-[#1d0d33] to-[#2A1736]/50 rounded-2xl"></div> 
            <div className="absolute inset-[2px] shadow-[inset_0_0_15px_rgba(199,135,246,0.15)] rounded-2xl"></div> 
            <div className="relative flex items-center justify-center gap-2"> 
              <span className="text-lg font-semibold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(199,135,246,0.4)] tracking-tighter">
                Search
              </span> 
            </div> 
            <div className="absolute inset-[2px] opacity-0 transition-opacity duration-300 bg-gradient-to-r from-[#2A1736]/20 via-[#C787F6]/10 to-[#2A1736]/20 group-hover:opacity-100 rounded-2xl"></div> 
          </button>
        </div>
        {error && (
          <p className="text-red-300 text-base font-medium text-center">{error}</p>
        )}
      </form>
    </div>
  );
};
