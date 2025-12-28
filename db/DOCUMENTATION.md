# Database Documentation

This document provides a comprehensive overview of the fully modularized database structure and components for the Accelerator project.

## Directory Structure

The database files are organized into a hierarchical, modular structure with individual files for every component:

### setup/

**Complete Database Setup Orchestration System**
Professional-grade setup framework with comprehensive documentation and dependency management.

- **setup.sql**: Main orchestrator coordinating the entire setup process in strict dependency order
- **README.md**: Complete setup documentation with workflows, troubleshooting, and best practices
- **extensions/extensions.sql**: PostgreSQL extension setup with detailed requirements
- **tables/tables.sql**: Table creation orchestrator (21 tables in dependency order)
- **indexes/indexes.sql**: Performance optimization and storage configuration
- **policies/policies.sql**: Security policy coordinator (16 RLS policies)
- **functions/**: Business logic orchestration (7 category coordinators for 41 functions)
- **triggers/triggers.sql**: Automation trigger coordinator (15 triggers)
- **views/views.sql**: Data aggregation view coordinator (39 views)

### extensions/

**PostgreSQL Extensions** (1 extension)
Critical database extensions providing enhanced functionality.

- **uuid-ossp.sql**: Universally Unique Identifier (UUID) generation functions for primary keys and unique identifiers

### tables/

**Database Tables** (21 individual table definitions)
Complete data structure with comprehensive documentation for each table.

**Core Business Entities:**

- **profiles.sql**: User profiles, subscriptions, and credit management
- **ideas.sql**: Primary business entity with workflow and validation tracking
- **votes.sql**: Community voting system for idea validation

**AI & Workflow Management:**

- **model_instances.sql**: AI model usage tracking and lifecycle management
- **model_sections.sql**: Granular progress tracking within AI models

**Collaboration & Social Features:**

- **team_members.sql**: Team member management for collaborative ideas
- **user_favorites.sql**: Idea bookmarking and personalization system
- **portfolios.sql**: Enterprise idea organization and collections
- **portfolio_ideas.sql**: Many-to-many portfolio-content relationships
- **portfolio_members.sql**: Team access management for shared portfolios

**Content & Communication:**

- **reports.sql**: AI-generated business reports and documents
- **notifications.sql**: In-app notification system
- **activity_log.sql**: Comprehensive user activity audit trail

**Financial & Economic System:**

- **credit_transactions.sql**: Complete financial transaction log
- **billing_history.sql**: Payment and billing records
- **voting_rewards.sql**: Reward distribution tracking
- **credit_packages.sql**: Credit purchase product catalog
- **packages.sql**: Subscription package definitions
- **rewards.sql**: Legacy reward system tracking

**Configuration & Infrastructure:**

- **user_settings.sql**: User preference and configuration storage
- **session.sql**: Web application session management

### indexes/

**Performance Optimization** (2 components)
Database performance indexes and storage configuration.

- **portfolio_members_user_id.sql**: Optimizes portfolio member queries for team collaboration
- **storage_buckets_setup.sql**: Configures Supabase Storage buckets for file uploads

### policies/

**Row Level Security (RLS) Policies** (16 individual policy files)
Comprehensive access control with detailed security documentation.

**Foundation Security:**

- **profiles.sql**: User profile access with public read and self-management
- **service_role_admin.sql**: Administrative access policies for system operations

**Business Entity Security:**

- **ideas.sql**: Idea privacy controls and team collaboration access
- **votes.sql**: Voting system access with public/private restrictions

**Workflow & AI Security:**

- **model_instances_sections.sql**: AI model access and team sharing controls

**Collaboration Security:**

- **team_members.sql**: Team membership management and access control
- **reports.sql**: AI-generated report access and sharing permissions
- **user_favorites.sql**: Social bookmarking access controls

**User Experience Security:**

- **notifications.sql**: Personal notification management
- **activity_log.sql**: User activity tracking and privacy controls
- **user_settings.sql**: Personal preference access controls

**Financial Security:**

- **credit_transactions.sql**: Financial transaction access and privacy
- **billing_history.sql**: Payment history access controls
- **packages.sql**: Product catalog access for authenticated users

**Enterprise Security:**

- **portfolios.sql**: Team portfolio management and sharing controls

**Infrastructure Security:**

- **storage_buckets_setup.sql**: File storage access and security policies

### functions/

**Business Logic Functions** (41 individual function files)
Complete application logic organized into 7 functional categories.

**Core Functions** (10 files):

- **calculate_completion_percentage.sql**: Progress calculation for ideas
- **cast_vote.sql**: Voting system with validation
- **deduct_credits_for_generation.sql**: Credit debit for AI usage
- **add_credits.sql**: Credit addition for rewards/purchases
- **create_notification.sql**: User notification system
- **log_activity.sql**: Audit trail and activity tracking
- **distribute_voting_rewards.sql**: Reward distribution logic
- **complete_model_section.sql**: Progress tracking updates
- **create_idea.sql**: Idea creation with validation
- **update_idea_status.sql**: Workflow state management

**Credit System Functions** (7 files):

- **process_credit_transaction.sql**: Unified credit transaction processing
- **calculate_credit_balance.sql**: Current credit balance retrieval
- **validate_credit_operation.sql**: Pre-transaction validation
- **get_credit_history.sql**: Paginated transaction history
- **get_user_credit_info.sql**: Comprehensive credit information
- **process_ai_generation.sql**: AI generation with credit deduction
- **process_credit_purchase.sql**: Credit purchase processing

**Idea Management Functions** (7 files):

- **generate_idea_slug.sql**: Unique URL-friendly slug creation
- **manage_idea.sql**: Comprehensive idea CRUD operations
- **validate_idea_access.sql**: Idea access permission checks
- **get_user_ideas.sql**: User idea retrieval with filtering
- **validate_and_create_idea.sql**: Full validation idea creation
- **update_idea_workflow.sql**: Status and workflow management
- **get_user_ideas_filtered.sql**: Advanced idea querying

**Voting & Rewards Functions** (5 files):

- **process_vote_transaction.sql**: Complete vote processing with rewards
- **calculate_voting_rewards.sql**: Reward distribution calculation
- **distribute_pending_rewards.sql**: Pending reward processing
- **validate_and_cast_vote.sql**: Vote validation and casting
- **get_leaderboard_data.sql**: Community leaderboard generation

**User Management Functions** (6 files):

- **manage_user_profile.sql**: Profile CRUD operations
- **handle_user_registration.sql**: User onboarding and registration
- **update_user_package.sql**: Subscription package management
- **load_user_context.sql**: Complete user context aggregation

**Model Management Functions** (5 files):

- **manage_model_instance.sql**: AI model lifecycle management
- **validate_model_access.sql**: Model access permission checks
- **complete_model_section.sql**: Section completion tracking
- **get_model_progress.sql**: Model progress statistics
- **complete_model_section_workflow.sql**: Workflow-based completion

**Portfolio Management Functions** (1 file):

- **manage_portfolio.sql**: Portfolio creation and team management

### triggers/

**Database Automation Triggers** (15 individual trigger files)
Comprehensive business rule automation with detailed documentation.

**Data Validation Triggers:**

- **check_credit_balance.sql**: Prevents negative credit balances
- **check_package_type.sql**: Validates package type assignments
- **prevent_negative_credit.sql**: Blocks insufficient fund transactions

**Calculation & Update Triggers:**

- **update_completion_percentage.sql**: Auto-updates completion percentages
- **update_idea_rating.sql**: Recalculates idea ratings after votes
- **update_credit_balance.sql**: Maintains real-time credit balances

**Activity & Audit Triggers:**

- **log_idea_changes.sql**: Logs idea modification activities
- **log_section_completion.sql**: Tracks AI model progress
- **auto_log_activities.sql**: Comprehensive CRUD activity logging

**Notification & Communication Triggers:**

- **notify_on_vote.sql**: Sends notifications for idea votes
- **auto_create_notifications.sql**: Automated social interaction alerts

**Gamification & Rewards Triggers:**

- **auto_reward_vote_credits.sql**: Awards credits for community votes
- **auto_reward_daily_first_vote.sql**: Daily participation bonuses
- **auto_unlock_models.sql**: Progressive feature unlocking
- **auto_milestone_achievements.sql**: Achievement tracking and rewards

### views/

**Data Aggregation Views** (40 views: 18 production + 22 testing)
Optimized data access for application performance and testing.

**Production Views** (18 files):

- **user_dashboard_summary.sql**: User activity and statistics overview
- **ideas_with_stats.sql**: Ideas with voting and engagement metrics
- **user_activity_feed.sql**: Chronological user activity timeline
- **voting_dashboard.sql**: Voting participation and rewards tracking
- **leaderboard.sql**: Community idea rankings
- **portfolio_summary.sql**: Portfolio organization overview
- **user_model_progress.sql**: AI learning progress tracking
- **idea_progress_view.sql**: Individual idea completion status
- **user_preferences.sql**: User settings aggregation
- **user_activity_feed_enhanced.sql**: Rich activity feed with entity details
- **ideas_with_full_stats.sql**: Comprehensive idea analytics
- **user_dashboard_comprehensive.sql**: Complete user dashboard data
- **user_achievements.sql**: Achievement and milestone tracking
- **automated_leaderboards.sql**: Dynamic community leaderboards
- **idea_recommendations.sql**: AI-powered content recommendations
- **system_health_dashboard.sql**: Real-time system monitoring
- **query_performance_monitoring.sql**: Database performance metrics and query statistics
- **user_onboarding_status.sql**: User activation and onboarding metrics

**Testing & Validation Views** (22 files):
Complete testing infrastructure for database validation and monitoring.

### seeds/

**Sample Data and Seeding** (4 individual seed files)
Development and testing data with proper cleanup.

- **cleanup.sql**: Database cleanup for fresh seeding
- **auth_users.sql**: Sample user accounts (60 fictional users)
- **credit_packages.sql**: Credit purchase product catalog
- **packages.sql**: Subscription package definitions

### reset/

**Database Reset System** (6 comprehensive reset files)
Complete database teardown with proper dependency management.

- **reset.sql**: Main reset orchestrator (full database cleanup)
- **reset-tables.sql**: Table dropping in reverse dependency order
- **reset-functions.sql**: Function removal (41 functions)
- **reset-triggers.sql**: Trigger cleanup (15 triggers)
- **reset-views.sql**: View removal (39 views)
- **reset-users.sql**: Auth user cleanup

## Architecture Overview

### Database-First Design Philosophy

This database implements a **database-first architecture** where the majority of business logic resides in PostgreSQL:

- **Functions**: 41 business logic functions implementing core application features
- **Triggers**: 15 automated triggers maintaining data integrity and business rules
- **Views**: 39 optimized views for data aggregation and API performance
- **RLS Policies**: 16 comprehensive security policies for access control

### Key Architectural Benefits

**Performance & Scalability:**

- Pre-computed aggregations reduce application query complexity
- Atomic database operations minimize round-trips
- Efficient handling of complex business logic at the data layer

**Security & Data Integrity:**

- Row Level Security (RLS) enforced at database level
- Business rules validated before data persistence
- Comprehensive audit trails for all user actions

**Maintainability & Development:**

- Modular, well-documented components
- Clear separation of concerns
- Easy testing and debugging of individual components

**Developer Experience:**

- Rich documentation with examples for every component
- Consistent patterns across all database objects
- Comprehensive testing infrastructure

## Setup Process

### Automated Setup (Recommended)

```bash
npm run db:setup    # Complete database setup
npm run db:seed     # Populate with sample data
```

### Manual Component Setup

```bash
# Extensions (foundation)
psql "$DB_URL" -f db/setup/extensions/extensions.sql

# Tables (data structure)
psql "$DB_URL" -f db/setup/tables/tables.sql

# Performance & Security
psql "$DB_URL" -f db/setup/indexes/indexes.sql
psql "$DB_URL" -f db/setup/policies/policies.sql

# Business Logic (dependency order)
psql "$DB_URL" -f db/setup/functions/functions-core.sql
psql "$DB_URL" -f db/setup/functions/functions-user.sql
psql "$DB_URL" -f db/setup/functions/functions-credit.sql
psql "$DB_URL" -f db/setup/functions/functions-idea.sql
psql "$DB_URL" -f db/setup/functions/functions-voting.sql
psql "$DB_URL" -f db/setup/functions/functions-model.sql
psql "$DB_URL" -f db/setup/functions/functions-portfolio.sql

# Automation & Views
psql "$DB_URL" -f db/setup/triggers/triggers.sql
psql "$DB_URL" -f db/setup/views/views.sql
```

## Development Workflow

### Adding New Components

1. Create individual file in appropriate directory (`db/[type]/new_component.sql`)
2. Add detailed documentation with purpose, examples, and dependencies
3. Update corresponding setup coordinator (`db/setup/[type]/[type].sql`)
4. Test setup process and verify dependencies
5. Update documentation

### Testing Database Changes

```bash
# Reset for clean testing
npm run db:reset

# Test individual components
node scripts/setup/triggers/setup-triggers.js    # Test triggers only
node scripts/reset/reset-functions.js   # Reset functions only

# Full development cycle
npm run db:install  # reset + setup + seed
```

## Component Statistics

- **Total Database Files**: 103 individual files
- **Extensions**: 1 (PostgreSQL capabilities)
- **Tables**: 21 (complete data model)
- **Indexes**: 2 (performance + storage)
- **Functions**: 41 (business logic)
- **Triggers**: 15 (automation)
- **Views**: 39 (17 production + 22 testing)
- **Policies**: 16 (security)
- **Seeds**: 4 (sample data)
- **Setup Files**: 15+ (orchestration system)

## Quality Assurance

Every database component includes:

- ✅ **Comprehensive Documentation**: Purpose, usage, examples
- ✅ **Dependency Analysis**: Clear relationship mapping
- ✅ **Security Validation**: RLS policies for access control
- ✅ **Performance Optimization**: Indexes and efficient queries
- ✅ **Testing Infrastructure**: Validation views and reset capabilities
- ✅ **Maintenance Support**: Modular design for easy updates

This modularized database represents a production-ready, enterprise-grade data architecture with complete documentation, testing infrastructure, and professional development workflows.

## Architecture Overview

This database follows a database-first design where the majority of business logic is implemented in PostgreSQL functions, views, and triggers. This approach provides:

- **Performance**: Atomic operations and pre-computed aggregations reduce query complexity.
- **Security**: Business rules enforced at the database level with RLS.
- **Maintainability**: Centralized business logic in SQL functions.
- **Scalability**: Efficient handling of complex operations by the database engine.

## Deployment Order

When setting up the database, files should be applied in this order:

1. setup/extensions/extensions.sql
2. setup/tables/tables.sql (includes all table definitions)
3. setup/indexes/indexes.sql
4. setup/policies/policies.sql
5. setup/functions/ (all function files in dependency order)
6. setup/triggers/triggers.sql
7. setup/views/views.sql
8. seeds/ (seeds files)

## Usage

Refer to the main README.md in the project root for installation and setup instructions, including npm scripts for database management.
