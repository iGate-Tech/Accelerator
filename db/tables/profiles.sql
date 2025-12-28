-- Profiles Table
-- Purpose: Stores user profile information and subscription details
-- This is the central user table that extends Supabase auth.users
--
-- Key Relationships:
-- - References auth.users(id) for authentication
-- - Referenced by most other tables for user ownership
--
-- Business Logic:
-- - Each user gets one profile record created during registration
-- - Package system manages subscription tiers and credit allocations
-- - Credit balance tracks available credits for AI generation and features
-- - Preferences store user UI/UX customizations as JSON
--
-- Columns:
-- - user_id: Links to Supabase auth (unique, cannot be changed)
-- - package_type: Subscription tier (free/student/enterprise)
-- - credit_balance: Available credits (default 1000 for new users)
-- - total_earned/total_spent: Credit transaction totals for analytics
-- - preferences: User settings stored as JSONB
--
-- Example Data:
-- | user_id | name  | package_type | credit_balance | total_earned | total_spent |
-- |---------|-------|--------------|----------------|--------------|-------------|
-- | abc-123 | Alice | student      | 850            | 1000         | 150         |
--
-- Constraints:
-- - Credit balance cannot be negative (enforced by trigger)
-- - Package type must be valid enum value
-- - One profile per user (enforced by unique constraint)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT,
    avatar_url TEXT,
    role TEXT,
    package_type TEXT CHECK (package_type IN ('free', 'student', 'enterprise')) DEFAULT 'free',
    package_status TEXT CHECK (package_status IN ('active', 'cancelled')) DEFAULT 'active',
    package_started TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    package_expires TIMESTAMP WITH TIME ZONE,
    credit_balance INTEGER DEFAULT 1000,  -- Updated to 1000 default per code
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_credit_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;