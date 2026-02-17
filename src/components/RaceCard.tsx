import { useState, useEffect } from 'react';
import { Clock, MapPin, Share2, Users, TrendingUp, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lamportsToSol } from '@/lib/solana';
import type { Race } from '@/lib/supabase';
import BetModal from './BetModal';

interface RaceCardProps {
  race: Race;
  onBetPlaced?: () => void;
}

const RaceCard = ({ race, onBetPlaced }: RaceCardProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  const yesPool = race.yes_pool || 0;
  const noPool = race.no_pool || 0;
  const totalPool = yesPool + noPool;
  const yesPercentage = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;
  const noPercentage = totalPool > 0 ? (noPool / totalPool) * 100 : 50;

  // Calculate countdown to race time
  useEffect(() => {
    const updateCountdown = () => {
      if (race.status === 'live') {
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
  }, [race.race_time, race.status]);

  const handleBetClick = (prediction: 'yes' | 'no') => {
    setSelectedPrediction(prediction);
    setBetModalOpen(true);
  };

  const handleShareBlink = async () => {
    // Build the Solana Action URL via dial.to
    const actionUrl = `https://auenoohozdpzcuxjseob.supabase.co/functions/v1/race-action?raceId=${race.id}`;
    const blinksUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;
    try {
      await navigator.clipboard.writeText(blinksUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatRaceTime = (raceTime: string) => {
    const date = new Date(raceTime);
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate odds (if pool is 0, default to 2x)
  const yesOdds = yesPool > 0 ? (totalPool / yesPool) : 2;
  const noOdds = noPool > 0 ? (totalPool / noPool) : 2;

  return (
    <>
      <div className="betting-slip rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{race.track_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatRaceTime(race.race_time)}</span>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            race.status === 'live' 
              ? 'bg-destructive/10 text-destructive animate-pulse-live' 
              : race.status === 'settled'
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary'
          }`}>
            {race.status === 'live' ? '🔴 LIVE' : race.status === 'settled' ? 'SETTLED' : countdown}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl animate-horse">🐎</span>
            <h3 className="text-xl font-bold text-foreground">{race.horse_name}</h3>
            {race.onchain_race_id && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                <Zap className="w-3 h-3" />
                On-chain
              </span>
            )}
          </div>
          <p className="text-base text-muted-foreground font-medium">{race.question}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              Total Pool
            </span>
            <span className="font-bold text-gradient-gold">
              {lamportsToSol(totalPool).toFixed(2)} SOL
            </span>
          </div>
          
          <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
            <div 
              className="absolute left-0 top-0 h-full bg-bet-yes transition-all duration-500"
              style={{ width: `${yesPercentage}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-bet-no transition-all duration-500"
              style={{ width: `${noPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-bet-yes font-medium">YES {yesPercentage.toFixed(0)}%</span>
            <span className="text-bet-no font-medium">NO {noPercentage.toFixed(0)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bet-yes/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-bet-yes" />
              <span className="text-xs text-bet-yes font-medium">YES Odds</span>
            </div>
            <span className="text-lg font-bold text-bet-yes">
              {yesOdds.toFixed(2)}x
            </span>
          </div>
          <div className="bg-bet-no/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-bet-no" />
              <span className="text-xs text-bet-no font-medium">NO Odds</span>
            </div>
            <span className="text-lg font-bold text-bet-no">
              {noOdds.toFixed(2)}x
            </span>
          </div>
        </div>

        {race.status === 'settled' && race.result && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            race.result === 'yes' ? 'bg-bet-yes/20' : 'bg-bet-no/20'
          }`}>
            <span className="font-bold text-lg">
              {race.result === 'yes' ? '✅ YES Won!' : '❌ NO Won!'}
            </span>
          </div>
        )}

        {race.status !== 'settled' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              onClick={() => handleBetClick('yes')}
              disabled={!race.onchain_race_id}
              className="bg-bet-yes hover:bg-bet-yes/90 text-bet-yes-foreground font-bold py-6 text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              BET YES
            </Button>
            <Button
              onClick={() => handleBetClick('no')}
              disabled={!race.onchain_race_id}
              className="bg-bet-no hover:bg-bet-no/90 text-bet-no-foreground font-bold py-6 text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              BET NO
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleShareBlink}
          className="w-full border-primary/30 text-primary hover:bg-primary/5"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Blink Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Share Blink
            </>
          )}
        </Button>
      </div>

      <BetModal
        open={betModalOpen}
        onClose={() => setBetModalOpen(false)}
        race={race}
        prediction={selectedPrediction}
        onBetPlaced={onBetPlaced}
      />
    </>
  );
};

export default RaceCard;