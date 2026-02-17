import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/supabase';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchLeaderboard();
      setLeaderboard(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load leaderboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return { leaderboard, loading, error, refresh: loadLeaderboard };
}
