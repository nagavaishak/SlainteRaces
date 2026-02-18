import { useState } from 'react';
import { Loader2, Droplets, Search, LayoutGrid, List, Zap } from 'lucide-react';
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

// ─── Main page ────────────────────────────────────────────────────────────────
const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAirdropping, setIsAirdropping] = useState(false);
  const { races, loading, refresh } = useRaces();
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();

  const handleConnectClick = () => {
    const walletBtn = document.querySelector('.wallet-adapter-button') as HTMLButtonElement;
    if (walletBtn) walletBtn.click();
  };

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

      {/* Connect wallet banner */}
      {!connected && (
        <div style={{ background: '#00a86b0c', borderBottom: '1px solid #00a86b28' }}>
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              🍀 Ireland's first on-chain prediction market — connect to trade
            </p>
            <div className="flex-shrink-0">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Markets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Irish horse racing · Solana Devnet</p>
          </div>
          {connected && (
            <Button
              onClick={handleAirdrop}
              disabled={isAirdropping}
              variant="outline"
              size="sm"
              className="text-xs self-start sm:self-auto"
            >
              {isAirdropping ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Droplets className="w-3 h-3 mr-1" />}
              Get SOL
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="relative px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={
                  activeFilter === tab.key
                    ? { background: '#2a2a2a', color: '#f1f5f9' }
                    : { color: '#888888' }
                }
              >
                {tab.key === 'live' && (
                  <span
                    className="absolute top-1 right-1 w-1 h-1 rounded-full animate-pulse-live"
                    style={{ background: '#ff5152' }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
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

          {/* View toggle */}
          <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 transition-colors"
              style={viewMode === 'grid' ? { background: '#2a2a2a', color: '#f1f5f9' } : { color: '#888888' }}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 transition-colors"
              style={viewMode === 'list' ? { background: '#2a2a2a', color: '#f1f5f9' } : { color: '#888888' }}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Markets */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-racing-green" />
          </div>
        ) : filteredRaces.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-3">🐎</p>
            <h3 className="text-base font-semibold text-foreground mb-1">No markets found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search' : 'Check back later for upcoming races'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRaces.map((race, i) =>
              connected ? (
                <MarketCard key={race.id} race={race} onBetPlaced={refresh} index={i} />
              ) : (
                <ReadOnlyMarketCard key={race.id} race={race} index={i} onConnect={handleConnectClick} />
              )
            )}
          </div>
        ) : (
          /* List view */
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Track</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">YES</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">NO</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  {connected && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trade</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRaces.map((race, i) => (
                  <ListMarketRow key={race.id} race={race} connected={connected} onBetPlaced={refresh} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

// ─── Read-only card for non-connected users ───────────────────────────────────
interface ReadOnlyProps {
  race: Race;
  index: number;
  onConnect: () => void;
}

const ReadOnlyMarketCard = ({ race, onConnect }: ReadOnlyProps) => {
  const { yes, no } = getProbs(race);
  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';

  return (
    <div
      className="card-hover rounded-lg flex flex-col"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
    >
      <div
        className="px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #2a2a2a' }}
      >
        {isLive ? (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#ff5152' }}>
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-live inline-block"
              style={{ background: '#ff5152' }}
            />
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
  connected: boolean;
  onBetPlaced?: () => void;
  index: number;
}

const ListMarketRow = ({ race, connected, onBetPlaced }: ListRowProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);

  const { yes, no } = getProbs(race);
  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';

  const handleBuy = (pred: 'yes' | 'no') => {
    setSelectedPrediction(pred);
    setBetModalOpen(true);
  };

  return (
    <>
      <tr
        className="transition-colors hover:bg-elevated/40"
        style={{ borderBottom: '1px solid #2a2a2a' }}
      >
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground leading-snug max-w-[280px]">{race.question}</p>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap hidden sm:table-cell">
          {race.track_name}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold tabular-nums" style={{ color: '#00a86b' }}>{yes}¢</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold tabular-nums" style={{ color: '#ff5152' }}>{no}¢</span>
        </td>
        <td className="px-4 py-3 text-right">
          {isLive ? (
            <span className="text-xs font-semibold" style={{ color: '#ff5152' }}>● LIVE</span>
          ) : race.status === 'settled' ? (
            <span className="text-xs text-muted-foreground">Settled</span>
          ) : (
            <span className="text-xs text-muted-foreground">Upcoming</span>
          )}
        </td>
        {connected && (
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleBuy('yes')}
                disabled={!race.onchain_race_id}
                className="px-2.5 py-1 rounded text-xs font-bold disabled:opacity-40 hover:opacity-80 transition-opacity"
                style={{ background: '#00a86b20', color: '#00a86b', border: '1px solid #00a86b40' }}
              >
                YES
              </button>
              <button
                onClick={() => handleBuy('no')}
                disabled={!race.onchain_race_id}
                className="px-2.5 py-1 rounded text-xs font-bold disabled:opacity-40 hover:opacity-80 transition-opacity"
                style={{ background: '#ff515220', color: '#ff5152', border: '1px solid #ff515240' }}
              >
                NO
              </button>
            </div>
          </td>
        )}
      </tr>

      {connected && (
        <BetModal
          open={betModalOpen}
          onClose={() => setBetModalOpen(false)}
          race={race}
          prediction={selectedPrediction}
          onBetPlaced={onBetPlaced}
        />
      )}
    </>
  );
};

export default Index;
