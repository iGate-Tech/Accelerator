#!/usr/bin/env node

const names = [
  "Alice Johnson",
  "Bob Smith",
  "Charlie Brown",
  "Diana Prince",
  "Edward Norton",
  "Fiona Green",
  "George Lucas",
  "Helen Troy",
  "Ian Fleming",
  "Julia Roberts",
  "Kevin Hart",
  "Laura Croft",
  "Michael Jordan",
  "Nancy Drew",
  "Oliver Twist",
  "Patricia Cornwell",
  "Quincy Jones",
  "Rachel Green",
  "Steven Spielberg",
  "Tina Fey",
  "Ursula K. Le Guin",
  "Vincent van Gogh",
  "Wanda Maximoff",
  "Xavier Charles",
  "Yoda Master",
  "Zoe Saldana",
  "Aaron Carter",
  "Bella Swan",
  "Casper Friendly",
  "Dora Explorer",
  "Ethan Hunt",
  "Felicity Jones",
  "Gandalf Grey",
  "Holly Golightly",
  "Indiana Jones",
  "Jessica Rabbit",
  "Kyle Reese",
  "Lara Croft",
  "Morpheus Neo",
  "Natalie Portman",
  "Oscar Wilde",
  "Penny Lane",
  "Quasimodo Bell",
  "Remy Ratatouille",
  "Scarlett Johansson",
  "Tony Stark",
  "Uma Thurman",
  "Victor Frankenstein",
  "Winnie Pooh",
  "Xena Warrior",
];

console.log("-- Generated seed data for 50 test auth users");
console.log(
  "-- WARNING: These are database records, not real Supabase authenticated users",
);
console.log("");

console.log(
  "INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES",
);

const authUsers = names.map((name, index) => {
  const id = `550e8400-e29b-41d4-a716-44665544${index.toString().padStart(3, "0")}`;
  const email = `${name.toLowerCase().replace(/[^a-zA-Z0-9]/g, ".")}@example.com`;
  const comma = index < names.length - 1 ? "," : "";
  return `  ('${id}', '${email}', NOW(), NOW(), NOW(), '{"name": "${name}"}')${comma}`;
});

console.log(authUsers.join("\n"));
console.log("ON CONFLICT (id) DO NOTHING;");
console.log("");

console.log(
  "INSERT INTO profiles (user_id, name, credit_balance, package_type, created_at, updated_at) VALUES",
);

const profiles = names.map((name, index) => {
  const id = `550e8400-e29b-41d4-a716-44665544${index.toString().padStart(3, "0")}`;
  const credits = Math.floor(Math.random() * 1000) + 500; // 500-1500 credits
  const comma = index < names.length - 1 ? "," : "";
  return `  ('${id}', '${name}', ${credits}, 'free', NOW(), NOW())${comma}`;
});

console.log(profiles.join("\n"));
console.log("ON CONFLICT (user_id) DO NOTHING;");
