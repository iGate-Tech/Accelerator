-- Local Database Update Script
-- This drops all tables and recreates them with the latest schema
-- Use this for development when you need to reset the local database

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS portfolio_invitations CASCADE;
DROP TABLE IF EXISTS portfolio_collaborators CASCADE;
DROP TABLE IF EXISTS project_votes CASCADE;
DROP TABLE IF EXISTS project_groups CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS credits CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Base Database Schema (Common Core)
-- This file contains the core table definitions without environment-specific auth or extensions
-- Tables: projects, tasks, groups, project_groups, credits, billing, notifications, packages, profiles, user_subscriptions, portfolio_collaborators, portfolio_invitations, project_votes
-- Sync columns are included for all tables

-- Projects table with core fields
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT, -- Will be overridden in extensions
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
  currentPrompt TEXT,
  llmResponse TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  deleted_at TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Local Extensions
-- This file contains PGLite/local-specific additions to the base schema
-- Run after base.sql

-- Users table for local authentication
CREATE TABLE users (
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
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);