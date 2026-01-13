import { createContext, createSignal, useContext, onMount } from "solid-js";
import { supabase, getCurrentUser, signIn, signUp, signOut, resetPassword } from "../lib/supabase";
import { dataAPI } from "../lib/data";
import { updateEntity, getUserProfile, createUserProfile, getUserById, createUser, getUserSubscription } from "../lib/db";
import { toastManager } from "../lib/feedback";
import { activityLogger } from "../lib/activity";
import avatar from "../assets/avatar.png";
import logger from "../lib/logger.js";


const UserContext = createContext();

export const UserProvider = (props) => {
  const [user, setUser] = createSignal(null);
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [session, setSession] = createSignal(null);

  const updateUser = (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(newUser));
      return newUser;
    });
  };

  const updateProfile = async (profileUpdates) => {
    try {
      // Handle avatar separately
      const updates = { ...profileUpdates };
      if (updates.avatar) {
        setUser(prev => ({ ...prev, avatar: updates.avatar }));
        delete updates.avatar;
      }

      // Handle name update via Supabase
      if (updates.name) {
        const { error } = await supabase.auth.updateUser({
          data: { name: updates.name }
        });
        if (error) throw error;
      }

      // Update local state for profile fields
      if (Object.keys(updates).length > 0) {
        setUser(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));
      }

      // Update database
      const dbUpdates = {};
      if (profileUpdates.avatar) dbUpdates.avatar = profileUpdates.avatar;
      if (profileUpdates.bio) dbUpdates.bio = profileUpdates.bio;

      if (Object.keys(dbUpdates).length > 0) {
        dbUpdates.last_modified = new Date();
        await updateEntity('profiles', 'user_id', user().id, dbUpdates);

        // Log profile update
        activityLogger.logProfile('updated', { fields: Object.keys(dbUpdates) });
      }
    } catch (error) {
      logger.error('Error updating profile:', error);
      // Revert local state on error
      setUser(prev => ({ ...prev, avatar: prev.avatar, profile: prev.profile }));
      throw error;
    }
  };

  const updatePreferences = async (preferenceUpdates) => {
    try {
      // Update local state first
      setUser(prev => ({ ...prev, profile: { ...prev.profile, preferences: { ...prev.preferences, ...preferenceUpdates } } }));

       // Update database
       await updateEntity('profiles', 'user_id', user().id, {
         preferences: { ...user().profile.preferences, ...preferenceUpdates },
         last_modified: new Date()
       });
    } catch (error) {
      logger.error('Error updating preferences:', error);
      // Revert local state on error
      setUser(prev => ({ ...prev, profile: { ...prev.profile, preferences: user().profile.preferences } }));
      throw error;
    }
  };

  const updateSubscription = (subscriptionUpdates) => {
    updateUser({ subscription: { ...user().subscription, ...subscriptionUpdates } });
  };

  const refreshUserData = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        // Refresh all user data including credits and subscription
        await checkAuth();
      }
    } catch (error) {
      logger.error('Error refreshing user data:', error);
    }
  };

  const updateCredits = (creditUpdates) => {
    updateUser({ credits: { ...user().credits, ...creditUpdates } });
  };

  const addCreditTransaction = (transaction) => {
    const newTransaction = {
      id: `txn_${Date.now()}`,
      date: new Date().toISOString(),
      ...transaction
    };
    updateCredits({
      balance: user().credits.balance + transaction.amount,
      transactions: [newTransaction, ...user().credits.transactions]
    });
  };

  // Auth functions
  const login = async (email, password) => {
    logger.info('User login initiated for:', email);
    try {
      const data = await signIn(email, password);
      if (data && data.user && data.session && typeof data.session.user.id === 'string') {
        logger.info('User login successful, user ID:', data.session.user.id);
        // Fetch profile data from database
        const profileData = await getUserProfile(data.session.user.id);

         // Fetch subscription data from database
         let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
         let creditBalance = 0;
         try {
           const { getUserSubscription, getCreditBalance } = await import('../lib/db');
           const userSubscription = await getUserSubscription(data.session.user.id);
           if (userSubscription) {
             subscriptionData = {
               plan: userSubscription.name,
               status: userSubscription.status,
               price: userSubscription.price,
               renewalDate: userSubscription.end_date,
               maxCredits: userSubscription.credits_included
             };
           }

           // Fetch credit balance
           creditBalance = await getCreditBalance(data.session.user.id);
         } catch (error) {
           logger.error('Error fetching subscription/credits in login:', error);
         }

        // Manually set auth state to ensure immediate update
        setSession(data.session);
        setIsAuthenticated(true);
        setUser({
          ...data.session.user,
          avatar: profileData?.avatar || data.session.user.user_metadata?.avatar_url || avatar,
          profile: {
            name: data.session.user.user_metadata?.name || data.session.user.email.split('@')[0],
            email: data.session.user.email,
            bio: data.session.user.user_metadata?.bio || '',
            joinDate: data.session.user.created_at,
            ...data.session.user.user_metadata,
            ...profileData
          },
          preferences: {
            notifications: { email: true, browser: false, projectUpdates: true },
            privacy: { profileVisibility: 'private', dataSharing: false }
          },
          subscription: subscriptionData,
           credits: { balance: creditBalance || (subscriptionData.plan?.toLowerCase() === 'free' ? 50 : 0), transactions: [] }
        });
        // Save to localStorage
        localStorage.setItem('userData', JSON.stringify(user()));
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Login error for', email, ':', error.message);
      if (error.message?.includes('Email not confirmed') || error.message?.includes('confirmation')) {
        throw new Error('Please check your email and confirm your account before logging in.');
      }
      return false;
    }
  };

  const logout = async () => {
    logger.info('User logout initiated');
    try {
      // Log logout before clearing session
      if (user()) {
        activityLogger.logAuth('logout');
      }

      await signOut();
      logger.info('User logout successful');
      toastManager.success('Logged out successfully');
      // Session will be cleared by onAuthStateChange
    } catch (error) {
      logger.error('Logout error:', error.message);
      toastManager.error('Logout failed');
    }
  };

  const signup = async (email, password, profile = {}) => {
    logger.info('User signup initiated for:', email);
    try {
      const result = await signUp(email, password, profile);
      if (result.user) {
        logger.info('User signup successful, user ID:', result.user.id);
        // Session will be set by onAuthStateChange if confirmed
        return {
          success: true,
          user: result.user,
          needsConfirmation: result.needsConfirmation
        };
      }
      return { success: false, error: 'No user data returned' };
    } catch (error) {
      logger.error('Signup error for', email, ':', error.message);
      return { success: false, error: error.message || error };
    }
  };

  const forgotPassword = async (email) => {
    logger.info('Password reset initiated for:', email);
    try {
      await resetPassword(email);
      logger.info('Password reset email sent to:', email);
      return { success: true };
    } catch (error) {
      logger.error('Password reset error for', email, ':', error.message);
      return { success: false, error: error.message };
    }
  };

  const checkAuth = async () => {
    logger.info('Auth check initiated');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session && data.session.user && typeof data.session.user.id === 'string') {
        const userData = data.session.user;
        logger.info('Auth check successful, user ID:', userData.id);

        // Ensure user exists in local database
        let localUser = await getUserById(userData.id);
        if (!localUser) {
          const email = String(userData.email || '');
          try {
            localUser = await createUser(email, null, {
              avatar: userData.user_metadata?.avatar_url || '/src/assets/avatar.png',
              bio: userData.user_metadata?.bio || '',
              preferences: {
                notifications: { email: true, browser: false, projectUpdates: true },
                privacy: { profileVisibility: 'private', dataSharing: false }
              }
            }, userData.id);
          } catch (error) {
            logger.error('Failed to create user in local database:', error);
            // Continue anyway - we can still work without local user data
          }
        }

        // Fetch profile data from database with error handling
        let profileData = null;
        try {
          profileData = await getUserProfile(userData.id);
        } catch (error) {
          logger.error('Failed to fetch profile data:', error);
          profileData = null; // Continue with null profile data
        }

         // Fetch subscription data from database with error handling
         let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
         let creditBalance = 0;
         try {
           const { getUserSubscription, getCreditBalance } = await import('../lib/db');
           const userSubscription = await getUserSubscription(userData.id);
           if (userSubscription) {
             subscriptionData = {
               plan: userSubscription.name,
               status: userSubscription.status,
               price: userSubscription.price,
               renewalDate: userSubscription.end_date,
               maxCredits: userSubscription.credits_included
             };
           }

           // Fetch credit balance
           creditBalance = await getCreditBalance(userData.id);
         } catch (error) {
           logger.error('Error fetching subscription or credits in checkAuth:', error);
           // Continue with default data
         }

        // Merge session data with profile and subscription data
         const mergedUser = {
           ...userData,
           avatar: profileData?.avatar || userData.user_metadata?.avatar_url || avatar,
           profile: {
             ...userData.user_metadata,
             ...profileData
           },
           preferences: {
             notifications: { email: true, browser: false, projectUpdates: true },
             privacy: { profileVisibility: 'private', dataSharing: false }
           },
           subscription: subscriptionData,
           credits: { balance: creditBalance || (subscriptionData.plan?.toLowerCase() === 'free' ? 50 : 0), transactions: [] }
         };

        setUser(mergedUser);
        setIsAuthenticated(true);

        // Save to localStorage for persistence
        localStorage.setItem('userData', JSON.stringify(mergedUser));

        // Log login activity
        activityLogger.setUser(mergedUser);
        activityLogger.logAuth('login');

        return true;
      }
      return false;
    } catch (error) {
      logger.error('Auth check error:', error.message);
      return false;
    }
  };



  onMount(async () => {
    logger.info('UserProvider initialization started');

    // Initialize database and sync system
    try {
      const { initDb } = await import('../lib/db');
      const { performSync } = await import('../lib/sync');
      await initDb();
      await performSync();
      logger.info('Database and sync initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database or sync:', error.message);
    }

    try {
      // Load user data from localStorage if available
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        const parsedUser = JSON.parse(savedUserData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }

      logger.debug('Starting checkAuth...');
      await checkAuth();
      logger.debug('checkAuth completed');
    } catch (error) {
      logger.error('checkAuth failed:', error);
      // Set default state if checkAuth fails
      setUser(null);
      setIsAuthenticated(false);
      setSession(null);
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state change:', event, 'session:', !!session);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && session.user) {
          logger.debug('Fetching user data for authenticated user...');

          // Fetch profile data from database with timeout and error handling
          let profileData = null;
          try {
            profileData = await Promise.race([
              getUserProfile(session.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 10000))
            ]);
          } catch (error) {
            logger.error('Failed to fetch profile data:', error);
            profileData = null; // Continue with null profile data
          }

           // Fetch subscription data from database with timeout
           let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
           let creditBalance = 0;
           try {
             const { getUserSubscription, getCreditBalance } = await import('../lib/db');
             const userSubscription = await Promise.race([
               getUserSubscription(session.user.id),
               new Promise((_, reject) => setTimeout(() => reject(new Error('Subscription fetch timeout')), 5000))
             ]);
             if (userSubscription) {
               subscriptionData = {
                 plan: userSubscription.name,
                 status: userSubscription.status,
                 price: userSubscription.price,
                 renewalDate: userSubscription.end_date,
                 maxCredits: userSubscription.credits_included
               };
             }

             // Fetch credit balance
             creditBalance = await Promise.race([
               getCreditBalance(session.user.id),
               new Promise((_, reject) => setTimeout(() => reject(new Error('Credit balance fetch timeout')), 2000))
             ]);
           } catch (error) {
             logger.error('Error fetching subscription or credits in onAuthStateChange:', error);
             // Continue with default subscription data
           }

          const finalUser = {
            ...session.user,
            avatar: profileData?.avatar || session.user.user_metadata?.avatar_url || avatar,
            profile: {
              ...session.user.user_metadata,
              ...profileData
            },
            preferences: {
              notifications: { email: true, browser: false, projectUpdates: true },
              privacy: { profileVisibility: 'private', dataSharing: false }
            },
            subscription: subscriptionData,
            credits: { balance: creditBalance || (subscriptionData.plan?.toLowerCase() === 'free' ? 50 : 0), transactions: [] }
          };

          setUser(finalUser);
          setIsAuthenticated(true);
          setSession(session);

          // Save to localStorage for persistence
          localStorage.setItem('userData', JSON.stringify(finalUser));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('userData');
        }
    });
  });

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      signup,
      forgotPassword,
      checkAuth,
      updateUser,
      updateProfile,
      updatePreferences,
      updateSubscription,
      updateCredits,
      addCreditTransaction,
      refreshUserData
    }}>
      {props.children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    // During development hot reloading, the context might temporarily be unavailable
    // Return a safe mock context to prevent crashes
    if (import.meta.hot) {
      return {
        user: () => null,
        isAuthenticated: () => false,
        login: async () => {},
        signup: async () => {},
        logout: async () => {},
        updateUser: () => {},
        updateProfile: () => {},
        updatePreferences: () => {},
        updateSubscription: () => {},
        updateCredits: () => {},
        addCreditTransaction: () => {},
        checkAuth: async () => {},
        forgotPassword: async () => {}
      };
    }
    // In production, this should never happen
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};