import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { JournalEntry, WineType } from '@/types';

const JOURNAL_STORAGE_KEY = '@unbottl_journal';

export const [JournalProvider, useJournal] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const journalQuery = useQuery({
    queryKey: ['journal'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) as JournalEntry[] : [];
    },
  });

  useEffect(() => {
    if (journalQuery.data) {
      setEntries(journalQuery.data);
    }
  }, [journalQuery.data]);

  const saveEntries = async (updatedEntries: JournalEntry[]) => {
    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
    queryClient.setQueryData(['journal'], updatedEntries);
  };

  const addEntryMutation = useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newEntry: JournalEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedEntries = [newEntry, ...entries];
      await saveEntries(updatedEntries);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return newEntry;
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<JournalEntry> }) => {
      const updatedEntries = entries.map(entry =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      );
      await saveEntries(updatedEntries);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      return updatedEntries.find(e => e.id === id);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const updatedEntries = entries.filter(entry => entry.id !== id);
      await saveEntries(updatedEntries);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
  });

  const getEntryById = useCallback((id: string) => {
    return entries.find(entry => entry.id === id);
  }, [entries]);

  const getEntriesByWineType = useCallback((type: WineType) => {
    return entries.filter(entry => entry.beverageType === type);
  }, [entries]);

  const getAverageRating = useMemo(() => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, entry) => acc + entry.rating, 0);
    return sum / entries.length;
  }, [entries]);

  const totalEntries = useMemo(() => entries.length, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries]);

  return {
    entries: sortedEntries,
    isLoading: journalQuery.isLoading,
    addEntry: addEntryMutation.mutateAsync,
    updateEntry: updateEntryMutation.mutateAsync,
    deleteEntry: deleteEntryMutation.mutateAsync,
    getEntryById,
    getEntriesByWineType,
    getAverageRating,
    totalEntries,
    isAdding: addEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending,
  };
});
