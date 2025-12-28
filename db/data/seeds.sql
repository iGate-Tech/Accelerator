-- Sample data for Accelerator database
-- Run after schema setup

-- Test auth users (for development only - these are not real Supabase auth users)
-- WARNING: Direct auth.users inserts create database records but not authenticated users
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'alice.johnson@example.com', NOW(), NOW(), NOW(), '{"name": "Alice Johnson"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'bob.smith@example.com', NOW(), NOW(), NOW(), '{"name": "Bob Smith"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'charlie.brown@example.com', NOW(), NOW(), NOW(), '{"name": "Charlie Brown"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'diana.prince@example.com', NOW(), NOW(), NOW(), '{"name": "Diana Prince"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'edward.norton@example.com', NOW(), NOW(), NOW(), '{"name": "Edward Norton"}')
ON CONFLICT (id) DO NOTHING;

-- Corresponding profiles
INSERT INTO profiles (user_id, name, credit_balance, package_type, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Alice Johnson', 1000, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Bob Smith', 950, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Charlie Brown', 1200, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Diana Prince', 800, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Edward Norton', 1100, 'free', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Test auth users (for development only - these are database records, not real Supabase authenticated users)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES
  ('550e8400-e29b-41d4-a716-44665544000', 'alice.johnson@example.com', NOW(), NOW(), NOW(), '{"name": "Alice Johnson"}'),
  ('550e8400-e29b-41d4-a716-44665544001', 'bob.smith@example.com', NOW(), NOW(), NOW(), '{"name": "Bob Smith"}'),
  ('550e8400-e29b-41d4-a716-44665544002', 'charlie.brown@example.com', NOW(), NOW(), NOW(), '{"name": "Charlie Brown"}'),
  ('550e8400-e29b-41d4-a716-44665544003', 'diana.prince@example.com', NOW(), NOW(), NOW(), '{"name": "Diana Prince"}'),
  ('550e8400-e29b-41d4-a716-44665544004', 'edward.norton@example.com', NOW(), NOW(), NOW(), '{"name": "Edward Norton"}'),
  ('550e8400-e29b-41d4-a716-44665544005', 'fiona.green@example.com', NOW(), NOW(), NOW(), '{"name": "Fiona Green"}'),
  ('550e8400-e29b-41d4-a716-44665544006', 'george.lucas@example.com', NOW(), NOW(), NOW(), '{"name": "George Lucas"}'),
  ('550e8400-e29b-41d4-a716-44665544007', 'helen.troy@example.com', NOW(), NOW(), NOW(), '{"name": "Helen Troy"}'),
  ('550e8400-e29b-41d4-a716-44665544008', 'ian.fleming@example.com', NOW(), NOW(), NOW(), '{"name": "Ian Fleming"}'),
  ('550e8400-e29b-41d4-a716-44665544009', 'julia.roberts@example.com', NOW(), NOW(), NOW(), '{"name": "Julia Roberts"}'),
  ('550e8400-e29b-41d4-a716-44665544010', 'kevin.hart@example.com', NOW(), NOW(), NOW(), '{"name": "Kevin Hart"}'),
  ('550e8400-e29b-41d4-a716-44665544011', 'laura.croft@example.com', NOW(), NOW(), NOW(), '{"name": "Laura Croft"}'),
  ('550e8400-e29b-41d4-a716-44665544012', 'michael.jordan@example.com', NOW(), NOW(), NOW(), '{"name": "Michael Jordan"}'),
  ('550e8400-e29b-41d4-a716-44665544013', 'nancy.drew@example.com', NOW(), NOW(), NOW(), '{"name": "Nancy Drew"}'),
  ('550e8400-e29b-41d4-a716-44665544014', 'oliver.twist@example.com', NOW(), NOW(), NOW(), '{"name": "Oliver Twist"}'),
  ('550e8400-e29b-41d4-a716-44665544015', 'patricia.cornwell@example.com', NOW(), NOW(), NOW(), '{"name": "Patricia Cornwell"}'),
  ('550e8400-e29b-41d4-a716-44665544016', 'quincy.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Quincy Jones"}'),
  ('550e8400-e29b-41d4-a716-44665544017', 'rachel.green@example.com', NOW(), NOW(), NOW(), '{"name": "Rachel Green"}'),
  ('550e8400-e29b-41d4-a716-44665544018', 'steven.spielberg@example.com', NOW(), NOW(), NOW(), '{"name": "Steven Spielberg"}'),
  ('550e8400-e29b-41d4-a716-44665544019', 'tina.fey@example.com', NOW(), NOW(), NOW(), '{"name": "Tina Fey"}'),
  ('550e8400-e29b-41d4-a716-44665544020', 'ursula.k.le.guin@example.com', NOW(), NOW(), NOW(), '{"name": "Ursula K. Le Guin"}'),
  ('550e8400-e29b-41d4-a716-44665544021', 'vincent.van.gogh@example.com', NOW(), NOW(), NOW(), '{"name": "Vincent van Gogh"}'),
  ('550e8400-e29b-41d4-a716-44665544022', 'wanda.maximoff@example.com', NOW(), NOW(), NOW(), '{"name": "Wanda Maximoff"}'),
  ('550e8400-e29b-41d4-a716-44665544023', 'xavier.charles@example.com', NOW(), NOW(), NOW(), '{"name": "Xavier Charles"}'),
  ('550e8400-e29b-41d4-a716-44665544024', 'yoda.master@example.com', NOW(), NOW(), NOW(), '{"name": "Yoda Master"}'),
  ('550e8400-e29b-41d4-a716-44665544025', 'zoe.saldana@example.com', NOW(), NOW(), NOW(), '{"name": "Zoe Saldana"}'),
  ('550e8400-e29b-41d4-a716-44665544026', 'aaron.carter@example.com', NOW(), NOW(), NOW(), '{"name": "Aaron Carter"}'),
  ('550e8400-e29b-41d4-a716-44665544027', 'bella.swan@example.com', NOW(), NOW(), NOW(), '{"name": "Bella Swan"}'),
  ('550e8400-e29b-41d4-a716-44665544028', 'casper.friendly@example.com', NOW(), NOW(), NOW(), '{"name": "Casper Friendly"}'),
  ('550e8400-e29b-41d4-a716-44665544029', 'dora.explorer@example.com', NOW(), NOW(), NOW(), '{"name": "Dora Explorer"}'),
  ('550e8400-e29b-41d4-a716-44665544030', 'ethan.hunt@example.com', NOW(), NOW(), NOW(), '{"name": "Ethan Hunt"}'),
  ('550e8400-e29b-41d4-a716-44665544031', 'felicity.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Felicity Jones"}'),
  ('550e8400-e29b-41d4-a716-44665544032', 'gandalf.grey@example.com', NOW(), NOW(), NOW(), '{"name": "Gandalf Grey"}'),
  ('550e8400-e29b-41d4-a716-44665544033', 'holly.golightly@example.com', NOW(), NOW(), NOW(), '{"name": "Holly Golightly"}'),
  ('550e8400-e29b-41d4-a716-44665544034', 'indiana.jones@example.com', NOW(), NOW(), NOW(), '{"name": "Indiana Jones"}'),
  ('550e8400-e29b-41d4-a716-44665544035', 'jessica.rabbit@example.com', NOW(), NOW(), NOW(), '{"name": "Jessica Rabbit"}'),
  ('550e8400-e29b-41d4-a716-44665544036', 'kyle.reese@example.com', NOW(), NOW(), NOW(), '{"name": "Kyle Reese"}'),
  ('550e8400-e29b-41d4-a716-44665544037', 'lara.croft@example.com', NOW(), NOW(), NOW(), '{"name": "Lara Croft"}'),
  ('550e8400-e29b-41d4-a716-44665544038', 'morpheus.neo@example.com', NOW(), NOW(), NOW(), '{"name": "Morpheus Neo"}'),
  ('550e8400-e29b-41d4-a716-44665544039', 'natalie.portman@example.com', NOW(), NOW(), NOW(), '{"name": "Natalie Portman"}'),
  ('550e8400-e29b-41d4-a716-44665544040', 'oscar.wilde@example.com', NOW(), NOW(), NOW(), '{"name": "Oscar Wilde"}'),
  ('550e8400-e29b-41d4-a716-44665544041', 'penny.lane@example.com', NOW(), NOW(), NOW(), '{"name": "Penny Lane"}'),
  ('550e8400-e29b-41d4-a716-44665544042', 'quasimodo.bell@example.com', NOW(), NOW(), NOW(), '{"name": "Quasimodo Bell"}'),
  ('550e8400-e29b-41d4-a716-44665544043', 'remy.ratatouille@example.com', NOW(), NOW(), NOW(), '{"name": "Remy Ratatouille"}'),
  ('550e8400-e29b-41d4-a716-44665544044', 'scarlett.johansson@example.com', NOW(), NOW(), NOW(), '{"name": "Scarlett Johansson"}'),
  ('550e8400-e29b-41d4-a716-44665544045', 'tony.stark@example.com', NOW(), NOW(), NOW(), '{"name": "Tony Stark"}'),
  ('550e8400-e29b-41d4-a716-44665544046', 'uma.thurman@example.com', NOW(), NOW(), NOW(), '{"name": "Uma Thurman"}'),
  ('550e8400-e29b-41d4-a716-44665544047', 'victor.frankenstein@example.com', NOW(), NOW(), NOW(), '{"name": "Victor Frankenstein"}'),
  ('550e8400-e29b-41d4-a716-44665544048', 'winnie.pooh@example.com', NOW(), NOW(), NOW(), '{"name": "Winnie Pooh"}'),
  ('550e8400-e29b-41d4-a716-44665544049', 'xena.warrior@example.com', NOW(), NOW(), NOW(), '{"name": "Xena Warrior"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (user_id, name, credit_balance, package_type, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-44665544000', 'Alice Johnson', 757, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544001', 'Bob Smith', 1122, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544002', 'Charlie Brown', 1445, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544003', 'Diana Prince', 974, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544004', 'Edward Norton', 1233, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544005', 'Fiona Green', 558, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544006', 'George Lucas', 558, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544007', 'Helen Troy', 1451, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544008', 'Ian Fleming', 1179, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544009', 'Julia Roberts', 540, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544010', 'Kevin Hart', 1182, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544011', 'Laura Croft', 1404, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544012', 'Michael Jordan', 782, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544013', 'Nancy Drew', 1244, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544014', 'Oliver Twist', 603, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544015', 'Patricia Cornwell', 1369, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544016', 'Quincy Jones', 1361, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544017', 'Rachel Green', 722, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544018', 'Steven Spielberg', 1109, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544019', 'Tina Fey', 842, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544020', 'Ursula K. Le Guin', 511, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544021', 'Vincent van Gogh', 572, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544022', 'Wanda Maximoff', 1375, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544023', 'Xavier Charles', 1012, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544024', 'Yoda Master', 1263, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544025', 'Zoe Saldana', 1435, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544026', 'Aaron Carter', 832, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544027', 'Bella Swan', 955, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544028', 'Casper Friendly', 1163, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544029', 'Dora Explorer', 1143, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544030', 'Ethan Hunt', 930, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544031', 'Felicity Jones', 657, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544032', 'Gandalf Grey', 577, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544033', 'Holly Golightly', 1471, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544034', 'Indiana Jones', 525, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544035', 'Jessica Rabbit', 1019, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544036', 'Kyle Reese', 1280, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544037', 'Lara Croft', 799, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544038', 'Morpheus Neo', 1245, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544039', 'Natalie Portman', 1016, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544040', 'Oscar Wilde', 884, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544041', 'Penny Lane', 1347, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544042', 'Quasimodo Bell', 1272, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544043', 'Remy Ratatouille', 1295, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544044', 'Scarlett Johansson', 1097, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544045', 'Tony Stark', 1148, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544046', 'Uma Thurman', 736, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544047', 'Victor Frankenstein', 918, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544048', 'Winnie Pooh', 1320, 'free', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-44665544049', 'Xena Warrior', 1484, 'free', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Credit packages
INSERT INTO credit_packages (name, credits, price) VALUES ('Basic', 500, 999), ('Pro', 2000, 2999);

-- Packages
INSERT INTO packages (name, type, price_monthly, credits_monthly, features) VALUES
('Free', 'free', 0, 50, '{"vote": true}'),
('Student', 'student', 999, 500, '{"create": true, "models": true}'),
('Enterprise', 'enterprise', 2999, 2000, '{"all": true, "team": true}');