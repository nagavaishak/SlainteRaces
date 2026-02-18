import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ExternalLink } from 'lucide-react';
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

const QUICK_AMOUNTS = [0.05, 0.1, 0.25, 0.5];

const BetModal = ({ open, onClose, race, prediction, onBetPlaced }: BetModalProps) => {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number>(0.05);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

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

  const isYes = prediction === 'yes';
  const sideColor = isYes ? '#00a86b' : '#ff5152';
  const sideBg = isYes ? '#00a86b18' : '#ff515218';

  const handlePlaceBet = async () => {
    if (!connected || !publicKey) {
      toast({ title: 'Wallet not connected', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      let signature = '';
      const isOnChain = race.onchain_race_id !== null && race.onchain_race_id !== undefined;

      if (isOnChain && sendTransaction) {
        const transaction = await buildPlaceBetTransaction(
          publicKey,
          race.onchain_race_id!,
          prediction === 'yes',
          amountLamports
        );
        signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');
        setTxSignature(signature);
      } else {
        signature = `mock_devnet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }

      await recordBet({
        user_wallet: publicKey.toBase58(),
        race_id: race.id,
        onchain_race_id: race.onchain_race_id || 1,
        prediction: prediction!,
        amount: amountLamports,
        tx_signature: signature
      });

      await updateRacePools(
        race.id,
        prediction === 'yes' ? yesPool + amountLamports : yesPool,
        prediction === 'no' ? noPool + amountLamports : noPool
      );

      setShowConfetti(true);
      toast({
        title: `${prediction?.toUpperCase()} position opened! Sláinte 🍀`,
        description: `${selectedAmount} SOL on ${race.horse_name}${!isOnChain ? ' (Mock Mode)' : ''}`,
      });

      setTimeout(() => {
        setShowConfetti(false);
        onClose();
        onBetPlaced?.();
      }, 2500);

    } catch (error) {
      toast({
        title: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Failed to place bet. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const profit = lamportsToSol(potentialPayout - amountLamports);

  return (
    <>
      {showConfetti && <Confetti />}

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-sm"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px' }}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {race.horse_name} · {race.track_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Side indicator */}
            <div
              className="p-3 rounded-lg"
              style={{ background: sideBg, border: `1px solid ${sideColor}30` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{race.question}</span>
                <span className="text-base font-bold" style={{ color: sideColor }}>
                  {prediction?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Amount picker */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Amount (SOL)</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className="py-2 rounded text-sm font-semibold transition-all"
                    style={
                      selectedAmount === amount
                        ? { background: sideColor, color: '#fff' }
                        : { background: '#222222', color: '#888888', border: '1px solid #2a2a2a' }
                    }
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: '#141414', border: '1px solid #2a2a2a' }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-semibold text-foreground tabular-nums">{selectedAmount} SOL</span>
              </div>
              <div className="h-px" style={{ background: '#2a2a2a' }} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential payout</span>
                <span className="font-bold tabular-nums" style={{ color: '#00a86b' }}>
                  {lamportsToSol(potentialPayout).toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Potential profit</span>
                <span className="text-muted-foreground tabular-nums">+{profit.toFixed(4)} SOL</span>
              </div>
            </div>

            {/* On-chain status */}
            <p className="text-center text-xs text-muted-foreground">
              {race.race_pda ? (
                <span style={{ color: '#00a86b' }}>● On-chain (Devnet SOL)</span>
              ) : (
                'Mock mode — recorded in database only'
              )}
            </p>

            {txSignature && (
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View on Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                style={{ border: '1px solid #2a2a2a' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={isProcessing || !connected}
                className="flex-1 py-2.5 rounded text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: sideColor, color: '#fff' }}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing...
                  </span>
                ) : (
                  `Buy ${prediction?.toUpperCase()}`
                )}
              </button>
            </div>

            {!connected && (
              <p className="text-center text-xs text-muted-foreground">
                Connect your wallet to place a bet
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BetModal;
