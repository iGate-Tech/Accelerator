-- Debug Supabase Schema and RLS Policies
-- Run these queries in Supabase SQL Editor to check current state

-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check table structure
\d projects;
\d tasks;
\d groups;
\d project_groups;
\d credits;
\d billing;

-- Check auth.users structure
\d auth.users;