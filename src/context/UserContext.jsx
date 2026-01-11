import { createContext, createSignal, useContext, onMount } from "solid-js";
import { supabase, getCurrentUser, signIn, signUp, signOut, resetPassword } from "../lib/supabase";
import { dataAPI } from "../lib/data";
import { updateEntity, getUserProfile, createUserProfile, getUserById, createUser } from "../lib/db";
import { toastManager } from "../lib/feedback";
import avatar from "../assets/avatar.png";

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
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
      console.error('Error updating preferences:', error);
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
      console.error('Error refreshing user data:', error);
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
    try {
      const data = await signIn(email, password);
      console.log('signIn result:', { user: !!data?.user, session: !!data?.session });
      if (data && data.user && data.session) {
        // Manually set auth state to ensure immediate update
        setSession(data.session);
        setIsAuthenticated(true);
        setUser({
          id: typeof data.session.user.id === 'string' ? data.session.user.id : String(data.session.user.id),
          email: data.session.user.email,
          avatar: data.session.user.user_metadata?.avatar_url || avatar,
          profile: {
            name: data.session.user.user_metadata?.name || data.session.user.email.split('@')[0],
            email: data.session.user.email,
            bio: data.session.user.user_metadata?.bio || '',
            joinDate: data.session.user.created_at,
            ...data.session.user.user_metadata
          },
          preferences: {
            notifications: { email: true, browser: false, projectUpdates: true },
            privacy: { profileVisibility: 'private', dataSharing: false }
          },
          subscription: { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 },
          credits: { balance: 0, transactions: [] }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      if (error.message?.includes('Email not confirmed') || error.message?.includes('confirmation')) {
        throw new Error('Please check your email and confirm your account before logging in.');
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      toastManager.success('Logged out successfully');
      // Session will be cleared by onAuthStateChange
    } catch (error) {
      console.error('Logout error:', error);
      toastManager.error('Logout failed');
    }
  };

  const signup = async (email, password, profile = {}) => {
    try {
      const result = await signUp(email, password, profile);
      if (result.user) {
        // Session will be set by onAuthStateChange if confirmed
        return {
          success: true,
          user: result.user,
          needsConfirmation: result.needsConfirmation
        };
      }
      return { success: false, error: 'No user data returned' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || error };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await resetPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  const checkAuth = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        const userData = data.session.user;
        console.log('session user:', userData);
        // Ensure id is string
        if (userData.id && typeof userData.id !== 'string') {
          userData.id = String(userData.id);
        }
        setUser(userData);
        setIsAuthenticated(true);



        // For production: Don't create sample data, let users build their own data
        // Users will see empty states until they interact with the app
        console.log('User authenticated successfully:', data.session.user.email);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };



  onMount(async () => {
    await checkAuth();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      try {
        console.log('onAuthStateChange:', event, !!session, session?.user?.email);
        setSession(session);
        if (session) {
          setUser({
            id: typeof session.user.id === 'string' ? session.user.id : String(session.user.id),
            email: session.user.email,
            profile: session.user.user_metadata || {},
            preferences: {
              notifications: { email: true, browser: false, projectUpdates: true },
              privacy: { profileVisibility: 'private', dataSharing: false }
            },
            subscription: { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 },
            credits: { balance: 0, transactions: [] }
          });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('onAuthStateChange error:', error);
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