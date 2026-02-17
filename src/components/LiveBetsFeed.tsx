import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { fetchAllRecentBets, subscribeToAllBets } from '@/lib/supabase';

interface BetWithRace {
  id: string;
  user_wallet: string;
  prediction: 'yes' | 'no';
  amount: number;
  created_at: string;
  races?: {
    horse_name: string;
    track_name: string;
  };
}

const LiveBetsFeed = () => {
  const [bets, setBets] = useState<BetWithRace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBets = async () => {
      try {
        const data = await fetchAllRecentBets(15);
        setBets(data || []);
      } catch (error) {
        console.error('Failed to load bets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBets();

    // Subscribe to real-time updates
    const subscription = subscribeToAllBets((newBets) => {
      setBets(newBets);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const formatAmount = (lamports: number) => {
    return (lamports / 1e9).toFixed(3);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-racing-green rounded-full animate-pulse" />
          Live Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-muted rounded-full" />
          Live Activity
        </h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No bets yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Be the first to bet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-racing-green rounded-full animate-pulse" />
        Live Activity
        <span className="text-xs font-normal text-muted-foreground ml-auto">
          {bets.length} bets
        </span>
      </h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {bets.map((bet, index) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`p-3 rounded-lg border transition-all hover:border-racing-green/30 ${
                bet.prediction === 'yes'
                  ? 'bg-bet-yes/5 border-bet-yes/20'
                  : 'bg-bet-no/5 border-bet-no/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-full ${
                    bet.prediction === 'yes' ? 'bg-bet-yes/20' : 'bg-bet-no/20'
                  }`}>
                    {bet.prediction === 'yes' ? (
                      <TrendingUp className="w-3 h-3 text-bet-yes" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-bet-no" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {formatWallet(bet.user_wallet)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {bet.races?.horse_name || 'Unknown'} @ {bet.races?.track_name || 'Track'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${
                    bet.prediction === 'yes' ? 'text-bet-yes' : 'text-bet-no'
                  }`}>
                    {bet.prediction.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(bet.amount)} SOL
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60">
                <Clock className="w-3 h-3" />
                {formatTime(bet.created_at)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveBetsFeed;
