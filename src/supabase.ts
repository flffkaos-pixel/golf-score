import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uauaaxwlqyyzrbtcqoap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdWFheHdscXl5enJidGNxb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODk3MTEsImV4cCI6MjA5MDA2NTcxMX0.rsraNFE4Kq2g8Weeg8Pbj06smoMmTqEEsB0isbfyZ3k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
