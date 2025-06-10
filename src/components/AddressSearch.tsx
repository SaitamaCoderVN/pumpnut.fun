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
    <div className="w-full max-w-md mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Solana address"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
          >
            Search
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </form>
    </div>
  );
};
