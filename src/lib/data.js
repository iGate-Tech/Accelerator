

// Data interfaces for easy Supabase migration
// These functions can be easily replaced with Supabase calls

import {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  createSession,
  getSessionByToken,
  deleteSession,
  getProjects,
  addProject,
  updateProject,
  getUserCredits,
  getUserCreditBalance,
  addCreditTransaction
} from './db.js';

// Generic API wrapper for consistent error handling
const apiWrapper = async (fn) => {
  try {
    const result = await fn();
    return { success: true, ...result };
  } catch (error) {
    logger.error('API error:', error);
    return { success: false, error: error.message };
  }
};

export const authAPI = {
  login: async (email, password) => {
    return await apiWrapper(async () => {
      // TODO: Replace with Supabase auth
      const dbUser = await getUserByEmail(email);
      if (!dbUser) throw new Error('User not found');

      // Simple password check (replace with proper hashing for production)
      if (dbUser.password_hash !== password) throw new Error('Invalid password');

      // Create session
      const token = `token_${Date.now()}_${Math.random()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await createSession(dbUser.id, token, expiresAt);

      return {
        user: {
          id: dbUser.id,
          profile: dbUser.profile,
          preferences: dbUser.profile?.preferences || {},
          subscription: dbUser.profile?.subscription || {},
          credits: { balance: 0, transactions: [] }
        },
        token
      };
    });
  },

  signup: async (userData) => {
    return await apiWrapper(async () => {
      // TODO: Replace with Supabase auth
      const profile = {
        name: userData.name,
        email: userData.email,
        avatar: avatar,
        joinDate: new Date().toISOString().split('T')[0],
        bio: ""
      };

      const newUser = await createUser(userData.email, userData.password, profile);
      return { user: newUser };
    });
  },

  logout: async () => {
    return await apiWrapper(async () => {
      // TODO: Replace with Supabase auth
      const token = localStorage.getItem('userToken');
      if (token) {
        await deleteSession(token);
      }
      localStorage.removeItem('userToken');
      return {};
    });
  },

  getCurrentUser: async () => {
    return await apiWrapper(async () => {
      // TODO: Replace with Supabase auth
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No token');

      const session = await getSessionByToken(token);
      if (!session) throw new Error('Invalid session');

      return {
        user: {
          id: session.user_id,
          profile: session.profile,
          preferences: session.profile?.preferences || {},
          subscription: session.profile?.subscription || {},
          credits: { balance: 0, transactions: [] }
        }
      };
    });
  }
};

export const dataAPI = {
  // User operations
  getUser: async (userId) => {
    return await apiWrapper(async () => {
      const user = await getUserById(userId);
      return { data: user };
    });
  },

  updateUser: async (userId, updates) => {
    return await apiWrapper(async () => {
      await updateUser(userId, updates);
      return {};
    });
  },

  // Project operations
  getProjects: async (userId) => {
    return await apiWrapper(async () => {
      const projects = await getProjects(userId);
      return { data: projects };
    });
  },

  createProject: async (projectData) => {
    return await apiWrapper(async () => {
      const projectId = await addProject(projectData);
      return { data: { id: projectId } };
    });
  },

  updateProject: async (projectId, updates) => {
    return await apiWrapper(async () => {
      if (!updates || typeof updates !== 'object') {
        throw new Error(`Invalid updates data: ${JSON.stringify(updates)}`);
      }
      await updateProject(projectId, updates);
      return {};
    });
  },

  // Credit operations
  getUserCredits: async (userId) => {
    return await apiWrapper(async () => {
      const credits = await getUserCredits(userId);
      return { data: credits };
    });
  },

  getCreditBalance: async (userId) => {
    return await apiWrapper(async () => {
      const balance = await getUserCreditBalance(userId);
      return { data: balance };
    });
  },

  addCreditTransaction: async (userId, type, amount, description) => {
    return await apiWrapper(async () => {
      await addCreditTransaction(userId, type, amount, description);
      return {};
    });
  }
};