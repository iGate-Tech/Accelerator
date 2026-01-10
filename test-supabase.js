#!/usr/bin/env node

// Test Supabase connection and schema
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Connection successful');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
  return true;
}

async function testTables() {
  console.log('\nTesting table access...');
  const tables = ['projects', 'tasks', 'groups', 'project_groups', 'credits', 'billing'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    } catch (error) {
      console.error(`❌ ${table}: ${error.message}`);
    }
  }
}

async function testRLS() {
  console.log('\nTesting RLS policies...');
  try {
    // Try to select from projects without auth (should fail or return empty)
    const { data, error } = await supabase.from('projects').select('*');
    if (error) {
      console.log('✅ RLS working: access denied without auth');
    } else if (data.length === 0) {
      console.log('✅ RLS working: no data returned without auth');
    } else {
      console.log('⚠️  RLS may not be properly configured');
    }
  } catch (error) {
    console.log('✅ RLS working: error accessing without auth');
  }
}

async function main() {
  console.log('🚀 Testing Supabase setup...\n');

  if (!(await testConnection())) return;

  await testTables();
  await testRLS();

  console.log('\n✨ Test complete');
}

main().catch(console.error);