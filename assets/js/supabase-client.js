import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 👉 Remplace ces deux valeurs par celles de ton projet Supabase
// (dans le tableau de bord Supabase : Project Settings > API)
const SUPABASE_URL = 'https://cgikkyrlvlciwzjckpbi.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaWtreXJsdmxjaXd6amNrcGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTA1MzgsImV4cCI6MjA5NzQyNjUzOH0.hKHCuARPOx_t_tHJSqm6VLZ3E2TdwGB1Z83f-dpOeVg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
