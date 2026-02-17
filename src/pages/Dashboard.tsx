import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Coins, TrendingUp, Target, Trophy, ArrowDownUp, Loader2, ExternalLink, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import SwapModal from '@/components/SwapModal';
import LiveBetsFeed from '@/components/LiveBetsFeed';
import { useUserData } from '@/hooks/useUserData';
import { lamportsToSol, buildClaimWinningsTransaction, connection } from '@/lib/solana';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { connected } = useWallet();
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const { activeBets, pastBets, stats, loading } = useUserData();

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">👛</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">
              Connect your Phantom or Backpack wallet to view your dashboard and betting history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your bets and winnings</p>
          </div>
          <Button
            onClick={() => setSwapModalOpen(true)}
            className="bg-gradient-gold hover:opacity-90 text-secondary-foreground font-semibold"
          >
            <ArrowDownUp className="w-4 h-4 mr-2" />
            Swap Tokens
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* SOL Balance - Gold accent */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#d4af37' }} />
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm">SOL Balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.solBalance.toFixed(4)} SOL</p>
          </div>
          
          {/* Total Winnings - Racing green accent */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#00a86b' }} />
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Winnings</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.totalWinnings.toFixed(4)} SOL</p>
          </div>
          
          {/* Win Rate - Grey accent */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#475569' }} />
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.winRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalBets} total bets</p>
          </div>
          
          {/* Active Bets - Grey accent */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#475569' }} />
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">Active Bets</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.activeBets}</p>
            <p className="text-xs text-muted-foreground mt-1">Currently in play</p>
          </div>
        </div>

        {/* Bets + Live Activity Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
        {/* Bets Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active
              {activeBets.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeBets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="animate-fade-in">
            {activeBets.length > 0 ? (
              <div className="grid gap-4">
                {activeBets.map(bet => (
                  <BetCard key={bet.id} bet={bet as any} onClaimSuccess={() => window.location.reload()} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <div className="text-4xl mb-4">🐎</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Active Bets</h3>
                <p className="text-muted-foreground mb-4">
                  Head to the races page to place your first bet!
                </p>
                <Button asChild className="bg-gradient-primary text-primary-foreground">
                  <a href="/">Browse Races</a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            {pastBets.length > 0 ? (
              <div className="grid gap-4">
                {pastBets.map(bet => (
                  <BetCard key={bet.id} bet={bet as any} onClaimSuccess={() => window.location.reload()} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Betting History</h3>
                <p className="text-muted-foreground">
                  Your completed bets will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

          </div>

          {/* Live Activity Sidebar */}
          <div className="lg:col-span-1">
            <LiveBetsFeed />
          </div>
        </div>

        {/* Simple CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Place your first trade to start climbing the leaderboard.
          </p>
        </div>
      </div>

      <SwapModal open={swapModalOpen} onClose={() => setSwapModalOpen(false)} />
    </div>
  );
};

// Bet Card Component for Dashboard
interface BetCardProps {
  bet: {
    id: string;
    prediction: string;
    amount: number;
    status: string | null;
    payout: number | null;
    tx_signature: string | null;
    created_at: string | null;
    claimed?: boolean | null;
    onchain_race_id?: number | null;
    races?: {
      horse_name: string;
      track_name: string;
    } | null;
  };
  onClaimSuccess?: () => void;
}

const BetCard = ({ bet, onClaimSuccess }: BetCardProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!publicKey || !sendTransaction || !bet.onchain_race_id) {
      toast({
        title: 'Cannot claim',
        description: 'Wallet not connected or bet not on-chain',
        variant: 'destructive'
      });
      return;
    }

    setIsClaiming(true);
    try {
      // Build the transaction
      const transaction = await buildClaimWinningsTransaction(
        publicKey,
        bet.onchain_race_id
      );

      // Send using wallet adapter's sendTransaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Update bet as claimed in Supabase
      await supabase
        .from('bets')
        .update({ claimed: true, claim_tx_signature: signature })
        .eq('id', bet.id);

      toast({
        title: 'Winnings claimed!',
        description: `${lamportsToSol(bet.payout || 0).toFixed(4)} SOL sent to your wallet`,
      });

      onClaimSuccess?.();
    } catch (error) {
      console.error('Claim error:', error);
      toast({
        title: 'Claim failed',
        description: error instanceof Error ? error.message : 'Failed to claim winnings',
        variant: 'destructive'
      });
    } finally {
      setIsClaiming(false);
    }
  };
  const getStatusBadge = () => {
    switch (bet.status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Active
          </span>
        );
      case 'won':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-bet-yes/10 text-bet-yes">
            Won
          </span>
        );
      case 'lost':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-bet-no/10 text-bet-no">
            Lost
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className={`bg-card rounded-lg border p-4 transition-all hover:shadow-card ${
      bet.status === 'won' ? 'border-bet-yes/30 bg-bet-yes/5' : 
      bet.status === 'lost' ? 'border-bet-no/30 bg-bet-no/5' : 
      'border-border'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🐎</span>
            <h4 className="font-semibold text-foreground">
              {(bet as { races?: { horse_name: string } | null }).races?.horse_name || 'Unknown Horse'}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {(bet as { races?: { track_name: string } | null }).races?.track_name || 'Unknown Track'}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            bet.prediction === 'yes' 
              ? 'bg-bet-yes/10 text-bet-yes' 
              : 'bg-bet-no/10 text-bet-no'
          }`}>
            {bet.prediction.toUpperCase()}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Coins className="w-3 h-3" />
            {lamportsToSol(bet.amount).toFixed(4)} SOL
          </div>
        </div>

        <div className="text-right flex items-center gap-3">
          {bet.status === 'won' && bet.payout && (
            <p className="font-bold text-bet-yes">+{lamportsToSol(bet.payout).toFixed(4)} SOL</p>
          )}
          {bet.status === 'lost' && (
            <p className="font-medium text-bet-no">-{lamportsToSol(bet.amount).toFixed(4)} SOL</p>
          )}
          <p className="text-xs text-muted-foreground">{formatTime(bet.created_at)}</p>
          {bet.tx_signature && (
            <a
              href={`https://explorer.solana.com/tx/${bet.tx_signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Claim Button for Won Bets */}
      {bet.status === 'won' && !bet.claimed && bet.onchain_race_id && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-bet-yes hover:bg-bet-yes/90 text-white font-bold"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim {lamportsToSol(bet.payout || 0).toFixed(4)} SOL
              </>
            )}
          </Button>
        </div>
      )}

      {/* Already Claimed Badge */}
      {bet.status === 'won' && bet.claimed && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Gift className="w-4 h-4" />
            Winnings Claimed
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;