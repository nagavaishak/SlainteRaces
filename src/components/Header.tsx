import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Coins, LayoutDashboard, Trophy, Activity, Shield, Menu, X } from 'lucide-react';
import { getWalletBalance } from '@/lib/solana';

const Header = () => {
  const { connected, publicKey } = useWallet();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connected) {
        try {
          const balance = await getWalletBalance(publicKey);
          setSolBalance(balance);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      } else {
        setSolBalance(0);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected]);

  const navLinks = [
    { path: '/', label: 'Markets', icon: null },
    { path: '/dashboard', label: 'Portfolio', icon: LayoutDashboard },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/activity', label: 'Activity', icon: Activity },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-gradient-hero backdrop-blur-sm" style={{ background: '#0a0e17', borderBottom: '1px solid #1f2d40' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-racing-green flex items-center justify-center shadow-md">
              <span className="text-xl">🍀</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-foreground leading-tight">Sláinte Races</h1>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-muted-foreground">Irish Racing Markets</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-racing-green animate-pulse" />
                  <span className="text-[10px] text-racing-green font-medium">Devnet Live</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  isActive(link.path)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={isActive(link.path) ? { borderBottom: '2px solid #00a86b' } : {}}
              >
                <span className="flex items-center gap-2">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right: Balance + Wallet + Admin */}
          <div className="flex items-center gap-3">
            {connected && (
              <div className="hidden sm:flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-border">
                <Coins className="w-3.5 h-3.5 text-racing-green" />
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {solBalance.toFixed(4)}
                </span>
                <span className="text-xs text-muted-foreground">SOL</span>
              </div>
            )}

            <WalletMultiButton className="!bg-card !text-foreground hover:!bg-elevated !rounded-lg !h-9 !text-sm !font-medium" />

            {connected && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-secondary/50 transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-card"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            {connected && (
              <div className="flex items-center gap-2 px-4 py-2 mb-2">
                <Coins className="w-4 h-4 text-racing-green" />
                <span className="text-sm font-semibold text-foreground">
                  {solBalance.toFixed(4)} SOL
                </span>
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
            {connected && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;