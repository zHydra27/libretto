import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://mxtkefwcyajcncwipjdm.supabase.co"; // Il tuo URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGtlZndjeWFqY25jd2lwamRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTc2NTUsImV4cCI6MjEwNDE3MzY1NX0.xV96xteOEeVhNFWRKamSYeqacOzBjQqeL07nep9a7uc"; // La tua chiave
export const isSupabaseConfigured = !SUPABASE_URL.includes("IL-TUO-PROGETTO") && !SUPABASE_ANON_KEY.startsWith("INCOLLA");
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
