'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Audience } from '@/types';

export function useAudiences() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchAudiences = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('audiences')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setAudiences([]);
    } else {
      setAudiences((data as Audience[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAudiences();
  }, [fetchAudiences]);

  const createAudience = async (
    newAudience: Omit<Audience, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error: createError } = await supabase
      .from('audiences')
      .insert(newAudience)
      .select()
      .single();

    if (createError) {
      return { data: null, error: createError.message };
    }

    await fetchAudiences();
    return { data: data as Audience, error: null };
  };

  const updateAudience = async (
    id: string,
    updates: Partial<Omit<Audience, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const { data, error: updateError } = await supabase
      .from('audiences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    await fetchAudiences();
    return { data: data as Audience, error: null };
  };

  const deleteAudience = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('audiences')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    await fetchAudiences();
    return { error: null };
  };

  return {
    audiences,
    loading,
    error,
    createAudience,
    updateAudience,
    deleteAudience,
    refetch: fetchAudiences,
  };
}
