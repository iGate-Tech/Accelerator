import express from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../../config.js';
import { requireAuth } from '../../session.js';

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.key);

// GET /api/credits - Get current user's credit balance and recent transactions
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    // Get user profile with credit info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance, total_spent, total_earned, last_credit_update')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch credit information',
      });
    }

    // Handle case where user doesn't have a profile yet
    const profileData = profile || {
      credit_balance: 0,
      total_spent: 0,
      total_earned: 0,
      last_credit_update: null,
    };

    // Get recent credit transactions
    const { data: transactions, error: txError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      // Don't fail the request if transactions fail
    }

    res.json({
      success: true,
      balance: profileData.credit_balance,
      total_spent: profileData.total_spent,
      total_earned: profileData.total_earned,
      last_update: profileData.last_credit_update,
      recent_transactions: transactions || [],
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/credits/purchase - Purchase credits
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { package_id } = req.body;

    if (!package_id) {
      return res.status(400).json({
        success: false,
        error: 'Package ID is required',
      });
    }

    // Get credit package details
    const { data: creditPackage, error: pkgError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (pkgError || !creditPackage) {
      return res.status(404).json({
        success: false,
        error: 'Credit package not found',
      });
    }

    // For now, assume credits are granted immediately (in a real implementation,
    // this would integrate with a payment processor like Stripe)

    // Get current user profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance, total_earned')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching current profile:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile',
      });
    }

    const newBalance =
      (currentProfile?.credit_balance || 0) + creditPackage.credits;
    const newTotalEarned =
      (currentProfile?.total_earned || 0) + creditPackage.credits;

    // Update user credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credit_balance: newBalance,
        total_earned: newTotalEarned,
        last_credit_update: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update credits',
      });
    }

    // Record the transaction
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'credit_purchase',
        amount: creditPackage.credits,
        metadata: {
          package_id: creditPackage.id,
          package_name: creditPackage.name,
          price: creditPackage.price,
        },
      });

    if (txError) {
      console.error('Error recording transaction:', txError);
      // Don't fail the request if transaction logging fails
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      action_type: 'credits_purchased',
      entity_type: 'credit_package',
      entity_id: creditPackage.id,
      details: {
        package_name: creditPackage.name,
        credits_purchased: creditPackage.credits,
        amount: creditPackage.price,
      },
    });

    res.json({
      success: true,
      message: `Successfully purchased ${creditPackage.credits} credits`,
      credits_added: creditPackage.credits,
      new_balance: newBalance,
      package: {
        id: creditPackage.id,
        name: creditPackage.name,
        credits: creditPackage.credits,
        price: creditPackage.price,
      },
    });
  } catch (error) {
    console.error('Purchase credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/credits/transactions - Get paginated credit transaction history
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type, start_date, end_date } = req.query;

    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (type) {
      query = query.eq('transaction_type', type);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Get total count for pagination
    const { count, error: countError } = await query;

    if (countError) {
      console.error('Error counting transactions:', countError);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions',
      });
    }

    res.json({
      success: true,
      transactions: transactions || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: transactions && transactions.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/credits/summary - Get credit usage summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get transactions in date range
    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction summary:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch credit summary',
      });
    }

    // Calculate summary statistics
    const summary = {
      total_earned: 0,
      total_spent: 0,
      ai_generations: 0,
      rewards_earned: 0,
      purchases: 0,
      by_type: {},
    };

    transactions?.forEach((tx) => {
      // Initialize type counter if not exists
      if (!summary.by_type[tx.transaction_type]) {
        summary.by_type[tx.transaction_type] = 0;
      }

      if (tx.amount > 0) {
        summary.total_earned += tx.amount;
        summary.by_type[tx.transaction_type] += tx.amount;

        if (tx.transaction_type === 'reward_earned') {
          summary.rewards_earned += tx.amount;
        } else if (tx.transaction_type === 'credit_purchase') {
          summary.purchases += tx.amount;
        }
      } else {
        summary.total_spent += Math.abs(tx.amount);
        summary.by_type[tx.transaction_type] += Math.abs(tx.amount);

        if (tx.transaction_type === 'ai_generation') {
          summary.ai_generations += Math.abs(tx.amount);
        }
      }
    });

    // Get current balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      period_days: parseInt(days),
      current_balance: profile?.credit_balance || 0,
      summary,
      transaction_count: transactions?.length || 0,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
