import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLIC_KEY,
);

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
  try {
    console.log("Creating 50 test users via Supabase signup...");

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const email = `testuser${Date.now() + i}@example.com`; // Unique email like in the test
      const password = "TestPass123!";

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) {
          console.error(`Error signing up ${name}:`, error.message);
        } else {
          console.log(`Created user: ${name} (${email}) - ID: ${data.user.id}`);
        }
      } catch (error) {
        console.error(`Error for ${name}:`, error.message);
      }

      // Delay to avoid rate limiting (1 user every 2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("All 50 users created successfully!");
  } catch (error) {
    console.error("Error in createUsers:", error);
  }
}

createUsers();
