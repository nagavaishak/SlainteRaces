import { useState, useEffect, useCallback } from 'react';
import { fetchRaces, subscribeToRaces, type Race } from '@/lib/supabase';

export function useRaces() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRaces = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRaces();
      setRaces(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load races'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRaces();

    // Subscribe to real-time updates
    const subscription = subscribeToRaces((updatedRaces) => {
      setRaces(updatedRaces);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadRaces]);

  return { races, loading, error, refresh: loadRaces };
}
