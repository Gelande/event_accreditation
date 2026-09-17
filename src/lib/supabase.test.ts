import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('supabase client', () => {
  it('exports an initialized supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
