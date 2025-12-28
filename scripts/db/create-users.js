import { Pool } from "pg";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";

config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

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

async function createUsers() {
  const client = await pool.connect();
  try {
    console.log("Creating 50 test users...");

    for (let i = 0; i < names.length; i++) {
      const userId = uuidv4();
      const name = names[i];
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
      const credits = Math.floor(Math.random() * 1000) + 500; // 500-1500 credits

      // Insert into auth.users
      await client.query(
        `
        INSERT INTO auth.users (id, email)
        VALUES ($1, $2)
        ON CONFLICT (id) DO NOTHING
      `,
        [userId, email],
      );

      // Insert into profiles
      await client.query(
        `
        INSERT INTO profiles (user_id, name, credit_balance, package_type)
        VALUES ($1, $2, $3, 'free')
        ON CONFLICT (user_id) DO NOTHING
      `,
        [userId, name, credits],
      );

      console.log(`Created user: ${name} (${email}) with ${credits} credits`);
    }

    console.log("All 50 users created successfully!");
  } catch (error) {
    console.error("Error creating users:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

createUsers();
