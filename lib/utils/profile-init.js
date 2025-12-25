import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from './logger.js';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey || config.supabase.key,
);

/**
 * Initialize user credits record if it doesn't exist
 * @param {string} userId - Supabase user ID
 */
export async function initializeUserProfile(userId) {
  try {
    // Check if user profile record exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: true, error: null };
    }

    // Create initial profile record with default credits
    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        package_type: 'free',
        package_status: 'active',
        credit_balance: 1000, // Default starting credits
        total_earned: 1000,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error initializing user profile:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error in initializeUserProfile:', error);
    return { success: false, error };
  }
}
