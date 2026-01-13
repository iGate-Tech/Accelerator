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