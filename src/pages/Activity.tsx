import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';

// Hardcoded activity feed data
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

  // Initialize with bottom 8 entries on mount
  useEffect(() => {
    const initialItems = activityFeedData.slice(-8).reverse().map((item, idx) => ({
      ...item,
      id: idx
    }));
    setFeedItems(initialItems);
    idCounterRef.current = 8;
    feedIndexRef.current = 0;
  }, []);

  // Add new entries periodically
  useEffect(() => {
    const addNewEntry = () => {
      const newItem = {
        ...activityFeedData[feedIndexRef.current],
        id: idCounterRef.current++
      };
      
      setFeedItems(prev => {
        const updated = [newItem, ...prev];
        return updated.slice(0, 25); // Keep max 25 items
      });
      
      feedIndexRef.current = (feedIndexRef.current + 1) % activityFeedData.length;
    };

    const getRandomInterval = () => Math.floor(Math.random() * 4000) + 3000; // 3-7 seconds
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        addNewEntry();
        scheduleNext();
      }, getRandomInterval());
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, []);

  // Filter items based on selected filter
  const filteredItems = feedItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'trades') return item.type === 'trade' || item.type === 'whale';
    if (filter === 'alerts') return item.type === 'alert' || item.type === 'status';
    if (filter === 'whales') return item.type === 'whale';
    return true;
  });

  // Get table data (all trade types)
  const tableData = activityFeedData.filter(item => 
    item.type === 'trade' || item.type === 'whale'
  );

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            ⚡ Live Activity
          </h1>
          <p className="text-muted-foreground">
            Real-time trades and market movements across Irish racing markets
          </p>
        </div>

        {/* Top Stats Bar */}
        <div className="relative mb-8">
          {/* Animated progress bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden rounded-t-lg">
            <div 
              className="h-full bg-racing-green animate-pulse"
              style={{
                animation: 'pulse-bar 2s ease-in-out infinite',
                background: 'linear-gradient(90deg, transparent, #00a86b, transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">⚡ Traders Today</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">2,847</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">📊 Volume</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">€124,450</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">🔄 Trades</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">1,247</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">🔴 Live Markets</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: '#00a86b' }}>1</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Live Feed (65%) */}
          <div className="lg:col-span-8">
            {/* Feed Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Live Activity</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-racing-green animate-pulse" />
                <span className="text-xs text-muted-foreground">Updating live</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(['all', 'trades', 'alerts', 'whales'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                    background: filter === f ? '#00a86b' : '#1a2235'
                  }}
                >
                  {f === 'all' ? 'All' : f === 'trades' ? 'Trades' : f === 'alerts' ? 'Alerts' : 'Whales'}
                </button>
              ))}
            </div>

            {/* Activity Feed */}
            <div className="space-y-3 mb-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <ActivityEntry item={item} getInitials={getInitials} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Recent Trades Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Recent Trades</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border" style={{ background: '#0f1418' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Trader</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Market</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Side</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Shares</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-border transition-colors hover:bg-elevated/50"
                        style={{ 
                          background: idx % 2 === 0 ? '#111827' : '#0f1418',
                          borderLeft: (item.amount && item.amount > 50) ? '3px solid #d4af37' : 'none'
                        }}
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{item.time}</td>
                        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{item.name}...</td>
                        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{item.horse}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            item.direction === 'YES' 
                              ? 'bg-bet-yes/20 text-bet-yes' 
                              : 'bg-bet-no/20 text-bet-no'
                          }`}>
                            {item.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums">{item.shares}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground text-right tabular-nums">{item.price?.toFixed(2)}¢</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right tabular-nums" style={{ color: item.amount && item.amount > 50 ? '#d4af37' : '#f1f5f9' }}>
                          €{item.amount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (35%) */}
          <div className="lg:col-span-4 space-y-4 hidden lg:block">
            {/* Most Active Market */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                🔥 Most Active Market
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-racing-green animate-pulse" />
                <span className="font-bold text-foreground text-lg">Fastnet Rock</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Leopardstown · 3:15 PM</p>
              <p className="text-sm text-muted-foreground mb-4">€4,270 volume · 143 positions</p>
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-bet-yes font-semibold">YES</span>
                  <span className="text-foreground font-bold">73%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1f2d40' }}>
                  <div className="h-full bg-bet-yes" style={{ width: '73%' }} />
                </div>
              </div>
            </div>

            {/* Biggest Mover */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                📈 Biggest Mover (24h)
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-foreground text-lg">Fastnet Rock</span>
                <span className="text-bet-yes font-bold">+23%</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Started at 50% → Now 73%
              </p>
              <p className="text-sm italic text-muted-foreground">
                "Rachael Blackmore confirmed as jockey"
              </p>
            </div>

            {/* Recently Settled */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                ✅ Recently Settled
              </div>
              <div className="font-bold text-foreground text-lg mb-1">Sea The Stars</div>
              <p className="text-sm text-muted-foreground mb-3">Galway · Yesterday</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Result:</span>
                  <span className="text-bet-yes font-semibold">YES ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid out:</span>
                  <span className="text-foreground font-semibold">€2,340 to 67 winners</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg profit:</span>
                  <span className="text-secondary font-semibold">+€34.90 per winner</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm font-semibold text-muted-foreground mb-3">Quick Links</div>
              <div className="space-y-2">
                <a href="/" className="flex items-center justify-between text-sm text-foreground hover:text-racing-green transition-colors">
                  <span>View All Markets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a href="/leaderboard" className="flex items-center justify-between text-sm text-foreground hover:text-racing-green transition-colors">
                  <span>Leaderboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a href="/dashboard" className="flex items-center justify-between text-sm text-foreground hover:text-racing-green transition-colors">
                  <span>My Portfolio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-bar {
          0%, 100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

// Activity Entry Component
interface ActivityEntryProps {
  item: ActivityItem;
  getInitials: (name: string) => string;
}

const ActivityEntry = ({ item, getInitials }: ActivityEntryProps) => {
  if (item.type === 'trade') {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: '#1a2235', color: '#00a86b' }}
          >
            {getInitials(item.name || '')}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm mb-1">
              <span className="font-semibold text-foreground">{item.name}...</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{item.time}</span>
            </div>
            
            {/* Body */}
            <p className="text-sm text-muted-foreground mb-2">
              Bought <span className="text-foreground font-semibold">{item.shares} {item.direction}</span> shares in{' '}
              <span className="text-foreground font-semibold">{item.horse}</span>
            </p>
            
            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  item.direction === 'YES' 
                    ? 'bg-bet-yes/20 text-bet-yes' 
                    : 'bg-bet-no/20 text-bet-no'
                }`}>
                  {item.direction}
                </span>
                <span className="text-xs text-muted-foreground">
                  @ {item.track} · {item.price?.toFixed(2)}¢/share
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">€{item.amount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'whale') {
    return (
      <div 
        className="rounded-lg p-4 border"
        style={{ 
          background: '#1a2235', 
          borderColor: '#1f2d40',
          borderLeft: '3px solid #d4af37'
        }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: '#111827', color: '#d4af37' }}
          >
            {getInitials(item.name || '')}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{item.name}...</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{item.time}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#d4af3720', color: '#d4af37' }}>
                🐳 Large Position
              </span>
            </div>
            
            {/* Body */}
            <p className="text-sm text-muted-foreground mb-2">
              Bought <span className="text-foreground font-semibold">{item.shares} {item.direction}</span> shares in{' '}
              <span className="text-foreground font-semibold">{item.horse}</span>
            </p>
            
            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  item.direction === 'YES' 
                    ? 'bg-bet-yes/20 text-bet-yes' 
                    : 'bg-bet-no/20 text-bet-no'
                }`}>
                  {item.direction}
                </span>
                <span className="text-xs text-muted-foreground">
                  @ {item.track} · {item.price?.toFixed(2)}¢/share
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: '#d4af37' }}>€{item.amount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'alert') {
    const directionIcon = item.direction === 'up' ? (
      <TrendingUp className="w-4 h-4" />
    ) : item.direction === 'down' ? (
      <TrendingDown className="w-4 h-4" />
    ) : (
      <Minus className="w-4 h-4" />
    );

    return (
      <div 
        className="rounded-lg p-4 border"
        style={{ 
          background: '#0f1729', 
          borderColor: '#1f2d40',
          borderLeft: '3px solid #3b82f6'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1" style={{ background: '#3b82f620', color: '#3b82f6' }}>
            {directionIcon}
            {item.direction === 'up' ? '📈 Market Alert' : item.direction === 'down' ? '📉 Market Alert' : '📊 Market Alert'}
          </span>
          <span className="text-xs text-muted-foreground">5m ago</span>
        </div>
        
        {/* Body */}
        <p className="text-sm text-foreground mb-2">
          {item.message}
        </p>
        
        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          {item.track} · {item.horse}
        </p>
      </div>
    );
  }

  if (item.type === 'status') {
    return (
      <div 
        className="rounded-lg p-4 border"
        style={{ 
          background: '#0f1729', 
          borderColor: '#1f2d40',
          borderLeft: '3px solid #00a86b'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#00a86b20', color: '#00a86b' }}>
            🔴 Race Update
          </span>
          <span className="text-xs text-muted-foreground">8m ago</span>
        </div>
        
        {/* Body */}
        <p className="text-sm text-foreground mb-2">
          <span className="font-semibold">{item.horse}</span> is now <span className="text-bet-yes font-bold">LIVE</span> at {item.track}.
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Betting closes at race start. Current YES probability: <span className="text-foreground font-semibold">{item.probability}%</span>
        </p>
        
        {/* CTA */}
        <a href="/" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: '#00a86b' }}>
          View Market →
        </a>
      </div>
    );
  }

  if (item.type === 'payout') {
    return (
      <div 
        className="rounded-lg p-4 border"
        style={{ 
          background: '#1a2235', 
          borderColor: '#1f2d40',
          borderLeft: '3px solid #d4af37'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#d4af3720', color: '#d4af37' }}>
            🏆 Payout
          </span>
          <span className="text-xs text-muted-foreground">{item.time}</span>
        </div>
        
        {/* Body */}
        <p className="text-sm text-foreground mb-2">
          <span className="font-semibold">{item.name}...</span> claimed{' '}
          <span className="font-bold" style={{ color: '#d4af37' }}>€{item.amount?.toFixed(2)}</span> winnings from{' '}
          <span className="font-semibold">{item.horse}</span>
        </p>
        
        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          At {item.track} · YES resolved ✓ ·{' '}
          <span className="text-bet-yes font-semibold">+€{item.profit?.toFixed(2)} profit (+{item.profitPct}%)</span>
        </p>
      </div>
    );
  }

  return null;
};

export default Activity;
