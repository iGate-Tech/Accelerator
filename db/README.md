# Database Management

This directory contains all database-related files and scripts for the Accelerator project, organized in a logical, maintainable structure.

## Directory Structure

```
db/
├── README.md                    # This documentation
├── schema.sql                  # Master schema orchestrator
├── schema/                     # Core schema definitions
├── indexes/                    # Individual index and configuration files
│   ├── portfolio_members_user_id.sql # Portfolio member user lookup index
│   └── storage_buckets_setup.sql     # Supabase storage configuration
├── extensions/                 # Individual extension definitions
│   └── uuid-ossp.sql           # UUID generation extension
├── tables/                     # Individual table definitions
│   ├── profiles.sql            # User profiles and subscriptions
│   ├── ideas.sql               # Core business entity
│   ├── votes.sql               # Community voting system
│   ├── model_instances.sql     # AI model usage tracking
│   ├── model_sections.sql      # Model progress sections
│   ├── team_members.sql        # Collaboration features
│   ├── reports.sql             # Generated business reports
│   ├── notifications.sql       # User notification system
│   ├── credit_transactions.sql # Financial transaction log
│   ├── activity_log.sql        # User activity audit trail
│   ├── user_favorites.sql      # Idea bookmarking
│   ├── voting_rewards.sql      # Reward distribution
│   ├── user_settings.sql       # User preferences
│   ├── billing_history.sql     # Payment records
│   ├── credit_packages.sql     # Credit purchase options
│   ├── packages.sql            # Subscription packages
│   ├── rewards.sql             # Legacy rewards
│   ├── portfolios.sql          # Idea organization
│   ├── portfolio_ideas.sql     # Portfolio contents
│   ├── portfolio_members.sql   # Team collaboration
│   └── session.sql             # Session management
│   ├── 04_constraints.sql      # Additional constraints (future)
│   └── 05_types.sql            # Custom types and enums (future)
├── security/                   # Security policies (legacy - migrated)
├── policies/                   # Individual RLS policy files
│   ├── profiles.sql            # User profile access policies
│   ├── service_role_admin.sql  # Admin access policies
│   ├── ideas.sql               # Idea access and privacy policies
│   ├── votes.sql               # Voting system policies
│   ├── model_instances_sections.sql # AI model access policies
│   ├── team_members.sql        # Collaboration policies
│   ├── reports.sql             # Report access policies
│   ├── notifications.sql       # Notification policies
│   ├── credit_transactions.sql # Financial transaction policies
│   ├── activity_log.sql        # Activity tracking policies
│   ├── user_favorites.sql      # Social feature policies
│   ├── user_settings.sql       # Preference policies
│   ├── billing_history.sql     # Billing access policies
│   ├── packages.sql            # Product catalog policies
│   ├── portfolios.sql          # Enterprise portfolio policies
│   └── storage_buckets_setup.sql # File storage policies
│   └── permissions.sql         # Custom permissions (future)
├── business/                   # Business logic layer (legacy - being migrated)
├── functions/                  # Individual function files
│   ├── calculate_completion_percentage.sql
│   ├── cast_vote.sql
│   ├── deduct_credits_for_generation.sql
│   ├── add_credits.sql
│   ├── create_notification.sql
│   ├── log_activity.sql
│   ├── distribute_voting_rewards.sql
│   ├── complete_model_section.sql
│   ├── create_idea.sql
│   ├── update_idea_status.sql
│   ├── process_credit_transaction.sql
│   ├── calculate_credit_balance.sql
│   ├── validate_credit_operation.sql
│   ├── get_credit_history.sql
│   ├── generate_idea_slug.sql
│   └── process_vote_transaction.sql
├── triggers/                   # Database triggers and automation
│   ├── update_completion_percentage.sql
│   ├── update_idea_rating.sql
│   ├── check_credit_balance.sql
│   ├── check_package_type.sql
│   ├── prevent_negative_credit.sql
│   ├── notify_on_vote.sql
│   ├── log_idea_changes.sql
│   ├── update_credit_balance.sql
│   ├── log_section_completion.sql
│   ├── auto_log_activities.sql
│   ├── auto_create_notifications.sql
│   ├── auto_reward_vote_credits.sql
│   ├── auto_reward_daily_first_vote.sql
│   ├── auto_unlock_models.sql
│   └── auto_milestone_achievements.sql
├── views/                      # Data aggregation layer
│   ├── aggregations.sql        # Production views orchestrator (18 views)
│   └── testing-views/          # Testing infrastructure (22 views)
├── seeds/                      # Sample data and seeds
│   ├── cleanup.sql             # Data cleanup before seeding
│   ├── auth_users.sql          # Test user accounts
│   ├── credit_packages.sql     # Credit purchase options
│   └── packages.sql            # Subscription packages
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
5. **Core Functions** → Deploy core business logic functions
6. **User Management** → User profile and registration functions
7. **Credit System** → Credit and billing functions
8. **Idea Management** → Idea CRUD functions
9. **Voting & Rewards** → Voting and reward distribution functions
10. **Model Management** → Model instance functions
11. **Portfolio Management** → Portfolio organization functions
12. **Triggers** → Set up automated database triggers
13. **Views** → Create aggregation and reporting views

## Architecture Overview

### Database-Driven Design

The Accelerator application implements a **database-first architecture** where the database serves as the primary business logic layer:

#### Database Layer Responsibilities (95% of Business Logic)

**Functions (41 organized functions):**

- **Core Functions**: Basic business operations and utilities
- **User Management**: Registration, profiles, package upgrades
- **Credit System**: Credit transactions, billing, and payments
- **Idea Management**: Idea CRUD operations and workflows
- **Voting & Rewards**: Voting system and reward distribution
- **Model Management**: AI model instances and progress tracking
- **Portfolio Management**: Idea organization and enterprise features
- **Automation**: Notifications, activity logging, validations

**Views (40 total: 18 production + 22 testing):**

- **Production Views**: Pre-computed aggregations for performance
- **Testing Views**: Comprehensive validation and monitoring infrastructure
- **Performance Monitoring**: Real-time system health and query analytics
- **API Efficiency**: Single queries replace complex JOINs

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

## Recent Modularization (2025)

The database has been completely modularized into 103 individual files with comprehensive documentation and professional orchestration:

**Before (2024):**

- 7 monolithic function files (2000+ lines each)
- 1 mixed triggers file
- 1 basic views aggregator
- Limited documentation and testing

**After (2025):**

- **103 individual database files** with full documentation
- **41 functions** split by business domain
- **15 triggers** with detailed automation logic
- **40 views** (18 production + 22 testing)
- **21 tables** with comprehensive schemas
- **16 security policies** with access controls
- **Professional setup orchestration** with dependency management
- **Complete testing infrastructure** for validation

### Current Modular Structure

**Functions (41 files organized by domain):**

- **Core Functions**: Completion, voting, credits, notifications
- **Credit System**: Transactions, balances, validation, history
- **Idea Management**: CRUD operations, validation, workflows
- **Voting & Rewards**: Vote processing, rewards, leaderboards
- **User Management**: Profiles, registration, packages
- **Model Management**: AI model lifecycle and progress
- **Portfolio Management**: Enterprise organization features

**Views (40 files: 18 production + 22 testing):**

- **Production**: Dashboards, feeds, analytics, recommendations
- **Testing**: Validation, trigger verification, system health
- **Performance**: Real-time monitoring and query analytics

**Infrastructure (21 tables + 16 policies + 15 triggers):**

- Complete data structures with RLS security
- Automated triggers for business logic
- Comprehensive access control policies

## Troubleshooting

### Common Issues

**"Permission denied" errors:**

- Ensure `SUPABASE_DB_URL` uses service role key
- Check RLS policies are applied correctly

**"Function not found" errors:**

- Run `npm run db:setup` to deploy functions
- Check function dependencies in deployment order

**Slow queries:**

- Ensure indexes are applied (`setup/indexes/indexes.sql`)
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
- **Advanced Analytics**: Business intelligence views and reporting
- **API Integration**: Direct database API endpoints for high-performance operations
- **Backup Automation**: Enhanced backup scripts with component handling

## Completed Enhancements (2025)

- ✅ **Performance Monitoring**: Query performance tracking views implemented
- ✅ **Modular Architecture**: 103 individual database files with orchestration
- ✅ **Testing Infrastructure**: Complete validation and monitoring system
- ✅ **Professional Documentation**: Comprehensive setup and maintenance guides

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
