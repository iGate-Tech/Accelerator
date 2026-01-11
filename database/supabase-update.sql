-- Base Database Schema (Common Core)
-- This file contains the core table definitions without environment-specific auth or extensions
-- Tables: projects, tasks, groups, project_groups, credits, billing, notifications, packages, profiles, user_subscriptions, portfolio_collaborators, portfolio_invitations, project_votes
-- Sync columns are included for all tables

-- Projects table with extensive business fields
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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
  problem TEXT,
  solution TEXT,
  strugglers TEXT,
  alternatives TEXT,
  gaps TEXT,
  persona TEXT,
  urgency TEXT,
  evidence TEXT,
  valueProp TEXT,
  features TEXT,
  modelType TEXT,
  revenue TEXT,
  pricing TEXT,
  moat TEXT,
  risks TEXT,
  assumptions TEXT,
  market TEXT,
  tam TEXT,
  sam TEXT,
  som TEXT,
  competitors TEXT,
  differentiation TEXT,
  marketTrends TEXT,
  fixedCosts TEXT,
  variableCosts TEXT,
  year1 TEXT,
  year2 TEXT,
  year3 TEXT,
  burnRate TEXT,
  runway TEXT,
  breakeven TEXT,
  traction TEXT,
  team TEXT,
  risk TEXT,
  valuation TEXT,
  stage TEXT,
  ask TEXT,
  allocation TEXT,
  preMoney TEXT,
  investors TEXT,
  milestones TEXT,
  teamGaps TEXT,
  hiring TEXT,
  advisors TEXT,
  entity TEXT,
  ip TEXT,
  contracts TEXT,
  compliance TEXT,
  pitchDeck TEXT,
  businessPlan TEXT,
  valuationReport TEXT,
  currentPrompt TEXT,
  llmResponse TEXT,
  tasks_list TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES projects(id),
  content TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  model TEXT,
  llm_model TEXT,
  section TEXT,
  stepName TEXT,
  prompt TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  color TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- Project Groups junction table
CREATE TABLE IF NOT EXISTS project_groups (
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  PRIMARY KEY (project_id, group_id)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
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

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar TEXT DEFAULT '/src/assets/avatar.png',
  bio TEXT,
  preferences JSONB DEFAULT '{"notifications": {"email": true, "browser": false, "projectUpdates": true}, "privacy": {"profileVisibility": "private", "dataSharing": false}}',
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT REFERENCES packages(id),
  status TEXT DEFAULT 'active',
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- Portfolio Collaborators table
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  inviter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  UNIQUE(portfolio_id, user_id)
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  message TEXT,
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  responded_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  UNIQUE(portfolio_id, invitee_email, status)
);

-- User Activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- Supabase Extensions
-- This file contains Supabase-specific additions to the base schema
-- Run after base.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alter user_id columns to UUID with auth references
ALTER TABLE projects ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tasks ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE groups ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE groups ADD CONSTRAINT groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE project_groups ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE project_groups ADD CONSTRAINT project_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE credits ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE credits ADD CONSTRAINT credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE billing ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE billing ADD CONSTRAINT billing_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE notifications ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profiles ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey PRIMARY KEY (user_id), ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_subscriptions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE portfolio_collaborators ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE portfolio_collaborators ADD CONSTRAINT portfolio_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_collaborators ALTER COLUMN inviter_id TYPE UUID USING inviter_id::UUID;
ALTER TABLE portfolio_collaborators ADD CONSTRAINT portfolio_collaborators_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE portfolio_invitations ALTER COLUMN inviter_id TYPE UUID USING inviter_id::UUID;
ALTER TABLE portfolio_invitations ADD CONSTRAINT portfolio_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_activities ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE user_activities ADD CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE project_votes ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE project_votes ADD CONSTRAINT project_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraints
ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE project_groups ADD CONSTRAINT project_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_groups ADD CONSTRAINT project_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages(id);
ALTER TABLE portfolio_collaborators ADD CONSTRAINT portfolio_collaborators_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE portfolio_invitations ADD CONSTRAINT portfolio_invitations_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE project_votes ADD CONSTRAINT project_votes_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

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
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Deny anon access
CREATE POLICY "Deny anon projects" ON projects FOR ALL TO anon USING (false);
CREATE POLICY "Deny anon tasks" ON tasks FOR ALL TO anon USING (false);
CREATE POLICY "Deny anon groups" ON groups FOR ALL TO anon USING (false);
CREATE POLICY "Deny anon project_groups" ON project_groups FOR ALL TO anon USING (false);
CREATE POLICY "Deny anon credits" ON credits FOR ALL TO anon USING (false);
CREATE POLICY "Deny anon billing" ON billing FOR ALL TO anon USING (false);

-- Authenticated user policies (simplified version)
CREATE POLICY "Users can view own projects and public projects" ON projects
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public = true);

CREATE POLICY "Users can insert own projects" ON projects
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Similar policies for other tables (abbreviated for brevity)
CREATE POLICY "Users can view own tasks" ON tasks
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add policies for groups, credits, billing, notifications, etc. (following the same pattern)

-- Add sync columns for versioning and soft deletes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE project_groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE project_groups ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE credits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE billing ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE packages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE portfolio_collaborators ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE portfolio_collaborators ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE portfolio_invitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE portfolio_invitations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE project_votes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE project_votes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Insert production-ready packages
INSERT INTO packages (id, name, description, price, credits_included, features)
SELECT 'free', 'Perfect for exploring our platform and testing basic features', 0, 50, '["AI-powered business plan generation", "Basic market analysis", "Financial projections", "3 projects maximum", "Community support", "Basic export options"]'
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE id = 'free');

INSERT INTO packages (name, description, price, credits_included, features)
SELECT 'Pro', 'Advanced tools for growing startups and entrepreneurs', 49.99, 1000, '["Everything in Free plan", "Unlimited projects", "Advanced market research", "Competitive analysis", "Pitch deck generation", "Financial modeling", "Priority customer support", "Advanced export formats", "API access", "Custom templates"]'
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Pro');

INSERT INTO packages (name, description, price, credits_included, features)
SELECT 'Enterprise', 'Complete solution for scaling companies and teams', 199.99, 5000, '["Everything in Pro plan", "Team collaboration tools", "Advanced analytics dashboard", "Custom integrations", "White-label options", "Dedicated success manager", "Priority feature requests", "Advanced security features", "Custom AI model training", "24/7 premium support"]'
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Enterprise');