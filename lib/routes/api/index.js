import express from 'express';
import { requireAuth } from '../../session.js';
import { createClient } from '@supabase/supabase-js';
import config from '../../config.js';
import { getUserCredits, deductCredits } from '../../utils/credits.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const getSupabaseClient = (req) => {
  const supabase = createClient(config.supabase.url, config.supabase.key);
  if (req.session.supabaseAccessToken) {
    supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }
  return supabase;
};

// ========================================
// AUTH API ENDPOINTS
// ========================================

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: profile || null,
      },
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    logger.error('Login API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/signup
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Initialize user profile
    if (data.user) {
      await initializeUserProfile(data.user.id, { firstName, lastName });
    }

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message:
        'Account created successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    logger.error('Signup API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    await supabase.auth.signOut();

    // Clear session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
      }
      res.json({ success: true });
    });
  } catch (error) {
    logger.error('Logout API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        profile: profile || null,
      },
    });
  } catch (error) {
    logger.error('Get user API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// USER API ENDPOINTS
// ========================================

// GET /api/users/profile
router.get('/users/profile', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error('Get profile API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/users/profile
router.post('/users/profile', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const updates = req.body;

    // Remove sensitive fields
    delete updates.user_id;
    delete updates.id;
    delete updates.created_at;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: req.user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error('Update profile API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// PACKAGES API ENDPOINTS
// ========================================

// GET /api/packages
router.get('/packages', async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);

    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('price_monthly');

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      packages: packages || [],
    });
  } catch (error) {
    logger.error('Get packages API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/packages/upgrade
router.post('/packages/upgrade', requireAuth, async (req, res) => {
  try {
    const { package_type } = req.body;
    const supabase = getSupabaseClient(req);

    // Validate package type
    const validPackages = ['free', 'student', 'enterprise'];
    if (!validPackages.includes(package_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package type',
      });
    }

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('package_type, credit_balance')
      .eq('user_id', req.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    // Get package details
    const { data: packageDetails } = await supabase
      .from('packages')
      .select('*')
      .eq('type', package_type)
      .single();

    if (!packageDetails) {
      return res.status(404).json({
        success: false,
        error: 'Package not found',
      });
    }

    // Calculate credits to add
    let creditsToAdd = 0;
    if (package_type === 'student' && profile.package_type !== 'student') {
      creditsToAdd = packageDetails.credits_monthly || 100;
    } else if (
      package_type === 'enterprise' &&
      profile.package_type !== 'enterprise'
    ) {
      creditsToAdd = packageDetails.credits_monthly || 500;
    }

    // Update package and credits
    const newBalance = profile.credit_balance + creditsToAdd;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        package_type: package_type,
        credit_balance: newBalance,
        last_credit_update: new Date().toISOString(),
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
      });
    }

    // Record transaction if credits were added
    if (creditsToAdd > 0) {
      await supabase.from('credit_transactions').insert({
        user_id: req.user.id,
        transaction_type: 'package_upgrade',
        amount: creditsToAdd,
        metadata: {
          package_type: package_type,
          previous_package: profile.package_type,
        },
      });
    }

    res.json({
      success: true,
      profile: updatedProfile,
      credits_added: creditsToAdd,
    });
  } catch (error) {
    logger.error('Package upgrade API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// IDEAS API ENDPOINTS
// ========================================

// GET /api/ideas
router.get('/ideas', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { limit = 20, offset = 0, search, category } = req.query;

    let query = supabase
      .from('ideas')
      .select(
        `
        *,
        votes (
          rating
        )
      `,
      )
      .order('created_at', { ascending: false });

    // Filter by privacy (show public ideas and user's own private ideas)
    query = query.or(
      `privacy.eq.public,and(user_id.eq.${req.user.id},privacy.eq.private)`,
    );

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Pagination
    query = query.range(
      parseInt(offset),
      parseInt(offset) + parseInt(limit) - 1,
    );

    const { data: ideas, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Calculate average ratings
    const ideasWithRatings =
      ideas?.map((idea) => ({
        ...idea,
        average_rating:
          idea.votes?.length > 0
            ? idea.votes.reduce((sum, vote) => sum + vote.rating, 0) /
              idea.votes.length
            : 0,
        vote_count: idea.votes?.length || 0,
        is_owner: idea.user_id === req.user.id,
        votes: undefined, // Remove votes array from response
      })) || [];

    res.json({
      success: true,
      ideas: ideasWithRatings,
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: ideasWithRatings.length === parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Get ideas API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/ideas
router.post('/ideas', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { title, description, category, tags, privacy } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required',
      });
    }

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        user_id: req.user.id,
        title,
        description,
        category: category || null,
        tags: Array.isArray(tags)
          ? tags
          : tags
            ? tags.split(',').map((t) => t.trim())
            : [],
        privacy: privacy || 'public',
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      idea,
    });
  } catch (error) {
    logger.error('Create idea API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/ideas/:id
router.get('/ideas/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id } = req.params;

    const { data: idea, error } = await supabase
      .from('ideas')
      .select(
        `
        *,
        votes (
          rating,
          user_id
        ),
        profiles!ideas_user_id_fkey (
          name,
          avatar_url
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    // Check if user can access this idea
    if (idea.privacy === 'private' && idea.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Calculate ratings
    const userVote = idea.votes?.find((vote) => vote.user_id === req.user.id);
    const averageRating =
      idea.votes?.length > 0
        ? idea.votes.reduce((sum, vote) => sum + vote.rating, 0) /
          idea.votes.length
        : 0;

    res.json({
      success: true,
      idea: {
        ...idea,
        average_rating: averageRating,
        vote_count: idea.votes?.length || 0,
        user_vote: userVote?.rating || null,
        author: idea.profiles,
        votes: undefined,
        profiles: undefined,
      },
    });
  } catch (error) {
    logger.error('Get idea API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/ideas/:id
router.put('/ideas/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const { data: existingIdea } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingIdea || existingIdea.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Remove sensitive fields
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    const { data: idea, error } = await supabase
      .from('ideas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      idea,
    });
  } catch (error) {
    logger.error('Update idea API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// DELETE /api/ideas/:id
router.delete('/ideas/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id } = req.params;

    // Check ownership
    const { data: existingIdea } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingIdea || existingIdea.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Delete the idea
    const { error } = await supabase.from('ideas').delete().eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Idea deleted successfully',
    });
  } catch (error) {
    logger.error('Delete idea API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// VOTES API ENDPOINTS
// ========================================

// POST /api/votes
router.post('/votes', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { idea_id, rating } = req.body;

    if (!idea_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Valid idea_id and rating (1-5) are required',
      });
    }

    // Check if idea exists and is public or owned by user
    const { data: idea } = await supabase
      .from('ideas')
      .select('user_id, privacy, validation_threshold_met')
      .eq('id', idea_id)
      .single();

    if (!idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    if (idea.privacy === 'private' && idea.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('idea_id', idea_id)
      .eq('user_id', req.user.id)
      .single();

    let vote;
    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('votes')
        .update({ rating })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      vote = data;
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('votes')
        .insert({
          idea_id,
          user_id: req.user.id,
          rating,
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      vote = data;

      // Check if idea should be validated
      await checkIdeaValidation(supabase, idea_id);
    }

    res.json({
      success: true,
      vote,
    });
  } catch (error) {
    logger.error('Vote API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// MODELS API ENDPOINTS
// ========================================

// POST /api/models/:type
router.post('/models/:type', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { type } = req.params;
    const { idea_id } = req.body;

    if (!idea_id) {
      return res.status(400).json({
        success: false,
        error: 'idea_id is required',
      });
    }

    // Validate model type
    const validTypes = [
      'idea',
      'business',
      'financial',
      'funding',
      'legal',
      'marketing',
      'team',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model type',
      });
    }

    // Check if user owns the idea
    const { data: idea } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', idea_id)
      .single();

    if (!idea || idea.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if model instance already exists
    const { data: existingModel } = await supabase
      .from('model_instances')
      .select('id')
      .eq('idea_id', idea_id)
      .eq('model_type', type)
      .eq('user_id', req.user.id)
      .single();

    if (existingModel) {
      return res.status(409).json({
        success: false,
        error: 'Model instance already exists for this idea',
      });
    }

    // Create model instance
    const { data: modelInstance, error } = await supabase
      .from('model_instances')
      .insert({
        idea_id,
        user_id: req.user.id,
        model_type: type,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      model: modelInstance,
    });
  } catch (error) {
    logger.error('Create model API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/models/:id/sections/:section
router.get('/models/:id/sections/:section', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id, section } = req.params;

    // Check if user owns the model instance
    const { data: modelInstance } = await supabase
      .from('model_instances')
      .select('user_id, idea_id')
      .eq('id', id)
      .single();

    if (!modelInstance || modelInstance.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get section data
    const { data: sectionData, error } = await supabase
      .from('model_sections')
      .select('*')
      .eq('model_instance_id', id)
      .eq('section_name', section)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      section: sectionData || {
        section_name: section,
        section_data: {},
        is_completed: false,
      },
    });
  } catch (error) {
    logger.error('Get model section API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/models/:id/sections/:section
router.put('/models/:id/sections/:section', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id, section } = req.params;
    const { section_data, is_completed } = req.body;

    // Check if user owns the model instance
    const { data: modelInstance } = await supabase
      .from('model_instances')
      .select('user_id, idea_id')
      .eq('id', id)
      .single();

    if (!modelInstance || modelInstance.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Upsert section data
    const { data: sectionData, error } = await supabase
      .from('model_sections')
      .upsert(
        {
          model_instance_id: id,
          section_name: section,
          section_data: section_data || {},
          is_completed: is_completed || false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'model_instance_id,section_name',
        },
      )
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Check if model should be marked as completed
    if (is_completed) {
      await checkModelCompletion(supabase, id);
    }

    res.json({
      success: true,
      section: sectionData,
    });
  } catch (error) {
    logger.error('Update model section API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// DASHBOARD API ENDPOINTS
// ========================================

// GET /api/dashboard/stats
router.get('/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);

    // Get user stats
    const [
      { count: ideasCount },
      { data: recentIdeas },
      { data: creditBalance },
      { data: recentActivity },
    ] = await Promise.all([
      // Ideas count
      supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id),

      // Recent ideas
      supabase
        .from('ideas')
        .select('id, title, created_at, completion_percentage')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // Credit balance
      supabase
        .from('profiles')
        .select('credit_balance')
        .eq('user_id', req.user.id)
        .single(),

      // Recent activity
      supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Get portfolio stats
    const { data: portfolios } = await supabase
      .from('ideas')
      .select(
        `
        id,
        portfolios!inner (
          id
        )
      `,
      )
      .eq('user_id', req.user.id);

    const portfolioCount = new Set(
      portfolios?.map((p) => p.portfolios.id) || [],
    ).size;

    // Calculate completion stats
    const completedIdeas =
      recentIdeas?.filter((idea) => idea.completion_percentage === 100)
        .length || 0;
    const completionRate =
      recentIdeas?.length > 0 ? (completedIdeas / recentIdeas.length) * 100 : 0;

    res.json({
      success: true,
      stats: {
        total_ideas: ideasCount || 0,
        completed_ideas: completedIdeas,
        completion_rate: Math.round(completionRate),
        credit_balance: creditBalance?.credit_balance || 0,
        portfolios: portfolioCount,
        recent_ideas: recentIdeas || [],
        recent_activity: recentActivity || [],
      },
    });
  } catch (error) {
    logger.error('Dashboard stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// REPORTS API ENDPOINTS
// ========================================

// POST /api/reports/:type
router.post('/reports/:type', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { type } = req.params;
    const { idea_id } = req.body;

    if (!idea_id) {
      return res.status(400).json({
        success: false,
        error: 'idea_id is required',
      });
    }

    // Validate report type
    const validTypes = ['business-plan', 'pitch-deck', 'valuation'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type',
      });
    }

    // Check if user owns the idea and it's validated
    const { data: idea } = await supabase
      .from('ideas')
      .select('user_id, validation_threshold_met, title')
      .eq('id', idea_id)
      .single();

    if (!idea || idea.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    if (!idea.validation_threshold_met) {
      return res.status(400).json({
        success: false,
        error: 'Idea must reach validation threshold before generating reports',
      });
    }

    // Check credit balance
    const { balance } = await getUserCredits(req.user.id);
    if (balance < 50) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. Report generation costs 50 credits.',
        required_credits: 50,
        current_balance: balance,
      });
    }

    // Get completed model data
    const { data: modelData } = await supabase
      .from('model_instances')
      .select(
        `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
      )
      .eq('idea_id', idea_id)
      .eq('user_id', req.user.id)
      .eq('status', 'completed');

    // Generate report content
    const reportContent = await generateReportContent(type, idea, modelData);

    // Generate PDF and upload to storage
    const { generateAndUploadPDF, convertReportToHTML } = await import(
      '../../services/report-storage.js'
    );

    const reportTitle = `${type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - ${idea.title}`;
    const htmlContent = convertReportToHTML(
      reportContent,
      reportTitle,
      type,
      idea,
    );

    const pdfResult = await generateAndUploadPDF(
      htmlContent,
      `${type}-${idea.id}`,
      'reports',
    );

    if (!pdfResult.success) {
      logger.error('PDF generation failed:', pdfResult.error);
      return res.status(500).json({
        success: false,
        error: 'Report generated but PDF creation failed',
      });
    }

    // Deduct credits
    await deductCredits(req.user.id, 50, 'report_generation', {
      idea_id: idea_id,
      report_type: type,
    });

    // Save report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        idea_id: idea_id,
        user_id: req.user.id,
        report_type: type,
        report_data: {
          content: reportContent,
          file_url: pdfResult.publicUrl,
        },
      })
      .select()
      .single();

    if (reportError) {
      logger.error('Error saving report:', reportError);
      return res.status(500).json({
        success: false,
        error: 'Report generated but failed to save',
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      action_type: 'report_generated',
      entity_type: 'report',
      entity_id: report.id,
      details: { report_type: type, idea_id: idea_id },
    });

    res.json({
      success: true,
      message: `${type.replace('-', ' ')} generated successfully`,
      report: {
        id: report.id,
        type: report.report_type,
        idea_id: report.idea_id,
        created_at: report.created_at,
        file_url: pdfResult.publicUrl,
      },
      credits_deducted: 50,
    });
  } catch (error) {
    logger.error('Generate report API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// ACTIVITY API ENDPOINTS
// ========================================

// GET /api/activity
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { limit = 20, offset = 0, type } = req.query;

    let query = supabase
      .from('activity_log')
      .select(
        `
        *,
        ideas (
          title
        ),
        reports (
          report_type
        )
      `,
      )
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('action_type', type);
    }

    query = query.range(
      parseInt(offset),
      parseInt(offset) + parseInt(limit) - 1,
    );

    const { data: activities, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: activities && activities.length === parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Get activity API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// CREDITS API ENDPOINTS
// ========================================

// GET /api/credits
router.get('/credits', requireAuth, async (req, res) => {
  try {
    const { balance, total_earned, total_spent } = await getUserCredits(
      req.user.id,
    );

    res.json({
      success: true,
      balance,
      total_earned,
      total_spent,
    });
  } catch (error) {
    logger.error('Get credits API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/credits/purchase
router.post('/credits/purchase', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req);
    const { package_id } = req.body;

    // Get package details
    const { data: creditPackage, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (packageError || !creditPackage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credit package selected',
      });
    }

    // Add credits to user account
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance, total_earned')
      .eq('user_id', req.user.id)
      .single();

    const newBalance = (profile?.credit_balance || 0) + creditPackage.credits;
    const newTotalEarned = (profile?.total_earned || 0) + creditPackage.credits;

    await supabase
      .from('profiles')
      .update({
        credit_balance: newBalance,
        total_earned: newTotalEarned,
        last_credit_update: new Date().toISOString(),
      })
      .eq('user_id', req.user.id);

    // Record the transaction
    await supabase.from('credit_transactions').insert({
      user_id: req.user.id,
      transaction_type: 'credit_purchase',
      amount: creditPackage.credits,
      metadata: {
        package_id: creditPackage.id,
        package_name: creditPackage.name,
        price: creditPackage.price,
      },
    });

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      action_type: 'credits_purchased',
      entity_type: 'credit_package',
      entity_id: creditPackage.id,
      details: {
        package_name: creditPackage.name,
        credits_added: creditPackage.credits,
        amount_paid: creditPackage.price,
      },
    });

    res.json({
      success: true,
      message: `Successfully purchased ${creditPackage.credits} credits`,
      credits_added: creditPackage.credits,
      new_balance: newBalance,
    });
  } catch (error) {
    logger.error('Credit purchase API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

async function initializeUserProfile(userId, metadata = {}) {
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
  );

  const name =
    metadata.firstName && metadata.lastName
      ? `${metadata.firstName} ${metadata.lastName}`
      : null;

  await supabase.from('profiles').insert({
    user_id: userId,
    name,
    credit_balance: 1000, // Default credits
  });
}

async function checkIdeaValidation(supabase, ideaId) {
  // Get all votes for the idea
  const { data: votes } = await supabase
    .from('votes')
    .select('rating')
    .eq('idea_id', ideaId);

  if (!votes || votes.length < 3) {
    return;
  }

  const averageRating =
    votes.reduce((sum, vote) => sum + vote.rating, 0) / votes.length;

  if (averageRating >= 3) {
    await supabase
      .from('ideas')
      .update({ validation_threshold_met: true })
      .eq('id', ideaId);
  }
}

async function checkModelCompletion(supabase, modelInstanceId) {
  // Check if all sections are completed
  const { data: sections } = await supabase
    .from('model_sections')
    .select('is_completed')
    .eq('model_instance_id', modelInstanceId);

  const allCompleted = sections?.every((section) => section.is_completed);

  if (allCompleted) {
    await supabase
      .from('model_instances')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', modelInstanceId);
  }
}

async function generateReportContent(type, idea, modelData) {
  const { generateBusinessPlan, generatePitchDeck, generateValuation } =
    await import('../../services/report-generator.js');

  switch (type) {
    case 'business-plan':
      return await generateBusinessPlan(idea, modelData);
    case 'pitch-deck':
      return await generatePitchDeck(idea, modelData);
    case 'valuation':
      return await generateValuation(idea, modelData);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

// POST /api/set-language
router.post('/set-language', async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'ar'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Invalid language. Must be 'en' or 'ar'",
      });
    }

    // Always set language in session for immediate effect
    req.session.language = language;

    // If user is authenticated, also update profile
    if (req.user) {
      const supabase = getSupabaseClient(req);

      const currentPrefs = req.user.profile?.preferences || {};
      const updatedPrefs = { ...currentPrefs, language };

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPrefs,
        })
        .eq('user_id', req.user.id);

      if (error) {
        logger.warn('Failed to update profile language:', error.message);
        // Continue without failing
      }

      // Update in-memory profile
      if (req.user.profile) {
        req.user.profile.preferences = updatedPrefs;
      }
    }

    res.json({
      success: true,
      language: language,
    });
  } catch (error) {
    logger.error('Set language API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API working', timestamp: new Date().toISOString() });
});

export default router;
