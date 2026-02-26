import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Coins, Shield, Menu, X } from 'lucide-react';
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
        } catch {
          // silently fail
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
    { path: '/', label: 'Markets' },
    { path: '/dashboard', label: 'Portfolio' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/activity', label: 'Activity' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: '#0f0f0f', borderBottom: '1px solid #2a2a2a' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-sm"
              style={{ background: '#00a86b' }}
            >
              🍀
            </div>
            <span className="font-bold text-foreground text-sm hidden sm:block">
              Sláinte <span style={{ color: '#00a86b' }}>Races</span>
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-foreground bg-elevated'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {connected && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <Coins className="w-3.5 h-3.5" style={{ color: '#00a86b' }} />
                <span className="font-semibold text-foreground tabular-nums">
                  {solBalance.toFixed(3)}
                </span>
                <span className="text-muted-foreground text-xs">SOL</span>
              </div>
            )}

            <WalletMultiButton />

            {connected && (
              <Link
                to="/admin"
                className="hidden md:flex items-center p-2 rounded transition-colors text-muted-foreground hover:text-foreground"
                style={{ border: '1px solid #2a2a2a', background: '#1a1a1a' }}
                title="Admin"
              >
                <Shield className="w-4 h-4" />
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-border animate-fade-in">
            {connected && (
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <Coins className="w-3.5 h-3.5" style={{ color: '#00a86b' }} />
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {solBalance.toFixed(3)} SOL
                </span>
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-elevated text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {connected && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
