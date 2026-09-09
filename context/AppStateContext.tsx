'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from '@/lib/types';
import { defaultState } from '@/lib/defaultState';

interface AppStateContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  saveState: (newState?: AppState) => void;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

const STORAGE_KEY = 'frostTechAdminState';

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        // Merge in any missing keys from defaultState
        const merged = { ...defaultState, ...parsed };
        setState(merged);
      }
    } catch {
      // If localStorage is corrupt, use default
    }
    setLoaded(true);
  }, []);

  const saveState = useCallback((newState?: AppState) => {
    const toSave = newState || state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // localStorage full or unavailable
    }
  }, [state]);

  // Auto-save when state changes (after initial load)
  useEffect(() => {
    if (loaded) {
      saveState(state);
    }
  }, [state, loaded, saveState]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="animate-pulse text-sky-400 text-xl font-semibold">Loading FrostTech...</div>
      </div>
    );
  }

  return (
    <AppStateContext.Provider value={{ state, setState, saveState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
