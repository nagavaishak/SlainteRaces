import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Coins, TrendingUp, Target, Trophy, Loader2, ExternalLink, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import LiveBetsFeed from '@/components/LiveBetsFeed';
import { useUserData } from '@/hooks/useUserData';
import { lamportsToSol, buildClaimWinningsTransaction, connection } from '@/lib/solana';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { connected } = useWallet();
  const { activeBets, pastBets, stats, loading } = useUserData();

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-4xl mb-4">👛</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Connect your wallet</h1>
          <p className="text-sm text-muted-foreground">
            Connect to view your portfolio and betting history
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-racing-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Page title */}
        <h1 className="text-xl font-bold text-foreground mb-5">Portfolio</h1>

        {/* Compact stats bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-8 rounded-lg overflow-hidden"
          style={{ background: '#2a2a2a' }}
        >
          <StatCell icon={Coins} label="SOL Balance" value={`${stats.solBalance.toFixed(3)} SOL`} />
          <StatCell icon={TrendingUp} label="Total Winnings" value={`${stats.totalWinnings.toFixed(3)} SOL`} accent="#00a86b" />
          <StatCell icon={Target} label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.totalBets} trades`} />
          <StatCell icon={Trophy} label="Active Bets" value={String(stats.activeBets)} sub="In play" />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="active">
              <TabsList className="mb-5">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  Active
                  {activeBets.length > 0 && (
                    <span
                      className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                      style={{ background: '#00a86b', color: '#fff' }}
                    >
                      {activeBets.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="animate-fade-in">
                {activeBets.length > 0 ? (
                  <div className="space-y-3">
                    {activeBets.map(bet => (
                      <BetCard key={bet.id} bet={bet as any} onClaimSuccess={() => window.location.reload()} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    emoji="🐎"
                    title="No active bets"
                    body="Head to the markets page to place your first bet!"
                    cta={{ label: 'Browse markets', href: '/' }}
                  />
                )}
              </TabsContent>

              <TabsContent value="history" className="animate-fade-in">
                {pastBets.length > 0 ? (
                  <div className="space-y-3">
                    {pastBets.map(bet => (
                      <BetCard key={bet.id} bet={bet as any} onClaimSuccess={() => window.location.reload()} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    emoji="📜"
                    title="No history yet"
                    body="Your completed bets will appear here."
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Activity sidebar */}
          <div className="lg:col-span-1">
            <LiveBetsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Stat cell ────────────────────────────────────────────────────────────────
interface StatCellProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

const StatCell = ({ icon: Icon, label, value, sub, accent }: StatCellProps) => (
  <div className="bg-card px-4 py-4">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <p className="text-xl font-bold tabular-nums" style={accent ? { color: accent } : {}}>
      {value}
    </p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const EmptyState = ({ emoji, title, body, cta }: EmptyStateProps) => (
  <div
    className="text-center py-12 rounded-lg"
    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
  >
    <p className="text-3xl mb-3">{emoji}</p>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{body}</p>
    {cta && (
      <a
        href={cta.href}
        className="inline-block px-4 py-2 rounded text-sm font-medium text-foreground transition-opacity hover:opacity-80"
        style={{ background: '#00a86b' }}
      >
        {cta.label}
      </a>
    )}
  </div>
);

// ─── Bet card ─────────────────────────────────────────────────────────────────
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
    races?: { horse_name: string; track_name: string } | null;
  };
  onClaimSuccess?: () => void;
}

const BetCard = ({ bet, onClaimSuccess }: BetCardProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!publicKey || !sendTransaction || !bet.onchain_race_id) {
      toast({ title: 'Cannot claim', description: 'Wallet not connected or bet not on-chain', variant: 'destructive' });
      return;
    }

    setIsClaiming(true);
    try {
      const transaction = await buildClaimWinningsTransaction(publicKey, bet.onchain_race_id);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

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
      toast({
        title: 'Claim failed',
        description: error instanceof Error ? error.message : 'Failed to claim winnings',
        variant: 'destructive'
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const isYes = bet.prediction === 'yes';
  const isWon = bet.status === 'won';
  const isLost = bet.status === 'lost';

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return 'Just now';
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: '#1a1a1a',
        border: `1px solid ${isWon ? '#00a86b30' : isLost ? '#ff515230' : '#2a2a2a'}`
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: horse + track */}
        <div className="flex items-center gap-3">
          <span
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={
              isYes
                ? { background: '#00a86b18', color: '#00a86b' }
                : { background: '#ff515218', color: '#ff5152' }
            }
          >
            {bet.prediction.toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {bet.races?.horse_name || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">
              {bet.races?.track_name} · {formatTime(bet.created_at)}
            </p>
          </div>
        </div>

        {/* Right: amount + P&L */}
        <div className="text-right flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {lamportsToSol(bet.amount).toFixed(4)} SOL
            </p>
            {isWon && bet.payout && (
              <p className="text-xs font-semibold tabular-nums" style={{ color: '#00a86b' }}>
                +{lamportsToSol(bet.payout).toFixed(4)} SOL
              </p>
            )}
            {isLost && (
              <p className="text-xs font-semibold tabular-nums" style={{ color: '#ff5152' }}>
                -{lamportsToSol(bet.amount).toFixed(4)} SOL
              </p>
            )}
          </div>

          {/* Status badge */}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={
              isWon ? { background: '#00a86b18', color: '#00a86b' }
              : isLost ? { background: '#ff515218', color: '#ff5152' }
              : { background: '#2a2a2a', color: '#888888' }
            }
          >
            {bet.status || 'Active'}
          </span>

          {bet.tx_signature && (
            <a
              href={`https://explorer.solana.com/tx/${bet.tx_signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Claim button */}
      {isWon && !bet.claimed && bet.onchain_race_id && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2a2a2a' }}>
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full font-bold text-sm"
            style={{ background: '#00a86b', color: '#fff' }}
          >
            {isClaiming ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Claiming...</>
            ) : (
              <><Gift className="w-4 h-4 mr-2" />Claim {lamportsToSol(bet.payout || 0).toFixed(4)} SOL</>
            )}
          </Button>
        </div>
      )}

      {isWon && bet.claimed && (
        <div className="mt-3 pt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground" style={{ borderTop: '1px solid #2a2a2a' }}>
          <Gift className="w-3.5 h-3.5" />
          Winnings claimed
        </div>
      )}
    </div>
  );
};

export default Dashboard;
