'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GolferLiveData, ESPNResponse, fetchGolferLiveData } from './espn';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useESPNData(golferNames: string[]) {
  const [data, setData] = useState<Record<string, GolferLiveData>>({});
  const [tournament, setTournament] = useState<ESPNResponse['tournament']>(null);
  const [loading, setLoading] = useState(false);

  // Stabilize the golfer names to avoid re-fetching on every render
  const key = golferNames.join(',');
  const namesRef = useRef(golferNames);
  if (namesRef.current.join(',') !== key) {
    namesRef.current = golferNames;
  }

  const fetchData = useCallback(async () => {
    const names = namesRef.current;
    if (names.length === 0) return;
    setLoading(true);
    const result = await fetchGolferLiveData(names);
    setData(result.golfers);
    setTournament(result.tournament);
    setLoading(false);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { golfers: data, tournament, loading };
}
