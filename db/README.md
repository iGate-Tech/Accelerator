# Database Management

This directory contains all database-related files and scripts for the Accelerator project.

## Files

- `schema.sql` - Complete database schema with tables, RLS policies, indexes, and functions
- `views.sql` - Database views for simplified queries and data aggregation
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

## Architecture Overview

The Accelerator application follows a **database-driven architecture** where business logic is primarily implemented in the database layer, with a thin server layer handling only:

- **AI Integration**: External API calls to OpenAI, Anthropic, etc.
- **Rendering**: Template rendering and response formatting
- **File Handling**: Uploads, downloads, cloud storage operations
- **External Services**: Stripe webhooks, email sending, authentication

### Database Layer Responsibilities

**Functions (63 total):**

- **User Management**: Profile operations, registration, package upgrades
- **Business Logic**: Ideas, voting, rewards, models, portfolios, payments
- **Credit System**: Atomic transactions with proper validation
- **Analytics**: Reporting, aggregations, performance monitoring

**Views (8 total):**

- **Pre-computed Aggregations**: Dashboard stats, idea rankings, user progress
- **Performance Optimization**: Reduce complex queries to simple view selects

### Server Layer Responsibilities

**Thin Application Layer:**

- Route handling with single RPC calls to database functions
- Middleware for authentication and context loading
- External API integrations (AI services, payments)
- File processing and cloud storage
- Response formatting and error handling

### Benefits

- **Performance**: Pre-computed aggregations, atomic transactions
- **Maintainability**: Single source of truth for business logic
- **Scalability**: Database handles complex operations efficiently
- **Security**: Business rules enforced at database level
- **Testability**: Database functions can be independently tested

## Migration from Previous Architecture

The application was migrated from server-heavy business logic to database-driven architecture:

**Before:**

- Complex server-side calculations and validations
- Multiple database queries per request (8-15 queries)
- Business logic scattered across services and routes

**After:**

- All business logic in database functions
- Single RPC calls per operation (1-2 queries)
- Server focuses on UI, external APIs, and coordination

## Notes

- All scripts use `SUPABASE_DB_URL` for database connection
- Schema includes Row Level Security (RLS) policies
- Sample data includes credit packages and subscription plans
- Database functions use `SECURITY DEFINER` for proper access control
