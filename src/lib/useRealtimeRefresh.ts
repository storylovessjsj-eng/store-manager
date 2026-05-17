'use client';
import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/**
 * Subscribe to Supabase realtime changes on one or more tables.
 * Calls onChange() whenever any INSERT/UPDATE/DELETE happens.
 */
export function useRealtimeRefresh(tables: string | string[], onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const tableList = Array.isArray(tables) ? tables : [tables];
  const key = tableList.join(',');

  useEffect(() => {
    const channels = tableList.map((table) =>
      supabase
        .channel(`rt-${table}-${Math.random().toString(36).slice(2, 8)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => onChangeRef.current()
        )
        .subscribe()
    );
    return () => {
      channels.forEach((c) => {
        supabase.removeChannel(c);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
