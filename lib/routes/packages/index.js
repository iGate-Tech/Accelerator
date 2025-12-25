import express from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../../config.js';
import logger from '../../utils/logger.js';
import { requireAuth } from '../../session.js';

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.key);

// Credit allocations for each package type
const creditAllocations = {
  free: 50,
  student: 500,
  enterprise: 2000,
};

// GET /api/packages - List all available packages
router.get('/', async (req, res) => {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('price_monthly');

    if (error) {
      logger.error('Error fetching packages:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch packages',
      });
    }

    // Add credit allocation info to each package
    const packagesWithCredits =
      packages?.map((pkg) => ({
        ...pkg,
        credits_allocated: creditAllocations[pkg.type] || 0,
      })) || [];

    res.json({
      success: true,
      packages: packagesWithCredits,
    });
  } catch (error) {
    logger.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/packages/current - Get current user's package info
router.get('/current', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile with package info
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'package_type, package_status, package_started, package_expires, credit_balance',
      )
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Error fetching user package:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch package information',
      });
    }

    // Get package details
    const { data: packageDetails } = await supabase
      .from('packages')
      .select('*')
      .eq('type', profile.package_type || 'free')
      .single();

    const packageInfo = {
      type: profile.package_type || 'free',
      status: profile.package_status || 'active',
      started: profile.package_started,
      expires: profile.package_expires,
      credits_allocated: creditAllocations[profile.package_type || 'free'] || 0,
      credits_current: profile.credit_balance || 0,
      package_details: packageDetails || null,
      days_remaining: null,
    };

    // Calculate days remaining if package expires
    if (profile.package_expires) {
      const expiresDate = new Date(profile.package_expires);
      const today = new Date();
      const diffTime = expiresDate - today;
      packageInfo.days_remaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      package: packageInfo,
    });
  } catch (error) {
    logger.error('Get current package error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/packages - Subscribe or upgrade to a package
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { package_type } = req.body;

    // Validate package type
    if (
      !package_type ||
      !['free', 'student', 'enterprise'].includes(package_type)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid package type. Must be one of: free, student, enterprise',
      });
    }

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('package_type, credit_balance')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error fetching current profile:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch current profile',
      });
    }

    // Calculate credit allocation
    let newCredits;
    switch (package_type) {
      case 'free':
        newCredits = 50;
        break;
      case 'student':
        newCredits = 500;
        break;
      case 'enterprise':
        newCredits = 2000;
        break;
      default:
        newCredits = 0; // Should not happen due to validation
    }
    const creditDifference = newCredits - (currentProfile?.credit_balance || 0);

    // Prepare update data
    const updateData = {
      package_type,
      package_status: 'active',
      package_started: new Date().toISOString(),
      credit_balance: newCredits,
      updated_at: new Date().toISOString(),
    };

    // Set expiration for paid packages (30 days from now)
    if (package_type !== 'free') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      updateData.package_expires = expires.toISOString();
    } else {
      updateData.package_expires = null;
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          ...updateData,
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating package:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update package',
      });
    }

    // Log credit transaction if credits were added
    if (creditDifference > 0) {
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        transaction_type: 'package_upgrade',
        amount: creditDifference,
        metadata: {
          reason: `Package change to ${package_type}`,
          previous_package: currentProfile?.package_type || 'none',
          new_package: package_type,
        },
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      action_type: 'package_upgraded',
      entity_type: 'package',
      entity_id: package_type,
      details: {
        previous_package: currentProfile?.package_type || 'none',
        new_package: package_type,
        credits_added: creditDifference > 0 ? creditDifference : 0,
      },
    });

    res.json({
      success: true,
      message: `Successfully ${currentProfile?.package_type ? 'upgraded' : 'subscribed'} to ${package_type} package${creditDifference > 0 ? ` with ${creditDifference} bonus credits` : ''}`,
      package: {
        type: package_type,
        status: 'active',
        credits_allocated: newCredits,
        credits_current: newCredits,
        started: updateData.package_started,
        expires: updateData.package_expires,
      },
    });
  } catch (error) {
    logger.error('Package subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/packages/cancel - Cancel subscription (downgrade to free)
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('package_type, credit_balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      logger.error('Error fetching current profile:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch current profile',
      });
    }

    // Check if already on free plan
    if (currentProfile.package_type === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel free plan',
      });
    }

    // Downgrade to free plan
    const updateData = {
      package_type: 'free',
      package_status: 'cancelled',
      package_expires: null,
      credit_balance: Math.min(
        currentProfile.credit_balance || 0,
        creditAllocations.free,
      ),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error cancelling package:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel package',
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      action_type: 'package_cancelled',
      entity_type: 'package',
      entity_id: 'free',
      details: {
        previous_package: currentProfile.package_type,
        credits_retained: updateData.credit_balance,
      },
    });

    res.json({
      success: true,
      message: 'Package cancelled successfully. Downgraded to free plan.',
      package: {
        type: 'free',
        status: 'cancelled',
        credits_current: updateData.credit_balance,
      },
    });
  } catch (error) {
    logger.error('Package cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/packages/credit-packages - Get available credit packages for purchase
router.get('/credit-packages', async (req, res) => {
  try {
    const { data: creditPackages, error } = await supabase
      .from('credit_packages')
      .select('*')
      .order('credits');

    if (error) {
      logger.error('Error fetching credit packages:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch credit packages',
      });
    }

    res.json({
      success: true,
      credit_packages: creditPackages || [],
    });
  } catch (error) {
    logger.error('Get credit packages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
