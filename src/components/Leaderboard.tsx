import { Trophy, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { lamportsToSol } from '@/lib/solana';

const Leaderboard = () => {
  const { leaderboard, loading } = useLeaderboard();

  const getMedal = (rank: number | null) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl animate-medal">🥇</span>;
      case 2:
        return <span className="text-2xl animate-medal">🥈</span>;
      case 3:
        return <span className="text-2xl animate-medal">🥉</span>;
      default:
        return <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const truncateWallet = (address: string | null) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="bg-gradient-primary p-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-secondary" />
            <h2 className="text-xl font-bold text-primary-foreground">Top Bettors</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <div className="bg-gradient-primary p-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-secondary" />
          <h2 className="text-xl font-bold text-primary-foreground">Top Bettors</h2>
        </div>
        <p className="text-sm text-primary-foreground/70 mt-1">This week's champions</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🏆</span>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Rankings Yet</h3>
          <p className="text-muted-foreground">Be the first to place a bet!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.wallet_address || index}
              className={`p-4 flex items-center gap-4 transition-colors hover:bg-muted/50 ${
                (entry.rank || 0) <= 3 ? 'bg-gradient-to-r from-secondary/5 to-transparent' : ''
              }`}
            >
              <div className="flex-shrink-0 w-10">
                {getMedal(entry.rank)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {entry.display_name || truncateWallet(entry.wallet_address)}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {truncateWallet(entry.wallet_address)}
                </p>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    Win Rate
                  </div>
                  <p className="font-semibold text-primary">{entry.win_rate || 0}%</p>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Total Bets
                  </div>
                  <p className="font-semibold text-foreground">{entry.total_bets || 0}</p>
                </div>
                <div className="min-w-[80px]">
                  <p className="text-xs text-muted-foreground mb-1">Winnings</p>
                  <p className="font-bold text-gradient-gold text-lg">
                    {lamportsToSol(entry.total_winnings || 0).toFixed(2)} SOL
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          🍀 Place bets to climb the leaderboard!
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
