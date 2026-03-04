'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Settings } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setSettings(null);
    } else {
      setSettings(data as Settings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>) => {
      if (!settings) return { error: 'No settings found' };

      const { data, error: updateError } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return { error: updateError.message };
      }

      setSettings(data as Settings);
      return { error: null };
    },
    [settings]
  );

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
}
