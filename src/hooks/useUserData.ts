import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  fetchUserBets, 
  fetchUserProfile, 
  getUserStats,
  subscribeToUserBets,
  type Bet,
  type UserProfile
} from '@/lib/supabase';
import { getWalletBalance } from '@/lib/solana';

export function useUserData() {
  const { publicKey, connected } = useWallet();
  const [bets, setBets] = useState<Bet[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalBets: 0,
    activeBets: 0,
    totalWinnings: 0,
    winRate: 0,
    solBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUserData = useCallback(async () => {
    if (!publicKey || !connected) {
      setBets([]);
      setProfile(null);
      setStats({ totalBets: 0, activeBets: 0, totalWinnings: 0, winRate: 0, solBalance: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const walletAddress = publicKey.toBase58();

      // Fetch all user data in parallel
      const [betsData, profileData, statsData, balance] = await Promise.all([
        fetchUserBets(walletAddress),
        fetchUserProfile(walletAddress),
        getUserStats(walletAddress),
        getWalletBalance(publicKey)
      ]);

      setBets(betsData || []);
      setProfile(profileData);
      setStats({
        ...statsData,
        solBalance: balance
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load user data'));
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    loadUserData();

    // Subscribe to bet updates if connected
    if (publicKey && connected) {
      const subscription = subscribeToUserBets(publicKey.toBase58(), (updatedBets) => {
        setBets(updatedBets);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [publicKey, connected, loadUserData]);

  // Separate active and past bets
  const activeBets = bets.filter(bet => bet.status === 'active');
  const pastBets = bets.filter(bet => bet.status !== 'active');

  return {
    bets,
    activeBets,
    pastBets,
    profile,
    stats,
    loading,
    error,
    refresh: loadUserData
  };
}
