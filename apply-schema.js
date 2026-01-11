#!/usr/bin/env node

// Apply Supabase schema using service role
require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env');
  console.error('Get it from Supabase Dashboard > Settings > Database > Connection string');
  console.error('Use the "Direct connection" URI (not pooled)');
  process.exit(1);
}

async function applySchema() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('Reading schema file...');
    const schema = fs.readFileSync('database/supabase-update.sql', 'utf8');

    console.log('Applying schema...');
    // Split schema into statements and execute them individually to handle errors
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement + ';');
      } catch (error) {
        // Skip policy already exists errors
        if (!error.message.includes('already exists') &&
            !error.message.includes('does not exist')) {
          console.warn(`Warning: ${error.message}`);
        }
      }
    }
    console.log('✅ Schema applied successfully');

    console.log('Verifying RLS and policies...');
    const result = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('projects', 'tasks', 'groups', 'credits', 'billing')
      ORDER BY tablename;
    `);

    console.log('RLS Status:');
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
    });

    const policies = await client.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    console.log('Policies Created:');
    policies.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.policyname}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

applySchema();