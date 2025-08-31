'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalLosses: number;
  biggestLoss: number;
  transactionCount: number;
}

export const ShareModal = ({ isOpen, onClose, totalLosses, biggestLoss, transactionCount }: ShareModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Load background image
    const bgImage = new Image();
    bgImage.src = '/raw-5.png';
    bgImage.onload = () => {
      // Draw background
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      // Configure text styles
      ctx.fillStyle = 'white';
      
      // Left side - PUMPANALYTICS (vertically aligned with -90 degree rotated letters)
      const text = 'CITYLANAPMUP'.split('').reverse().join(''); // Reverse the text for correct reading order
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px Inter';
      const startY = 540; // Start from bottom
      const letterSpacing = 40; // Increased gap between letters
      
      // Save the current context state
      ctx.save();
      
      // For each letter, translate to position, rotate -90 degrees, draw text
      text.split('').forEach((letter, index) => {
        ctx.save(); // Save state before rotation
        ctx.translate(100, startY - (index * letterSpacing));
        ctx.rotate(-Math.PI / 2); // Rotate -90 degrees
        ctx.fillText(letter, 0, 0);
        ctx.restore(); // Restore state after rotation
      });
      
      // Restore the original context state
      ctx.restore();

      // Right side - Stats card with blur effect (wider layout)
      const cardX = canvas.width / 2 - 150; // Moved left to make room for wider card
      const cardY = 100;
      const cardWidth = canvas.width / 2 + 100; // Increased width
      const cardHeight = 350;
      
      // Draw blurred background for card
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.filter = 'blur(30px)';
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      ctx.restore();
      
      // Draw card border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
      
      // Stats content with improved spacing
      const contentStartX = cardX + 60; // Increased left padding for labels
      const valueX = cardX + cardWidth - 60; // Increased right padding for values
      const startStatsY = cardY + 100; // Increased top padding
      const statSpacing = 100; // Increased vertical spacing between stats
      
      // Total Losses
      ctx.font = '36px Inter';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'white';
      ctx.fillText('Total Losses', contentStartX, startStatsY);
      ctx.textAlign = 'right';
      ctx.font = 'bold 48px Inter';
      ctx.fillText(`${totalLosses.toFixed(2)} SOL`, valueX, startStatsY);
      
      // Biggest Loss
      ctx.textAlign = 'left';
      ctx.font = '36px Inter';
      ctx.fillText('Biggest Loss', contentStartX, startStatsY + statSpacing);
      ctx.textAlign = 'right';
      ctx.font = 'bold 48px Inter';
      ctx.fillText(`${biggestLoss.toFixed(2)} SOL`, valueX, startStatsY + statSpacing);
      
      // Total Transactions
      ctx.textAlign = 'left';
      ctx.font = '36px Inter';
      ctx.fillText('Total Transactions', contentStartX, startStatsY + statSpacing * 2);
      ctx.textAlign = 'right';
      ctx.font = 'bold 48px Inter';
      ctx.fillText(`${transactionCount}`, valueX, startStatsY + statSpacing * 2);

      // Add airdrop description
      ctx.textAlign = 'center';
      ctx.font = '24px Inter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('We will airdrop to you based on your total SOL losses', canvas.width/2, canvas.height - 80);
      
      // Add website URL
      ctx.font = '20px Inter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('pumpanalytic.com', canvas.width/2, canvas.height - 40);

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    };
  }, [isOpen, totalLosses, biggestLoss, transactionCount]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'pump-fun-loss-report.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], 'pump-fun-loss-report.png', { type: 'image/png' });

      // Share on Twitter with image
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Just lost ${totalLosses.toFixed(2)} SOL on pump.fun! 🎰\n\nCheck your losses at pumpanalytic.com`
      )}`;
      window.open(shareUrl, '_blank');
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Share Your Loss Report</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg mb-6">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                Download Image
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-lg text-white font-medium transition-colors"
              >
                Share on X
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};