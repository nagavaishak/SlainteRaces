import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownUp, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SwapModalProps {
  open: boolean;
  onClose: () => void;
}

const SwapModal = ({ open, onClose }: SwapModalProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const exchangeRate = 1.08;
  const outputAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : '0.00';

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount to swap.',
        variant: 'destructive'
      });
      return;
    }

    setIsSwapping(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsSwapping(false);
    
    toast({
      title: 'Swap successful!',
      description: `Swapped ${amount} USDC for ${outputAmount} EURC`,
    });
    
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5 text-primary" />
            Swap USDC to EURC
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Swap your USDC for EURC to place bets on Sláinte Races. Powered by Jupiter.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">You Pay</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20 text-lg font-semibold h-14"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-primary-foreground">
                  $
                </div>
                <span className="font-semibold text-foreground">USDC</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowDownUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">You Receive</label>
            <div className="relative">
              <Input
                type="text"
                value={outputAmount}
                readOnly
                className="pr-20 text-lg font-semibold h-14 bg-muted/50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-bold text-secondary-foreground">
                  €
                </div>
                <span className="font-semibold text-foreground">EURC</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <span>Exchange Rate</span>
            <span className="font-medium">1 USDC = {exchangeRate} EURC</span>
          </div>

          <Button
            onClick={handleSwap}
            disabled={isSwapping || !amount}
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold py-6"
          >
            {isSwapping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              'Swap Now'
            )}
          </Button>

          <a
            href="https://jup.ag"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Powered by Jupiter
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapModal;
