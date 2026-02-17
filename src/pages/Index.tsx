import { useState, useRef } from 'react';
import { Loader2, Droplets, Zap, ChevronDown, Link2, TrendingUp, Users, Clock, Wallet, BarChart3, Link as LinkIcon } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import MarketCard from '@/components/MarketCard';
import SwapModal from '@/components/SwapModal';
import { useRaces } from '@/hooks/useRaces';
import { requestAirdrop } from '@/lib/solana';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const Index = () => {
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const { races, loading, refresh } = useRaces();
  const { publicKey, connected, select, wallets } = useWallet();
  const { toast } = useToast();
  const walletButtonRef = useRef<HTMLButtonElement>(null);

  // Hardcoded demo stats
  const totalVolume = 124450;
  const totalTraders = 2847;
  const liveMarkets = 3;

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setIsAirdropping(true);
    try {
      await requestAirdrop(publicKey, 1);
      toast({
        title: 'Airdrop successful!',
        description: '1 SOL has been added to your wallet (Devnet)',
      });
    } catch (error) {
      toast({
        title: 'Airdrop failed',
        description: 'Please try again or use the Solana faucet.',
        variant: 'destructive'
      });
    } finally {
      setIsAirdropping(false);
    }
  };

  const handleConnectClick = () => {
    // Trigger the hidden wallet button
    const walletBtn = document.querySelector('.wallet-adapter-button') as HTMLButtonElement;
    if (walletBtn) {
      walletBtn.click();
    }
  };

  // Ticker tape content with horse emoji separators
  const tickerContent = "🐎 Séamus just backed Fastnet Rock YES at 73¢  🏇  🐳 Large position: 150 NO shares in Tiger Roll  🐎  📈 Fastnet Rock up +23% today  🏇  🏆 Aoife won €34.50 on Sea The Stars  🐎  Pádraig backed Tiger Roll NO at 45¢  🏇  ⚡ 2,847 traders active today  🐎  🍀 €124,450 in volume this week  🏇  ";

  // Mini sparkline data for step 2
  const miniSparklineData = [
    { y: 50 }, { y: 52 }, { y: 55 }, { y: 58 }, { y: 61 }, { y: 65 }, { y: 68 }, { y: 73 }
  ];

  // Landing page for non-connected users
  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        {/* HERO SECTION */}
        <section className="relative min-h-[calc(100vh-64px)] flex flex-col overflow-hidden">
          {/* Static Image Background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/hero-bg.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          >
            {/* Dark overlay — four layers for depth */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, #0a0e17e6 0%, #0a0e1799 40%, #0a0e17cc 75%, #0a0e17ff 100%)'
            }} />
            {/* Green tint layer — Irish identity */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 20% 50%, #00a86b18 0%, transparent 60%)'
            }} />
          </div>
          
          {/* Layer 2: Animated Orbs */}
          <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
            <div 
              className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-100"
              style={{
                background: 'radial-gradient(circle, #00a86b15 0%, transparent 70%)',
                animation: 'pulseOrb1 4s ease-in-out infinite',
              }}
            />
            <div 
              className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full opacity-100"
              style={{
                background: 'radial-gradient(circle, #d4af3710 0%, transparent 70%)',
                animation: 'pulseOrb2 4s ease-in-out infinite',
                animationDelay: '2s',
              }}
            />
          </div>

          {/* Layer 3: Dot Grid */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#ffffff08 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              zIndex: 3,
            }}
          />

          {/* Hero Content */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-4xl mx-auto">
              {/* Pill Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6"
              >
                <span 
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{ 
                    border: '1px solid #00a86b40',
                    background: '#00a86b10',
                    color: '#00a86b'
                  }}
                >
                  ��� Live on Solana Devnet · Ireland's First
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="font-extrabold text-foreground mb-6 leading-[1.1]"
                style={{ fontSize: 'clamp(40px, 8vw, 72px)' }}
              >
                Ireland's{' '}
                <span className="hero-gradient-text">Prediction Market</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-muted-foreground mb-10 mx-auto leading-relaxed"
                style={{ fontSize: '18px', maxWidth: '560px', lineHeight: '1.7' }}
              >
                Trade horse race outcomes. Share your bet as a link.
                Your mates bet in one tap. No bookmaker. No middleman.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-6"
              >
                {/* Hidden wallet button */}
                <div className="hidden">
                  <WalletMultiButton />
                </div>
                
                <button
                  onClick={handleConnectClick}
                  className="hero-cta-button"
                >
                  Connect Wallet &amp; Start Trading
                </button>
              </motion.div>

              {/* Trust Signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center justify-center gap-4 flex-wrap"
                style={{ color: '#475569', fontSize: '13px' }}
              >
                <span>🔒 Non-custodial</span>
                <span style={{ color: '#2d3748' }}>·</span>
                <span>⚡ Instant settlement</span>
                <span style={{ color: '#2d3748' }}>·</span>
                <span>🇮🇪 Built for Ireland</span>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 1, duration: 0.5 },
              y: { delay: 1, duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </motion.div>

          {/* Ticker Tape */}
          <div 
            className="relative z-10 h-9 overflow-hidden flex items-center"
            style={{ 
              background: '#111827',
              borderTop: '1px solid #1f2d40',
              borderBottom: '1px solid #1f2d40'
            }}
          >
            {/* Fade edges */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-20 z-10"
              style={{ background: 'linear-gradient(to right, #111827, transparent)' }}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-20 z-10"
              style={{ background: 'linear-gradient(to left, #111827, transparent)' }}
            />
            
            {/* Scrolling content */}
            <div className="ticker-scroll whitespace-nowrap">
              <span className="ticker-content">{tickerContent}</span>
              <span className="ticker-content">{tickerContent}</span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section 
          className="py-20 border-t border-b"
          style={{ background: '#0d1117', borderColor: '#1f2d40' }}
        >
          <div className="container mx-auto px-4">
            {/* Section Header - Left aligned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-4xl font-bold text-foreground">How it works</h2>
            </motion.div>

            {/* Timeline Steps */}
            <div className="relative">
              {/* Connecting Line - Desktop only */}
              <div 
                className="hidden lg:block absolute top-24 left-[16.66%] right-[16.66%] h-px"
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(to right, #1f2d40 0px, #1f2d40 8px, transparent 8px, transparent 16px)'
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 items-stretch">
                {/* Step 1: Connect */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0 }}
                  className="relative h-full"
                >
                  <div className="relative bg-card border border-border rounded-xl p-6 overflow-hidden h-full">
                    {/* Decorative number */}
                    <span 
                      className="absolute -top-4 -right-2 text-7xl font-bold pointer-events-none select-none"
                      style={{ color: '#00a86b20' }}
                    >
                      01
                    </span>
                    
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ background: '#00a86b' }}
                    >
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Title with underline */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-foreground mb-1">Connect your wallet</h3>
                      <div className="w-12 h-0.5 rounded-full" style={{ background: '#00a86b' }} />
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Phantom wallet. Your keys, your custody. No email, no KYC, no account.
                    </p>
                  </div>
                </motion.div>

                {/* Step 2: Trade */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative h-full"
                >
                  <div className="relative bg-card border border-border rounded-xl p-6 overflow-hidden h-full">
                    {/* Decorative number */}
                    <span 
                      className="absolute -top-4 -right-2 text-7xl font-bold pointer-events-none select-none"
                      style={{ color: '#00a86b20' }}
                    >
                      02
                    </span>
                    
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ background: '#d4af37' }}
                    >
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Title with underline */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-foreground mb-1">Buy shares in race outcomes</h3>
                      <div className="w-12 h-0.5 rounded-full" style={{ background: '#d4af37' }} />
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      YES or NO on each horse. Prices move with the market. Exit your position before the race starts.
                    </p>

                    {/* Mini Sparkline */}
                    <div className="h-10 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniSparklineData}>
                          <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#00a86b"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>

                {/* Step 3: Share */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative h-full"
                >
                  <div className="relative bg-card border border-border rounded-xl p-6 overflow-hidden h-full">
                    {/* Decorative number */}
                    <span 
                      className="absolute -top-4 -right-2 text-7xl font-bold pointer-events-none select-none"
                      style={{ color: '#00a86b20' }}
                    >
                      03
                    </span>
                    
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ background: '#3b82f6' }}
                    >
                      <LinkIcon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Title with underline */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-foreground mb-1">Share as a Blink</h3>
                      <div className="w-12 h-0.5 rounded-full" style={{ background: '#3b82f6' }} />
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      One click generates a link. Your mates bet directly from Twitter or WhatsApp — no app needed.
                    </p>

                    {/* Mini Blink Widget */}
                    <div 
                      className="rounded-lg border p-3"
                      style={{ background: '#0f1729', borderColor: '#1f2d40' }}
                    >
                      <div className="text-xs text-muted-foreground mb-2">Fastnet Rock</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div 
                          className="text-center py-1.5 rounded text-xs font-bold text-white"
                          style={{ background: '#22c55e' }}
                        >
                          YES 73¢
                        </div>
                        <div 
                          className="text-center py-1.5 rounded text-xs font-bold text-white"
                          style={{ background: '#ef4444' }}
                        >
                          NO 27¢
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section 
          className="py-6"
          style={{ 
            background: '#111827',
            borderTop: '1px solid #1f2d40',
            borderBottom: '1px solid #1f2d40'
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
              {/* Stat 1 */}
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">€5.5B</div>
                <div className="text-xs text-muted-foreground mt-1">Irish Gambling<br />Market</div>
              </div>
              
              <div className="hidden md:block w-px h-12" style={{ background: '#1f2d40' }} />
              
              {/* Stat 2 */}
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold" style={{ color: '#00a86b' }}>0</div>
                <div className="text-xs text-muted-foreground mt-1">Crypto Platforms<br />Before Us</div>
              </div>
              
              <div className="hidden md:block w-px h-12" style={{ background: '#1f2d40' }} />
              
              {/* Stat 3 */}
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">1.5M</div>
                <div className="text-xs text-muted-foreground mt-1">Diaspora<br />Worldwide</div>
              </div>
              
              <div className="hidden md:block w-px h-12" style={{ background: '#1f2d40' }} />
              
              {/* Stat 4 */}
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">2,847</div>
                <div className="text-xs text-muted-foreground mt-1">Traders<br />This Week</div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE MARKETS PREVIEW */}
        <section className="py-20 bg-background border-t border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Live Markets Right Now</h2>
              <p className="text-muted-foreground">Connect your wallet to start trading</p>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-racing-green" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                {races.map((race, index) => (
                  <ReadOnlyMarketCard key={race.id} race={race} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* BLINKS SHOWCASE */}
        <section className="py-20 bg-background border-t border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Share With Blinks</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Your bet becomes a shareable link. Friends bet without ever opening the app.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-lg mx-auto"
            >
              {/* Mock Twitter Card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Tweet Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                      style={{ background: '#1a2235', color: '#00a86b' }}
                    >
                      SO
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Séamus O'Brien</div>
                      <div className="text-sm text-muted-foreground">@seamus_trades</div>
                    </div>
                  </div>
                  <p className="text-foreground mt-3">
                    Just backed Fastnet Rock at Leopardstown! Who's with me? 🐎
                  </p>
                </div>

                {/* Blink Widget Preview */}
                <div className="p-4" style={{ background: '#0f1729' }}>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🍀</span>
                      <span className="font-bold text-foreground">Sláinte Races</span>
                    </div>
                    <h4 className="font-bold text-foreground mb-3">Bet on Fastnet Rock</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Will Fastnet Rock win at Leopardstown?
                    </p>
                    
                    {/* Probability Display */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-bet-yes font-semibold">YES 73%</span>
                        <span className="text-bet-no font-semibold">NO 27%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1f2d40' }}>
                        <div className="h-full bg-bet-yes" style={{ width: '73%' }} />
                      </div>
                    </div>

                    {/* Mock Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-bet-yes text-white text-center py-3 rounded-lg font-semibold text-sm">
                        BUY YES 0.73¢
                      </div>
                      <div className="bg-bet-no text-white text-center py-3 rounded-lg font-semibold text-sm">
                        BUY NO 0.27¢
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tweet Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center gap-6 text-muted-foreground text-sm">
                  <span>💬 12</span>
                  <span>🔁 8</span>
                  <span>❤️ 47</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Trade?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Connect your wallet and start trading Irish racing markets in seconds.
              </p>
              <button
                onClick={handleConnectClick}
                className="hero-cta-button"
              >
                Connect Wallet &amp; Start Trading
              </button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍀</span>
                <span className="font-bold text-foreground">Sláinte Races</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Built on Solana. Trade responsibly. Must be 18+ to participate.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Zap className="w-3 h-3 text-racing-green" />
                <span>Devnet</span>
                <span>•</span>
                <span>Irish Racing Markets</span>
              </div>
            </div>
          </div>
        </footer>

        {/* CSS Styles */}
        <style>{`
          @keyframes pulseOrb1 {
            0%, 100% { transform: scale(0.95); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          @keyframes pulseOrb2 {
            0%, 100% { transform: scale(1.05); opacity: 1; }
            50% { transform: scale(0.95); opacity: 0.8; }
          }
          
          .hero-gradient-text {
            background: linear-gradient(90deg, #00a86b 0%, #34d399 50%, #00a86b 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmerGradient 3s linear infinite;
          }
          
          /* Wallet button styles */
          .wallet-adapter-button {
            background: transparent !important;
            border: 1px solid #00a86b !important;
            color: #00a86b !important;
            font-family: inherit !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            padding: 8px 16px !important;
          }
          .wallet-adapter-button:hover {
            background: #00a86b15 !important;
          }
          
          @keyframes shimmerGradient {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
          
          .hero-cta-button {
            background: linear-gradient(135deg, #00a86b, #00c47d);
            color: white;
            font-weight: 700;
            font-size: 16px;
            padding: 16px 40px;
            border-radius: 12px;
            box-shadow: 0 0 40px #00a86b40;
            transition: all 200ms ease;
            border: none;
            cursor: pointer;
          }
          
          .hero-cta-button:hover {
            box-shadow: 0 0 60px #00a86b60;
            transform: scale(1.02);
          }
          
          .ticker-scroll {
            display: flex;
            animation: tickerScroll 40s linear infinite;
          }
          
          .ticker-content {
            padding: 0 2rem;
            font-size: 13px;
            color: #94a3b8;
          }
          
          .ticker-content .highlight {
            color: #00a86b;
          }
          
          @keyframes tickerScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  }

  // Connected user view - normal markets page
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Slim Professional Hero */}
      <section className="bg-background border-b border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                🏇 Irish Racing Markets
              </h1>
              <p className="text-muted-foreground text-base">
                Trade the outcome. Know before the race. Sláinte. 🍀
              </p>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-secondary animate-count-up tabular-nums">
                  €{totalVolume.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </motion.div>
              <div className="w-px h-10 bg-border" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-foreground animate-count-up tabular-nums">
                  {totalTraders.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Traders</div>
              </motion.div>
              <div className="w-px h-10 bg-border" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-racing-green animate-count-up tabular-nums">
                  {liveMarkets}
                </div>
                <div className="text-xs text-muted-foreground">Live Markets</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-racing-green to-transparent opacity-20" />

      {/* Filters and Markets */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#00a86b' }}>
                All Markets
              </button>
              <button className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors" style={{ background: '#1a2235' }}>
                🔴 Live Now
              </button>
              <button className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors" style={{ background: '#1a2235' }}>
                ⏳ Starting Soon
              </button>
              <button className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors" style={{ background: '#1a2235' }}>
                ✅ Settled
              </button>
            </div>
            
            {connected && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAirdrop}
                  disabled={isAirdropping}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {isAirdropping ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Droplets className="w-3 h-3 mr-1" />
                  )}
                  Get SOL
                </Button>
              </div>
            )}
          </div>

          {/* Market Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-racing-green" />
            </div>
          ) : races.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-4xl mb-4 block">🐎</span>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Markets Available</h3>
              <p className="text-muted-foreground">Check back soon for upcoming markets!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {races.map((race, index) => (
                <MarketCard key={race.id} race={race} onBetPlaced={refresh} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍀</span>
              <span className="font-bold text-foreground">Sláinte Races</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Built on Solana. Trade responsibly. Must be 18+ to participate.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Zap className="w-3 h-3 text-racing-green" />
              <span>Devnet</span>
              <span>•</span>
              <span>Irish Racing Markets</span>
            </div>
          </div>
        </div>
      </footer>

      <SwapModal open={swapModalOpen} onClose={() => setSwapModalOpen(false)} />
    </div>
  );
};

// Read-only market card for landing page
import type { Race } from '@/lib/supabase';

interface ReadOnlyMarketCardProps {
  race: Race;
  index: number;
}

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

const ReadOnlyMarketCard = ({ race, index }: ReadOnlyMarketCardProps) => {
  // Hardcoded probabilities
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
  }

  // Hardcoded volume
  let volumeEuros = 0;
  if (race.horse_name === 'Fastnet Rock') {
    volumeEuros = 4270;
  } else if (race.horse_name === 'Tiger Roll') {
    volumeEuros = 2890;
  } else if (race.horse_name === 'Ruby Walsh' || race.horse_name === 'Istabraq') {
    volumeEuros = 1650;
  }

  const isLive = race.horse_name === 'Fastnet Rock' || race.status === 'live';
  const yesPrice = (yesPercentage / 100).toFixed(2);
  const noPrice = (noPercentage / 100).toFixed(2);
  const chartData = chartDataMap[race.horse_name] || chartDataMap['Tiger Roll'];
  const priceChange = chartData[chartData.length - 1].y - chartData[0].y;
  const priceChangePercent = ((priceChange / chartData[0].y) * 100).toFixed(0);
  const isPositive = priceChange > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="betting-slip rounded-lg p-5"
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
              <linearGradient id={`gradient-readonly-${race.id}`} x1="0" y1="0" x2="0" y2="1">
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
              fill={`url(#gradient-readonly-${race.id})`}
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
          <span className="font-mono">€{volumeEuros.toLocaleString()}</span>
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

      {/* Connect to Trade CTA */}
      <a 
        href="#"
        className="block text-center font-semibold text-sm py-3 transition-colors hover:underline"
        style={{ color: '#00a86b' }}
      >
        Connect wallet to trade →
      </a>
    </motion.div>
  );
};

export default Index;