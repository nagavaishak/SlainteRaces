import { useState, useEffect } from 'react';
import { Clock, Share2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { lamportsToSol } from '@/lib/solana';
import type { Race } from '@/lib/supabase';
import BetModal from './BetModal';
import BlinkPreviewModal from './BlinkPreviewModal';

const chartDataMap: Record<string, Array<{ t: string; y: number }>> = {
  'Fastnet Rock': [
    { t: '9am', y: 50 }, { t: '10am', y: 52 }, { t: '11am', y: 55 },
    { t: '12pm', y: 58 }, { t: '1pm', y: 61 }, { t: '2pm', y: 65 },
    { t: '3pm', y: 68 }, { t: '4pm', y: 70 }, { t: 'now', y: 73 },
  ],
  'Tiger Roll': [
    { t: '9am', y: 50 }, { t: '10am', y: 51 }, { t: '11am', y: 53 },
    { t: '12pm', y: 52 }, { t: '1pm', y: 54 }, { t: '2pm', y: 53 },
    { t: '3pm', y: 55 }, { t: '4pm', y: 54 }, { t: 'now', y: 55 },
  ],
  'Ruby Walsh': [
    { t: '9am', y: 60 }, { t: '10am', y: 58 }, { t: '11am', y: 55 },
    { t: '12pm', y: 52 }, { t: '1pm', y: 49 }, { t: '2pm', y: 46 },
    { t: '3pm', y: 43 }, { t: '4pm', y: 41 }, { t: 'now', y: 40 },
  ],
  'Istabraq': [
    { t: '9am', y: 60 }, { t: '10am', y: 57 }, { t: '11am', y: 54 },
    { t: '12pm', y: 51 }, { t: '1pm', y: 48 }, { t: '2pm', y: 46 },
    { t: '3pm', y: 43 }, { t: '4pm', y: 41 }, { t: 'now', y: 40 },
  ],
};

const getChartData = (horse_name: string) =>
  chartDataMap[horse_name] ?? [
    { t: '9am', y: 50 }, { t: '12pm', y: 50 }, { t: 'now', y: 50 },
  ];

interface MarketCardProps {
  race: Race;
  onBetPlaced?: () => void;
  index?: number;
}

const getProbabilities = (race: Race) => {
  const yesPool = race.yes_pool || 0;
  const noPool = race.no_pool || 0;
  const totalPool = yesPool + noPool;

  // Hardcoded demo probabilities
  if (race.horse_name === 'Fastnet Rock') return { yes: 73, no: 27 };
  if (race.horse_name === 'Tiger Roll') return { yes: 55, no: 45 };
  if (race.horse_name === 'Ruby Walsh' || race.horse_name === 'Istabraq') return { yes: 40, no: 60 };
  if (totalPool > 0) {
    const yes = Math.round((yesPool / totalPool) * 100);
    return { yes, no: 100 - yes };
  }
  return { yes: 50, no: 50 };
};

const getDemoVolume = (race: Race) => {
  const yesPool = race.yes_pool || 0;
  const noPool = race.no_pool || 0;
  if (race.horse_name === 'Fastnet Rock') return 4270;
  if (race.horse_name === 'Tiger Roll') return 2890;
  if (race.horse_name === 'Ruby Walsh' || race.horse_name === 'Istabraq') return 1650;
  return Math.round(lamportsToSol(yesPool + noPool) * 100) / 100;
};

const get24hChange = (horse_name: string) => {
  if (horse_name === 'Fastnet Rock') return +23;
  if (horse_name === 'Tiger Roll') return +7;
  if (horse_name === 'Ruby Walsh' || horse_name === 'Istabraq') return -20;
  return 0;
};

const MarketCard = ({ race, onBetPlaced, index = 0 }: MarketCardProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [blinkModalOpen, setBlinkModalOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);
  const [countdown, setCountdown] = useState('');

  const { yes: yesPercentage, no: noPercentage } = getProbabilities(race);
  const volume = getDemoVolume(race);
  const change24h = get24hChange(race.horse_name);
  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';
  const isSettled = race.status === 'settled';

  useEffect(() => {
    const updateCountdown = () => {
      if (isLive) { setCountdown('LIVE'); return; }
      if (isSettled) { setCountdown('Settled'); return; }

      const raceTime = new Date(race.race_time).getTime();
      const diff = raceTime - Date.now();

      if (diff <= 0) { setCountdown('Starting...'); return; }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [race.race_time, isLive, isSettled]);

  const handleBuyClick = (prediction: 'yes' | 'no') => {
    setSelectedPrediction(prediction);
    setBetModalOpen(true);
  };

  const volumeDisplay = typeof volume === 'number' && volume >= 1
    ? `€${volume.toLocaleString()}`
    : `${lamportsToSol((race.yes_pool || 0) + (race.no_pool || 0)).toFixed(2)} SOL`;

  return (
    <>
      <div
        className="market-card card-hover rounded-lg flex flex-col"
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          animationDelay: `${index * 40}ms`,
        }}
      >
        {/* Card Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#ff5152' }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse-live"
                    style={{ background: '#ff5152', display: 'inline-block' }}
                  />
                  LIVE
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: '#00a86b15', color: '#00a86b', border: '1px solid #00a86b30' }}
                  title="Bets routed via MagicBlock Ephemeral Rollup — ~10ms latency"
                >
                  ⚡ ER
                </span>
              </div>
            )}
            {!isLive && !isSettled && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {countdown || 'Upcoming'}
              </span>
            )}
            {isSettled && (
              <span className="text-xs text-muted-foreground">Settled</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{race.track_name}</span>
        </div>

        {/* Question */}
        <div className="px-4 py-4 flex-1">
          <p className="text-sm font-medium text-foreground leading-snug mb-5">
            {race.question}
          </p>

          {/* Price Display — Kalshi style */}
          <div className="flex items-stretch gap-2 mb-3">
            <div className="flex-1 text-center py-2.5 rounded" style={{ background: '#00a86b18' }}>
              <div className="text-2xl font-bold tabular-nums" style={{ color: '#00a86b' }}>
                {yesPercentage}¢
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: '#00a86b' }}>YES</div>
            </div>
            <div className="flex-1 text-center py-2.5 rounded" style={{ background: '#ff515218' }}>
              <div className="text-2xl font-bold tabular-nums" style={{ color: '#ff5152' }}>
                {noPercentage}¢
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: '#ff5152' }}>NO</div>
            </div>
          </div>

          {/* Split bar */}
          <div className="h-1 rounded-full overflow-hidden flex" style={{ background: '#2a2a2a' }}>
            <div
              className="h-full probability-bar"
              style={{ width: `${yesPercentage}%`, background: '#00a86b' }}
            />
            <div
              className="h-full probability-bar"
              style={{ width: `${noPercentage}%`, background: '#ff5152' }}
            />
          </div>

          {/* Sparkline chart */}
          {(() => {
            const chartData = getChartData(race.horse_name);
            const isUp = change24h >= 0;
            const lineColor = isUp ? '#00a86b' : '#ff5152';
            const gradientId = `grad-${race.id ?? race.horse_name.replace(/\s/g, '')}`;
            return (
              <div className="mt-3 -mx-1" style={{ height: 56 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, fontSize: 11, padding: '4px 8px' }}
                      itemStyle={{ color: lineColor }}
                      labelStyle={{ color: '#666', fontSize: 10 }}
                      formatter={(v: number) => [`${v}¢`, 'YES']}
                    />
                    <Area
                      type="monotone"
                      dataKey="y"
                      stroke={lineColor}
                      strokeWidth={1.5}
                      fill={`url(#${gradientId})`}
                      dot={false}
                      activeDot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* Stats footer */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              Vol: <span className="text-foreground">{volumeDisplay}</span>
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${change24h >= 0 ? 'text-price-up' : 'text-price-down'}`}
            >
              {change24h >= 0 ? '+' : ''}{change24h}% 24h
            </span>
          </div>
        </div>

        {/* Card Footer — action buttons */}
        {!isSettled ? (
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => handleBuyClick('yes')}
              disabled={!race.onchain_race_id}
              className="flex-1 py-2.5 rounded text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: '#00a86b', color: '#fff' }}
            >
              Buy YES
            </button>
            <button
              onClick={() => handleBuyClick('no')}
              disabled={!race.onchain_race_id}
              className="flex-1 py-2.5 rounded text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: '#ff5152', color: '#fff' }}
            >
              Buy NO
            </button>
            <button
              onClick={() => setBlinkModalOpen(true)}
              className="p-2.5 rounded transition-colors text-muted-foreground hover:text-foreground"
              style={{ border: '1px solid #2a2a2a' }}
              title="Share Blink"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        ) : race.result ? (
          <div className="px-4 pb-4">
            <div
              className="py-2 rounded text-center text-sm font-bold"
              style={
                race.result === 'yes'
                  ? { background: '#00a86b18', color: '#00a86b' }
                  : { background: '#ff515218', color: '#ff5152' }
              }
            >
              {race.result === 'yes' ? '✓ YES Resolved' : '✗ NO Resolved'}
            </div>
          </div>
        ) : null}
      </div>

      <BetModal
        open={betModalOpen}
        onClose={() => setBetModalOpen(false)}
        race={race}
        prediction={selectedPrediction}
        onBetPlaced={onBetPlaced}
      />

      <BlinkPreviewModal
        open={blinkModalOpen}
        onClose={() => setBlinkModalOpen(false)}
        race={race}
      />
    </>
  );
};

export default MarketCard;
