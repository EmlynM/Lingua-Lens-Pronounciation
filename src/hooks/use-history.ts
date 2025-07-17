"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TranslationEntry } from '@/types';

const HISTORY_KEY = 'linguaLensHistory';

export function useHistory() {
  const [history, setHistory] = useState<TranslationEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const addEntry = useCallback((entry: Omit<TranslationEntry, 'id' | 'timestamp'>) => {
    const newEntry: TranslationEntry = {
      ...entry,
      id: new Date().toISOString(),
      timestamp: Date.now(),
    };

    setHistory(prevHistory => {
      const updatedHistory = [newEntry, ...prevHistory.slice(0, 19)]; // Keep latest 20
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
      }
      return updatedHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear history from localStorage", error);
    }
  }, []);

  return { history, addEntry, clearHistory, isLoaded };
}
