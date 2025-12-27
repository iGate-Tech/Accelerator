# Database-Driven Migration Deployment Guide

## Overview

This guide covers the deployment of the Accelerator application's database-driven architecture migration.

## Pre-Deployment Checklist

- [ ] Backup current database
- [ ] Test database functions in staging environment
- [ ] Verify all server routes use database functions
- [ ] Confirm middleware changes work correctly
- [ ] Update environment variables if needed

## Deployment Steps

### 1. Database Schema Update

Deploy the new database functions and views:

```bash
# Set environment variables
export SUPABASE_DB_URL="postgresql://postgres:[SERVICE_KEY]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Deploy schema, views, and functions
npm run db:update-schema
```

This will execute:

- `db/tables.sql` - Table definitions and RLS policies
- `db/views.sql` - Database views for aggregations
- `db/functions.sql` - All business logic functions

### 2. Server Code Deployment

Deploy the simplified server code:

```bash
# Standard deployment process
git push origin main
# CI/CD will handle server deployment
```

### 3. Post-Deployment Verification

#### Database Functions Test

```sql
-- Test key functions
SELECT manage_user_profile('test-user-id', 'create', '{"name": "Test User"}');
SELECT get_user_ideas('test-user-id');
SELECT process_credit_transaction('test-user-id', 'test', 100);
```

#### Server Health Check

```bash
# Check server starts without errors
curl -f http://your-app/health

# Test key endpoints
curl -f http://your-app/api/ideas
curl -f http://your-app/dashboard
```

#### Performance Monitoring

- Monitor database function execution times
- Check for increased query performance
- Verify reduced server response times

## Rollback Plan

If issues occur:

1. **Immediate Rollback**: Revert server code deployment
2. **Database Rollback**: Restore from backup if schema changes cause issues
3. **Gradual Rollback**: Keep database functions but revert some routes to old logic

## Monitoring

### Key Metrics to Monitor

- **Database Performance**: Function execution times, query performance
- **Server Performance**: Response times, error rates
- **Business Metrics**: Idea creation, voting activity, credit transactions

### Alerting

Set up alerts for:

- Database function errors
- Server response time degradation
- Credit transaction failures

## Migration Benefits Validation

After deployment, verify:

- ✅ **Query Reduction**: 8-15 queries → 1-2 RPC calls per request
- ✅ **Server Simplification**: 80% reduction in business logic code
- ✅ **Performance**: Improved response times
- ✅ **Maintainability**: Single source of truth for business rules

## Troubleshooting

### Common Issues

**Server won't start:**

- Check database connectivity
- Verify all imports are correct
- Check for missing environment variables

**Database function errors:**

- Check function syntax
- Verify parameter types
- Check permissions (SECURITY DEFINER)

**Performance degradation:**

- Check view refresh status
- Monitor database connection pool
- Review query execution plans

### Support

For issues during migration:

1. Check server logs
2. Review database function errors
3. Verify network connectivity to Supabase
4. Contact development team
