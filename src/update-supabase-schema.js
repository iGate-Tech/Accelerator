const fs = require('fs');
const path = require('path');

// Read base schema and Supabase extensions
const baseSchema = fs.readFileSync(path.join(__dirname, '..', 'database', 'base.sql'), 'utf8');
const supabaseExtensions = fs.readFileSync(path.join(__dirname, '..', 'database', 'supabase-extensions.sql'), 'utf8');

// Combine them
const sql = baseSchema + '\n\n' + supabaseExtensions;

// Write to the update file
const filePath = path.join(__dirname, '..', 'database', 'supabase-update.sql');
fs.writeFileSync(filePath, sql);
console.log('Supabase schema update SQL written to:', filePath);
console.log('Copy and paste the contents into your Supabase SQL editor to apply the updates.');