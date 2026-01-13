-- =========================================================
-- CORE DATABASE SCHEMA (ENVIRONMENT-AGNOSTIC)
-- =========================================================
-- No auth, no RLS, no storage, no extensions
-- Sync-first, offline-first
-- =========================================================

-- =========================================================
-- PROJECTS
-- =========================================================
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  current_step TEXT,
  step_name TEXT,
  current_model TEXT,
  current_section TEXT,

  ui_progress REAL,
  ui_message TEXT,
  ui_status TEXT,

  total_credits REAL DEFAULT 0,
  consumed_credits REAL DEFAULT 0,
  total_time REAL DEFAULT 0,
  consumed_time REAL DEFAULT 0,
  total_steps INTEGER,

  public BOOLEAN DEFAULT false,

  current_prompt TEXT,
  llm_response TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- TASKS
-- =========================================================
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id BIGINT NOT NULL,

  content TEXT,
  prompt TEXT,
  llm_response TEXT,

  model TEXT,
  section TEXT,
  step_name TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- GROUPS / PORTFOLIOS
-- =========================================================
CREATE TABLE groups (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  color TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- PROJECT ↔ GROUPS
-- =========================================================
CREATE TABLE project_groups (
  project_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  user_id UUID NOT NULL,

  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,

  PRIMARY KEY (project_id, group_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- =========================================================
-- CREDITS (LEDGER)
-- =========================================================
CREATE TABLE credits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,

  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- BILLING
-- =========================================================
CREATE TABLE billing (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,

  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,

  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,

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

-- =========================================================
-- PACKAGES (GLOBAL LOOKUP)
-- =========================================================
CREATE TABLE packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  credits_included INTEGER NOT NULL,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- USER SUBSCRIPTIONS
-- =========================================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  package_id TEXT NOT NULL,

  status TEXT DEFAULT 'active',
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,

  avatar TEXT,
  bio TEXT,
  preferences JSONB,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- PORTFOLIO COLLABORATORS
-- =========================================================
CREATE TABLE portfolio_collaborators (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  inviter_id UUID NOT NULL,

  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,

  UNIQUE (portfolio_id, user_id)
);

-- =========================================================
-- PORTFOLIO INVITATIONS
-- =========================================================
CREATE TABLE portfolio_invitations (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL,
  inviter_id UUID NOT NULL,

  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  message TEXT,

  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  responded_at TIMESTAMP,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,

  UNIQUE (portfolio_id, invitee_email),
  FOREIGN KEY (portfolio_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- =========================================================
-- USER ACTIVITIES
-- =========================================================
CREATE TABLE user_activities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,

  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,

  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- =========================================================
-- PROJECT VOTES
-- =========================================================
CREATE TABLE project_votes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  user_id UUID NOT NULL,

  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- SUPABASE OVERLAY
-- =========================================================
-- Supabase-only features:
--  - auth.users foreign keys
--  - RLS
--  - storage buckets & policies
--  - grants
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- AUTH FOREIGN KEYS
-- =========================================================
ALTER TABLE projects
  ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE groups
  ADD CONSTRAINT groups_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE project_groups
  ADD CONSTRAINT project_groups_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE credits
  ADD CONSTRAINT credits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE billing
  ADD CONSTRAINT billing_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE portfolio_collaborators
  ADD CONSTRAINT portfolio_collaborators_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE portfolio_collaborators
  ADD CONSTRAINT portfolio_collaborators_inviter_id_fkey
  FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE portfolio_invitations
  ADD CONSTRAINT portfolio_invitations_inviter_id_fkey
  FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_activities
  ADD CONSTRAINT user_activities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE project_votes
  ADD CONSTRAINT project_votes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =========================================================
-- STORAGE: AVATARS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- User upload
DROP POLICY IF EXISTS avatars_user_insert ON storage.objects;
CREATE POLICY avatars_user_insert
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- User update
DROP POLICY IF EXISTS avatars_user_update ON storage.objects;
CREATE POLICY avatars_user_update
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- User delete
DROP POLICY IF EXISTS avatars_user_delete ON storage.objects;
CREATE POLICY avatars_user_delete
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =========================================================
-- ENABLE RLS
-- =========================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- PROJECTS
DROP POLICY IF EXISTS projects_read ON projects;
CREATE POLICY projects_read
ON projects
FOR SELECT
USING (user_id = auth.uid() OR public = true);

DROP POLICY IF EXISTS projects_write ON projects;
CREATE POLICY projects_write
ON projects
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- GENERIC USER-OWNED TABLES
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tasks','groups','project_groups','credits','billing',
    'notifications','profiles','user_subscriptions',
    'portfolio_collaborators','user_activities','project_votes'
  ]
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS %I_owner ON %I;
      CREATE POLICY %I_owner ON %I
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    ', t, t, t, t);
  END LOOP;
END $$;

-- PORTFOLIO INVITATIONS
DROP POLICY IF EXISTS portfolio_invitations_owner ON portfolio_invitations;
CREATE POLICY portfolio_invitations_owner
ON portfolio_invitations
FOR ALL
USING (inviter_id = auth.uid())
WITH CHECK (inviter_id = auth.uid());

-- PACKAGES (PUBLIC READ)
DROP POLICY IF EXISTS packages_public_read ON packages;
CREATE POLICY packages_public_read
ON packages
FOR SELECT
USING (true);

-- =========================================================
-- GRANTS
-- =========================================================
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO authenticated;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO authenticated;

GRANT SELECT ON packages TO anon;

-- =========================================================
-- SEED DATA
-- =========================================================
INSERT INTO packages (id, name, description, price, credits_included, features)
VALUES
(
  'free',
  'Free',
  'Perfect for exploring the platform',
  0,
  50,
  '[
    "Basic AI features",
    "3 projects",
    "Community support"
  ]'
),
(
  'pro',
  'Pro',
  'Advanced tools for founders',
  49.99,
  1000,
  '[
    "Unlimited projects",
    "Advanced analysis",
    "Priority support"
  ]'
),
(
  'enterprise',
  'Enterprise',
  'Scaling teams & companies',
  199.99,
  5000,
  '[
    "Team collaboration",
    "Advanced analytics",
    "Dedicated support"
  ]'
)
ON CONFLICT (id) DO NOTHING;
