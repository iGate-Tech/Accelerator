import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';

worker({
  async init(options) {
    console.log('Worker init called with options:', options);
    const db = new PGlite({
      dataDir: options.dataDir || 'idb://accelerator-db-v19'
    });

    console.log('PGLite instance created');

    // Initialize fresh schema with all columns
    await db.exec(`
-- Fresh Local Database Schema with All Columns
-- No ALTER TABLE needed - everything defined upfront

-- Users table for local authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT DEFAULT '/src/assets/avatar.png',
  profile JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Sessions table for local sessions
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Projects table with extensive business fields
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
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
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id),
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
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  color TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Project Groups junction table
CREATE TABLE IF NOT EXISTS project_groups (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
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
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
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
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
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
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
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
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
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
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
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
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Portfolio Collaborators table
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  inviter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
  UNIQUE(portfolio_id, user_id)
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
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
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
  UNIQUE(portfolio_id, invitee_email, status)
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
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

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
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
  project_id BIGINT,
  group_id BIGINT,
  user_id TEXT,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  PRIMARY KEY (project_id, group_id)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  user_id TEXT,
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
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
  user_id TEXT PRIMARY KEY,
  avatar TEXT DEFAULT '/src/assets/avatar.png',
  bio TEXT,
  preferences JSONB DEFAULT '{"notifications": {"email": true, "browser": false, "projectUpdates": true}, "privacy": {"profileVisibility": "private", "dataSharing": false}}',
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  package_id TEXT,
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
  portfolio_id BIGINT,
  user_id TEXT,
  inviter_id TEXT,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  UNIQUE(portfolio_id, user_id)
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT,
  inviter_id TEXT,
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
  UNIQUE(portfolio_id, invitee_email, status)
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT,
  user_id TEXT,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- Local Extensions
-- This file contains PGLite/local-specific additions to the base schema
-- Run after base.sql

-- Users table for local authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT DEFAULT '/src/assets/avatar.png',
  profile JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

-- Sessions table for local sessions
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);
    `);

    // Add sync columns if missing
    await db.exec(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

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

      ALTER TABLE portfolio_collaborators ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE portfolio_collaborators ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

      ALTER TABLE portfolio_invitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE portfolio_invitations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

      ALTER TABLE project_votes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE project_votes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
      ALTER TABLE project_votes ADD COLUMN IF NOT EXISTS sync_error TEXT;
      ALTER TABLE project_votes ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
    `);

    console.log('Database schema initialized successfully');
    return db;
  },
});