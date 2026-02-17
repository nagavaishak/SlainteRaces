import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://auenoohozdpzcuxjseob.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZW5vb2hvemRwemN1eGpzZW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTU4MDIsImV4cCI6MjA4NjQ5MTgwMn0.C7G0YqvPeV6Dzr7OJ7WEmq3euBAtRhFx4969882I7Bc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types for app use
export type Race = Database['public']['Tables']['races']['Row'];
export type Bet = Database['public']['Tables']['bets']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row'];

// API Functions
export async function fetchRaces(status?: string) {
  let query = supabase.from('races').select('*').order('race_time', { ascending: true });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchRaceById(id: string) {
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function fetchUserBets(walletAddress: string) {
  const { data, error } = await supabase
    .from('bets')
    .select('*, races(*)')
    .eq('user_wallet', walletAddress)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchUserProfile(walletAddress: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('rank', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function recordBet(bet: {
  user_wallet: string;
  race_id: string;
  onchain_race_id: number;
  prediction: 'yes' | 'no';
  amount: number;
  tx_signature?: string;
}) {
  // First, upsert user profile
  await upsertUserProfile(bet.user_wallet, bet.amount);
  
  const { data, error } = await supabase
    .from('bets')
    .insert({
      ...bet,
      tx_signature: bet.tx_signature || `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Upsert user profile when placing a bet
export async function upsertUserProfile(walletAddress: string, betAmount: number) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();
  
  if (existing) {
    // Update existing profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        total_bets: (existing.total_bets || 0) + 1,
        total_wagered: (existing.total_wagered || 0) + betAmount,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);
    
    if (error) throw error;
  } else {
    // Create new profile
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        wallet_address: walletAddress,
        total_bets: 1,
        total_wagered: betAmount,
        total_winnings: 0,
        win_count: 0
      });
    
    if (error) throw error;
  }
}

export async function updateRacePools(raceId: string, yesPool: number, noPool: number) {
  const { error } = await supabase
    .from('races')
    .update({ yes_pool: yesPool, no_pool: noPool, updated_at: new Date().toISOString() })
    .eq('id', raceId);
  
  if (error) throw error;
}

export async function getUserStats(walletAddress: string) {
  const profile = await fetchUserProfile(walletAddress);
  
  if (!profile) {
    return {
      totalBets: 0,
      activeBets: 0,
      totalWinnings: 0,
      winRate: 0,
      solBalance: 0
    };
  }
  
  // Get active bets count
  const { count: activeBets } = await supabase
    .from('bets')
    .select('*', { count: 'exact', head: true })
    .eq('user_wallet', walletAddress)
    .eq('status', 'active');
  
  return {
    totalBets: profile.total_bets || 0,
    activeBets: activeBets || 0,
    totalWinnings: (profile.total_winnings || 0) / 1e9, // Convert lamports to SOL
    winRate: profile.total_bets && profile.win_count 
      ? Math.round((profile.win_count / profile.total_bets) * 100) 
      : 0,
    solBalance: 0 // Will be fetched from wallet
  };
}

// Subscribe to real-time race updates
export function subscribeToRaces(callback: (races: Race[]) => void) {
  return supabase
    .channel('races-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'races' },
      async () => {
        const races = await fetchRaces();
        callback(races || []);
      }
    )
    .subscribe();
}

// Subscribe to user's bets
export function subscribeToUserBets(walletAddress: string, callback: (bets: Bet[]) => void) {
  return supabase
    .channel('user-bets-channel')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'bets',
        filter: `user_wallet=eq.${walletAddress}`
      },
      async () => {
        const bets = await fetchUserBets(walletAddress);
        callback(bets || []);
      }
    )
    .subscribe();
}

// Fetch recent bets for a race
export async function fetchRecentBets(raceId: string, limit = 10) {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('race_id', raceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// Fetch all recent bets across all races
export async function fetchAllRecentBets(limit = 20) {
  const { data, error } = await supabase
    .from('bets')
    .select('*, races(horse_name, track_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// Subscribe to all bets (for live activity feed)
export function subscribeToAllBets(callback: (bets: any[]) => void) {
  return supabase
    .channel('all-bets-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bets' },
      async () => {
        const bets = await fetchAllRecentBets();
        callback(bets || []);
      }
    )
    .subscribe();
}