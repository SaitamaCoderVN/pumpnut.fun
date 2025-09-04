'use client';

import { useState, useEffect } from 'react';
import { getSyncStatus } from '@/services/solana';

interface SyncStatusDebugProps {
  walletAddress: string;
  className?: string;
}

export const SyncStatusDebug = ({ walletAddress, className = '' }: SyncStatusDebugProps) => {
  const [syncStatus, setSyncStatus] = useState<{
    hasCachedData: boolean;
    lastSyncSignature: string | null;
    lastSyncTimestamp: number | null;
    cachedTransactionCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStatus = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const status = await getSyncStatus(walletAddress);
      setSyncStatus(status);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      refreshStatus();
    }
  }, [walletAddress]);

  if (!walletAddress || !syncStatus) {
    return null;
  }

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 text-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Sync Status Debug</h3>
        <button
          onClick={refreshStatus}
          disabled={isLoading}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-2 text-gray-300">
        <div className="flex justify-between">
          <span>Cached Data:</span>
          <span className={syncStatus.hasCachedData ? 'text-green-400' : 'text-red-400'}>
            {syncStatus.hasCachedData ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Cached Transactions:</span>
          <span className="text-blue-400">{syncStatus.cachedTransactionCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Last Sync:</span>
          <span className="text-yellow-400">
            {formatTimestamp(syncStatus.lastSyncTimestamp)}
          </span>
        </div>
        
        {syncStatus.lastSyncSignature && (
          <div className="flex justify-between">
            <span>Last Signature:</span>
            <span className="text-purple-400 font-mono text-xs">
              {syncStatus.lastSyncSignature.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
