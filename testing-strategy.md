# Database Testing Strategy

This document outlines a comprehensive testing strategy for each database component folder in the specified order. Testing follows a dependency hierarchy, starting with components requiring minimal data and progressing to those needing more setup.

## 1. Extensions

**Purpose**: Verify PostgreSQL extensions are properly installed and functional.

**Testing Steps**:

- Run extension setup: `psql "$DATABASE_URL" -f db/setup/extensions/extensions.sql`
- Verify extension installation: `SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';`
- Test UUID generation: `SELECT uuid_generate_v4();`
- Expected: Extension exists and generates valid UUIDs without errors.

**Tools**: Direct psql queries, setup script in `db/setup/extensions/`

## 2. Tables

**Purpose**: Ensure all core database tables are created with correct schema.

**Testing Steps**:

- Apply table definitions: `psql "$DATABASE_URL" -f db/setup/tables/tables.sql`
- Verify table creation: Query `information_schema.tables` for all expected tables
- Check column definitions: `\d [table_name]` for each table
- Validate constraints: Attempt invalid inserts to test constraints
- Expected: All 21 tables exist with correct columns, types, and constraints.

**Tools**: psql `\d` commands, information_schema queries, `db/setup/tables/`

## 3. Indexes

**Purpose**: Confirm performance indexes and storage configurations are applied.

**Testing Steps**:

- Apply indexes: `psql "$DATABASE_URL" -f db/setup/indexes/indexes.sql`
- Verify index creation: Query `pg_indexes` for expected indexes
- Test index usage: Run EXPLAIN on relevant queries
- Check storage setup: Verify bucket configurations
- Expected: Indexes exist and improve query performance.

**Tools**: pg_indexes view, EXPLAIN ANALYZE, `db/setup/indexes/`

## 4. Policies

**Purpose**: Validate Row Level Security (RLS) policies enforce proper data access control.

**Testing Steps**:

- Apply policies: `psql "$DATABASE_URL" -f db/setup/policies/policies.sql`
- Enable RLS on tables: Verify `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Test policy enforcement: Attempt queries as different users/roles
- Insert seed users first if needed for auth testing
- Expected: Policies restrict access appropriately based on user context.

**Tools**: pg_policies view, role-based testing, `db/setup/policies/`

## 5. Functions

**Purpose**: Test business logic functions across all domains for correctness and performance.

**Testing Steps**:

- Apply functions in order: Run each orchestrator (`functions-core.sql`, `functions-user.sql`, etc.)
- Unit test functions: Call with various inputs, check outputs
- Integration testing: Test function interactions
- Performance testing: Time execution for complex functions
- Error handling: Test with invalid inputs
- Expected: All 41 functions execute correctly and handle edge cases.

**Tools**: psql function calls, custom test scripts, `db/setup/functions/`

**Function Categories to Test**:

- Core: Completion, voting, credits, notifications
- Credit System: Transactions, balances, validation
- Idea Management: CRUD, validation, workflow
- Voting & Rewards: Processing, distribution, leaderboards
- User Management: Profiles, registration, packages
- Model Management: AI lifecycle, progress tracking
- Portfolio Management: Organization, collaboration

## 6. Triggers

**Purpose**: Verify automated business rules and data integrity triggers work correctly.

**Testing Steps**:

- Apply triggers: `psql "$DATABASE_URL" -f db/setup/triggers/triggers.sql`
- Test trigger firing: Perform operations that should activate triggers
- Verify trigger effects: Check if expected actions occur (logging, notifications, etc.)
- Test trigger conditions: Ensure triggers fire only when appropriate
- Expected: All 15 triggers execute automatically on specified events.

**Tools**: Database operations to trigger events, audit logs, `db/setup/triggers/`

## 7. Views

**Purpose**: Validate data aggregation views return correct results and optimize queries.

**Testing Steps**:

- Apply views: `psql "$DATABASE_URL" -f db/setup/views/views.sql`
- Populate test data: Insert minimal data into related tables
- Query views: Verify results match expected aggregations
- Performance testing: Compare view vs. raw query performance
- Test all view types: Production dashboards, feeds, analytics, testing views
- Expected: All 40 views return accurate data efficiently.

**Tools**: View queries, performance benchmarks, `db/setup/views/`

## 8. Seeds

**Purpose**: Confirm seed data is inserted correctly and maintains referential integrity.

**Testing Steps**:

- Apply seeds in order: Run individual seed files or use npm script
- Verify data insertion: Count rows in seeded tables
- Check data relationships: Validate foreign keys and constraints
- Test seeded data functionality: Use with functions/views that depend on data
- Clean up: Use reset scripts between test runs
- Expected: All seed data inserted without errors, relationships intact.

**Tools**: Row counts, constraint checks, `db/seeds/`, reset scripts

## Automated Testing Commands

```bash
# Full automated testing
npm run db:install  # Reset + setup + seed + test

# Individual component testing
node scripts/setup/extensions/setup-extensions.js
node scripts/setup/tables/setup-tables.js
node scripts/setup/indexes/setup-indexes.js
node scripts/setup/policies/setup-policies.js
npm run db:setup:functions
node scripts/setup/triggers/setup-triggers.js
node scripts/setup/views/setup-views.js
node scripts/seeds/seed.js
```

## General Testing Guidelines

- **Isolation**: Test components independently when possible
- **Dependencies**: Ensure prerequisite components are applied before testing
- **Data Management**: Use minimal test data; reset between runs
- **Error Handling**: Test both success and failure scenarios
- **Performance**: Monitor execution times and resource usage
- **Documentation**: Update this strategy as components evolve
- **CI/CD**: Integrate these tests into automated pipelines

## Troubleshooting

- **Dependency Errors**: Verify setup order and prerequisite components
- **Permission Issues**: Ensure proper database user privileges
- **Data Conflicts**: Use reset scripts for clean testing environments
- **Performance Issues**: Check indexes and query optimization
