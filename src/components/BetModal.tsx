import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Confetti from './Confetti';
import { buildPlaceBetTransaction, solToLamports, calculatePotentialPayout, lamportsToSol, connection } from '@/lib/solana';
import { recordBet, updateRacePools } from '@/lib/supabase';
import type { Race } from '@/lib/supabase';

interface BetModalProps {
  open: boolean;
  onClose: () => void;
  race: Race;
  prediction: 'yes' | 'no' | null;
  onBetPlaced?: () => void;
}

const BetModal = ({ open, onClose, race, prediction, onBetPlaced }: BetModalProps) => {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number>(0.05);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const amounts = [0.01, 0.05, 0.1];

  const yesPool = race.yes_pool || 0;
  const noPool = race.no_pool || 0;
  const amountLamports = solToLamports(selectedAmount);

  const potentialPayout = calculatePotentialPayout(
    amountLamports,
    prediction === 'yes',
    yesPool,
    noPool,
    250
  );

  const sharePrice = ((prediction === 'yes' ? yesPool : noPool) / (yesPool + noPool) || 0.5);
  const sharesReceived = Math.floor(amountLamports / (sharePrice * 1e9));

  const handlePlaceBet = async () => {
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to buy shares.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      let signature = '';
      const isOnChain = race.onchain_race_id !== null && race.onchain_race_id !== undefined;
      
      // Check if race is deployed on-chain (has onchain_race_id) - if so, do real transaction
      if (isOnChain && sendTransaction) {
        // Build the transaction
        const transaction = await buildPlaceBetTransaction(
          publicKey,
          race.onchain_race_id!,
          prediction === 'yes',
          amountLamports
        );

        // Send using wallet adapter's sendTransaction (avoids serialization issues)
        signature = await sendTransaction(transaction, connection);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        setTxSignature(signature);
      } else {
        // Mock mode - just record in Supabase for devnet testing without on-chain tx
        signature = `mock_devnet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }

      // Record bet in Supabase (works for both mock and real)
      await recordBet({
        user_wallet: publicKey.toBase58(),
        race_id: race.id,
        onchain_race_id: race.onchain_race_id || 1, // Use 1 as default for mock
        prediction: prediction!,
        amount: amountLamports,
        tx_signature: signature
      });

      // Update pools in Supabase
      const newYesPool = prediction === 'yes' ? yesPool + amountLamports : yesPool;
      const newNoPool = prediction === 'no' ? noPool + amountLamports : noPool;
      await updateRacePools(race.id, newYesPool, newNoPool);

      setShowConfetti(true);

      toast({
        title: `${sharesReceived} ${prediction?.toUpperCase()} shares purchased! Sláinte`,
        description: `${selectedAmount} SOL invested in ${race.horse_name}${isOnChain ? '' : ' (Mock Mode)'}`,
      });

      setTimeout(() => {
        setShowConfetti(false);
        onClose();
        onBetPlaced?.();
      }, 2500);

    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Failed to buy shares. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatRaceTime = (raceTime: string) => {
    const date = new Date(raceTime);
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {showConfetti && <Confetti />}
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-elevated border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">🐎</span>
              Buy {prediction?.toUpperCase()} Shares — {race.horse_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{race.track_name} • {formatRaceTime(race.race_time)}</p>
              <p className="font-semibold text-foreground">{race.question}</p>
            </div>

            <div className={`p-4 rounded-lg text-center border ${
              prediction === 'yes' 
                ? 'bg-bet-yes/5 border-bet-yes/30' 
                : 'bg-bet-no/5 border-bet-no/30'
            }`}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Position</span>
              <p className={`text-3xl font-bold mt-1 ${
                prediction === 'yes' ? 'text-bet-yes' : 'text-bet-no'
              }`}>
                {prediction?.toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(sharePrice * 100)}% implied probability
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Investment Amount (SOL)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`py-4 rounded-lg font-bold text-lg transition-all ${
                      selectedAmount === amount
                        ? 'bg-gradient-gold text-secondary-foreground shadow-gold'
                        : 'bg-card text-foreground border border-border hover:border-racing-green/50'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You invest:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {selectedAmount} SOL
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Share price:</span>
                <span className="font-semibold text-foreground">
                  {(sharePrice * 100).toFixed(0)}¢
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-bold text-foreground">
                  ~{sharesReceived} {prediction?.toUpperCase()} shares
                </span>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">If {prediction?.toUpperCase()} wins:</span>
                  <span className="font-bold text-bet-yes">
                    {lamportsToSol(potentialPayout).toFixed(4)} SOL (+{lamportsToSol(potentialPayout - amountLamports).toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">If {prediction === 'yes' ? 'NO' : 'YES'} wins:</span>
                  <span className="font-bold text-bet-no">
                    0.00 SOL (-{selectedAmount})
                  </span>
                </div>
              </div>
            </div>

            {txSignature && (
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-racing-green hover:underline"
              >
                View on Solana Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBet}
                disabled={isProcessing || !connected}
                className={`flex-1 font-bold ${
                  prediction === 'yes'
                    ? 'bg-bet-yes hover:bg-bet-yes/90'
                    : 'bg-bet-no hover:bg-bet-no/90'
                } text-primary-foreground`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    Buy {prediction?.toUpperCase()} Shares
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {!connected && (
              <p className="text-center text-sm text-destructive">
                Please connect your wallet to buy shares
              </p>
            )}

            {!connected && (
              <p className="text-center text-sm text-muted-foreground">
                Connect your wallet above to place a bet
              </p>
            )}

            {/* On-chain status indicator */}
            {race.race_pda ? (
              <p className="text-center text-sm text-bet-yes flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-bet-yes rounded-full animate-pulse" />
                On-Chain Betting (Real Devnet SOL)
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Mock Mode - Bet recorded in database only
              </p>
            )}

            {!race.onchain_race_id && (
              <p className="text-center text-sm text-secondary">
                This market is not yet available on-chain
              </p>
            )}
            
            <p className="text-center text-xs text-muted-foreground">
              Devnet — uses SOL. Mainnet will use EURC 🇮🇪
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BetModal;