import { createContext, createSignal, useContext, onMount } from "solid-js";
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
       const { updateUserProfile } = await import('../lib/db');
       // Update database first
       await updateUserProfile(user().id, profileUpdates);

       // Then update local state
       setUser(prev => ({
         ...prev,
         avatar: profileUpdates.avatar || prev.avatar,
         profile: { ...prev.profile, ...profileUpdates }
       }));

       // Log profile update
       activityLogger.logProfile('updated', { fields: Object.keys(profileUpdates) });
     } catch (error) {
       logger.error('Error updating profile:', error);
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
     // No refresh needed for local user
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

  // Auth functions (local)
  const login = async (email, password) => {
    logger.info('User login initiated for:', email);
    // Always succeed for local user
    const localUserId = 'local-user';
    const profileData = await getUserProfile(localUserId);

    let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
    let creditBalance = 0;
    try {
      const userSubscription = await getUserSubscription(localUserId);
      if (userSubscription) {
        subscriptionData = {
          plan: userSubscription.name,
          status: userSubscription.status,
          price: userSubscription.price,
          renewalDate: userSubscription.end_date,
          maxCredits: userSubscription.credits_included
        };
      }

      const { getCreditBalance } = await import('../lib/db');
      creditBalance = await getCreditBalance(localUserId);
    } catch (error) {
      logger.error('Error fetching subscription/credits in login:', error);
    }

    setIsAuthenticated(true);
    setUser({
      id: localUserId,
      email: email,
      avatar: profileData?.avatar || avatar,
      profile: {
        name: email.split('@')[0],
        email: email,
        bio: profileData?.bio || '',
        joinDate: new Date().toISOString(),
        ...profileData
      },
      preferences: {
        notifications: { email: true, browser: false, projectUpdates: true },
        privacy: { profileVisibility: 'private', dataSharing: false }
      },
      subscription: subscriptionData,
      credits: { balance: creditBalance || (subscriptionData.plan?.toLowerCase() === 'free' ? 50 : 0), transactions: [] }
    });
    localStorage.setItem('userData', JSON.stringify(user()));
    return true;
  };

  const logout = async () => {
    if (!confirm('Are you sure you want to log out?')) {
      return;
    }

    logger.info('User logout initiated');
    // Log logout before clearing session
    if (user()) {
      activityLogger.logAuth('logout');
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userData');
    logger.info('User logout successful');
    toastManager.success('Logged out successfully');
  };

  const signup = async (email, password, profile = {}) => {
    logger.info('User signup initiated for:', email);
    try {
      // Try to create user in database
      const { createUser } = await import('../lib/db');
      try {
        await createUser(email, null, profile, 'local-user');
      } catch (dbError) {
        logger.warn('Failed to create user in database, continuing with local auth:', dbError);
        // Continue anyway for local mode
      }
      // Always succeed for local user
      return {
        success: true,
        user: { id: 'local-user', email },
        needsConfirmation: false
      };
    } catch (error) {
      logger.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    logger.info('Password reset initiated for:', email);
    // Always succeed for local user
    return { success: true };
  };

  const checkAuth = async () => {
    logger.info('Auth check initiated');
    // Always authenticated for local user
    const localUserId = 'local-user';
    const profileData = await getUserProfile(localUserId);

    let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
    let creditBalance = 0;
    try {
      const userSubscription = await getUserSubscription(localUserId);
      if (userSubscription) {
        subscriptionData = {
          plan: userSubscription.name,
          status: userSubscription.status,
          price: userSubscription.price,
          renewalDate: userSubscription.end_date,
          maxCredits: userSubscription.credits_included
        };
      }

      const { getCreditBalance } = await import('../lib/db');
      creditBalance = await getCreditBalance(localUserId);
    } catch (error) {
      logger.error('Error fetching subscription or credits in checkAuth:', error);
    }

    const localUser = {
      id: localUserId,
      email: 'local@user.com',
      avatar: profileData?.avatar || avatar,
      profile: {
        name: 'Local User',
        email: 'local@user.com',
        bio: profileData?.bio || '',
        joinDate: new Date().toISOString(),
        ...profileData
      },
      preferences: {
        notifications: { email: true, browser: false, projectUpdates: true },
        privacy: { profileVisibility: 'private', dataSharing: false }
      },
      subscription: subscriptionData,
      credits: { balance: creditBalance || (subscriptionData.plan?.toLowerCase() === 'free' ? 50 : 0), transactions: [] }
    };

    setUser(localUser);
    setIsAuthenticated(true);
    localStorage.setItem('userData', JSON.stringify(localUser));
    activityLogger.setUser(localUser);
    return true;
  };



  onMount(async () => {
    logger.info('UserProvider initialization started');

    // Initialize database only
    try {
      const { initDb } = await import('../lib/db');
      await initDb();
      logger.info('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error.message);
    }

    try {
      // Load user data from localStorage if available
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        try {
          const parsedUser = JSON.parse(savedUserData);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            logger.debug('User loaded from localStorage');
          } else {
            localStorage.removeItem('userData');
          }
        } catch (parseError) {
          logger.error('Error parsing saved user data:', parseError);
          localStorage.removeItem('userData');
        }
      }

      logger.debug('Starting checkAuth...');
      await checkAuth();
      logger.debug('checkAuth completed');
    } catch (error) {
      logger.error('checkAuth failed:', error);
      // Set default state if checkAuth fails
      setUser(null);
      setIsAuthenticated(false);
    }
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