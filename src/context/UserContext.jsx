import { createContext, createSignal, useContext, onMount } from "solid-js";
import { dataAPI } from "../lib/data";
import { updateEntity, getUserProfile, createUserProfile, getUserById, createUser, getUserSubscription, setCurrentUser } from "../lib/db";
import { initDatabase } from "../lib/db-core";
import { toastManager } from "../lib/feedback";
import { activityLogger } from "../lib/activity";
import avatar from "../assets/avatar.png";
import logger from "../lib/logger.js";
import { confirmLogout } from "../components/ui/GlobalConfirm";


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
       setUser(prev => ({ ...prev, preferences: { ...prev.preferences, ...preferenceUpdates } }));
       localStorage.setItem('userData', JSON.stringify(user()));

        // Update database
        await updateEntity('profiles', 'user_id', user().id, {
          preferences: JSON.stringify({ ...user().preferences, ...preferenceUpdates }),
          last_modified: new Date()
        });
     } catch (error) {
       logger.debug('Error updating preferences (non-critical):', error.message);
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
    
    try {
      const { _getUserByEmail } = await import('../lib/db-users');
      const userRecord = await _getUserByEmail({ email });
      
      if (!userRecord) {
        logger.info('User not found:', email);
        return { success: false, error: 'User not found' };
      }
      
      let userId = userRecord.id;
      
      // Verify password if hash exists
      if (userRecord.password_hash && password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'accelerator-salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (userRecord.password_hash !== passwordHash) {
          logger.warn('Invalid password for user:', email);
          return { success: false, error: 'Invalid password' };
        }
      }

      const profileData = await getUserProfile(userId);

      let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100, credits_included: 100 };
      let creditBalance = 50;
      try {
        const { getUserSubscription, getCreditBalance: dbGetCreditBalance } = await import('../lib/db');
        
        // First try to get subscription from packages module
        let userSubscription = null;
        try {
          const { _getUserSubscription, _getPackages } = await import('../lib/db-packages');
          userSubscription = await _getUserSubscription({ userId });
          
          if (userSubscription) {
            const packages = await _getPackages();
            const pkg = packages.find(p => p.id === userSubscription.package_id);
            subscriptionData = {
              plan: userSubscription.package_id || 'free',
              status: userSubscription.status,
              price: userSubscription.price || pkg?.price || 0,
              renewalDate: userSubscription.end_date,
              maxCredits: userSubscription.credits_included || pkg?.credits_included || 100,
              credits_included: userSubscription.credits_included || pkg?.credits_included || 100
            };
          }
        } catch (e) {
          logger.debug('No subscription found or error:', e.message);
        }
        
        creditBalance = await dbGetCreditBalance(userId);
      } catch (error) {
        logger.debug('Error fetching subscription/credits in login:', error.message);
      }

      const userData = {
        id: userId,
        email: email,
        avatar: profileData?.avatar || avatar,
        profile: {
          name: profileData?.name || email.split('@')[0],
          email: email,
          bio: profileData?.bio || '',
          joinDate: profileData?.created_at || new Date().toISOString(),
          ...profileData
        },
        preferences: {
          notifications: { email: true, browser: false, projectUpdates: true },
          privacy: { profileVisibility: 'private', dataSharing: false },
          ...(profileData?.preferences ? JSON.parse(profileData.preferences) : {})
        },
        subscription: subscriptionData,
        credits: { balance: creditBalance || 50, transactions: [] }
      };

      setIsAuthenticated(true);
      setUser(userData);
      setCurrentUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      activityLogger.setUser(userData);
      logger.info('Login successful for:', email);
      return { success: true, user: userData };
    } catch (error) {
      logger.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    const shouldLogout = await confirmLogout();
    if (!shouldLogout) return;

    logger.info('User logout initiated');
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
      const userId = `user_${Date.now()}`;
      const { _createUser, _createUserProfile, _getUserByEmail } = await import('../lib/db-users');
      
      const existingUser = await _getUserByEmail({ email });
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }
      
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'accelerator-salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Create user in database
      const userResult = await _createUser({ email, passwordHash, userId, profile });
      logger.debug('User created:', userResult);
      
      // Create user profile
      const profileData = {
        name: profile.name || email.split('@')[0],
        email: email,
        avatar: profile.avatar || avatar,
        bio: profile.bio || '',
        joinDate: new Date().toISOString()
      };
      const profileResult = await _createUserProfile({ userId, profileData });
      logger.debug('Profile created:', profileResult);
      
      // Create welcome notification
      try {
        const { createNotification, addCreditTransaction, createUserSubscription, seedPackages } = await import('../lib/db');
        
        // Seed packages if not exists
        try {
          await seedPackages();
        } catch (e) {
          logger.debug('Packages already seeded or error:', e.message);
        }
        
        // Create comprehensive onboarding notifications
        await createNotification(userId, 'system', 'Welcome to Accelerator! 🎉', 'Your account has been set up successfully. Start exploring your startup ideas and building amazing projects!');
        
        await createNotification(userId, 'getting-started', 'Getting Started Guide', 'Here\'s how to make the most of Accelerator: 1) Create your first project, 2) Explore AI-powered features, 3) Organize ideas in Portfolio, 4) Track your progress');
        
        await createNotification(userId, 'credits', 'You have 50 Free Credits!', 'Credits are used for AI features and advanced simulations. Check /credits for your balance and /packages to upgrade anytime.');
        
        await createNotification(userId, 'subscription', 'Free Subscription Active', 'You\'re on the Free plan with 100 credits. Upgrade to Pro for more credits, advanced features, and priority support.');
        
        await createNotification(userId, 'project', 'Create Your First Project', 'Click "New Project" to start building your startup idea. Our AI will help you explore different angles and create a comprehensive plan.');
        
        await createNotification(userId, 'portfolio', 'Organize in Portfolio', 'Save your best projects to your Portfolio for quick access. Build a collection of your most promising startup ideas!');
        
        await createNotification(userId, 'help', 'Need Help?', 'Visit /help for FAQs, tutorials, and documentation. Our AI assistant is here to guide you through every step!');
        
        await createNotification(userId, 'ai', 'AI-Powered Accelerator', 'Accelerator uses AI to simulate different startup scenarios, helping you make better decisions. Try it out in your first project!');
        
        await createNotification(userId, 'explore', 'Explore New Ideas', 'Use the Explore page to discover trending startup ideas and get inspired. Find your next big opportunity!');
        
        // Initialize credits with 50 free credits
        try {
          await addCreditTransaction(userId, 'bonus', 50, 'Welcome bonus - free credits');
          logger.debug('Credit transaction created');
        } catch (creditError) {
          logger.debug('Error creating credit transaction:', creditError.message);
        }
        
        // Create free subscription
        try {
          await createUserSubscription(userId, 'free', {
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null,
            auto_renew: 1
          });
          logger.debug('Free subscription created');
        } catch (subError) {
          logger.debug('Error creating subscription:', subError.message);
        }
      } catch (dbError) {
        logger.debug('Database operations error (non-critical):', dbError.message);
      }
      
      // Automatically log in the user after signup
      const loginResult = await login(email, password);
      if (loginResult.success) {
        logger.info('User signed up and logged in successfully:', email);
        return { success: true, user: loginResult.user, needsConfirmation: false };
      } else {
        // Still return success since user was created, just login failed
        return { 
          success: true, 
          user: { id: userId, email },
          needsConfirmation: false,
          warning: 'Account created but automatic login failed. Please log in manually.'
        };
      }
    } catch (error) {
      logger.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    logger.info('Password reset initiated for:', email);
    return { success: true };
  };

  const checkAuth = async () => {
    logger.info('Auth check initiated');
    
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const parsedUser = JSON.parse(savedUserData);
        if (parsedUser && parsedUser.id) {
          const userId = parsedUser.id;
          const profileData = await getUserProfile(userId);
          
          let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
          let creditBalance = 50;
          try {
            const userSubscription = await getUserSubscription(userId);
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
            creditBalance = await getCreditBalance(userId);
          } catch (error) {
            logger.debug('Error fetching subscription or credits in checkAuth:', error.message);
          }

          const userData = {
            ...parsedUser,
            avatar: profileData?.avatar || parsedUser.avatar,
            profile: {
              ...parsedUser.profile,
              ...profileData
            },
            subscription: subscriptionData,
            credits: { balance: creditBalance || 50, transactions: [] }
          };

          setUser(userData);
          setCurrentUser(userData);
          setIsAuthenticated(true);
          activityLogger.setUser(userData);
          return true;
        }
      } catch (error) {
        logger.error('Error parsing saved user data:', error);
      }
    }
    
    const localUserId = 'local-user';
    const profileData = await getUserProfile(localUserId);

    let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 };
    let creditBalance = 50;
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
      logger.debug('Error fetching subscription or credits in checkAuth:', error.message);
    }

    const localUser = {
      id: localUserId,
      email: 'local@user.com',
      avatar: profileData?.avatar || avatar,
       profile: {
         name: 'local@user.com'.split('@')[0],
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
       credits: { balance: creditBalance || 50, transactions: [] }
    };

    setUser(localUser);
    setIsAuthenticated(true);
    localStorage.setItem('userData', JSON.stringify(localUser));
    activityLogger.setUser(localUser);
    return true;
  };



  onMount(async () => {
    logger.info('UserProvider initialization started');

    try {
      await initDatabase();
    } catch (error) {
      logger.debug('Database init in background failed:', error.message);
    }

    try {
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        try {
          const parsedUser = JSON.parse(savedUserData);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            setCurrentUser(parsedUser);
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
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};