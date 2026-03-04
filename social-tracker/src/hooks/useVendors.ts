'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Vendor } from '@/types';

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      setVendors((data as Vendor[]) || []);
      setLoading(false);
    }
    fetchVendors();
  }, []);

  return { vendors, loading };
}
