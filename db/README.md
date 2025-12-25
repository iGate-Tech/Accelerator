# Database Management

This directory contains all database-related files and scripts for the Accelerator project.

## Files

- `schema.sql` - Complete database schema with tables, RLS policies, indexes, and functions
- `seeds.sql` - Sample data for initial database population
- `reset_database.sql` - Script to reset the database (if exists)
- `current_schema.sql` - Generated file containing the current database schema (after running db:get-schema)

## npm Scripts

Use these commands to manage the database:

- `npm run db:get-schema` - Dump current database schema to `db/current_schema.sql`
- `npm run db:update-schema` - Apply `db/schema.sql` to the database
- `npm run db:upload-seeds` - Insert sample data from `db/seeds.sql`
- `npm run db:reset-full` - Reset entire database (drops all public tables)

## Environment Setup

Before running database scripts, ensure your environment variables are loaded:

```bash
source .env
```

Or set `SUPABASE_DB_URL` directly:

```bash
export SUPABASE_DB_URL="postgresql://postgres:[SERVICE_KEY]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

## Workflow

1. **Initial Setup**: `npm run db:update-schema` (applies full schema)
2. **Add Sample Data**: `npm run db:upload-seeds`
3. **Check Current Schema**: `npm run db:get-schema`
4. **Reset if Needed**: `npm run db:reset-full` (destructive!)

## Notes

- All scripts use `SUPABASE_DB_URL` for database connection
- Schema includes Row Level Security (RLS) policies
- Sample data includes credit packages and subscription plans
