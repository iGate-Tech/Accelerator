// create-user-favorites-table.js - One-time script to create user_favorites table
import { createClient } from "@supabase/supabase-js";
import config from "../lib/config.js";

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

async function createUserFavoritesTable() {
  try {
    // Create the table
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS user_favorites (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, idea_id)
        );
      `,
    });

    if (createError) {
      console.error("Error creating table:", createError);
      return;
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;",
    });

    if (rlsError) {
      console.error("Error enabling RLS:", rlsError);
      return;
    }

    // Create policy
    const { error: policyError } = await supabase.rpc("exec_sql", {
      sql: 'CREATE POLICY "Users can manage own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);',
    });

    if (policyError) {
      console.error("Error creating policy:", policyError);
      return;
    }

    console.log("user_favorites table created successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  }
}

createUserFavoritesTable();
