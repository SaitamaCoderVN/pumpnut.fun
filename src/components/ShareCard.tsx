'use client';


interface ShareCardProps {
  totalLosses: number;
  biggestLoss: number;
  totalTransactions: number;
  rank?: number;
  totalParticipants?: number;
}

export const generateShareImage = async ({
  totalLosses,
  biggestLoss,
  totalTransactions,
  rank,
  totalParticipants,
}: ShareCardProps): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set canvas size with better aspect ratio
  canvas.width = 1200;
  canvas.height = 675; // 16:9 aspect ratio

  // Enhanced background with deeper gradient
  ctx.fillStyle = '#0f172a'; // Darker background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Improved gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(147, 51, 234, 0.3)'); // Increased opacity
  gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Enhanced Logo and Title
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 80, 35, 0, 2 * Math.PI); // Larger circle
  ctx.fillStyle = '#9333EA';
  ctx.fill();
  
  ctx.font = '32px Arial'; // Larger emoji
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('🎰', canvas.width / 2, 92);
  
  ctx.font = 'bold 48px Inter'; // Larger title
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('Status of me on pump.fun', canvas.width / 2, 160);
  ctx.restore();

  // Status Container with improved styling
  const status = [
    {
      label: 'Total Losses',
      value: `${totalLosses.toFixed(2)} SOL`,
      icon: '💸'
    },
    {
      label: 'Biggest Loss',
      value: `${biggestLoss.toFixed(2)} SOL`,
      icon: '📉'
    },
    {
      label: 'Total Transactions',
      value: `${totalTransactions.toLocaleString()}`,
      icon: '🔄'
    },
    {
      label: 'Your Rank',
      value: rank && totalParticipants ? `#${rank} of ${totalParticipants} players` : 'N/A',
      icon: '🏆'
    }
  ];

  // Improved status boxes layout
  const boxWidth = canvas.width / 2 - 80;
  const boxHeight = 100;
  const boxPadding = 50;
  const startX = (canvas.width - (boxWidth * 2 + boxPadding)) / 2;
  const startY = 220;

  status.forEach((stat, index) => {
    const x = startX + (index % 2) * (boxWidth + boxPadding);
    const y = startY + Math.floor(index / 2) * (boxHeight + boxPadding);

    // Enhanced box styling with shadow effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 16);
    ctx.fill();
    
    // Add large icon at the start of each status
    ctx.font = '60px Arial'; // Reduced icon size by 25%
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(stat.icon, x + 20, y + boxHeight/2 + 25);
    
    // Label with improved typography
    ctx.font = '20px Inter';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText(stat.label, x + 100, y + 30);
    
    // Value with enhanced styling
    ctx.font = 'bold 28px Inter';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(stat.value, x + 100, y + boxHeight - 15);
  });

  // Improved comforting messages
  const comfortingMessages = [
    "Every setback is a setup for a comeback 💪",
    "Keep calm and HODL on 🚀",
    "The market is a pendulum that forever swings 🔄",
    "Losses are just lessons in disguise 📚",
    "Stay strong, the future is bright ✨",
    "Every dip is an opportunity 📈",
    "You're not alone in this journey 🤝",
    "The best is yet to come 🌟",
    "Keep your head up, it's just a bump 🎢",
    "Believe in the process, not just the outcome 🎯"
  ];

  const randomMessage = comfortingMessages[Math.floor(Math.random() * comfortingMessages.length)];

  // Enhanced message styling
  const messageY = canvas.height - 100;
  ctx.font = 'bold 36px Inter';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'center';
  ctx.fillText(randomMessage, canvas.width / 2, messageY);

  // Enhanced footer with better spacing
  const footerY = canvas.height - 50;
  ctx.font = '24px Inter';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'center';
  ctx.fillText('Check your losses at', canvas.width / 2 - 80, footerY);
  
  ctx.font = 'bold 24px Inter';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('pumptge.fun', canvas.width / 2 + 130, footerY);

  return canvas.toDataURL('image/png', 1.0); // Added quality parameter
};