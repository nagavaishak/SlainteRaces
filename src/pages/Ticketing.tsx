import { ArrowRight, Ticket, Trophy, Zap, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

const TicketMockup = () => (
  <div
    className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden select-none"
    style={{
      background: 'linear-gradient(135deg, #1a2a1a 0%, #0f1a0f 50%, #1a1a1a 100%)',
      border: '1px solid #00a86b40',
      boxShadow: '0 0 40px rgba(0,168,107,0.15)',
    }}
  >
    {/* Shimmer top band */}
    <div
      className="h-1 w-full"
      style={{ background: 'linear-gradient(90deg, #00a86b, #34d399, #d4af37, #00a86b)' }}
    />

    {/* Ticket header */}
    <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px dashed #2a2a2a' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ background: '#00a86b' }}>🍀</div>
          <span className="text-xs font-bold text-foreground">SLÁINTE RACES</span>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#d4af3720', color: '#d4af37', border: '1px solid #d4af3740' }}>
          GOLD TICKET
        </span>
      </div>
      <p className="text-lg font-extrabold text-foreground mt-2">Leopardstown</p>
      <p className="text-xs text-muted-foreground">Saturday, March 15 · Gold Cup Day</p>
    </div>

    {/* Ticket body */}
    <div className="px-6 py-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Gate</p>
          <p className="text-sm font-bold text-foreground">Gate 3 — Grandstand</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Races</p>
          <p className="text-sm font-bold text-foreground">All 7 Races</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Prediction Entry</p>
          <p className="text-sm font-bold" style={{ color: '#00a86b' }}>✓ Unlocked</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Free Bet Allocation</p>
          <p className="text-sm font-bold" style={{ color: '#d4af37' }}>0.5 SOL</p>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="relative my-4">
        <div style={{ borderTop: '1px dashed #2a2a2a' }} />
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: '#0f0f0f' }} />
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: '#0f0f0f' }} />
      </div>

      {/* Barcode area */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-0.5 mb-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 rounded-sm"
              style={{
                height: i % 3 === 0 ? 20 : i % 2 === 0 ? 14 : 18,
                background: '#00a86b',
                opacity: 0.7 + (i % 3) * 0.1,
              }}
            />
          ))}
        </div>
        <p className="text-xs font-mono text-muted-foreground">SLNT-LEO-2026-0342</p>
      </div>
    </div>

    {/* Corner decoration */}
    <div
      className="absolute top-3 right-3 text-2xl opacity-10 pointer-events-none"
      style={{ transform: 'rotate(15deg)' }}
    >
      🏇
    </div>
  </div>
);

const FlowStep = ({
  num, icon, title, desc, color = '#00a86b'
}: {
  num: string; icon: string; title: string; desc: string; color?: string;
}) => (
  <div className="flex gap-4">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{num}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ArchDiagram = () => (
  <div
    className="rounded-xl p-5 font-mono text-xs"
    style={{ background: '#141414', border: '1px solid #2a2a2a' }}
  >
    <p className="text-muted-foreground mb-3 font-sans text-xs font-semibold uppercase tracking-wide">Architecture</p>
    <div className="space-y-2">
      {[
        { label: 'KYD Labs', detail: 'Ticket NFT mint (ERC-1155 on Solana)', color: '#d4af37' },
        { arrow: '↓ ticket_id verified on-chain', color: '#555' },
        { label: 'Sláinte Races Program', detail: 'check_ticket_ownership() → allocate_free_bet()', color: '#00a86b' },
        { arrow: '↓ free_bet_pda created', color: '#555' },
        { label: 'PlaceBet instruction', detail: 'amount deducted from free_bet_pda first', color: '#00a86b' },
        { arrow: '↓ race settles', color: '#555' },
        { label: 'ClaimWinnings', detail: 'Boosted payout (1.2x multiplier for ticket holders)', color: '#00a86b' },
        { arrow: '↓ post-race', color: '#555' },
        { label: 'Ticket NFT metadata', detail: 'Updated with race results embedded on-chain', color: '#d4af37' },
      ].map((step, i) =>
        'arrow' in step ? (
          <p key={i} className="pl-4 text-xs" style={{ color: step.color }}>{step.arrow}</p>
        ) : (
          <div
            key={i}
            className="flex items-start justify-between px-3 py-2 rounded"
            style={{ background: '#1a1a1a', border: `1px solid ${step.color}25` }}
          >
            <span style={{ color: step.color }} className="font-semibold">{step.label}</span>
            <span className="text-muted-foreground text-right ml-4 font-sans" style={{ fontSize: 10 }}>{step.detail}</span>
          </div>
        )
      )}
    </div>
  </div>
);

const Ticketing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page hero */}
      <div
        className="relative overflow-hidden"
        style={{ borderBottom: '1px solid #2a2a2a' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(212,175,55,0.08) 0%, transparent 60%)' }}
        />
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{ border: '1px solid #d4af3740', background: '#d4af3710', color: '#d4af37' }}
            >
              <Ticket className="w-3 h-3" />
              Powered by KYD Labs · Concept Track
            </div>

            <h1 className="text-3xl font-extrabold text-foreground mb-4 leading-tight">
              Predictive Ticketing
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-6" style={{ fontSize: 15 }}>
              Your raceday ticket is your prediction market entry pass.
              KYD-issued NFT tickets for Leopardstown and Cheltenham unlock free bet allocations on Sláinte Races — attend, predict, and win boosted payouts.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#00a86b' }}
              >
                Bet on Live Races <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://kyd.so"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
                style={{ border: '1px solid #2a2a2a' }}
              >
                KYD Labs ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Ticket mockup */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Sample Ticket</p>
            <TicketMockup />
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Each ticket is a Solana NFT minted by KYD Labs.<br />Sláinte Races verifies ownership on-chain.
            </p>
          </div>

          {/* Flow steps */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">How It Works</p>
            <div className="space-y-5">
              <FlowStep
                num="01"
                icon="🎟️"
                title="Buy a raceday ticket"
                desc="Purchase a KYD-issued NFT ticket for Leopardstown, Cheltenham, or Punchestown. The ticket lives in your Solana wallet."
                color="#d4af37"
              />
              <FlowStep
                num="02"
                icon="🔓"
                title="Unlock your prediction entry"
                desc="Sláinte Races verifies ticket ownership via CPI call to KYD's program. Your account is automatically credited with a 0.5 SOL free bet allocation."
              />
              <FlowStep
                num="03"
                icon="📈"
                title="Predict race outcomes"
                desc="Use your free bet allocation to trade YES/NO on any Sláinte Races market. In-play bets route through MagicBlock Ephemeral Rollups at 10ms latency."
              />
              <FlowStep
                num="04"
                icon="🏆"
                title="Collect boosted winnings"
                desc="Ticket holders receive a 1.2× payout multiplier on correct predictions. After settlement, your ticket NFT metadata is updated with results on-chain."
                color="#d4af37"
              />
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center">On-Chain Architecture</p>
          <ArchDiagram />
        </div>

        {/* Value props */}
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center">Why This Matters</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Ticket className="w-5 h-5" />,
                title: 'Tickets With Utility',
                desc: 'Transforms passive spectator tickets into active DeFi instruments. Your ticket earns while you watch.',
                color: '#d4af37',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Live In-Play Betting',
                desc: 'MagicBlock ER enables bet placement as races unfold — 10ms latency, zero fees between bets.',
                color: '#00a86b',
              },
              {
                icon: <Trophy className="w-5 h-5" />,
                title: 'Collectible Proof',
                desc: 'Your ticket NFT becomes a permanent on-chain trophy with race outcomes, odds, and payout history embedded.',
                color: '#a78bfa',
              },
            ].map(card => (
              <div
                key={card.title}
                className="rounded-lg p-5"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${card.color}18`, color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Spec compliance callout */}
        <div
          className="max-w-2xl mx-auto mt-12 rounded-xl p-6"
          style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Implementation Roadmap</p>
          <div className="space-y-3">
            {[
              { done: true,  text: 'Sláinte Races prediction market — live on Solana Devnet' },
              { done: true,  text: 'Solana Blinks API — bet from X, Discord, WhatsApp' },
              { done: true,  text: 'MagicBlock ER integration for live race betting' },
              { done: false, text: 'KYD Labs SDK integration for ticket NFT verification' },
              { done: false, text: 'check_ticket_ownership() Anchor instruction' },
              { done: false, text: '1.2× payout multiplier for ticket holders' },
              { done: false, text: 'Post-race ticket metadata update with results' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ color: item.done ? '#00a86b' : '#555' }} className="flex-shrink-0">
                  {item.done ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <span className="text-sm" style={{ color: item.done ? '#e2e8f0' : '#666' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2"><span>🍀</span><span className="text-sm font-semibold text-foreground">Sláinte Races</span></div>
          <p className="text-xs text-muted-foreground">KYD Labs integration concept — Graveyard Hackathon 2026</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="w-3 h-3 text-racing-green" />Devnet</div>
        </div>
      </footer>
    </div>
  );
};

export default Ticketing;
