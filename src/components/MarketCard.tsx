import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Users, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { lamportsToSol } from '@/lib/solana';
import type { Race } from '@/lib/supabase';
import BetModal from './BetModal';
import BlinkPreviewModal from './BlinkPreviewModal';

interface MarketCardProps {
  race: Race;
  onBetPlaced?: () => void;
  index?: number;
}

// Hardcoded chart data for demo
const chartDataMap: Record<string, Array<{ t: string; y: number }>> = {
  'Fastnet Rock': [
    { t: '9am', y: 50 }, { t: '10am', y: 52 }, { t: '11am', y: 51 }, { t: '12pm', y: 55 },
    { t: '1pm', y: 58 }, { t: '2pm', y: 61 }, { t: '3pm', y: 65 }, { t: '4pm', y: 63 },
    { t: '5pm', y: 68 }, { t: '6pm', y: 71 }, { t: 'now', y: 73 }
  ],
  'Tiger Roll': [
    { t: '9am', y: 48 }, { t: '10am', y: 49 }, { t: '11am', y: 51 }, { t: '12pm', y: 50 },
    { t: '1pm', y: 52 }, { t: '2pm', y: 51 }, { t: '3pm', y: 53 }, { t: '4pm', y: 54 },
    { t: '5pm', y: 55 }, { t: '6pm', y: 54 }, { t: 'now', y: 55 }
  ],
  'Ruby Walsh': [
    { t: '9am', y: 62 }, { t: '10am', y: 61 }, { t: '11am', y: 58 }, { t: '12pm', y: 56 },
    { t: '1pm', y: 53 }, { t: '2pm', y: 50 }, { t: '3pm', y: 47 }, { t: '4pm', y: 44 },
    { t: '5pm', y: 42 }, { t: '6pm', y: 41 }, { t: 'now', y: 40 }
  ],
};

const MarketCard = ({ race, onBetPlaced, index = 0 }: MarketCardProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [blinkModalOpen, setBlinkModalOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  const yesPool = race.yes_pool || 0;
  const noPool = race.no_pool || 0;
  const totalPool = yesPool + noPool;
  
  // Hardcoded probabilities for demo
  let yesPercentage = 50;
  let noPercentage = 50;
  
  if (race.horse_name === 'Fastnet Rock') {
    yesPercentage = 73;
    noPercentage = 27;
  } else if (race.horse_name === 'Tiger Roll') {
    yesPercentage = 55;
    noPercentage = 45;
  } else if (race.horse_name === 'Ruby Walsh' || race.horse_name === 'Istabraq') {
    yesPercentage = 40;
    noPercentage = 60;
  } else if (totalPool > 0) {
    yesPercentage = Math.round((yesPool / totalPool) * 100);
    noPercentage = 100 - yesPercentage;
  }
  
  // Hardcoded volume for demo
  let volumeEuros = 0;
  if (race.horse_name === 'Fastnet Rock') {
    volumeEuros = 4270;
  } else if (race.horse_name === 'Tiger Roll') {
    volumeEuros = 2890;
  } else if (race.horse_name === 'Ruby Walsh' || race.horse_name === 'Istabraq') {
    volumeEuros = 1650;
  }
  
  // Force Fastnet Rock to be live
  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';

  // Calculate share prices (probability in cents)
  const yesPrice = (yesPercentage / 100).toFixed(2);
  const noPrice = (noPercentage / 100).toFixed(2);

  // Get chart data
  const chartData = chartDataMap[race.horse_name] || chartDataMap['Tiger Roll'];
  const priceChange = chartData[chartData.length - 1].y - chartData[0].y;
  const priceChangePercent = ((priceChange / chartData[0].y) * 100).toFixed(0);
  const isPositive = priceChange > 0;

  // Calculate countdown to race time
  useEffect(() => {
    const updateCountdown = () => {
      // Force Fastnet Rock to show LIVE NOW
      if (race.horse_name === 'Fastnet Rock' || race.status === 'live') {
        setCountdown('LIVE NOW');
        return;
      }
      
      if (race.status === 'settled') {
        setCountdown('SETTLED');
        return;
      }

      const raceTime = new Date(race.race_time).getTime();
      const now = Date.now();
      const diff = raceTime - now;

      if (diff <= 0) {
        setCountdown('Starting...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [race.race_time, race.status, race.horse_name]);

  const handleBuyClick = (prediction: 'yes' | 'no') => {
    setSelectedPrediction(prediction);
    setBetModalOpen(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="betting-slip rounded-lg p-5 card-hover"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold bg-destructive/10 text-destructive animate-pulse-live">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              🔴 LIVE
            </span>
          )}
          {!isLive && race.status === 'upcoming' && (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-muted/30 text-muted-foreground">
              <Clock className="w-3 h-3" />
              Starting Soon
            </span>
          )}
          <div className="text-xs text-muted-foreground ml-auto">
            {race.track_name} · {new Date(race.race_time).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Question */}
        <h3 className="text-base font-semibold text-foreground mb-4 leading-snug">
          {race.question}
        </h3>

        {/* Probability Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-bet-yes uppercase tracking-wider">YES</span>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground tabular-nums">{yesPercentage}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {yesPercentage >= 50 ? 'YES' : 'NO'} Leading
              </div>
            </div>
            <span className="text-xs font-bold text-bet-no uppercase tracking-wider">NO</span>
          </div>

          {/* Probability Bar */}
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#1f2d40' }}>
            <div
              className="absolute left-0 top-0 h-full bg-bet-yes probability-bar"
              style={{ width: `${yesPercentage}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-bet-no probability-bar"
              style={{ width: `${noPercentage}%` }}
            />
            <div className="absolute left-1/2 top-0 w-px h-full bg-foreground/30" />
          </div>

          {/* Share Prices */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-bet-yes">{yesPrice}¢/share</span>
            <span className="text-sm font-semibold text-bet-no">{noPrice}¢/share</span>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="mb-4 -mx-2">
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${race.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00a86b" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00a86b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    return (
                      <div className="bg-elevated border border-border rounded px-2 py-1 text-xs">
                        <div className="font-semibold text-foreground">{payload[0].value}%</div>
                        <div className="text-muted-foreground text-[10px]">{payload[0].payload.t}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#00a86b"
                strokeWidth={2}
                dot={false}
                fill={`url(#gradient-${race.id})`}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="flex items-center justify-center mt-1">
            <span className={`text-xs font-semibold ${isPositive ? 'text-price-up' : 'text-price-down'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(parseInt(priceChangePercent))}% today
            </span>
          </div>
        </div>

        {/* Market Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-1">
            <span className="font-mono">€{volumeEuros > 0 ? volumeEuros.toLocaleString() : lamportsToSol(totalPool).toFixed(0)}</span>
            <span>volume</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{Math.floor(Math.random() * 200) + 50} positions</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{isPositive ? '+' : ''}{priceChangePercent}% 24h</span>
          </div>
        </div>

        {/* Buy Buttons */}
        {race.status !== 'settled' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              onClick={() => handleBuyClick('yes')}
              disabled={!race.onchain_race_id}
              className="bg-bet-yes hover:bg-bet-yes/90 text-bet-yes-foreground font-bold py-6 text-sm transition-all hover:scale-[1.02]"
            >
              BUY YES {yesPrice}¢
            </Button>
            <Button
              onClick={() => handleBuyClick('no')}
              disabled={!race.onchain_race_id}
              className="bg-bet-no hover:bg-bet-no/90 text-bet-no-foreground font-bold py-6 text-sm transition-all hover:scale-[1.02]"
            >
              BUY NO {noPrice}¢
            </Button>
          </div>
        )}

        {race.status === 'settled' && race.result && (
          <div className={`mb-4 p-3 rounded-lg text-center font-bold ${
            race.result === 'yes' ? 'bg-bet-yes/20 text-bet-yes' : 'bg-bet-no/20 text-bet-no'
          }`}>
            {race.result === 'yes' ? '✅ YES Resolved' : '❌ NO Resolved'}
          </div>
        )}

        {/* Accordion Sections */}
        <div className="space-y-2">
          {/* Form Guide */}
          <button
            onClick={() => toggleSection('form')}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>🐎</span>
              Form Guide
            </span>
            {expandedSection === 'form' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expandedSection === 'form' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/20 rounded p-3 text-xs space-y-2"
            >
              <div className="font-semibold text-foreground">{race.horse_name}</div>
              <div className="text-muted-foreground">
                Last 5: <span className="text-bet-yes">1st</span> · <span className="text-bet-yes">1st</span> · <span className="text-secondary">3rd</span> · <span className="text-muted">2nd</span> · <span className="text-bet-yes">1st</span>
              </div>
              <div className="text-muted-foreground">
                At {race.track_name}: 3 wins from 4 starts ⭐
              </div>
            </motion.div>
          )}

          {/* Market Analysis */}
          <button
            onClick={() => toggleSection('analysis')}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>📈</span>
              Market Analysis
            </span>
            {expandedSection === 'analysis' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expandedSection === 'analysis' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/20 rounded p-3 text-xs space-y-2"
            >
              <div className="text-muted-foreground">
                Smart money moved in at 1pm — YES jumped 7% in 20 minutes
              </div>
              <div className="text-muted-foreground">
                {yesPercentage + 8}% of large positions (&gt;€50) are on YES
              </div>
            </motion.div>
          )}

          {/* Share Blink */}
          <button
            onClick={() => setBlinkModalOpen(true)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3" />
              Share Blink
            </span>
            <span className="text-racing-green">→</span>
          </button>
        </div>
      </motion.div>

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