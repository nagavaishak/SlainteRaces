import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Header from '@/components/Header';

const activityFeedData = [
  { type: 'trade', name: "Séamus O'B", shares: 25, direction: 'YES', horse: 'Fastnet Rock', track: 'Leopardstown', price: 0.73, amount: 18.25, time: 'just now' },
  { type: 'alert', message: 'Fastnet Rock market moved +8% in 20 minutes. Smart money into YES.', horse: 'Fastnet Rock', track: 'Leopardstown', direction: 'up' },
  { type: 'trade', name: "Aoife M", shares: 10, direction: 'NO', horse: 'Tiger Roll', track: 'Curragh', price: 0.45, amount: 4.50, time: '1m ago' },
  { type: 'whale', name: "Pádraig W", shares: 150, direction: 'NO', horse: 'Tiger Roll', track: 'Curragh', price: 0.45, amount: 67.50, time: '2m ago' },
  { type: 'trade', name: "Sinéad B", shares: 30, direction: 'YES', horse: 'Fastnet Rock', track: 'Leopardstown', price: 0.71, amount: 21.30, time: '3m ago' },
  { type: 'trade', name: "Ciarán D", shares: 20, direction: 'YES', horse: 'Tiger Roll', track: 'Curragh', price: 0.55, amount: 11.00, time: '4m ago' },
  { type: 'status', horse: 'Fastnet Rock', track: 'Leopardstown', status: 'LIVE', probability: 73 },
  { type: 'trade', name: "Niamh G", shares: 50, direction: 'NO', horse: 'Ruby Walsh', track: 'Punchestown', price: 0.60, amount: 30.00, time: '6m ago' },
  { type: 'trade', name: "Ruairí M", shares: 15, direction: 'YES', horse: 'Fastnet Rock', track: 'Leopardstown', price: 0.70, amount: 10.50, time: '7m ago' },
  { type: 'alert', message: 'Tiger Roll market stable at 55%. High liquidity on both sides.', horse: 'Tiger Roll', track: 'Curragh', direction: 'neutral' },
  { type: 'whale', name: "Tomás Ó", shares: 200, direction: 'YES', horse: 'Fastnet Rock', track: 'Leopardstown', price: 0.68, amount: 136.00, time: '9m ago' },
  { type: 'trade', name: "Eimear K", shares: 12, direction: 'NO', horse: 'Ruby Walsh', track: 'Punchestown', price: 0.61, amount: 7.32, time: '10m ago' },
  { type: 'payout', name: "Fionnuala N", amount: 34.50, profit: 14.50, profitPct: 72, horse: 'Sea The Stars', track: 'Galway', time: '1h ago' },
  { type: 'trade', name: "Darragh F", shares: 40, direction: 'YES', horse: 'Tiger Roll', track: 'Curragh', price: 0.53, amount: 21.20, time: '12m ago' },
  { type: 'trade', name: "Caoimhe R", shares: 8, direction: 'NO', horse: 'Fastnet Rock', track: 'Leopardstown', price: 0.27, amount: 2.16, time: '14m ago' },
  { type: 'alert', message: 'Ruby Walsh showing NO momentum. Price dropped 5% in last 30 minutes.', horse: 'Ruby Walsh', track: 'Punchestown', direction: 'down' },
  { type: 'whale', name: "Brendán Ó", shares: 100, direction: 'YES', horse: 'Tiger Roll', track: 'Curragh', price: 0.54, amount: 54.00, time: '18m ago' },
  { type: 'trade', name: "Méabh C", shares: 35, direction: 'YES', horse: 'Fastnet Rock', track: 'Leopardstown', price: 0.69, amount: 24.15, time: '20m ago' },
  { type: 'payout', name: "Séamus O'B", amount: 156.00, profit: 56.00, profitPct: 56, horse: 'Fastnet Rock', track: 'Leopardstown', time: '2h ago' },
  { type: 'trade', name: "Liam Ó'C", shares: 60, direction: 'NO', horse: 'Tiger Roll', track: 'Curragh', price: 0.46, amount: 27.60, time: '22m ago' },
];

type ActivityItem = typeof activityFeedData[0] & { id: number };
type FilterType = 'all' | 'trades' | 'alerts' | 'whales';

const Activity = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [feedItems, setFeedItems] = useState<ActivityItem[]>([]);
  const feedIndexRef = useRef(0);
  const idCounterRef = useRef(0);

  useEffect(() => {
    const initialItems = activityFeedData.slice(-8).reverse().map((item, idx) => ({ ...item, id: idx }));
    setFeedItems(initialItems);
    idCounterRef.current = 8;
    feedIndexRef.current = 0;
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        const newItem = { ...activityFeedData[feedIndexRef.current], id: idCounterRef.current++ };
        setFeedItems(prev => [newItem, ...prev].slice(0, 25));
        feedIndexRef.current = (feedIndexRef.current + 1) % activityFeedData.length;
        scheduleNext();
      }, Math.floor(Math.random() * 4000) + 3000);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  const filteredItems = feedItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'trades') return item.type === 'trade' || item.type === 'whale';
    if (filter === 'alerts') return item.type === 'alert' || item.type === 'status';
    if (filter === 'whales') return item.type === 'whale';
    return true;
  });

  const tableData = activityFeedData.filter(item => item.type === 'trade' || item.type === 'whale');

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'trades', label: 'Trades' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'whales', label: 'Whales 🐳' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Live Activity
            <span className="w-2 h-2 rounded-full animate-pulse-live inline-block" style={{ background: '#00a86b' }} />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time trades across Irish racing markets
          </p>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg overflow-hidden mb-8"
          style={{ background: '#2a2a2a' }}
        >
          {[
            { label: 'Traders today', value: '2,847' },
            { label: 'Volume', value: '€124,450' },
            { label: 'Trades', value: '1,247' },
            { label: 'Live markets', value: '1', accent: '#00a86b' },
          ].map(s => (
            <div key={s.label} className="bg-card px-4 py-4">
              <p className="text-xs text-muted-foreground mb-1.5">{s.label}</p>
              <p className="text-xl font-bold tabular-nums" style={s.accent ? { color: s.accent } : {}}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feed — 8 cols */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Feed</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-live inline-block" style={{ background: '#00a86b' }} />
                Updating live
              </div>
            </div>

            {/* Filter tabs */}
            <div
              className="flex items-center gap-1 p-1 rounded mb-5 w-fit"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={
                    filter === tab.key
                      ? { background: '#2a2a2a', color: '#f1f5f9' }
                      : { color: '#888888' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feed items */}
            <div className="space-y-2 mb-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FeedRow item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Recent trades table */}
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
              <div
                className="px-4 py-3 text-sm font-semibold text-foreground"
                style={{ borderBottom: '1px solid #2a2a2a', background: '#1a1a1a' }}
              >
                Recent Trades
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                      {['Time', 'Trader', 'Market', 'Side', 'Shares', 'Price', 'Total'].map(h => (
                        <th
                          key={h}
                          className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase ${h === 'Total' || h === 'Shares' || h === 'Price' ? 'text-right' : h === 'Side' ? 'text-center' : 'text-left'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-elevated/40"
                        style={{
                          borderBottom: '1px solid #2a2a2a',
                          borderLeft: (item.amount && item.amount > 50) ? '2px solid #d4af37' : '2px solid transparent',
                        }}
                      >
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.time}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{item.name}...</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{item.horse}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={
                              item.direction === 'YES'
                                ? { background: '#00a86b18', color: '#00a86b' }
                                : { background: '#ff515218', color: '#ff5152' }
                            }
                          >
                            {item.direction}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right tabular-nums text-foreground">{item.shares}</td>
                        <td className="px-4 py-2.5 text-sm text-right tabular-nums text-muted-foreground">{item.price?.toFixed(2)}¢</td>
                        <td
                          className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums"
                          style={{ color: item.amount && item.amount > 50 ? '#d4af37' : '#f1f5f9' }}
                        >
                          €{item.amount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar — 4 cols */}
          <div className="lg:col-span-4 space-y-4 hidden lg:block">
            <SideCard title="🔥 Most Active">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-live inline-block" style={{ background: '#00a86b' }} />
                <span className="font-bold text-foreground">Fastnet Rock</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Leopardstown · €4,270 vol · 143 positions</p>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: '#00a86b' }}>YES</span>
                  <span className="text-foreground font-bold">73%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: '#2a2a2a' }}>
                  <div className="h-full" style={{ width: '73%', background: '#00a86b' }} />
                  <div className="h-full" style={{ width: '27%', background: '#ff5152' }} />
                </div>
              </div>
            </SideCard>

            <SideCard title="📈 Biggest Mover (24h)">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground">Fastnet Rock</span>
                <span className="font-bold text-sm" style={{ color: '#00a86b' }}>+23%</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">50% → 73%</p>
              <p className="text-xs italic text-muted-foreground">"Rachael Blackmore confirmed as jockey"</p>
            </SideCard>

            <SideCard title="✅ Recently Settled">
              <p className="font-bold text-foreground mb-1">Sea The Stars</p>
              <p className="text-sm text-muted-foreground mb-3">Galway · Yesterday · YES ✓</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid out</span>
                  <span className="text-foreground">€2,340 to 67 winners</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg profit</span>
                  <span style={{ color: '#d4af37' }}>+€34.90</span>
                </div>
              </div>
            </SideCard>

            <SideCard title="Quick Links">
              {[
                { label: 'View All Markets', href: '/' },
                { label: 'Leaderboard', href: '/leaderboard' },
                { label: 'My Portfolio', href: '/dashboard' },
              ].map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between text-sm py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                  <span>→</span>
                </a>
              ))}
            </SideCard>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Side card ────────────────────────────────────────────────────────────────
const SideCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
    <p className="text-xs font-semibold text-muted-foreground mb-3">{title}</p>
    {children}
  </div>
);

// ─── Feed row ─────────────────────────────────────────────────────────────────
const FeedRow = ({ item }: { item: ActivityItem }) => {
  const isYes = item.direction === 'YES';

  if (item.type === 'trade' || item.type === 'whale') {
    const isWhale = item.type === 'whale';
    return (
      <div
        className="rounded-lg p-3"
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderLeft: isWhale ? '2px solid #d4af37' : '2px solid transparent',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: '#222', color: isWhale ? '#d4af37' : '#00a86b' }}
            >
              {item.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm text-foreground">
                <span className="font-medium">{item.name}...</span>
                {' '}bought{' '}
                <span
                  className="font-bold"
                  style={{ color: isYes ? '#00a86b' : '#ff5152' }}
                >
                  {item.shares} {item.direction}
                </span>
                {' '}in {item.horse}
              </span>
              <p className="text-xs text-muted-foreground">{item.track} · {item.price?.toFixed(2)}¢/share · {item.time}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: isWhale ? '#d4af37' : '#f1f5f9' }}
            >
              €{item.amount?.toFixed(2)}
            </span>
            {isWhale && <p className="text-xs" style={{ color: '#d4af37' }}>🐳 Whale</p>}
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'alert') {
    const Icon = item.direction === 'up' ? TrendingUp : item.direction === 'down' ? TrendingDown : Minus;
    return (
      <div
        className="rounded-lg p-3"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '2px solid #3b82f6' }}
      >
        <div className="flex items-start gap-2">
          <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
          <div>
            <p className="text-sm text-foreground">{item.message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.track} · {item.horse}</p>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'status') {
    return (
      <div
        className="rounded-lg p-3"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '2px solid #00a86b' }}
      >
        <p className="text-sm text-foreground">
          <span className="font-semibold">{item.horse}</span> is now{' '}
          <span className="font-bold" style={{ color: '#ff5152' }}>LIVE</span> at {item.track} ·{' '}
          <span style={{ color: '#00a86b' }}>YES {item.probability}%</span>
        </p>
      </div>
    );
  }

  if (item.type === 'payout') {
    return (
      <div
        className="rounded-lg p-3"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '2px solid #d4af37' }}
      >
        <p className="text-sm text-foreground">
          <span className="font-medium">{item.name}...</span> claimed{' '}
          <span className="font-bold" style={{ color: '#d4af37' }}>€{item.amount?.toFixed(2)}</span> from{' '}
          {item.horse}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.track} · YES ✓ ·{' '}
          <span style={{ color: '#00a86b' }}>+€{item.profit?.toFixed(2)} profit</span>
          {' '}· {item.time}
        </p>
      </div>
    );
  }

  return null;
};

export default Activity;
