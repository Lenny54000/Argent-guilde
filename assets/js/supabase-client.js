import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 👉 Remplace ces deux valeurs par celles de ton projet Supabase
// (dans le tableau de bord Supabase : Project Settings > API)
const SUPABASE_URL = 'METTRE_ICI_URL_SUPABASE';
const SUPABASE_ANON_KEY = 'METTRE_ICI_CLE_ANON_PUBLIC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
