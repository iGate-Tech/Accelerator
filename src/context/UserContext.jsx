import { createContext, createSignal, useContext, onMount } from "solid-js";
import { dataAPI } from "@lib/auth/data.js";
import { updateEntity, getUserProfile, createUserProfile, getUserById, createUser, getUserSubscription, setCurrentUser } from "@lib/database";
import { initDatabase } from "@lib/database/core.js";
import { toastManager } from "@lib/ui/feedback.js";
import { activityLogger } from "@lib/business.js";
import { logger } from "@lib/core";
import { confirmLogout } from "../components";
import { createAuthToken } from "@lib/auth/data.js";
import { secureLocalStorage } from "@lib/auth/security.js";


const UserContext = createContext();

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"%3E%3C/path%3E%3Ccircle cx="12" cy="7" r="4"%3E%3C/circle%3E%3C/svg%3E';

export const UserProvider = (props) => {
  const [user, setUser] = createSignal(null);
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [session, setSession] = createSignal(null);

  // Session management
  const checkSession = async () => {
    try {
      const token = await secureLocalStorage.getItem('userToken');
      if (!token) return false;

      const { getSessionByToken } = await import('../lib/database');
      const sessionData = await getSessionByToken(token);

      if (!sessionData) {
        // Session doesn't exist, clear local auth
        await logout();
        return false;
      }

      // Check if session is expired
      const expiresAt = new Date(sessionData.expires_at);
      if (expiresAt < new Date()) {
        // Session expired, clear it
        await logout();
        return false;
      }

      setSession(sessionData);
      return true;
    } catch (error) {
      logger.error('Session check failed:', error);
      await logout();
      return false;
    }
  };

  const updateUser = async (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      // Save to secure localStorage
      secureLocalStorage.setItem('userData', newUser);
      return newUser;
    });
  };

   const updateProfile = async (profileUpdates) => {
     try {
       const { updateUserProfile } = await import('../lib/database');
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
        await secureLocalStorage.setItem('userData', user());

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
  const login = async (email, password, rememberMe = false) => {
    logger.info('User login initiated for:', email);

    // Rate limiting check
    const { authRateLimiter } = await import('../lib/auth/security.js');
    if (authRateLimiter.isBlocked(email)) {
      const remainingMs = authRateLimiter.getRemainingTime(email);
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      logger.warn(`Login blocked for ${email}, ${remainingMinutes} minutes remaining`);
      return { success: false, error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` };
    }

    try {
      const { _getUserByEmail } = await import('../lib/database/users.js');
      const userRecord = await _getUserByEmail({ email });

      if (!userRecord) {
        logger.info('User not found:', email);
        authRateLimiter.recordAttempt(email, false);
        return { success: false, error: 'Invalid credentials' };
      }
      
      let userId = userRecord.id;
      
       // Verify password if hash exists
       if (userRecord.password_hash && password) {
        const { verifyPassword } = await import('../lib/auth/security.js');
        const isValidPassword = await verifyPassword(password, userRecord.password_hash);

         if (!isValidPassword) {
           authRateLimiter.recordAttempt(email, false);
           return { success: false, error: 'Invalid credentials' };
         }
       }

      const profileData = await getUserProfile(userId);

      let subscriptionData = { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100, credits_included: 100 };
      let creditBalance = 50;
      try {
          const { getUserSubscription, getCreditBalance: dbGetCreditBalance } = await import('../lib/database');
        
        // First try to get subscription from packages module
        let userSubscription = null;
        try {
          const { _getUserSubscription, _getPackages } = await import('../lib/database/packages.js');
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
        avatar: profileData?.avatar || DEFAULT_AVATAR,
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

       // Create authentication token and session
       try {
         const { createSession } = await import('../lib/database');
         const token = await createAuthToken(userId, rememberMe);
         const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 days or 1 day

         await createSession(userId, token, expiresAt.toISOString());

        // Store token in secure localStorage
        await secureLocalStorage.setItem('userToken', token);

        setIsAuthenticated(true);
        setUser(userData);
        await setCurrentUser(userData);
        await secureLocalStorage.setItem('userData', userData);
        activityLogger.setUser(userData);
        authRateLimiter.recordAttempt(email, true); // Record successful login
        logger.info('Login successful for:', email);
        return { success: true, user: userData };
      } catch (sessionError) {
        logger.error('Session creation failed:', sessionError);
        // Still allow login but without persistent session
        setIsAuthenticated(true);
        setUser(userData);
        await setCurrentUser(userData);
        await secureLocalStorage.setItem('userData', userData);
        activityLogger.setUser(userData);
        return { success: true, user: userData, warning: 'Session persistence failed - you may need to login again' };
      }
    } catch (error) {
      logger.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    const shouldLogout = await confirmLogout();
    if (!shouldLogout) return;

    logger.info('User logout initiated');

    try {
      // Invalidate JWT token and delete session
      const token = await secureLocalStorage.getItem('userToken');
      if (token) {
        const { deleteSession } = await import('../lib/database');
        await deleteSession(token);
        secureLocalStorage.removeItem('userToken');
        logger.info('JWT token invalidated and session deleted');
      }

      if (user()) {
        activityLogger.logAuth('logout');
      }

      setUser(null);
      setIsAuthenticated(false);
      setSession(null);
      localStorage.removeItem('userData');
      logger.info('User logout successful');
      toastManager.success('Logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      // Still perform local logout even if session cleanup fails
      setUser(null);
      setIsAuthenticated(false);
      setSession(null);
      secureLocalStorage.removeItem('userData');
      secureLocalStorage.removeItem('userToken');
      toastManager.success('Logged out locally');
    }
  };

  const signup = async (email, password, profile = {}) => {
    logger.info('User signup initiated for:', email);
    try {
      const userId = `user_${Date.now()}`;
      const { _createUser, _createUserProfile, _getUserByEmail } = await import('../lib/database/users.js');
      
      const existingUser = await _getUserByEmail({ email });
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }
      
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte salt for PBKDF2

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const hashBuffer = await crypto.subtle.exportKey('raw', key);
      const hashArray = new Uint8Array(hashBuffer);

      // Combine salt and hash (same format as verifyPassword expects)
      const combined = new Uint8Array(salt.length + hashArray.length);
      combined.set(salt);
      combined.set(hashArray, salt.length);

      const passwordHash = btoa(String.fromCharCode(...combined));
      
      // Create user in database
      const userResult = await _createUser({ email, passwordHash, userId, profile });
      logger.debug('User created:', userResult);
      
      // Create user profile
      const profileData = {
        name: profile.name || email.split('@')[0],
        email: email,
        avatar: profile.avatar || DEFAULT_AVATAR,
        bio: profile.bio || '',
        joinDate: new Date().toISOString()
      };
      const profileResult = await _createUserProfile({ userId, profileData });
      logger.debug('Profile created:', profileResult);
      
      // Create welcome notification
      try {
        const { createNotification, addCreditTransaction, createUserSubscription, seedPackages } = await import('../lib/database');
        
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

    try {
      // Check if user exists
      const { _getUserByEmail } = await import('../lib/database/users.js');
      const userRecord = await _getUserByEmail({ email });

      if (!userRecord) {
        // For security, don't reveal if email exists or not
        logger.info('Password reset requested for non-existent email:', email);
        return { success: true, message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      // Generate reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store reset token in database
      const { createPasswordResetToken } = await import('../lib/database');
      await createPasswordResetToken(userRecord.id, resetToken, expiresAt.toISOString());

      // In a real app, send email here. For now, log the reset link
      const resetLink = `${window.location.origin}/auth/reset-password/${resetToken}`;
      logger.info('Password reset link generated:', resetLink);

      // For demo purposes, you could show this link to the user
      // In production, this would be emailed

      return { success: true, message: 'If an account with this email exists, a password reset link has been sent.' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      return { success: false, error: 'Failed to process password reset request. Please try again.' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    logger.info('Password reset initiated with token');

    try {
      // Validate the reset token
      const { validatePasswordResetToken, usePasswordResetToken } = await import('../lib/database');
      const tokenValidation = await validatePasswordResetToken(token);

      if (!tokenValidation.valid) {
        return { success: false, error: tokenValidation.error };
      }

      // Validate new password strength
      const { isValidPassword } = await import('../lib/auth/security.js');
      const passwordValidation = isValidPassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.message };
      }

      // Hash the new password using PBKDF2
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(newPassword);
      const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte salt for PBKDF2

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const hashBuffer = await crypto.subtle.exportKey('raw', key);
      const hashArray = new Uint8Array(hashBuffer);

      // Combine salt and hash (same format as verifyPassword expects)
      const combined = new Uint8Array(salt.length + hashArray.length);
      combined.set(salt);
      combined.set(hashArray, salt.length);

      const passwordHash = btoa(String.fromCharCode(...combined));

      // Update the user's password
      const { _updateUserPassword } = await import('../lib/database/users.js');
      await _updateUserPassword({ userId: tokenValidation.userId, passwordHash });

      // Mark the token as used
      await usePasswordResetToken(tokenValidation.tokenId);

      // Log security event
      activityLogger.logSecurity('password_reset', { method: 'token' });

      logger.info('Password reset successful for user:', tokenValidation.userId);
      return { success: true, message: 'Password has been reset successfully' };

    } catch (error) {
      logger.error('Password reset error:', error);
      return { success: false, error: 'Failed to reset password. Please try again.' };
    }
  };

  const checkAuth = async () => {
    logger.info('Auth check initiated');

    const savedUserData = await secureLocalStorage.getItem('userData');
    if (savedUserData) {
      try {
        // Handle both encrypted (object) and potentially corrupted (string) data
        const parsedUser = typeof savedUserData === 'object' ? savedUserData : JSON.parse(savedUserData);
        if (parsedUser && parsedUser.id) {

          const userId = parsedUser.id;
          let profileData = await getUserProfile(userId);

          // Check if user exists in database
          if (!profileData) {
            logger.warn('User data found but user not in database - creating user in database');
            try {
              const { createUser, createUserProfile } = await import('../lib/database');
              await createUser(parsedUser.email, 'dummy', parsedUser.profile || {}, parsedUser.id);
              await createUserProfile(parsedUser.id, parsedUser.profile || {});
              profileData = await getUserProfile(parsedUser.id); // Refresh profileData
            } catch (error) {
              logger.error('Failed to create user in database:', error);
              await secureLocalStorage.removeItem('userData');
              await secureLocalStorage.removeItem('userToken');
              setUser(null);
              await setCurrentUser(null);
              setIsAuthenticated(false);
               return false;
             }
           }

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

             const { getCreditBalance } = await import('../lib/database');
             creditBalance = await getCreditBalance(userId);
           } catch (error) {
             logger.debug('Error fetching subscription or credits in checkAuth:', error.message);
           }

            const userData = {
              ...parsedUser,
              avatar: (profileData?.avatar && !profileData?.avatar.startsWith('/default')) 
                ? profileData?.avatar 
                : (parsedUser.avatar && !parsedUser.avatar.startsWith('/default'))
                  ? parsedUser.avatar
                  : DEFAULT_AVATAR,
              profile: {
                ...parsedUser.profile,
                ...profileData
              },
              subscription: subscriptionData,
              credits: { balance: creditBalance || 50, transactions: [] }
            };

           setUser(userData);
           await setCurrentUser(userData);
           setIsAuthenticated(true);
           activityLogger.setUser(userData);
           return true;
         }
       } catch (error) {
         logger.error('Error parsing user data:', error);
         await secureLocalStorage.removeItem('userData');
         await secureLocalStorage.removeItem('userToken');
         setUser(null);
         await setCurrentUser(null);
         setIsAuthenticated(false);
         return false;
       }
     }

     // No saved user data found, require proper authentication
     setUser(null);
     setIsAuthenticated(false);
     return false;
  };



  onMount(async () => {
    logger.info('UserProvider initialization started');

    try {
      await initDatabase();
    } catch (error) {
      logger.debug('Database init in background failed:', error.message);
    }

    try {
      const savedUserData = await secureLocalStorage.getItem('userData');
      if (savedUserData) {
        try {
          if (savedUserData && savedUserData.id) {
            setUser(savedUserData);
            await setCurrentUser(savedUserData);
            setIsAuthenticated(true);
            logger.debug('User loaded from secure localStorage');
          } else {
            secureLocalStorage.removeItem('userData');
          }
        } catch (parseError) {
          logger.error('Error parsing saved user data:', parseError);
          secureLocalStorage.removeItem('userData');
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
      resetPassword,
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