'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import { ShareModal } from './ShareModal';
import { generateShareImage } from './ShareCard';
import { createXIntentLink } from '@/lib/x-intent';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

interface ShareButtonProps {
  walletAddress: string;
  totalLosses: number;
  totalTransactions: number;
  biggestLoss: number;
  rank?: number;
  totalParticipants?: number;
}

export const ShareButton = ({
  walletAddress,
  totalLosses,
  totalTransactions,
  biggestLoss,
  rank,
  totalParticipants,
}: ShareButtonProps) => {
  const { publicKey } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareImage, setShareImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleShare = async () => {
  if (!publicKey) return;

  try {
    setIsUploading(true);
    
    const imageData = await generateShareImage({
      totalLosses,
      biggestLoss, 
      totalTransactions,
      rank,
      totalParticipants
    });

    if (imageData) {
      setShareImage(imageData);
      setIsModalOpen(true);
    }
  } catch (error) {
    console.error('Error sharing:', error);
  } finally {
    setIsUploading(false);
  }
};

  const handleShareOnX = () => {
    const websiteUrl = 'https://pumptge.fun';
    const text = `Check out my pump.fun status! 🎰\n\nTrack your losses at 👇\n${websiteUrl}`;
    
    const shareUrl = createXIntentLink('tweet', {
      text,
      url: websiteUrl,
      hashtags: ['Solana', 'Web3', 'Crypto'],
      via: 'pumptge'
    });

    window.open(shareUrl, '_blank');
    setIsModalOpen(false);
  };

  // Only show the share button if the connected wallet matches the searched wallet
  if (!publicKey || publicKey.toBase58() !== walletAddress) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={isUploading}
        className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
      >
        <X className="w-4 h-4" />
        {isUploading ? 'Preparing...' : 'Share'}
      </Button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={shareImage}
        onShare={handleShareOnX}
      />
    </>
  );
};