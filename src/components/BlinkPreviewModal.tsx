import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Race } from '@/lib/supabase';

interface BlinkPreviewModalProps {
  open: boolean;
  onClose: () => void;
  race: Race;
}

const BlinkPreviewModal = ({ open, onClose, race }: BlinkPreviewModalProps) => {
  const [copied, setCopied] = useState(false);

  // Generate blink URL
  const blinkSlug = race.horse_name?.toLowerCase().replace(/\s+/g, '-') || 'market';
  const blinkUrl = race.blinks_url || `https://slainte.races/blink/${blinkSlug}`;

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
  }

  const yesPrice = yesPercentage;
  const noPrice = noPercentage;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(blinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareX = () => {
    const text = encodeURIComponent(`I'm backing ${race.horse_name} at ${race.track_name}! Join me 🐎`);
    const url = encodeURIComponent(blinkUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`I'm backing ${race.horse_name}! Place your bet here: ${blinkUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="w-full max-w-md rounded-xl border overflow-hidden"
              style={{ background: '#1a2235', borderColor: '#1f2d40' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#1f2d40' }}>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Share this market as a Blink 🔗</h2>
                  <p className="text-sm text-muted-foreground">Friends can bet instantly — no app needed</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-card transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Blink Widget Preview */}
              <div className="p-4">
                <div 
                  className="rounded-lg border overflow-hidden"
                  style={{ background: '#111827', borderColor: '#1f2d40' }}
                >
                  {/* Widget Header */}
                  <div 
                    className="flex items-center gap-2 px-4 py-3 border-b"
                    style={{ background: '#0f1729', borderColor: '#1f2d40' }}
                  >
                    <span className="text-lg">🍀</span>
                    <span className="font-semibold text-foreground text-sm">Sláinte Races</span>
                    <span className="text-muted-foreground text-xs">· Irish Racing Markets</span>
                  </div>

                  {/* Widget Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground text-base mb-1">
                      Will {race.horse_name} finish in top 3?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {race.track_name} · {new Date(race.race_time).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button 
                        className="py-3 rounded-lg font-bold text-white text-sm transition-transform hover:scale-[1.02]"
                        style={{ background: '#22c55e' }}
                      >
                        YES {yesPrice}¢
                      </button>
                      <button 
                        className="py-3 rounded-lg font-bold text-white text-sm transition-transform hover:scale-[1.02]"
                        style={{ background: '#ef4444' }}
                      >
                        NO {noPrice}¢
                      </button>
                    </div>

                    {/* Powered by */}
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">Powered by Solana Blinks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Field */}
              <div className="px-4 pb-4">
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg border"
                  style={{ background: '#111827', borderColor: '#1f2d40' }}
                >
                  <input
                    type="text"
                    readOnly
                    value={blinkUrl}
                    className="flex-1 bg-transparent text-sm text-muted-foreground outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: '#00a86b' }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleShareX}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors border"
                    style={{ background: '#111827', borderColor: '#1f2d40', color: '#f1f5f9' }}
                  >
                    <span className="font-bold">𝕏</span>
                    Share on X
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors border"
                    style={{ background: '#111827', borderColor: '#1f2d40', color: '#f1f5f9' }}
                  >
                    <span>💬</span>
                    WhatsApp
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors border"
                    style={{ background: '#111827', borderColor: '#1f2d40', color: '#f1f5f9' }}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  When your friends click this link on Twitter or dial.to, they can bet directly — no app download needed.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BlinkPreviewModal;
