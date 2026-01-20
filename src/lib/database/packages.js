import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './core.js';

// Package and subscription management functions
export async function _seedPackages() {
   try {
     console.log('Seeding packages...');
     const packages = [
       {
         id: 'free',
         name: 'Free',
         description: 'Basic plan with limited credits',
         price: 0,
         credits_included: 100,
         features: JSON.stringify(['Basic AI models', 'Limited credits', 'Community support']),
         active: 1
       },
       {
         id: 'pro',
         name: 'Pro',
         description: 'Professional plan with more credits',
         price: 29.99,
         credits_included: 1000,
         features: JSON.stringify(['Advanced AI models', 'Higher credit limits', 'Priority support', 'API access']),
         active: 1
       },
       {
         id: 'enterprise',
         name: 'Enterprise',
         description: 'Enterprise plan for teams',
         price: 99.99,
         credits_included: 5000,
         features: JSON.stringify(['All AI models', 'Unlimited credits', 'Dedicated support', 'Team collaboration', 'Custom integrations']),
         active: 1
       }
     ];

     for (const pkg of packages) {
       await dbInstance.query(`
         INSERT INTO packages (id, name, description, price, credits_included, features, active, created_at, synced_at, last_modified, sync_status, deleted_at, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING
       `, [
         pkg.id,
         pkg.name,
         pkg.description,
         pkg.price,
         pkg.credits_included,
         pkg.features,
         pkg.active,
         new Date().toISOString(),
         new Date().toISOString(),
         new Date().toISOString(),
         'local',
         null,
         1
       ]);
     }

     console.log('Packages seeded successfully');
     return { success: true };
   } catch (error) {
     console.error('Error seeding packages:', error);
     throw error;
   }
 }

export async function _getPackages() {
  try {
    const res = await dbInstance.query('SELECT * FROM packages WHERE active = 1 ORDER BY price ASC');
    return res.rows;
  } catch (error) {
    console.error('Error getting packages:', error);
    return [];
  }
}

export async function _createUserSubscription({ userId, packageId, subscriptionData = {} }) {
  try {
    const id = uuidv4();
    
    // Get package details to include price and credits
    let packageDetails = { price: 0, credits_included: 100 };
    try {
      const res = await dbInstance.query('SELECT * FROM packages WHERE id = $1', [packageId]);
      if (res.rows[0]) {
        packageDetails = {
          price: res.rows[0].price || 0,
          credits_included: res.rows[0].credits_included || 100
        };
      }
    } catch (pkgError) {
      console.debug('Error getting package details:', pkgError.message);
    }
    
    const res = await dbInstance.query(`
      INSERT INTO user_subscriptions (id, user_id, package_id, name, status, price, credits_included, start_date, end_date, auto_renew, synced_at, last_modified, sync_status, deleted_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      id,
      userId,
      packageId,
      subscriptionData.name || packageId,
      subscriptionData.status || 'active',
      packageDetails.price,
      packageDetails.credits_included,
      subscriptionData.start_date || new Date().toISOString(),
      subscriptionData.end_date || null,
      subscriptionData.auto_renew !== undefined ? subscriptionData.auto_renew : 1,
      new Date().toISOString(),
      new Date().toISOString(),
      'local',
      null,
      1
    ]);
    return res.rows[0];
  } catch (error) {
    console.error('Error creating user subscription:', error);
    throw error;
  }
}

export async function _getUserSubscription({ userId }) {
  if (!dbInstance) {
    console.debug('Database not initialized, returning null subscription');
    return null;
  }
  try {
    const res = await dbInstance.query('SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY start_date DESC LIMIT 1', [userId]);
    return res.rows[0];
  } catch (error) {
    if (error.message.includes('relation "user_subscriptions" does not exist')) {
      console.warn('user_subscriptions table does not exist, creating it...');
      try {
        await dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS user_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            package_id TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            start_date TEXT DEFAULT CURRENT_TIMESTAMP::text,
            end_date TEXT,
            auto_renew INTEGER DEFAULT 1,
            synced_at TEXT,
            last_modified TEXT,
            sync_status TEXT DEFAULT 'local',
            deleted_at TEXT,
            version INTEGER DEFAULT 1
          );
        `);
        console.log('user_subscriptions table created');
        // Retry the query
        const res = await dbInstance.query('SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY start_date DESC LIMIT 1', [userId]);
        return res.rows[0];
      } catch (createError) {
        console.error('Error creating user_subscriptions table:', createError);
        return null;
      }
    } else {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }
}

export async function _changeUserSubscription({ userId, newPackageId, currentSubscription }) {
  try {
    // If there's a current subscription, update it or cancel it
    if (currentSubscription) {
       await dbInstance.query('UPDATE user_subscriptions SET status = $1, cancelled_at = $2 WHERE id = $3', ['cancelled', new Date().toISOString(), currentSubscription.id]);
    }

    // Create new subscription
    const subscriptionData = {
      user_id: userId,
      package_id: newPackageId,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      sync_status: 'local'
    };

    const result = await _createUserSubscription({ userId, packageId: newPackageId, subscriptionData });
    return result;
  } catch (err) {
    console.error('Error changing user subscription:', err);
    throw err;
  }
}

export async function _updateUserSubscription({ userId, subscriptionId, updates }) {
  try {
    const { updateEntity } = await import('./core.js');
    const result = await updateEntity({ table: 'user_subscriptions', idField: 'id', id: subscriptionId, updates });
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (err) {
    console.error('Error updating user subscription:', err);
    throw err;
  }
}