'use client';

import { useState } from 'react';

interface ShareDebugProps {
  totalLosses: number;
  biggestLoss: number;
  transactionCount: number;
  referralCode?: string;
}

export const ShareDebug = ({ totalLosses, biggestLoss, transactionCount, referralCode }: ShareDebugProps) => {
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testShareUrl = () => {
    const finalReferralCode = referralCode || 'default';
    const referralLink = `https://pumpanalytics.xyz?ref=${finalReferralCode}`;
    
    const shareText = referralCode 
      ? `Just lost ${totalLosses.toFixed(2)} SOL on pump.fun! 🎰\n\nCheck your losses at ${referralLink}\n\nUse my referral link to get extra rewards! 🚀`
      : `Just lost ${totalLosses.toFixed(2)} SOL on pump.fun! 🎰\n\nCheck your losses at ${referralLink}`;

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    
    setDebugInfo(`
Share URL: ${shareUrl}
Referral Code: ${referralCode || 'None'}
Referral Link: ${referralLink}
Share Text: ${shareText}
    `);
    
    return shareUrl;
  };

  const openTestShare = () => {
    const url = testShareUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-sm">
      <h3 className="text-white font-semibold mb-3">Share Debug</h3>
      
      <div className="space-y-2 text-gray-300 mb-4">
        <div>Total Losses: {totalLosses.toFixed(2)} SOL</div>
        <div>Biggest Loss: {biggestLoss.toFixed(2)} SOL</div>
        <div>Transaction Count: {transactionCount}</div>
        <div>Referral Code: {referralCode || 'None'}</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={testShareUrl}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Generate URL
        </button>
        <button
          onClick={openTestShare}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
        >
          Test Share
        </button>
      </div>

      {debugInfo && (
        <div className="bg-gray-900 p-3 rounded text-xs font-mono text-green-400 whitespace-pre-wrap">
          {debugInfo}
        </div>
      )}
    </div>
  );
};
