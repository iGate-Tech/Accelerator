# Database Setup Directory

This directory contains the professional database setup orchestration system for the Accelerator application. Following the 2025 modularization, all database components are organized into **103 individual files** with comprehensive documentation and automated dependency management.

## Architecture Achievement (2025)

- **103 Individual Files**: Complete modularization of all database components
- **Professional Orchestration**: Automated setup with dependency resolution
- **Enterprise Documentation**: Every file includes purpose, examples, and maintenance notes
- **Testing Infrastructure**: Comprehensive validation and monitoring system
- **Maintainable Structure**: Easy to modify, test, and deploy individual components

## Directory Structure

```
db/setup/
├── setup.sql                    # Main setup orchestrator (runs everything)
├── extensions/                  # PostgreSQL extensions
│   └── extensions.sql          # Extension setup coordinator
├── tables/                      # Database table definitions
│   └── tables.sql              # Table setup coordinator
├── indexes/                     # Performance indexes and storage config
│   └── indexes.sql             # Index setup coordinator
├── policies/                    # Row Level Security policies
│   └── policies.sql            # Security policy coordinator
├── functions/                   # Business logic functions (7 orchestrators)
│   ├── functions-core.sql      # Core functions orchestrator
│   ├── functions-user.sql      # User management orchestrator
│   ├── functions-credit.sql    # Credit system orchestrator
│   ├── functions-idea.sql      # Idea management orchestrator
│   ├── functions-voting.sql    # Voting system orchestrator
│   ├── functions-model.sql     # AI model orchestrator
│   └── functions-portfolio.sql # Portfolio management orchestrator
├── triggers/                    # Database automation triggers
│   └── triggers.sql            # Trigger setup coordinator
└── views/                       # Data aggregation views
    └── views.sql               # View setup coordinator
```

## Setup Process

### Automated Setup (Recommended)

```bash
# Complete database setup
npm run db:setup

# Or manually:
node scripts/setup/setup.js
```

### Manual Setup (Advanced)

If you need to apply components individually:

```bash
# 1. Extensions (must be first)
psql "$DATABASE_URL" -f db/setup/extensions/extensions.sql

# 2. Tables (core structure)
psql "$DATABASE_URL" -f db/setup/tables/tables.sql

# 3. Indexes (performance optimization)
psql "$DATABASE_URL" -f db/setup/indexes/indexes.sql

# 4. Security policies
psql "$DATABASE_URL" -f db/setup/policies/policies.sql

# 5. Functions (business logic - orchestrated by domain)
psql "$DATABASE_URL" -f db/setup/functions/functions-core.sql      # Core utilities
psql "$DATABASE_URL" -f db/setup/functions/functions-user.sql      # User management
psql "$DATABASE_URL" -f db/setup/functions/functions-credit.sql    # Credit system
psql "$DATABASE_URL" -f db/setup/functions/functions-idea.sql      # Idea operations
psql "$DATABASE_URL" -f db/setup/functions/functions-voting.sql    # Voting & rewards
psql "$DATABASE_URL" -f db/setup/functions/functions-model.sql     # AI models
psql "$DATABASE_URL" -f db/setup/functions/functions-portfolio.sql # Portfolio features

# 6. Triggers (automation)
psql "$DATABASE_URL" -f db/setup/triggers/triggers.sql

# 7. Views (aggregations)
psql "$DATABASE_URL" -f db/setup/views/views.sql
```

## Component Details

### Extensions

- **Purpose**: Enable PostgreSQL extensions required for application functionality
- **Files**: 1 extension (uuid-ossp for UUID generation)
- **Dependencies**: Must be applied before any tables or functions

### Tables

- **Purpose**: Core database schema and data structures
- **Files**: 21 individual table definitions
- **Dependencies**: Foundation for all other components

### Indexes

- **Purpose**: Performance optimization and storage configuration
- **Files**: 2 components (portfolio index + storage setup)
- **Dependencies**: Requires existing tables

### Policies

- **Purpose**: Row Level Security (RLS) for data access control
- **Files**: 16 individual policy definitions
- **Dependencies**: Requires table structure

### Functions

- **Purpose**: Business logic implementation
- **Files**: 7 orchestrators managing 41 individual function files
- **Organization**: Functions split by business domain for maintainability
- **Individual Files**: Each function in separate file (`db/functions/[function_name].sql`)
- **Dependencies**: Carefully ordered by dependency requirements

**Function Categories:**

- **Core**: Completion, voting, credits, notifications, activity logging
- **Credit System**: Transactions, balances, validation, billing history
- **Idea Management**: CRUD operations, validation, workflow management
- **Voting & Rewards**: Vote processing, rewards distribution, leaderboards
- **User Management**: Profiles, registration, package upgrades
- **Model Management**: AI model lifecycle and progress tracking
- **Portfolio Management**: Enterprise organization and collaboration features

### Triggers

- **Purpose**: Automated business rules and data integrity
- **Files**: 15 individual trigger definitions
- **Dependencies**: Requires tables and functions

### Views

- **Purpose**: Data aggregation, API optimization, and testing infrastructure
- **Files**: 40 views (18 production + 22 testing)
- **Production Views**: Application dashboards, feeds, and analytics
- **Testing Views**: Validation, monitoring, and system health checks
- **Dependencies**: Can reference any database objects

## Development Workflow

### Adding New Components

**For Functions:**

1. Create individual function file in `db/functions/[function_name].sql`
2. Add comprehensive documentation (purpose, parameters, examples)
3. Update appropriate orchestrator in `db/setup/functions/` (add `\i` statement)
4. Test function independently and with full setup
5. Update documentation

**For Other Components:**

1. Create individual files in appropriate directories (`db/[component_type]/`)
2. Update corresponding setup coordinator (`db/setup/[component_type]/[component_type].sql`)
3. Test setup process to ensure proper dependency order
4. Update documentation

### Testing Setup

```bash
# Full development setup
npm run db:install  # reset + setup + seed

# Individual component testing
node scripts/setup/triggers/setup-triggers.js  # Test just triggers
npm run db:setup:functions  # Test all functions
```

### Troubleshooting

- **Dependency Errors**: Check setup order in `setup.sql`
- **Missing Functions**: Verify function setup files include all new functions
- **Permission Issues**: Ensure proper database user privileges
- **Extension Errors**: May require superuser for extension installation

## File Organization Principles

- **Fully Modular**: 103 individual files with single responsibilities
- **Professional Orchestration**: Coordinators manage dependency order automatically
- **Comprehensive Documentation**: Every file includes purpose, examples, and dependencies
- **Dependency-Aware**: Strict setup hierarchy prevents deployment issues
- **Enterprise Maintainable**: Easy to modify, debug, or extend individual components
- **Isolated Testing**: Components can be tested independently or as groups
- **Domain-Driven**: Functions organized by business logic domains

## Performance Considerations

- **Setup Time**: Full setup takes ~30-60 seconds depending on environment
- **Memory Usage**: Large function definitions may require increased PostgreSQL memory settings
- **Concurrent Access**: Setup should be run with exclusive database access
- **Rollback**: Use reset scripts for clean slate testing

## Security Notes

- RLS policies ensure data access control at database level
- Functions run with appropriate security contexts
- Triggers maintain data integrity automatically
- Extensions are safely installed with IF NOT EXISTS protection
