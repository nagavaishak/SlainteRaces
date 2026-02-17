import { Clock, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { Bet } from '@/lib/mockData';

interface BetCardProps {
  bet: Bet;
}

const BetCard = ({ bet }: BetCardProps) => {
  const getStatusBadge = () => {
    switch (bet.status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Clock className="w-3 h-3" />
            Active
          </span>
        );
      case 'won':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-bet-yes/10 text-bet-yes">
            <CheckCircle2 className="w-3 h-3" />
            Won
          </span>
        );
      case 'lost':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-bet-no/10 text-bet-no">
            <XCircle className="w-3 h-3" />
            Lost
          </span>
        );
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className={`bg-card rounded-lg border p-4 transition-all hover:shadow-card ${
      bet.status === 'won' ? 'border-bet-yes/30 bg-bet-yes/5' : 
      bet.status === 'lost' ? 'border-bet-no/30 bg-bet-no/5' : 
      'border-border'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🐎</span>
            <h4 className="font-semibold text-foreground">{bet.horseName}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{bet.trackName}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            bet.prediction === 'yes' 
              ? 'bg-bet-yes/10 text-bet-yes' 
              : 'bg-bet-no/10 text-bet-no'
          }`}>
            {bet.prediction.toUpperCase()}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Coins className="w-3 h-3" />
            €{bet.amount}
          </div>
        </div>

        <div className="text-right">
          {bet.status === 'won' && bet.payout && (
            <p className="font-bold text-bet-yes">+€{bet.payout.toFixed(2)}</p>
          )}
          {bet.status === 'lost' && (
            <p className="font-medium text-bet-no">-��{bet.amount}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatTime(bet.timestamp)}</p>
        </div>
      </div>
    </div>
  );
};

export default BetCard;
