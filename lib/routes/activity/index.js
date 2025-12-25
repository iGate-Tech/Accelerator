import express from 'express';
import { requireAuth } from '../../session.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// GET /api/activity - Get comprehensive activity log with filtering and pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      limit = 20,
      offset = 0,
      type,
      entity_type,
      entity_id,
      start_date,
      end_date,
      search,
    } = req.query;

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Build query with filters
    let query = supabase
      .from('activity_log')
      .select(
        `
        id,
        action_type,
        entity_type,
        entity_id,
        details,
        created_at
      `,
      )
      .eq('user_id', userId);

    // Apply filters
    if (type) {
      query = query.eq('action_type', type);
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }

    if (entity_id) {
      query = query.eq('entity_id', entity_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Search in details JSON (basic implementation)
    if (search) {
      // Note: This is a basic search. In production, you might want to use
      // full-text search or more sophisticated JSON querying
      query = query.or(
        `details->>description.ilike.%${search}%,details->>title.ilike.%${search}%`,
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await query;

    if (countError) {
      logger.error('Error counting activities:', countError);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: activities, error } = await query;

    if (error) {
      logger.error('Error fetching activities:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch activity log',
      });
    }

    // Get activity statistics
    const stats = await getActivityStats(userId, supabase);

    res.json({
      success: true,
      activities: activities || [],
      stats: stats,
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: activities && activities.length === parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Activity API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/activity/types - Get available activity types and entity types
router.get('/types', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Get distinct action types
    const { data: actionTypes, error: actionError } = await supabase
      .from('activity_log')
      .select('action_type')
      .eq('user_id', userId);

    if (actionError) {
      logger.error('Error fetching action types:', actionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch activity types',
      });
    }

    // Get distinct entity types
    const { data: entityTypes, error: entityError } = await supabase
      .from('activity_log')
      .select('entity_type')
      .eq('user_id', userId);

    if (entityError) {
      logger.error('Error fetching entity types:', entityError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch entity types',
      });
    }

    // Extract unique values
    const uniqueActionTypes = [
      ...new Set(actionTypes?.map((item) => item.action_type) || []),
    ];
    const uniqueEntityTypes = [
      ...new Set(entityTypes?.map((item) => item.entity_type) || []),
    ];

    res.json({
      success: true,
      types: {
        actions: uniqueActionTypes,
        entities: uniqueEntityTypes,
      },
    });
  } catch (error) {
    logger.error('Activity types API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/activity/summary - Get activity summary for date ranges
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get activities in date range
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('action_type, entity_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      logger.error('Error fetching activity summary:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch activity summary',
      });
    }

    // Group by date and type
    const summary = {
      by_date: new Map(),
      by_type: new Map(),
      by_entity: new Map(),
      daily_activity: [],
    };

    activities?.forEach((activity) => {
      const date = new Date(activity.created_at).toISOString().split('T')[0];

      // By date
      if (!summary.by_date.has(date)) {
        summary.by_date.set(date, 0);
      }
      summary.by_date.set(date, summary.by_date.get(date) + 1);

      // By action type
      if (!summary.by_type.has(activity.action_type)) {
        summary.by_type.set(activity.action_type, 0);
      }
      summary.by_type.set(
        activity.action_type,
        summary.by_type.get(activity.action_type) + 1,
      );

      // By entity type
      if (!summary.by_entity.has(activity.entity_type)) {
        summary.by_entity.set(activity.entity_type, 0);
      }
      summary.by_entity.set(
        activity.entity_type,
        summary.by_entity.get(activity.entity_type) + 1,
      );
    });

    // Convert to array for easier consumption
    summary.daily_activity = Array.from(summary.by_date.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      success: true,
      period_days: parseInt(days),
      summary: summary,
    });
  } catch (error) {
    logger.error('Activity summary API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/activity/recent - Get recent activities (simplified endpoint)
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: activities, error } = await supabase
      .from('activity_log')
      .select(
        `
        id,
        action_type,
        entity_type,
        entity_id,
        details,
        created_at
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      logger.error('Error fetching recent activities:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recent activities',
      });
    }

    res.json({
      success: true,
      activities: activities || [],
    });
  } catch (error) {
    logger.error('Recent activities API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// DELETE /api/activity/:id - Delete a specific activity entry (admin/moderation)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Verify ownership
    const { data: activity, error: fetchError } = await supabase
      .from('activity_log')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found or access denied',
      });
    }

    // Delete the activity
    const { error } = await supabase
      .from('activity_log')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error deleting activity:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete activity',
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    logger.error('Delete activity API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Helper function to get activity statistics
async function getActivityStats(userId, supabase) {
  try {
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('action_type, entity_type')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching activity stats:', error);
      return {};
    }

    const stats = {
      total: activities?.length || 0,
      by_action: {},
      by_entity: {},
      most_active_entity: null,
      most_common_action: null,
    };

    activities?.forEach((activity) => {
      // Count by action type
      stats.by_action[activity.action_type] =
        (stats.by_action[activity.action_type] || 0) + 1;

      // Count by entity type
      stats.by_entity[activity.entity_type] =
        (stats.by_entity[activity.entity_type] || 0) + 1;
    });

    // Find most common
    if (Object.keys(stats.by_action).length > 0) {
      stats.most_common_action = Object.entries(stats.by_action).sort(
        ([, a], [, b]) => b - a,
      )[0][0];
    }

    if (Object.keys(stats.by_entity).length > 0) {
      stats.most_active_entity = Object.entries(stats.by_entity).sort(
        ([, a], [, b]) => b - a,
      )[0][0];
    }

    return stats;
  } catch (error) {
    logger.error('Error calculating activity stats:', error);
    return {};
  }
}

export default router;
