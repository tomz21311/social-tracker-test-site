'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Content, Platform } from '@/types';

interface UseContentOptions {
  year?: number;
  platform?: Platform | 'all';
  search?: string;
}

export function useContent(options: UseContentOptions = {}) {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('content')
      .select('*')
      .order('publish_date', { ascending: false });

    // Filter by year
    if (options.year) {
      query = query
        .gte('publish_date', `${options.year}-01-01`)
        .lte('publish_date', `${options.year}-12-31`);
    }

    // Filter by platform
    if (options.platform && options.platform !== 'all') {
      query = query.contains('platforms', [options.platform]);
    }

    // Search by title
    if (options.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setContent([]);
    } else {
      setContent((data as Content[]) || []);
    }
    setLoading(false);
  }, [options.year, options.platform, options.search]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const createContent = async (
    newContent: Omit<Content, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error: createError } = await supabase
      .from('content')
      .insert(newContent)
      .select()
      .single();

    if (createError) {
      return { data: null, error: createError.message };
    }

    await fetchContent();
    return { data: data as Content, error: null };
  };

  const updateContent = async (
    id: string,
    updates: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const { data, error: updateError } = await supabase
      .from('content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    await fetchContent();
    return { data: data as Content, error: null };
  };

  const deleteContent = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    await fetchContent();
    return { error: null };
  };

  return {
    content,
    loading,
    error,
    createContent,
    updateContent,
    deleteContent,
    refetch: fetchContent,
  };
}

// Hook for fetching a single content item by ID
export function useContentItem(id: string) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setContent(null);
    } else {
      setContent(data as Content);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateContent = async (
    updates: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const { data, error: updateError } = await supabase
      .from('content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    setContent(data as Content);
    return { data: data as Content, error: null };
  };

  const deleteContent = async () => {
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return { error: null };
  };

  return {
    content,
    loading,
    error,
    updateContent,
    deleteContent,
    refetch: fetchContent,
  };
}
