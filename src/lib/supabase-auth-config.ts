// Supabase publishable credentials are intentionally public and are safe to
// ship in the browser/mobile bundle. Environment variables can override these
// defaults without requiring a privileged service-role key.
export const SUPABASE_AUTH_URL =
  process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL ||
  "https://zoixfbydnwxbceqnrjvs.supabase.co";

export const SUPABASE_AUTH_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_AUTH_PUBLISHABLE_KEY ||
  "sb_publishable_TMu7g0cYEAmj0W0WLei0EA_P9v62Zwk";
