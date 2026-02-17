import { Trophy, TrendingUp, Target, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';

// Hardcoded Irish leaderboard - always show this data
const hardcodedLeaderboard = [
  { rank: 1, name: "Séamus O'Brien", profit: 1247, winRate: 71, trades: 45, streak: 5, wallet: '9PJ8...3555' },
  { rank: 2, name: "Aoife Murphy", profit: 934, winRate: 68, trades: 32, streak: 3, wallet: '7KL2...8912' },
  { rank: 3, name: "Pádraig Walsh", profit: 821, winRate: 65, trades: 28, streak: 0, wallet: '4MN9...2341' },
  { rank: 4, name: "Sinéad Brennan", profit: 634, winRate: 62, trades: 41, streak: 2, wallet: '2XY4...7823' },
  { rank: 5, name: "Ciarán Doyle", profit: 512, winRate: 58, trades: 19, streak: 0, wallet: '8QW1...4456' },
  { rank: 6, name: "Niamh Gallagher", profit: 445, winRate: 61, trades: 23, streak: 1, wallet: '5TU7...9034' },
  { rank: 7, name: "Tomás Ó'Súilleabháin", profit: 378, winRate: 55, trades: 31, streak: 0, wallet: '3VB6...1287' },
  { rank: 8, name: "Eimear Kelly", profit: 290, winRate: 57, trades: 14, streak: 3, wallet: '6HJ8...5621' },
];

const LeaderboardPage = () => {
  const leaderboard = hardcodedLeaderboard;

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-secondary" />
            <h1 className="text-4xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            This week's top traders on Irish racing markets
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-end justify-center gap-4 max-w-3xl mx-auto">
            {/* 2nd Place */}
            <div className="flex-1 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-b from-card to-background border border-border rounded-lg p-6 h-48 flex flex-col items-center justify-center"
              >
                <div className="text-4xl mb-2">🥈</div>
                <div className="font-bold text-foreground text-lg mb-1">{leaderboard[1].name}</div>
                <div className="text-secondary font-bold text-xl">€{leaderboard[1].profit}</div>
                <div className="text-xs text-muted-foreground mt-1">{leaderboard[1].winRate}% win rate</div>
              </motion.div>
            </div>

            {/* 1st Place */}
            <div className="flex-1 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-b from-secondary/20 via-card to-background border-2 border-secondary rounded-lg p-6 h-56 flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
                <div className="text-5xl mb-2">🥇</div>
                <div className="font-bold text-foreground text-xl mb-1">{leaderboard[0].name}</div>
                <div className="text-secondary font-bold text-2xl">€{leaderboard[0].profit}</div>
                <div className="text-xs text-muted-foreground mt-1">{leaderboard[0].winRate}% win rate</div>
                <div className="absolute bottom-2 left-0 right-0">
                  <div className="text-xs text-secondary font-semibold">👑 Champion</div>
                </div>
              </motion.div>
            </div>

            {/* 3rd Place */}
            <div className="flex-1 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-b from-card to-background border border-border rounded-lg p-6 h-40 flex flex-col items-center justify-center"
              >
                <div className="text-3xl mb-2">🥉</div>
                <div className="font-bold text-foreground text-base mb-1">{leaderboard[2].name}</div>
                <div className="text-secondary font-bold text-lg">€{leaderboard[2].profit}</div>
                <div className="text-xs text-muted-foreground mt-1">{leaderboard[2].winRate}% win rate</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Full Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-lg border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trader</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Win Rate</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trades</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <motion.tr
                    key={entry.wallet}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * entry.rank }}
                    className={`border-b border-border hover:bg-elevated/50 transition-colors ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-secondary/5 to-transparent' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMedal(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-foreground">{entry.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{entry.wallet}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="font-bold text-secondary text-lg tabular-nums">
                        €{entry.profit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Target className="w-3 h-3 text-racing-green" />
                        <span className="font-semibold text-foreground tabular-nums">{entry.winRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold text-foreground tabular-nums">{entry.trades}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {entry.streak > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Flame className="w-4 h-4 text-secondary" />
                          <span className="font-bold text-secondary">{entry.streak}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-elevated border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              🍀 Place trades to climb the leaderboard!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
