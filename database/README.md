# Database Schema Management

This folder contains the centralized schema definitions for the Accelerator application, providing one source of truth for both local PGLite and Supabase databases.

## Structure

- `base.sql`: Core table definitions without environment-specific auth or extensions
- `supabase-extensions.sql`: Supabase-specific additions (UUID user references, RLS policies, storage, packages)
- `local-extensions.sql`: PGLite/local-specific additions (local users table, TEXT user IDs)

- `supabase-update.sql`: Generated update script for applying changes to Supabase
- `local-update.sql`: Update script for resetting local PGLite database in development
- `docker-compose.yml`: Local Supabase development setup

## Usage

### Local Development
The local PGLite database automatically uses `base.sql` + `local-extensions.sql` when initializing.

### Supabase Updates
1. Make changes to `base.sql` for core schema updates
2. Update extensions if needed
3. Run `npm run update-supabase-schema` to generate `src/supabase-schema-update.sql`
4. Run `npm run apply-schema` to apply to Supabase

## Schema Differences

| Aspect | Local (PGLite) | Supabase |
|--------|---------------|----------|
| User IDs | TEXT | UUID (references auth.users) |
| Auth | Local users table | Supabase auth system |
| Security | None | Row Level Security (RLS) |
| Storage | IndexedDB | PostgreSQL + Storage API |

## Sync

Data synchronization between local and remote handles ID mapping (TEXT ↔ UUID) and schema differences automatically.