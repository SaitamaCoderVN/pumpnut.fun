'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onShare: () => void;
}

export const ShareModal = ({ isOpen, onClose, imageUrl, onShare }: ShareModalProps) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'pump-fun-status.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Share Your Status</DialogTitle>
          <DialogDescription className="text-gray-400">
            Preview your status card before sharing on X
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1200/640' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Share status"
                className="w-full h-full object-contain bg-slate-900"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                Generating preview...
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-white/20 bg-black text-white hover:bg-gray-800"
              disabled={!imageUrl}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 bg-black text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={onShare}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
              disabled={!imageUrl}
            >
              <X className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 