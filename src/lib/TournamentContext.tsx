'use client';

import { createContext, useContext } from 'react';
import { Tournament } from './types';
import { TOURNAMENTS } from './constants';

const TournamentContext = createContext<Tournament[]>(TOURNAMENTS);

export function TournamentProvider({ tournaments, children }: { tournaments: Tournament[]; children: React.ReactNode }) {
  return (
    <TournamentContext.Provider value={tournaments}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments(): Tournament[] {
  return useContext(TournamentContext);
}
