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
  public BOOLEAN DEFAULT false,
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

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'system', 'billing', 'credits', 'update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS packages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  credits_included INTEGER NOT NULL,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  avatar TEXT DEFAULT '/src/assets/avatar.png',
  bio TEXT,
  preferences JSONB DEFAULT '{"notifications": {"email": true, "browser": false, "projectUpdates": true}, "privacy": {"profileVisibility": "private", "dataSharing": false}}',
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id BIGINT REFERENCES packages(id),
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- Portfolio Collaboration Tables
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor', -- 'editor', 'viewer'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  UNIQUE(portfolio_id, user_id)
);

CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor', -- 'editor', 'viewer'
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  message TEXT,
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  responded_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  UNIQUE(portfolio_id, invitee_email, status) -- Prevent duplicate pending invitations
);

-- Voting system for public projects
CREATE TABLE IF NOT EXISTS project_votes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Users can view own projects and public projects" ON projects;
CREATE POLICY "Users can view own projects and public projects" ON projects
FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public = true OR
  EXISTS (
    SELECT 1 FROM project_groups pg
    JOIN portfolio_collaborators pc ON pg.group_id = pc.portfolio_id
    WHERE pg.project_id = projects.id AND pc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM project_groups pg
    JOIN portfolio_collaborators pc ON pg.group_id = pc.portfolio_id
    WHERE pg.project_id = projects.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM project_groups pg
    JOIN portfolio_collaborators pc ON pg.group_id = pc.portfolio_id
    WHERE pg.project_id = projects.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
  )
);

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
FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM portfolio_collaborators pc
    WHERE pc.portfolio_id = groups.id AND pc.user_id = auth.uid()
  )
);

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
FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM portfolio_collaborators pc
    WHERE pc.portfolio_id = project_groups.group_id AND pc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own project_groups" ON project_groups;
CREATE POLICY "Users can insert own project_groups" ON project_groups
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM portfolio_collaborators pc
    WHERE pc.portfolio_id = project_groups.group_id AND pc.user_id = auth.uid() AND pc.role = 'editor'
  )
);



DROP POLICY IF EXISTS "Users can delete own project_groups" ON project_groups;
CREATE POLICY "Users can delete own project_groups" ON project_groups
FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM portfolio_collaborators pc
    WHERE pc.portfolio_id = project_groups.group_id AND pc.user_id = auth.uid() AND pc.role = 'editor'
  )
);

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

CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view packages" ON packages
FOR SELECT TO authenticated;

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Portfolio Collaborators policies
CREATE POLICY "Portfolio owners can view collaborators" ON portfolio_collaborators
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "Portfolio owners can add collaborators" ON portfolio_collaborators
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Portfolio owners can update collaborators" ON portfolio_collaborators
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Portfolio owners can remove collaborators" ON portfolio_collaborators
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

-- Portfolio Invitations policies
CREATE POLICY "Portfolio owners can view invitations" ON portfolio_invitations
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Portfolio owners can create invitations" ON portfolio_invitations
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Portfolio owners can update invitations" ON portfolio_invitations
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Portfolio owners can delete invitations" ON portfolio_invitations
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

-- Project Votes policies
CREATE POLICY "Users can view all votes on public projects" ON project_votes
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND public = true
  )
);

CREATE POLICY "Users can vote on public projects" ON project_votes
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND public = true
  ) AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own votes" ON project_votes
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON project_votes
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Insert production-ready packages
INSERT INTO packages (name, description, price, credits_included, features)
SELECT 'Free', 'Perfect for exploring our platform and testing basic features', 0, 50, '["AI-powered business plan generation", "Basic market analysis", "Financial projections", "3 projects maximum", "Community support", "Basic export options"]'
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Free');

INSERT INTO packages (name, description, price, credits_included, features)
SELECT 'Pro', 'Advanced tools for growing startups and entrepreneurs', 49.99, 1000, '["Everything in Free plan", "Unlimited projects", "Advanced market research", "Competitive analysis", "Pitch deck generation", "Financial modeling", "Priority customer support", "Advanced export formats", "API access", "Custom templates"]'
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Pro');

INSERT INTO packages (name, description, price, credits_included, features)
SELECT 'Enterprise', 'Complete solution for scaling companies and teams', 199.99, 5000, '["Everything in Pro plan", "Team collaboration tools", "Advanced analytics dashboard", "Custom integrations", "White-label options", "Dedicated success manager", "Priority feature requests", "Advanced security features", "Custom AI model training", "24/7 premium support"]'
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Enterprise');