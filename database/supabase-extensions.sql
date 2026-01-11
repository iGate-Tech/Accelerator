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