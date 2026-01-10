-- Supabase Database Schema for Accelerator App
-- Run this complete script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables with user isolation and sync metadata
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  currentStep TEXT,
  completedSteps INTEGER,
  stepName TEXT,
  currentModel TEXT,
  currentSection TEXT,
  uiProgress REAL,
  uiMessage TEXT,
  uiStatus TEXT,
  totalCredits REAL,
  consumedCredits REAL,
  totalTime REAL,
  consumedTime REAL,
  totalSteps INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id BIGINT,
  content TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  model TEXT,
  llm_model TEXT,
  section TEXT,
  stepName TEXT,
  prompt TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS groups (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  color TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS project_groups (
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  PRIMARY KEY (project_id, group_id)
);

CREATE TABLE IF NOT EXISTS credits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS billing (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON project_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON credits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing TO authenticated;

-- Grant SELECT to anon (RLS will deny access)
GRANT SELECT ON projects TO anon;
GRANT SELECT ON tasks TO anon;
GRANT SELECT ON groups TO anon;
GRANT SELECT ON project_groups TO anon;
GRANT SELECT ON credits TO anon;
GRANT SELECT ON billing TO anon;

-- Clean up any existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.schemaname) || '.' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Create comprehensive RLS policies for user data isolation
-- Deny anon access to satisfy Data API requirements
DROP POLICY IF EXISTS "Deny anon projects" ON projects;
CREATE POLICY "Deny anon projects" ON projects FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon tasks" ON tasks;
CREATE POLICY "Deny anon tasks" ON tasks FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon groups" ON groups;
CREATE POLICY "Deny anon groups" ON groups FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon project_groups" ON project_groups;
CREATE POLICY "Deny anon project_groups" ON project_groups FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon credits" ON credits;
CREATE POLICY "Deny anon credits" ON credits FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon billing" ON billing;
CREATE POLICY "Deny anon billing" ON billing FOR ALL TO anon USING (false);

-- Authenticated user policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks
FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own groups" ON groups;
CREATE POLICY "Users can view own groups" ON groups
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
CREATE POLICY "Users can insert own groups" ON groups
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own groups" ON groups;
CREATE POLICY "Users can update own groups" ON groups
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own groups" ON groups;
CREATE POLICY "Users can delete own groups" ON groups
FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own project_groups" ON project_groups;
CREATE POLICY "Users can view own project_groups" ON project_groups
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own project_groups" ON project_groups;
CREATE POLICY "Users can insert own project_groups" ON project_groups
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);



DROP POLICY IF EXISTS "Users can delete own project_groups" ON project_groups;
CREATE POLICY "Users can delete own project_groups" ON project_groups
FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own credits" ON credits;
CREATE POLICY "Users can view own credits" ON credits
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credits" ON credits;
CREATE POLICY "Users can insert own credits" ON credits
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credits" ON credits;
CREATE POLICY "Users can update own credits" ON credits
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own billing" ON billing;
CREATE POLICY "Users can view own billing" ON billing
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own billing" ON billing;
CREATE POLICY "Users can insert own billing" ON billing
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own billing" ON billing;
CREATE POLICY "Users can update own billing" ON billing
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);