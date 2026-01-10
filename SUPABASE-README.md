# Supabase Setup and Testing Guide

## Environment Variables
Your `.env` file should contain:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
# Optional: VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## Database Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Run the contents of `supabase-schema.sql` to create tables and policies

## Testing Supabase Connection
Run the automated test script:
```bash
npm run test:supabase
```

This will test:
- ✅ Connection to Supabase
- ✅ Access to all tables
- ✅ RLS policy enforcement

## Debugging
If sync fails:
1. Run `debug-supabase-schema.sql` queries in Supabase SQL Editor
2. Check that RLS is enabled and policies exist
3. Ensure you're using the correct API key

## Sync Testing
1. Start the app: `npm run dev`
2. Log in with a valid account
3. Trigger sync from the sidebar
4. Check console for success/failure messages