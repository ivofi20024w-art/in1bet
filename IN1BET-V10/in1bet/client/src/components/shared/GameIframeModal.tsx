import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Home, Wallet } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface GameIframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameUrl: string | null;
  gameName?: string;
}

export function GameIframeModal({ isOpen, onClose, gameUrl, gameName }: GameIframeModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setLocation] = useLocation();

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const handleGoHome = () => {
    handleClose();
    setLocation('/');
  };

  const handleGoWallet = () => {
    handleClose();
    setLocation('/wallet');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!gameUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className={`p-0 gap-0 border-0 bg-black overflow-hidden ${
          isFullscreen 
            ? 'fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none' 
            : 'w-[95vw] h-[85vh] max-w-[1400px] rounded-lg'
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-zinc-900 to-black px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoHome}
              data-testid="button-game-home"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoWallet}
              data-testid="button-game-wallet"
            >
              <Wallet className="h-4 w-4" />
            </Button>
            {gameName && (
              <span className="text-sm font-medium text-white/70 ml-2 hidden sm:inline">
                {gameName}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              data-testid="button-game-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="button-game-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 bg-black" style={{ height: 'calc(100% - 48px)' }}>
          <iframe
            src={gameUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            data-testid="iframe-game"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
