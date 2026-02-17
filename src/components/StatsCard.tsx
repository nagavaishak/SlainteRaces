import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'gold';
}

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  variant = 'default'
}: StatsCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-primary text-primary-foreground';
      case 'gold':
        return 'bg-gradient-gold text-secondary-foreground';
      default:
        return 'bg-card text-foreground';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'primary':
      case 'gold':
        return 'bg-primary-foreground/20 text-inherit';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className={`rounded-xl p-5 shadow-card ${getVariantStyles()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${getIconStyles()}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-bet-yes/20 text-bet-yes' 
              : 'bg-bet-no/20 text-bet-no'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      
      <div>
        <p className={`text-sm font-medium mb-1 ${
          variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
        }`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${
          variant === 'gold' ? 'text-secondary-foreground' : ''
        }`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs mt-1 ${
            variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
