import { Trophy, Target, TrendingUp, Flame } from 'lucide-react';
import Header from '@/components/Header';

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
  const top3 = hardcodedLeaderboard.slice(0, 3);
  const rest = hardcodedLeaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: '#d4af37' }} />
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            This week's top traders on Irish racing markets
          </p>
        </div>

        {/* Podium — top 3 */}
        <div className="flex items-end justify-center gap-3 max-w-2xl mx-auto mb-10">
          {/* 2nd */}
          <PodiumCard entry={top3[1]} height="h-36" />
          {/* 1st */}
          <PodiumCard entry={top3[0]} height="h-44" highlight />
          {/* 3rd */}
          <PodiumCard entry={top3[2]} height="h-28" />
        </div>

        {/* Full table */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trader</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Win Rate</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Trades</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Streak</th>
              </tr>
            </thead>
            <tbody>
              {hardcodedLeaderboard.map(entry => (
                <tr
                  key={entry.wallet}
                  className="transition-colors hover:bg-elevated/40 animate-fade-in"
                  style={{ borderBottom: '1px solid #2a2a2a' }}
                >
                  <td className="px-5 py-3 whitespace-nowrap">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.wallet}</p>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span className="text-sm font-bold tabular-nums" style={{ color: '#d4af37' }}>
                      €{entry.profit}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1 text-sm tabular-nums text-foreground">
                      <Target className="w-3 h-3 text-racing-green" />
                      {entry.winRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap hidden md:table-cell">
                    <span className="flex items-center justify-end gap-1 text-sm tabular-nums text-foreground">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      {entry.trades}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {entry.streak > 0 ? (
                      <span className="flex items-center justify-end gap-1 font-bold" style={{ color: '#d4af37' }}>
                        <Flame className="w-3.5 h-3.5" />
                        {entry.streak}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="px-5 py-3 text-center text-xs text-muted-foreground"
            style={{ borderTop: '1px solid #2a2a2a', background: '#1a1a1a' }}
          >
            🍀 Place trades to climb the leaderboard
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Podium card ─────────────────────────────────────────────────────────────
interface PodiumEntry {
  rank: number;
  name: string;
  profit: number;
  winRate: number;
}

interface PodiumCardProps {
  entry: PodiumEntry;
  height: string;
  highlight?: boolean;
}

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const PodiumCard = ({ entry, height, highlight = false }: PodiumCardProps) => (
  <div
    className={`flex-1 flex flex-col items-center justify-center ${height} rounded-lg px-3`}
    style={{
      background: '#1a1a1a',
      border: highlight ? '1px solid #d4af3740' : '1px solid #2a2a2a',
    }}
  >
    <span className="text-2xl mb-2">{medals[entry.rank]}</span>
    <p className="text-xs font-semibold text-foreground text-center leading-snug mb-1">{entry.name}</p>
    <p className="text-sm font-bold tabular-nums" style={{ color: '#d4af37' }}>€{entry.profit}</p>
    <p className="text-xs text-muted-foreground">{entry.winRate}% win</p>
  </div>
);

// ─── Rank badge ────────────────────────────────────────────────────────────────
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank <= 3) return <span className="text-lg">{medals[rank]}</span>;
  return (
    <span className="text-sm font-bold text-muted-foreground tabular-nums">{rank}</span>
  );
};

export default LeaderboardPage;
