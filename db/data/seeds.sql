-- Sample data for Accelerator database
-- Run after schema setup

-- Cleanup existing test data first
TRUNCATE TABLE credit_packages CASCADE;
TRUNCATE TABLE packages CASCADE;

-- Test auth users (for development only - these are not real Supabase auth users)
-- WARNING: Direct auth.users inserts create database records but not authenticated users
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES
  (gen_random_uuid(), 'alice.johnson@example.com', NOW(), NOW(), NOW(), '{"name": "Alice Johnson"}'),
  (gen_random_uuid(), 'bob.smith@example.com', NOW(), NOW(), NOW(), '{"name": "Bob Smith"}'),
  (gen_random_uuid(), 'charlie.brown@example.com', NOW(), NOW(), NOW(), '{"name": "Charlie Brown"}'),
  (gen_random_uuid(), 'diana.prince@example.com', NOW(), NOW(), NOW(), '{"name": "Diana Prince"}'),
  (gen_random_uuid(), 'edward.norton@example.com', NOW(), NOW(), NOW(), '{"name": "Edward Norton"}'),
  (gen_random_uuid(), 'fiona.green@example.com', NOW(), NOW(), NOW(), '{"name": "Fiona Green"}'),
  (gen_random_uuid(), 'george.lucas@example.com', NOW(), NOW(), NOW(), '{"name": "George Lucas"}'),
  (gen_random_uuid(), 'helen.troy@example.com', NOW(), NOW(), NOW(), '{"name": "Helen Troy"}'),
  (gen_random_uuid(), 'ian.fleming@example.com', NOW(), NOW(), NOW(), '{"name": "Ian Fleming"}'),
  (gen_random_uuid(), 'julia.roberts@example.com', NOW(), NOW(), NOW(), '{"name": "Julia Roberts"}'),
  (gen_random_uuid(), 'kevin.hart@example.com', NOW(), NOW(), NOW(), '{"name": "Kevin Hart"}'),
  (gen_random_uuid(), 'laura.croft@example.com', NOW(), NOW(), NOW(), '{"name": "Laura Croft"}'),
  (gen_random_uuid(), 'michael.jordan@example.com', NOW(), NOW(), NOW(), '{"name": "Michael Jordan"}'),
  (gen_random_uuid(), 'nancy.drew@example.com', NOW(), NOW(), NOW(), '{"name": "Nancy Drew"}'),
  (gen_random_uuid(), 'oliver.twist@example.com', NOW(), NOW(), NOW(), '{"name": "Oliver Twist"}'),
  (gen_random_uuid(), 'patricia.cornwell@example.com', NOW(), NOW(), NOW(), '{"name": "Patricia Cornwell"}'),
  (gen_random_uuid(), 'quincy.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Quincy Jones"}'),
  (gen_random_uuid(), 'rachel.green@example.com', NOW(), NOW(), NOW(), '{"name": "Rachel Green"}'),
  (gen_random_uuid(), 'steven.spielberg@example.com', NOW(), NOW(), NOW(), '{"name": "Steven Spielberg"}'),
  (gen_random_uuid(), 'tina.fey@example.com', NOW(), NOW(), NOW(), '{"name": "Tina Fey"}'),
  (gen_random_uuid(), 'ursula.k.le.guin@example.com', NOW(), NOW(), NOW(), '{"name": "Ursula K. Le Guin"}'),
  (gen_random_uuid(), 'vincent.van.gogh@example.com', NOW(), NOW(), NOW(), '{"name": "Vincent van Gogh"}'),
  (gen_random_uuid(), 'wanda.maximoff@example.com', NOW(), NOW(), NOW(), '{"name": "Wanda Maximoff"}'),
  (gen_random_uuid(), 'xavier.charles@example.com', NOW(), NOW(), NOW(), '{"name": "Xavier Charles"}'),
  (gen_random_uuid(), 'yoda.master@example.com', NOW(), NOW(), NOW(), '{"name": "Yoda Master"}'),
  (gen_random_uuid(), 'zoe.saldana@example.com', NOW(), NOW(), NOW(), '{"name": "Zoe Saldana"}'),
  (gen_random_uuid(), 'aaron.carter@example.com', NOW(), NOW(), NOW(), '{"name": "Aaron Carter"}'),
  (gen_random_uuid(), 'bella.swan@example.com', NOW(), NOW(), NOW(), '{"name": "Bella Swan"}'),
  (gen_random_uuid(), 'casper.friendly@example.com', NOW(), NOW(), NOW(), '{"name": "Casper Friendly"}'),
  (gen_random_uuid(), 'dora.explorer@example.com', NOW(), NOW(), NOW(), '{"name": "Dora Explorer"}'),
  (gen_random_uuid(), 'ethan.hunt@example.com', NOW(), NOW(), NOW(), '{"name": "Ethan Hunt"}'),
  (gen_random_uuid(), 'felicity.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Felicity Jones"}'),
  (gen_random_uuid(), 'gandalf.grey@example.com', NOW(), NOW(), NOW(), '{"name": "Gandalf Grey"}'),
  (gen_random_uuid(), 'holly.golightly@example.com', NOW(), NOW(), NOW(), '{"name": "Holly Golightly"}'),
  (gen_random_uuid(), 'indiana.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Indiana Jones"}'),
  (gen_random_uuid(), 'jessica.rabbit@example.com', NOW(), NOW(), NOW(), '{"name": "Jessica Rabbit"}'),
  (gen_random_uuid(), 'kyle.reese@example.com', NOW(), NOW(), NOW(), '{"name": "Kyle Reese"}'),
  (gen_random_uuid(), 'lara.croft@example.com', NOW(), NOW(), NOW(), '{"name": "Lara Croft"}'),
  (gen_random_uuid(), 'morpheus.neo@example.com', NOW(), NOW(), NOW(), '{"name": "Morpheus Neo"}'),
  (gen_random_uuid(), 'natalie.portman@example.com', NOW(), NOW(), NOW(), '{"name": "Natalie Portman"}'),
  (gen_random_uuid(), 'oscar.wilde@example.com', NOW(), NOW(), NOW(), '{"name": "Oscar Wilde"}'),
  (gen_random_uuid(), 'penny.lane@example.com', NOW(), NOW(), NOW(), '{"name": "Penny Lane"}'),
  (gen_random_uuid(), 'quasimodo.bell@example.com', NOW(), NOW(), NOW(), '{"name": "Quasimodo Bell"}'),
  (gen_random_uuid(), 'remy.ratatouille@example.com', NOW(), NOW(), NOW(), '{"name": "Remy Ratatouille"}'),
  (gen_random_uuid(), 'scarlett.johansson@example.com', NOW(), NOW(), NOW(), '{"name": "Scarlett Johansson"}'),
  (gen_random_uuid(), 'tony.stark@example.com', NOW(), NOW(), NOW(), '{"name": "Tony Stark"}'),
  (gen_random_uuid(), 'uma.thurman@example.com', NOW(), NOW(), NOW(), '{"name": "Uma Thurman"}'),
  (gen_random_uuid(), 'victor.frankenstein@example.com', NOW(), NOW(), NOW(), '{"name": "Victor Frankenstein"}'),
  (gen_random_uuid(), 'winnie.pooh@example.com', NOW(), NOW(), NOW(), '{"name": "Winnie Pooh"}'),
  (gen_random_uuid(), 'xena.warrior@example.com', NOW(), NOW(), NOW(), '{"name": "Xena Warrior"}')
ON CONFLICT DO NOTHING;

-- Credit packages
INSERT INTO credit_packages (name, credits, price) VALUES ('Basic', 500, 999), ('Pro', 2000, 2999);

-- Packages
INSERT INTO packages (name, type, price_monthly, credits_monthly, features) VALUES
('Free', 'free', 0, 50, '{"vote": true}'),
('Student', 'student', 999, 500, '{"create": true, "models": true}'),
('Enterprise', 'enterprise', 2999, 2000, '{"all": true, "team": true}');