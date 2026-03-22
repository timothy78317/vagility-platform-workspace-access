import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://svaaqcopoeckikgvhsib.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YWFxY29wb2Vja2lrZ3Zoc2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzQ5ODYsImV4cCI6MjA4MDMxMDk4Nn0.uAohcf54qBL7ZMQWocze8sYDztAbmP-kB6y6lskK26o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
    },
});
