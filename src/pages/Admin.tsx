import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Shield, CheckCircle, XCircle, Clock, Users, Coins, AlertTriangle, Loader2, Plus, Zap, ExternalLink, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import { useRaces } from '@/hooks/useRaces';
import { 
  lamportsToSol, 
  PROGRAM_ID, 
  isConfigInitialized, 
  isRaceCreated,
  initializeConfig,
  createRaceOnChain,
  startRaceOnChain,
  settleRaceOnChain,
  getRacePDA,
  getVaultPDA
} from '@/lib/solana';
import { supabase, type Race } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PublicKey } from '@solana/web3.js';

const Admin = () => {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const { races, loading, refresh } = useRaces();
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create race form
  const [newRace, setNewRace] = useState({
    track_name: '',
    horse_name: '',
    question: '',
    race_time: ''
  });

  // On-chain state
  const [configInitialized, setConfigInitialized] = useState<boolean | null>(null);
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [feeBps, setFeeBps] = useState('250'); // 2.5%
  const [treasury, setTreasury] = useState('');

  // Check config status on load
  useEffect(() => {
    const checkConfig = async () => {
      const initialized = await isConfigInitialized();
      setConfigInitialized(initialized);
    };
    checkConfig();
  }, []);

  // Set default treasury to connected wallet
  useEffect(() => {
    if (publicKey && !treasury) {
      setTreasury(publicKey.toBase58());
    }
  }, [publicKey, treasury]);

  // Admin wallet restriction
const ADMIN_WALLET = '5SXCRj9Wom3YyCgqkpTqdrx5Ks9r2mKLRYZRVRrcNAo4';
const isAdmin = connected && publicKey?.toBase58() === ADMIN_WALLET;

  // Initialize config on-chain
  const handleInitializeConfig = async () => {
    if (!publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return;
    
    setIsProcessing(true);
    try {
      const treasuryPubkey = new PublicKey(treasury);
      const signature = await initializeConfig(
        { publicKey, signTransaction: wallet.signTransaction, signAllTransactions: wallet.signAllTransactions },
        parseInt(feeBps),
        treasuryPubkey
      );
      
      toast({
        title: 'Config Initialized!',
        description: `Transaction: ${signature.slice(0, 8)}...`,
      });
      
      setConfigInitialized(true);
      setInitModalOpen(false);
    } catch (error) {
      console.error('Init config error:', error);
      toast({
        title: 'Failed to initialize',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create race on-chain
  const handleCreateRaceOnChain = async (race: Race) => {
    if (!publicKey || !wallet.signTransaction || !wallet.signAllTransactions || !race.onchain_race_id) return;
    
    setIsProcessing(true);
    try {
      const signature = await createRaceOnChain(
        { publicKey, signTransaction: wallet.signTransaction, signAllTransactions: wallet.signAllTransactions },
        race.onchain_race_id,
        race.horse_name,
        race.question
      );
      
      // Update Supabase with PDA addresses
      const [racePDA] = getRacePDA(race.onchain_race_id);
      const [vaultPDA] = getVaultPDA(race.onchain_race_id);
      
      await supabase
        .from('races')
        .update({ 
          race_pda: racePDA.toBase58(),
          vault_pda: vaultPDA.toBase58()
        })
        .eq('id', race.id);
      
      toast({
        title: 'Race Created On-Chain!',
        description: `${race.horse_name} is now live on Solana devnet.`,
      });
      
      refresh();
    } catch (error) {
      console.error('Create race on-chain error:', error);
      toast({
        title: 'Failed to create on-chain',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start race on-chain
  const handleStartRaceOnChain = async (race: Race) => {
    if (!publicKey || !wallet.signTransaction || !wallet.signAllTransactions || !race.onchain_race_id) return;
    
    setIsProcessing(true);
    try {
      const signature = await startRaceOnChain(
        { publicKey, signTransaction: wallet.signTransaction, signAllTransactions: wallet.signAllTransactions },
        race.onchain_race_id
      );
      
      // Update Supabase status
      await supabase
        .from('races')
        .update({ status: 'live' })
        .eq('id', race.id);
      
      toast({
        title: 'Race Started!',
        description: `${race.horse_name} is now LIVE and accepting bets.`,
      });
      
      refresh();
    } catch (error) {
      console.error('Start race error:', error);
      toast({
        title: 'Failed to start race',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Settle race on-chain
  const handleSettleRaceOnChain = async (race: Race, result: boolean) => {
    if (!publicKey || !wallet.signTransaction || !wallet.signAllTransactions || !race.onchain_race_id) return;
    
    setIsProcessing(true);
    try {
      const treasuryPubkey = new PublicKey(treasury || publicKey.toBase58());
      
      const signature = await settleRaceOnChain(
        { publicKey, signTransaction: wallet.signTransaction, signAllTransactions: wallet.signAllTransactions },
        race.onchain_race_id,
        result,
        treasuryPubkey
      );
      
      // Update Supabase
      await supabase
        .from('races')
        .update({ 
          status: 'settled', 
          result: result ? 'yes' : 'no',
          settled_at: new Date().toISOString()
        })
        .eq('id', race.id);

      // Update bet statuses and calculate payouts
      const winningPrediction = result ? 'yes' : 'no';
      const totalPool = (race.yes_pool || 0) + (race.no_pool || 0);
      const feeBps = 250; // 2.5%
      const fee = Math.floor((totalPool * feeBps) / 10000);
      const poolAfterFees = totalPool - fee;
      const winningPool = result ? (race.yes_pool || 0) : (race.no_pool || 0);

      // Get all winning bets and calculate payouts
      const { data: winningBets } = await supabase
        .from('bets')
        .select('*')
        .eq('race_id', race.id)
        .eq('prediction', winningPrediction);

      // Update each winning bet with calculated payout
      if (winningBets && winningPool > 0) {
        for (const bet of winningBets) {
          const payout = Math.floor((bet.amount * poolAfterFees) / winningPool);
          await supabase
            .from('bets')
            .update({ status: 'won', payout })
            .eq('id', bet.id);
        }
      }

      // Mark losing bets
      await supabase
        .from('bets')
        .update({ status: 'lost', payout: 0 })
        .eq('race_id', race.id)
        .neq('prediction', winningPrediction);
      
      toast({
        title: 'Race Settled On-Chain!',
        description: `${race.horse_name} - ${result ? 'YES' : 'NO'} won!`,
      });
      
      setResolveModalOpen(false);
      refresh();
    } catch (error) {
      console.error('Settle race error:', error);
      toast({
        title: 'Failed to settle',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveClick = (race: Race) => {
    setSelectedRace(race);
    setResolveModalOpen(true);
  };

  const handleResolve = async (outcome: 'yes' | 'no') => {
    if (!selectedRace) return;
    
    // If race has on-chain ID, settle on-chain
    if (selectedRace.onchain_race_id && selectedRace.race_pda) {
      await handleSettleRaceOnChain(selectedRace, outcome === 'yes');
      return;
    }

    // Otherwise just update Supabase (mock mode)
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('races')
        .update({ 
          status: 'settled', 
          result: outcome,
          settled_at: new Date().toISOString()
        })
        .eq('id', selectedRace.id);

      if (error) throw error;

      // Calculate payouts for mock mode
      const totalPool = (selectedRace.yes_pool || 0) + (selectedRace.no_pool || 0);
      const feeBps = 250;
      const fee = Math.floor((totalPool * feeBps) / 10000);
      const poolAfterFees = totalPool - fee;
      const winningPool = outcome === 'yes' ? (selectedRace.yes_pool || 0) : (selectedRace.no_pool || 0);

      const { data: winningBets } = await supabase
        .from('bets')
        .select('*')
        .eq('race_id', selectedRace.id)
        .eq('prediction', outcome);

      if (winningBets && winningPool > 0) {
        for (const bet of winningBets) {
          const payout = Math.floor((bet.amount * poolAfterFees) / winningPool);
          await supabase
            .from('bets')
            .update({ status: 'won', payout })
            .eq('id', bet.id);
        }
      }

      await supabase
        .from('bets')
        .update({ status: 'lost', payout: 0 })
        .eq('race_id', selectedRace.id)
        .neq('prediction', outcome);

      toast({
        title: 'Race Resolved!',
        description: `${selectedRace.horse_name} - ${outcome === 'yes' ? 'YES won' : 'NO won'}.`,
      });

      refresh();
      setResolveModalOpen(false);
    } catch (error) {
      console.error('Resolve error:', error);
      toast({
        title: 'Failed to resolve',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateRace = async () => {
    if (!newRace.track_name || !newRace.horse_name || !newRace.question || !newRace.race_time) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get the next race ID
      const { data: maxRace } = await supabase
        .from('races')
        .select('onchain_race_id')
        .order('onchain_race_id', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRaceId = (maxRace?.onchain_race_id || 0) + 1;

      // Create race in Supabase
      const { error } = await supabase
        .from('races')
        .insert({
          track_name: newRace.track_name,
          horse_name: newRace.horse_name,
          question: newRace.question,
          race_time: newRace.race_time,
          status: 'upcoming',
          onchain_race_id: nextRaceId,
          program_id: PROGRAM_ID.toBase58(),
          yes_pool: 0,
          no_pool: 0
        });

      if (error) throw error;

      toast({
        title: 'Race Created!',
        description: `${newRace.horse_name} at ${newRace.track_name} has been added.`,
      });

      setNewRace({ track_name: '', horse_name: '', question: '', race_time: '' });
      setCreateModalOpen(false);
      refresh();
    } catch (error) {
      console.error('Create error:', error);
      toast({
        title: 'Failed to create race',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRace = async (race: Race) => {
    // If race is on-chain, start on-chain
    if (race.race_pda && race.onchain_race_id) {
      await handleStartRaceOnChain(race);
      return;
    }
    
    // Otherwise just update Supabase
    try {
      await supabase
        .from('races')
        .update({ status: 'live' })
        .eq('id', race.id);
      
      toast({
        title: 'Race Started!',
        description: `${race.horse_name} is now LIVE.`,
      });
      
      refresh();
    } catch (error) {
      toast({
        title: 'Failed to start race',
        variant: 'destructive'
      });
    }
  };

  const wallet = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
              <Shield className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Admin Access Required</h1>
            <p className="text-muted-foreground">
              Connect your wallet to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-6 flex items-center justify-center">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Unauthorized</h1>
            <p className="text-muted-foreground mb-2">
              Your wallet does not have admin access.
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">
              {publicKey?.toBase58()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  const totalPoolSize = races.reduce((sum, r) => sum + (r.yes_pool || 0) + (r.no_pool || 0), 0);
  const activeRaces = races.filter(r => r.status !== 'settled').length;
  const settledRaces = races.filter(r => r.status === 'settled').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage races and resolve outcomes</p>
            </div>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-gold text-secondary-foreground font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Race
          </Button>
        </div>

        {/* Program Info & Config Status */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">Program ID</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm text-muted-foreground font-mono">{PROGRAM_ID.toBase58()}</code>
                <a
                  href={`https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            {/* Config Status */}
            <div className="text-right">
              {configInitialized === null ? (
                <span className="text-muted-foreground text-sm">Checking config...</span>
              ) : configInitialized ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-bet-yes/10 text-bet-yes text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Config Initialized
                </span>
              ) : (
                <Button
                  onClick={() => setInitModalOpen(true)}
                  size="sm"
                  className="bg-gradient-gold text-secondary-foreground"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Initialize Config
                </Button>
              )}
            </div>
          </div>
          
          {!configInitialized && configInitialized !== null && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  Config not initialized. You must initialize the program config before creating races on-chain.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm">Total Pool</span>
            </div>
            <p className="text-2xl font-bold text-gradient-gold">{lamportsToSol(totalPoolSize).toFixed(4)} SOL</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Active Races</span>
            </div>
            <p className="text-2xl font-bold text-primary">{activeRaces}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settled</span>
            </div>
            <p className="text-2xl font-bold text-bet-yes">{settledRaces}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total Races</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{races.length}</p>
          </div>
        </div>

        {/* Races Table */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Manage Races</h2>
          </div>

          {races.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🐎</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Races Yet</h3>
              <p className="text-muted-foreground">Create your first race to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {races.map(race => (
                <div key={race.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🐎</span>
                      <h3 className="font-semibold text-foreground">{race.horse_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        race.status === 'live' 
                          ? 'bg-destructive/10 text-destructive' 
                          : race.status === 'settled'
                          ? 'bg-bet-yes/10 text-bet-yes'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {race.status?.toUpperCase()}
                      </span>
                      {race.onchain_race_id && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                          ID: {race.onchain_race_id}
                        </span>
                      )}
                      {race.race_pda ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bet-yes/10 text-bet-yes flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          On-Chain
                        </span>
                      ) : race.onchain_race_id && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                          Off-Chain
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {race.track_name} • {new Date(race.race_time).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">YES Pool</p>
                      <p className="font-semibold text-bet-yes">{lamportsToSol(race.yes_pool || 0).toFixed(4)} SOL</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">NO Pool</p>
                      <p className="font-semibold text-bet-no">{lamportsToSol(race.no_pool || 0).toFixed(4)} SOL</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {race.status === 'settled' ? (
                      <span className="flex items-center gap-2 px-4 py-2 bg-bet-yes/10 text-bet-yes rounded-lg text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {race.result?.toUpperCase()} Won
                      </span>
                    ) : (
                      <>
                        {/* Deploy to chain button */}
                        {race.onchain_race_id && !race.race_pda && configInitialized && (
                          <Button
                            onClick={() => handleCreateRaceOnChain(race)}
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            className="border-bet-yes text-bet-yes hover:bg-bet-yes/10"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
                            Deploy On-Chain
                          </Button>
                        )}
                        
                        {race.status === 'upcoming' && race.race_pda && (
                          <Button
                            onClick={() => handleStartRace(race)}
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            className="border-primary text-primary"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start Race
                          </Button>
                        )}
                        
                        {race.status === 'upcoming' && !race.race_pda && (
                          <Button
                            onClick={() => handleStartRace(race)}
                            variant="outline"
                            size="sm"
                            className="border-primary text-primary"
                          >
                            Start (Mock)
                          </Button>
                        )}
                        
                        {race.status === 'live' && (
                          <Button
                            onClick={() => handleResolveClick(race)}
                            className="bg-gradient-gold text-secondary-foreground font-semibold"
                          >
                            Resolve Race
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning Notice */}
        <div className="mt-6 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground">On-Chain Workflow</h4>
              <p className="text-sm text-muted-foreground">
                1. Initialize Config (once) → 2. Create Race in DB → 3. Deploy On-Chain → 4. Start Race → 5. Users Bet → 6. Resolve/Settle
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Initialize Config Modal */}
      <Dialog open={initModalOpen} onOpenChange={setInitModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Initialize Program Config
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
              This is a one-time setup to initialize the Solana program. You'll set the fee percentage and treasury wallet.
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Fee (basis points)</label>
              <Input
                type="number"
                placeholder="250 = 2.5%"
                value={feeBps}
                onChange={(e) => setFeeBps(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">{parseInt(feeBps) / 100}% fee on winnings</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Treasury Wallet</label>
              <Input
                placeholder="Solana wallet address"
                value={treasury}
                onChange={(e) => setTreasury(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Fees will be sent to this wallet</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setInitModalOpen(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInitializeConfig}
                disabled={isProcessing || !treasury}
                className="flex-1 bg-gradient-primary text-primary-foreground"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Initialize Config'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Race Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Create New Race
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Track Name</label>
              <Input
                placeholder="e.g., Leopardstown"
                value={newRace.track_name}
                onChange={(e) => setNewRace(prev => ({ ...prev, track_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Horse Name</label>
              <Input
                placeholder="e.g., Fastnet Rock"
                value={newRace.horse_name}
                onChange={(e) => setNewRace(prev => ({ ...prev, horse_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Question</label>
              <Input
                placeholder="e.g., Will Fastnet Rock finish top 3?"
                value={newRace.question}
                onChange={(e) => setNewRace(prev => ({ ...prev, question: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Race Time</label>
              <Input
                type="datetime-local"
                value={newRace.race_time}
                onChange={(e) => setNewRace(prev => ({ ...prev, race_time: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRace}
                disabled={isProcessing}
                className="flex-1 bg-gradient-primary text-primary-foreground"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Race'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Resolve Race
            </DialogTitle>
          </DialogHeader>

          {selectedRace && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🐎</span>
                  <h3 className="font-semibold text-foreground">{selectedRace.horse_name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{selectedRace.question}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedRace.track_name} • {new Date(selectedRace.race_time).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bet-yes/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-bet-yes mb-1">YES Pool</p>
                  <p className="text-lg font-bold text-bet-yes">{lamportsToSol(selectedRace.yes_pool || 0).toFixed(4)} SOL</p>
                </div>
                <div className="bg-bet-no/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-bet-no mb-1">NO Pool</p>
                  <p className="text-lg font-bold text-bet-no">{lamportsToSol(selectedRace.no_pool || 0).toFixed(4)} SOL</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Select the winning outcome:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleResolve('yes')}
                    disabled={isProcessing}
                    className="bg-bet-yes hover:bg-bet-yes/90 text-bet-yes-foreground font-bold py-6"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        YES Won
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleResolve('no')}
                    disabled={isProcessing}
                    className="bg-bet-no hover:bg-bet-no/90 text-bet-no-foreground font-bold py-6"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        NO Won
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This will update bet statuses in the database.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;