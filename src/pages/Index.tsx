import { useState } from 'react';
import { Loader2, Droplets, Search, LayoutGrid, List, Zap, ArrowRight } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import MarketCard from '@/components/MarketCard';
import BetModal from '@/components/BetModal';
import { useRaces } from '@/hooks/useRaces';
import { requestAirdrop } from '@/lib/solana';
import { useToast } from '@/hooks/use-toast';
import type { Race } from '@/lib/supabase';

type FilterTab = 'all' | 'live' | 'upcoming' | 'settled';

// ─── Probability helper ───────────────────────────────────────────────────────
const getProbs = (race: Race) => {
  if (race.horse_name === 'Fastnet Rock') return { yes: 73, no: 27 };
  if (race.horse_name === 'Tiger Roll') return { yes: 55, no: 45 };
  if (race.horse_name === 'Ruby Walsh' || race.horse_name === 'Istabraq') return { yes: 40, no: 60 };
  const yesPool = race.yes_pool || 0;
  const noPool = race.no_pool || 0;
  const total = yesPool + noPool;
  if (total > 0) {
    const yes = Math.round((yesPool / total) * 100);
    return { yes, no: 100 - yes };
  }
  return { yes: 50, no: 50 };
};

// ─── Landing page (not connected) ────────────────────────────────────────────
const LandingPage = () => {
  const { races, loading } = useRaces();

  const handleConnectClick = () => {
    const btn = document.querySelector('.wallet-adapter-button') as HTMLButtonElement;
    if (btn) btn.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header style={{ background: 'rgba(15,15,15,0.85)', borderBottom: '1px solid #2a2a2a', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center text-sm" style={{ background: '#00a86b' }}>🍀</div>
              <span className="font-bold text-foreground text-sm">
                Sláinte <span style={{ color: '#00a86b' }}>Races</span>
              </span>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col min-h-[88vh]">
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Dark overlay — strong at top and bottom, lighter in middle */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15,15,15,0.92) 0%, rgba(15,15,15,0.60) 40%, rgba(15,15,15,0.80) 75%, rgba(15,15,15,1) 100%)',
          }}
        />
        {/* Green tint */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 15% 60%, rgba(0,168,107,0.12) 0%, transparent 55%)' }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
            style={{ border: '1px solid #00a86b40', background: '#00a86b10', color: '#00a86b' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-live inline-block" style={{ background: '#00a86b' }} />
            Live on Solana Devnet · Ireland's First
          </div>

          {/* Headline */}
          <h1
            className="font-extrabold text-foreground leading-tight mb-5"
            style={{ fontSize: 'clamp(36px, 7vw, 68px)', maxWidth: '800px' }}
          >
            Ireland's{' '}
            <span style={{
              background: 'linear-gradient(90deg, #00a86b, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Prediction Market
            </span>
          </h1>

          {/* Sub */}
          <p
            className="text-muted-foreground mb-10 leading-relaxed"
            style={{ fontSize: '17px', maxWidth: '500px' }}
          >
            Trade horse race outcomes on-chain. Parimutuel payouts, instant settlement, no bookmaker.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            {/* Hidden real wallet button */}
            <div className="hidden"><WalletMultiButton /></div>
            <button
              onClick={handleConnectClick}
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold text-white transition-all hover:opacity-90"
              style={{ background: '#00a86b', fontSize: '15px', boxShadow: '0 0 32px rgba(0,168,107,0.35)' }}
            >
              Connect Wallet
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#markets"
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-foreground transition-all hover:bg-white/5"
              style={{ border: '1px solid #2a2a2a', fontSize: '15px' }}
            >
              View Markets
            </a>
          </div>

          {/* Trust row */}
          <div className="flex items-center gap-5 flex-wrap justify-center" style={{ color: '#555', fontSize: '13px' }}>
            <span>🔒 Non-custodial</span>
            <span style={{ color: '#2a2a2a' }}>·</span>
            <span>⚡ Instant settlement</span>
            <span style={{ color: '#2a2a2a' }}>·</span>
            <span>🇮🇪 Built for Ireland</span>
          </div>
        </div>

        {/* Stats strip at bottom of hero */}
        <div
          className="relative z-10 grid grid-cols-2 sm:grid-cols-4 divide-x"
          style={{ borderTop: '1px solid #2a2a2a', background: 'rgba(15,15,15,0.90)', backdropFilter: 'blur(8px)', divideColor: '#2a2a2a' }}
        >
          {[
            { label: 'Irish gambling market', value: '€5.5B' },
            { label: 'Crypto platforms before us', value: '0', accent: '#00a86b' },
            { label: 'Diaspora worldwide', value: '1.5M' },
            { label: 'Traders this week', value: '2,847' },
          ].map(s => (
            <div key={s.label} className="px-6 py-5 text-center" style={{ borderColor: '#2a2a2a' }}>
              <p className="text-2xl font-bold tabular-nums" style={s.accent ? { color: s.accent } : { color: '#f1f5f9' }}>
                {s.value}
              </p>
              <p className="text-xs mt-1" style={{ color: '#555' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live markets preview */}
      <section id="markets" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground">Live Markets</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Connect your wallet to trade</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-live inline-block" style={{ background: '#ff5152' }} />
              Live now
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-racing-green" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {races.map((race, i) => (
                <ReadOnlyMarketCard key={race.id} race={race} index={i} onConnect={() => {
                  const btn = document.querySelector('.wallet-adapter-button') as HTMLButtonElement;
                  if (btn) btn.click();
                }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16" style={{ borderTop: '1px solid #2a2a2a', background: '#0a0a0a' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-foreground mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Connect wallet', body: 'Phantom wallet. Your keys, your custody. No email, no KYC.', icon: '👛' },
              { num: '02', title: 'Buy YES or NO shares', body: 'Prices move with the market. Each cent = 1% probability.', icon: '📈' },
              { num: '03', title: 'Collect your payout', body: 'Winners split the losing pool after a 2.5% fee. Instant settlement.', icon: '🏆' },
            ].map(step => (
              <div
                key={step.num}
                className="relative rounded-lg p-5 overflow-hidden"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <span className="absolute -top-3 -right-1 text-6xl font-black pointer-events-none select-none" style={{ color: '#00a86b0d' }}>
                  {step.num}
                </span>
                <span className="text-2xl mb-4 block">{step.icon}</span>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center" style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-foreground mb-3">Ready to trade?</h2>
          <p className="text-sm text-muted-foreground mb-7">
            Connect your wallet and start trading Irish racing markets in seconds.
          </p>
          <button
            onClick={() => {
              const btn = document.querySelector('.wallet-adapter-button') as HTMLButtonElement;
              if (btn) btn.click();
            }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold text-white transition-all hover:opacity-90"
            style={{ background: '#00a86b', fontSize: '15px' }}
          >
            Connect Wallet <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>🍀</span>
            <span className="text-sm font-semibold text-foreground">Sláinte Races</span>
          </div>
          <p className="text-xs text-muted-foreground">Built on Solana. Trade responsibly. 18+</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-racing-green" />
            Devnet
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── Connected markets page ───────────────────────────────────────────────────
const MarketsPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAirdropping, setIsAirdropping] = useState(false);
  const { races, loading, refresh } = useRaces();
  const { publicKey } = useWallet();
  const { toast } = useToast();

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setIsAirdropping(true);
    try {
      await requestAirdrop(publicKey, 1);
      toast({ title: 'Airdrop successful!', description: '1 SOL added to your wallet (Devnet)' });
    } catch {
      toast({ title: 'Airdrop failed', description: 'Try again or use the Solana faucet.', variant: 'destructive' });
    } finally {
      setIsAirdropping(false);
    }
  };

  const filterRaces = (list: Race[]) => {
    let filtered = list;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => {
        if (activeFilter === 'live') return r.status === 'live' || r.horse_name === 'Fastnet Rock';
        if (activeFilter === 'upcoming') return r.status === 'upcoming' && r.horse_name !== 'Fastnet Rock';
        if (activeFilter === 'settled') return r.status === 'settled';
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.horse_name?.toLowerCase().includes(q) ||
          r.track_name?.toLowerCase().includes(q) ||
          r.question?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const filteredRaces = filterRaces(races);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'settled', label: 'Settled' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Markets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Irish horse racing · Solana Devnet</p>
          </div>
          <Button onClick={handleAirdrop} disabled={isAirdropping} variant="outline" size="sm" className="text-xs self-start sm:self-auto">
            {isAirdropping ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Droplets className="w-3 h-3 mr-1" />}
            Get SOL
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="relative px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={activeFilter === tab.key ? { background: '#2a2a2a', color: '#f1f5f9' } : { color: '#888888' }}
              >
                {tab.key === 'live' && (
                  <span className="absolute top-1 right-1 w-1 h-1 rounded-full animate-pulse-live" style={{ background: '#ff5152' }} />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-racing-green"
            />
          </div>

          <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
            <button onClick={() => setViewMode('grid')} className="p-1.5 transition-colors" style={viewMode === 'grid' ? { background: '#2a2a2a', color: '#f1f5f9' } : { color: '#888888' }} title="Grid">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className="p-1.5 transition-colors" style={viewMode === 'list' ? { background: '#2a2a2a', color: '#f1f5f9' } : { color: '#888888' }} title="List">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-racing-green" />
          </div>
        ) : filteredRaces.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-3">🐎</p>
            <h3 className="text-base font-semibold text-foreground mb-1">No markets found</h3>
            <p className="text-sm text-muted-foreground">{searchQuery ? 'Try a different search' : 'Check back later'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRaces.map((race, i) => (
              <MarketCard key={race.id} race={race} onBetPlaced={refresh} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Track</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">YES</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">NO</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trade</th>
                </tr>
              </thead>
              <tbody>
                {filteredRaces.map((race, i) => (
                  <ListMarketRow key={race.id} race={race} onBetPlaced={refresh} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2"><span>🍀</span><span className="text-sm font-semibold text-foreground">Sláinte Races</span></div>
          <p className="text-xs text-muted-foreground">Built on Solana. Trade responsibly. 18+</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="w-3 h-3 text-racing-green" />Devnet</div>
        </div>
      </footer>
    </div>
  );
};

// ─── Root component ───────────────────────────────────────────────────────────
const Index = () => {
  const { connected } = useWallet();
  return connected ? <MarketsPage /> : <LandingPage />;
};

// ─── Read-only card for landing page ─────────────────────────────────────────
interface ReadOnlyProps {
  race: Race;
  index: number;
  onConnect: () => void;
}

const ReadOnlyMarketCard = ({ race, onConnect }: ReadOnlyProps) => {
  const { yes, no } = getProbs(race);
  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';

  return (
    <div className="card-hover rounded-lg flex flex-col" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a2a' }}>
        {isLive ? (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#ff5152' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-live inline-block" style={{ background: '#ff5152' }} />
            LIVE
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Upcoming</span>
        )}
        <span className="text-xs text-muted-foreground">{race.track_name}</span>
      </div>
      <div className="px-4 py-4 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug mb-5">{race.question}</p>
        <div className="flex items-stretch gap-2 mb-3">
          <div className="flex-1 text-center py-2.5 rounded" style={{ background: '#00a86b18' }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color: '#00a86b' }}>{yes}¢</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#00a86b' }}>YES</div>
          </div>
          <div className="flex-1 text-center py-2.5 rounded" style={{ background: '#ff515218' }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color: '#ff5152' }}>{no}¢</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#ff5152' }}>NO</div>
          </div>
        </div>
        <div className="h-1 rounded-full overflow-hidden flex" style={{ background: '#2a2a2a' }}>
          <div className="h-full" style={{ width: `${yes}%`, background: '#00a86b' }} />
          <div className="h-full" style={{ width: `${no}%`, background: '#ff5152' }} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={onConnect}
          className="w-full py-2.5 rounded text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ border: '1px solid #2a2a2a', color: '#00a86b', background: 'transparent' }}
        >
          Connect wallet to trade →
        </button>
      </div>
    </div>
  );
};

// ─── List view row ────────────────────────────────────────────────────────────
interface ListRowProps {
  race: Race;
  onBetPlaced?: () => void;
  index: number;
}

const ListMarketRow = ({ race, onBetPlaced }: ListRowProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);
  const { yes, no } = getProbs(race);
  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';

  const handleBuy = (pred: 'yes' | 'no') => { setSelectedPrediction(pred); setBetModalOpen(true); };

  return (
    <>
      <tr className="transition-colors hover:bg-elevated/40" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground leading-snug max-w-[280px]">{race.question}</p>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap hidden sm:table-cell">{race.track_name}</td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold tabular-nums" style={{ color: '#00a86b' }}>{yes}¢</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold tabular-nums" style={{ color: '#ff5152' }}>{no}¢</span>
        </td>
        <td className="px-4 py-3 text-right">
          {isLive ? <span className="text-xs font-semibold" style={{ color: '#ff5152' }}>● LIVE</span>
            : race.status === 'settled' ? <span className="text-xs text-muted-foreground">Settled</span>
            : <span className="text-xs text-muted-foreground">Upcoming</span>}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={() => handleBuy('yes')} disabled={!race.onchain_race_id} className="px-2.5 py-1 rounded text-xs font-bold disabled:opacity-40 hover:opacity-80 transition-opacity" style={{ background: '#00a86b20', color: '#00a86b', border: '1px solid #00a86b40' }}>YES</button>
            <button onClick={() => handleBuy('no')} disabled={!race.onchain_race_id} className="px-2.5 py-1 rounded text-xs font-bold disabled:opacity-40 hover:opacity-80 transition-opacity" style={{ background: '#ff515220', color: '#ff5152', border: '1px solid #ff515240' }}>NO</button>
          </div>
        </td>
      </tr>
      <BetModal open={betModalOpen} onClose={() => setBetModalOpen(false)} race={race} prediction={selectedPrediction} onBetPlaced={onBetPlaced} />
    </>
  );
};

export default Index;
