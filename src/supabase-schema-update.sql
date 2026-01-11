


-- Drop existing tables to recreate with correct schema
DROP TABLE IF EXISTS portfolio_invitations CASCADE;
DROP TABLE IF EXISTS portfolio_collaborators CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS credits CASCADE;
DROP TABLE IF EXISTS project_groups CASCADE;
DROP TABLE IF EXISTS Groups CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_votes CASCADE;
DROP TABLE IF EXISTS Projects CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables if they don't exist (run these in Supabase SQL editor)
-- Note: Adjust column types if needed to match local schema

-- Alter existing columns to TEXT if they are varchar
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE users ALTER COLUMN email TYPE TEXT;
ALTER TABLE users ALTER COLUMN password_hash TYPE TEXT;
ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;
ALTER TABLE users ALTER COLUMN profile TYPE JSONB;
ALTER TABLE users ALTER COLUMN sync_status TYPE TEXT;

ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE sessions ALTER COLUMN session_data TYPE JSONB;
ALTER TABLE sessions ALTER COLUMN sync_status TYPE TEXT;

ALTER TABLE Projects ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN name TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN description TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN currentStep TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN stepName TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN currentModel TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN currentSection TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN uiMessage TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN uiStatus TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN problem TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN solution TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN strugglers TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN alternatives TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN gaps TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN persona TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN urgency TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN evidence TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN valueProp TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN features TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN modelType TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN revenue TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN pricing TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN moat TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN risks TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN assumptions TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN market TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN tam TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN sam TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN som TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN competitors TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN differentiation TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN marketTrends TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN fixedCosts TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN variableCosts TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN year1 TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN year2 TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN year3 TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN burnRate TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN runway TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN breakeven TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN traction TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN team TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN risk TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN valuation TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN stage TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN ask TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN allocation TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN preMoney TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN investors TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN milestones TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN teamGaps TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN hiring TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN advisors TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN entity TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN ip TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN contracts TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN compliance TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN pitchDeck TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN businessPlan TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN valuationReport TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN currentPrompt TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN llmResponse TYPE TEXT;
ALTER TABLE Projects ALTER COLUMN sync_status TYPE TEXT;

-- And so on for other tables, change varchar to TEXT

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

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS Projects (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
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
   sync_status TEXT DEFAULT 'local'
 );

ALTER TABLE Projects ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS project_votes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES Projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS Groups (
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

CREATE TABLE IF NOT EXISTS project_groups (
  project_id BIGINT REFERENCES Projects(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES Groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  PRIMARY KEY (project_id, group_id)
);

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
  sync_status TEXT DEFAULT 'local'
);

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
  sync_status TEXT DEFAULT 'local'
);

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
  sync_status TEXT DEFAULT 'local'
);

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

CREATE TABLE IF NOT EXISTS profiles (
   user_id TEXT PRIMARY KEY REFERENCES users(id),
   avatar TEXT DEFAULT '/src/assets/avatar.png',
   bio TEXT,
   preferences JSONB DEFAULT '{"notifications": {"email": true, "browser": false, "projectUpdates": true}, "privacy": {"profileVisibility": "private", "dataSharing": false}}',
   synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   sync_status TEXT DEFAULT 'local'
 );

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

CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT REFERENCES Groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  inviter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT DEFAULT 'local',
  UNIQUE(portfolio_id, user_id)
);

CREATE TABLE IF NOT EXISTS portfolio_invitations (
   id BIGSERIAL PRIMARY KEY,
   portfolio_id BIGINT REFERENCES Groups(id) ON DELETE CASCADE,
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
   UNIQUE(portfolio_id, invitee_email, status)
);

-- Grant permissions for all tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON Projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON Groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON credits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON packages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_invitations TO authenticated;

-- Also grant usage on sequences for auto-incrementing IDs
GRANT USAGE ON SEQUENCE sessions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE Projects_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE project_votes_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE tasks_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE Groups_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE portfolio_collaborators_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE portfolio_invitations_id_seq TO authenticated;

-- Enable Row Level Security and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE Projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE Groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for Projects
CREATE POLICY "Deny anon projects" ON Projects FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Users can delete own projects" ON Projects FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own projects" ON Projects FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own projects" ON Projects FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own projects and public projects" ON Projects FOR SELECT TO authenticated USING (auth.uid()::text = user_id OR public = true);

-- Policies for tasks
CREATE POLICY "Deny anon tasks" ON tasks FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for Groups
CREATE POLICY "Deny anon groups" ON Groups FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Users can delete own groups" ON Groups FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own groups" ON Groups FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own groups" ON Groups FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own groups" ON Groups FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for project_groups
CREATE POLICY "Deny anon project_groups" ON project_groups FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Users can delete own project_groups" ON project_groups FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own project_groups" ON project_groups FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own project_groups" ON project_groups FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for credits
CREATE POLICY "Deny anon credits" ON credits FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Users can insert own credits" ON credits FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own credits" ON credits FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own credits" ON credits FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for billing
CREATE POLICY "Deny anon billing" ON billing FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Users can insert own billing" ON billing FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own billing" ON billing FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own billing" ON billing FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for notifications
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for packages
CREATE POLICY "Everyone can view packages" ON packages FOR SELECT TO authenticated USING (true);

-- Policies for profiles
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Policies for portfolio_collaborators
CREATE POLICY "Portfolio owners can add collaborators" ON portfolio_collaborators FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = inviter_id);
CREATE POLICY "Portfolio owners can remove collaborators" ON portfolio_collaborators FOR DELETE TO authenticated USING (auth.uid()::text = (SELECT user_id FROM Groups WHERE id = portfolio_id));
CREATE POLICY "Portfolio owners can update collaborators" ON portfolio_collaborators FOR UPDATE TO authenticated USING (auth.uid()::text = (SELECT user_id FROM Groups WHERE id = portfolio_id)) WITH CHECK (auth.uid()::text = (SELECT user_id FROM Groups WHERE id = portfolio_id));
CREATE POLICY "Users can add portfolio collaborators" ON portfolio_collaborators FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can remove portfolio collaborators" ON portfolio_collaborators FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update portfolio collaborators" ON portfolio_collaborators FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view portfolio collaborators" ON portfolio_collaborators FOR SELECT TO authenticated USING (auth.uid()::text = user_id OR auth.uid()::text = (SELECT user_id FROM Groups WHERE id = portfolio_id));

-- Policies for portfolio_invitations
CREATE POLICY "Portfolio owners can create invitations" ON portfolio_invitations FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = inviter_id);
CREATE POLICY "Portfolio owners can delete invitations" ON portfolio_invitations FOR DELETE TO authenticated USING (auth.uid()::text = inviter_id);
CREATE POLICY "Portfolio owners can update invitations" ON portfolio_invitations FOR UPDATE TO authenticated USING (auth.uid()::text = inviter_id) WITH CHECK (auth.uid()::text = inviter_id);
CREATE POLICY "Portfolio owners can view invitations" ON portfolio_invitations FOR SELECT TO authenticated USING (auth.uid()::text = inviter_id);

-- Policies for project_votes
CREATE POLICY "Users can delete their own votes" ON project_votes FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own votes" ON project_votes FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view all votes on public projects" ON project_votes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM Projects WHERE id = project_id AND public = true));
CREATE POLICY "Users can vote on public projects" ON project_votes FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id AND EXISTS (SELECT 1 FROM Projects WHERE id = project_id AND public = true));
