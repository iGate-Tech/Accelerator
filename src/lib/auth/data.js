

// Data interfaces for easy Supabase migration
// These functions can be easily replaced with Supabase calls

import { logger } from '../core';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"%3E%3C/path%3E%3Ccircle cx="12" cy="7" r="4"%3E%3C/circle%3E%3C/svg%3E';

// Client-side authentication utilities
export const createAuthToken = async (userId, rememberMe = false) => {
  const { createSecureToken } = await import('./security.js');
  return await createSecureToken(userId, rememberMe);
};

export const verifyAuthToken = async (token) => {
  const { verifySecureToken } = await import('./security.js');
  return await verifySecureToken(token);
};

// Legacy compatibility
export const createMockToken = (userId, rememberMe = false) => {
  return createAuthToken(userId, rememberMe);
};

export const verifyMockToken = (token) => {
  return verifyAuthToken(token);
};

export const getCurrentUserFromToken = async (token) => {
  try {
    const decoded = await verifyMockToken(token);
    if (!decoded) return null;

    // Check if session exists in database
    const session = await getSessionByToken(token);
    if (!session) return null;

    // Get user data
    const user = await getUserById(decoded.userId);
    return user;
  } catch (error) {
    logger.error('getCurrentUserFromToken failed:', error.message);
    return null;
  }
};
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
} from '../database';

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

      // Simple password check for mock auth (in production, use proper hashing)
      if (dbUser.password_hash !== password) throw new Error('Invalid password');

      // Create JWT token for session
      const token = await createAuthToken(dbUser.id, false);

      // Store session in database for tracking
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
        avatar: userData.avatar || DEFAULT_AVATAR,
        joinDate: new Date().toISOString().split('T')[0],
        bio: ""
      };

      // For mock auth, store password as-is (in production, hash server-side)
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