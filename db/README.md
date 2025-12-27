# Database Management

This directory contains all database-related files and scripts for the Accelerator project, organized in a logical, maintainable structure.

## Directory Structure

```
db/
├── README.md                    # This documentation
├── schema.sql                  # Master schema orchestrator
├── schema/                     # Core schema definitions
│   ├── 01_extensions.sql       # Database extensions (UUID, etc.)
│   ├── 02_tables.sql           # Table definitions
│   ├── 03_indexes.sql          # Indexes and constraints
│   ├── 04_constraints.sql      # Additional constraints (future)
│   └── 05_types.sql            # Custom types and enums (future)
├── security/                   # Security policies
│   ├── rls_policies.sql        # Row Level Security policies
│   └── permissions.sql         # Custom permissions (future)
├── business/                   # Business logic layer
│   ├── functions.sql           # Business functions (63 total)
│   └── triggers.sql            # Database triggers and automation
├── views/                      # Data aggregation layer
│   ├── aggregations.sql        # Summary and dashboard views
│   ├── reporting.sql           # Report-specific views (future)
│   └── api_views.sql           # API-optimized views (future)
├── data/                       # Sample data and seeds
│   ├── seeds.sql               # Base configuration data
│   ├── seeds_ideas.sql         # Sample ideas and content
│   └── demo_data.sql           # Demo environment data (future)
└── maintenance/                # Maintenance and utilities
    ├── reset.sql               # Database reset scripts
    ├── backup.sql              # Backup procedures
    └── migration.sql           # Schema migration helpers (future)
```

## Quick Start

**Complete Database Setup (Recommended):**

```bash
npm run db:install  # Reset + Setup + Seed in one command
```

**Individual Steps:**

```bash
npm run db:reset    # Reset database
npm run db:setup    # Apply schema
npm run db:seed     # Load sample data
```

## npm Scripts Reference

### Core Database Operations

- `npm run db:install` - Complete setup (reset + setup + seed)
- `npm run db:reset` - Reset database (destructive!)
- `npm run db:setup` - Apply full schema
- `npm run db:seed` - Load sample data

### Maintenance & Backup

- `npm run db:backup` - Create database backup
- `npm run db:migrate` - Apply schema migrations

### Environment-Specific

- `npm run db:dev:setup` - Development environment setup
- `npm run db:test:setup` - Test environment setup
- `npm run db:prod:backup` - Production backup (safe)

## Environment Setup

**Required Environment Variables:**

```bash
# Database Connection (Required)
SUPABASE_DB_URL=postgresql://postgres:[KEY]@db.[PROJECT].supabase.co:5432/postgres

# Optional: For specific environments
NODE_ENV=development|test|production
```

## Schema Deployment Order

The schema is applied in this specific order to maintain dependencies:

1. **Extensions** → Enable required PostgreSQL extensions
2. **Tables** → Create all table structures
3. **Indexes** → Add performance indexes and constraints
4. **Security** → Apply Row Level Security policies
5. **Triggers** → Set up automated database triggers
6. **Functions** → Deploy business logic functions
7. **Views** → Create aggregation and reporting views

## Architecture Overview

### Database-Driven Design

The Accelerator application implements a **database-first architecture** where the database serves as the primary business logic layer:

#### Database Layer Responsibilities (95% of Business Logic)

**Functions (63 total):**

- **User Management**: Registration, profiles, package upgrades
- **Core Business**: Ideas, voting, rewards, credit transactions
- **AI Integration**: Model management, progress tracking
- **Analytics**: Dashboard data, reporting, leaderboards
- **Automation**: Notifications, activity logging, validations

**Views (8 total):**

- **Performance Optimization**: Pre-computed aggregations
- **API Efficiency**: Single queries replace complex JOINs
- **Reporting**: Real-time analytics and statistics

#### Server Layer Responsibilities (5% of Application Logic)

**Thin Application Layer:**

- **HTTP Handling**: Route definitions and response formatting
- **External APIs**: AI services, payment processing, file storage
- **Authentication**: User sessions and middleware
- **UI Rendering**: Template processing and error handling

### Key Benefits

- **🚀 Performance**: Atomic operations, pre-computed views
- **🔒 Security**: Business rules enforced at database level
- **🧪 Testability**: Functions testable independently
- **📈 Scalability**: Database handles complex operations efficiently
- **🔧 Maintainability**: Single source of truth for business logic
- **⚡ Reliability**: ACID transactions for data consistency

## Migration from Legacy Structure

The database was reorganized from a flat structure to the current logical hierarchy:

**Before:**

```
db/
├── schema.sql (comment file)
├── tables.sql (mixed concerns)
├── functions.sql (3000+ lines)
├── views.sql (scattered)
└── seeds.sql (unorganized)
```

**After:**

```
db/
├── Organized by concern
├── Logical file naming
├── Clear deployment order
├── Scalable structure
└── Comprehensive documentation
```

## Troubleshooting

### Common Issues

**"Permission denied" errors:**

- Ensure `SUPABASE_DB_URL` uses service role key
- Check RLS policies are applied correctly

**"Function not found" errors:**

- Run `npm run db:setup` to deploy functions
- Check function dependencies in deployment order

**Slow queries:**

- Ensure indexes are applied (`03_indexes.sql`)
- Check if views are being used instead of raw queries

### Recovery Commands

```bash
# Complete reset and restore
npm run db:install

# Backup before major changes
npm run db:backup

# Apply only schema updates
npm run db:migrate
```

## Future Enhancements

- **Migration System**: Version-controlled schema migrations
- **Multi-Environment**: Environment-specific configurations
- **Performance Monitoring**: Query performance tracking
- **Automated Testing**: Database function test suites

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
