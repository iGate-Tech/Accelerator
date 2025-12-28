-- Sample data for Accelerator database
-- Run after schema setup

-- Test auth users (for development only - these are not real Supabase auth users)
-- WARNING: Direct auth.users inserts create database records but not authenticated users
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES
  ('550e8400-e29b-41d4-a716-44665544000'::uuid, 'alice.johnson@example.com', NOW(), NOW(), NOW(), '{"name": "Alice Johnson"}'),
  ('550e8400-e29b-41d4-a716-44665544001'::uuid, 'bob.smith@example.com', NOW(), NOW(), NOW(), '{"name": "Bob Smith"}'),
  ('550e8400-e29b-41d4-a716-44665544002'::uuid, 'charlie.brown@example.com', NOW(), NOW(), NOW(), '{"name": "Charlie Brown"}'),
  ('550e8400-e29b-41d4-a716-44665544003'::uuid, 'diana.prince@example.com', NOW(), NOW(), NOW(), '{"name": "Diana Prince"}'),
  ('550e8400-e29b-41d4-a716-44665544004'::uuid, 'edward.norton@example.com', NOW(), NOW(), NOW(), '{"name": "Edward Norton"}'),
  ('550e8400-e29b-41d4-a716-44665544005'::uuid, 'fiona.green@example.com', NOW(), NOW(), NOW(), '{"name": "Fiona Green"}'),
  ('550e8400-e29b-41d4-a716-44665544006'::uuid, 'george.lucas@example.com', NOW(), NOW(), NOW(), '{"name": "George Lucas"}'),
  ('550e8400-e29b-41d4-a716-44665544007'::uuid, 'helen.troy@example.com', NOW(), NOW(), NOW(), '{"name": "Helen Troy"}'),
  ('550e8400-e29b-41d4-a716-44665544008'::uuid, 'ian.fleming@example.com', NOW(), NOW(), NOW(), '{"name": "Ian Fleming"}'),
  ('550e8400-e29b-41d4-a716-44665544009'::uuid, 'julia.roberts@example.com', NOW(), NOW(), NOW(), '{"name": "Julia Roberts"}'),
  ('550e8400-e29b-41d4-a716-44665544010'::uuid, 'kevin.hart@example.com', NOW(), NOW(), NOW(), '{"name": "Kevin Hart"}'),
  ('550e8400-e29b-41d4-a716-44665544011'::uuid, 'laura.croft@example.com', NOW(), NOW(), NOW(), '{"name": "Laura Croft"}'),
  ('550e8400-e29b-41d4-a716-44665544012'::uuid, 'michael.jordan@example.com', NOW(), NOW(), NOW(), '{"name": "Michael Jordan"}'),
  ('550e8400-e29b-41d4-a716-44665544013'::uuid, 'nancy.drew@example.com', NOW(), NOW(), NOW(), '{"name": "Nancy Drew"}'),
  ('550e8400-e29b-41d4-a716-44665544014'::uuid, 'oliver.twist@example.com', NOW(), NOW(), NOW(), '{"name": "Oliver Twist"}'),
  ('550e8400-e29b-41d4-a716-44665544015'::uuid, 'patricia.cornwell@example.com', NOW(), NOW(), NOW(), '{"name": "Patricia Cornwell"}'),
  ('550e8400-e29b-41d4-a716-44665544016'::uuid, 'quincy.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Quincy Jones"}'),
  ('550e8400-e29b-41d4-a716-44665544017'::uuid, 'rachel.green@example.com', NOW(), NOW(), NOW(), '{"name": "Rachel Green"}'),
  ('550e8400-e29b-41d4-a716-44665544018'::uuid, 'steven.spielberg@example.com', NOW(), NOW(), NOW(), '{"name": "Steven Spielberg"}'),
  ('550e8400-e29b-41d4-a716-44665544019'::uuid, 'tina.fey@example.com', NOW(), NOW(), NOW(), '{"name": "Tina Fey"}'),
  ('550e8400-e29b-41d4-a716-44665544020'::uuid, 'ursula.k.le.guin@example.com', NOW(), NOW(), NOW(), '{"name": "Ursula K. Le Guin"}'),
  ('550e8400-e29b-41d4-a716-44665544021'::uuid, 'vincent.van.gogh@example.com', NOW(), NOW(), NOW(), '{"name": "Vincent van Gogh"}'),
  ('550e8400-e29b-41d4-a716-44665544022'::uuid, 'wanda.maximoff@example.com', NOW(), NOW(), NOW(), '{"name": "Wanda Maximoff"}'),
  ('550e8400-e29b-41d4-a716-44665544023'::uuid, 'xavier.charles@example.com', NOW(), NOW(), NOW(), '{"name": "Xavier Charles"}'),
  ('550e8400-e29b-41d4-a716-44665544024'::uuid, 'yoda.master@example.com', NOW(), NOW(), NOW(), '{"name": "Yoda Master"}'),
  ('550e8400-e29b-41d4-a716-44665544025'::uuid, 'zoe.saldana@example.com', NOW(), NOW(), NOW(), '{"name": "Zoe Saldana"}'),
  ('550e8400-e29b-41d4-a716-44665544026'::uuid, 'aaron.carter@example.com', NOW(), NOW(), NOW(), '{"name": "Aaron Carter"}'),
  ('550e8400-e29b-41d4-a716-44665544027'::uuid, 'bella.swan@example.com', NOW(), NOW(), NOW(), '{"name": "Bella Swan"}'),
  ('550e8400-e29b-41d4-a716-44665544028'::uuid, 'casper.friendly@example.com', NOW(), NOW(), NOW(), '{"name": "Casper Friendly"}'),
  ('550e8400-e29b-41d4-a716-44665544029'::uuid, 'dora.explorer@example.com', NOW(), NOW(), NOW(), '{"name": "Dora Explorer"}'),
  ('550e8400-e29b-41d4-a716-44665544030'::uuid, 'ethan.hunt@example.com', NOW(), NOW(), NOW(), '{"name": "Ethan Hunt"}'),
  ('550e8400-e29b-41d4-a716-44665544031'::uuid, 'felicity.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Felicity Jones"}'),
  ('550e8400-e29b-41d4-a716-44665544032'::uuid, 'gandalf.grey@example.com', NOW(), NOW(), NOW(), '{"name": "Gandalf Grey"}'),
  ('550e8400-e29b-41d4-a716-44665544033'::uuid, 'holly.golightly@example.com', NOW(), NOW(), NOW(), '{"name": "Holly Golightly"}'),
  ('550e8400-e29b-41d4-a716-44665544034'::uuid, 'indiana.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Indiana Jones"}'),
  ('550e8400-e29b-41d4-a716-44665544035'::uuid, 'jessica.rabbit@example.com', NOW(), NOW(), NOW(), '{"name": "Jessica Rabbit"}'),
  ('550e8400-e29b-41d4-a716-44665544036'::uuid, 'kyle.reese@example.com', NOW(), NOW(), NOW(), '{"name": "Kyle Reese"}'),
  ('550e8400-e29b-41d4-a716-44665544037'::uuid, 'lara.croft@example.com', NOW(), NOW(), NOW(), '{"name": "Lara Croft"}'),
  ('550e8400-e29b-41d4-a716-44665544038'::uuid, 'morpheus.neo@example.com', NOW(), NOW(), NOW(), '{"name": "Morpheus Neo"}'),
  ('550e8400-e29b-41d4-a716-44665544039'::uuid, 'natalie.portman@example.com', NOW(), NOW(), NOW(), '{"name": "Natalie Portman"}'),
  ('550e8400-e29b-41d4-a716-44665544040'::uuid, 'oscar.wilde@example.com', NOW(), NOW(), NOW(), '{"name": "Oscar Wilde"}'),
  ('550e8400-e29b-41d4-a716-44665544041'::uuid, 'penny.lane@example.com', NOW(), NOW(), NOW(), '{"name": "Penny Lane"}'),
  ('550e8400-e29b-41d4-a716-44665544042'::uuid, 'quasimodo.bell@example.com', NOW(), NOW(), NOW(), '{"name": "Quasimodo Bell"}'),
  ('550e8400-e29b-41d4-a716-44665544043'::uuid, 'remy.ratatouille@example.com', NOW(), NOW(), NOW(), '{"name": "Remy Ratatouille"}'),
  ('550e8400-e29b-41d4-a716-44665544044'::uuid, 'scarlett.johansson@example.com', NOW(), NOW(), NOW(), '{"name": "Scarlett Johansson"}'),
  ('550e8400-e29b-41d4-a716-44665544045'::uuid, 'tony.stark@example.com', NOW(), NOW(), NOW(), '{"name": "Tony Stark"}'),
  ('550e8400-e29b-41d4-a716-44665544046'::uuid, 'uma.thurman@example.com', NOW(), NOW(), NOW(), '{"name": "Uma Thurman"}'),
  ('550e8400-e29b-41d4-a716-44665544047'::uuid, 'victor.frankenstein@example.com', NOW(), NOW(), NOW(), '{"name": "Victor Frankenstein"}'),
  ('550e8400-e29b-41d4-a716-44665544048'::uuid, 'winnie.pooh@example.com', NOW(), NOW(), NOW(), '{"name": "Winnie Pooh"}'),
  ('550e8400-e29b-41d4-a716-44665544049'::uuid, 'xena.warrior@example.com', NOW(), NOW(), NOW(), '{"name": "Xena Warrior"}')
ON CONFLICT (id) DO NOTHING;

-- Credit packages
INSERT INTO credit_packages (name, credits, price) VALUES ('Basic', 500, 999), ('Pro', 2000, 2999);

-- Packages
INSERT INTO packages (name, type, price_monthly, credits_monthly, features) VALUES
('Free', 'free', 0, 50, '{"vote": true}'),
('Student', 'student', 999, 500, '{"create": true, "models": true}'),
('Enterprise', 'enterprise', 2999, 2000, '{"all": true, "team": true}');