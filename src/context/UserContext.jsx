import { createContext, createSignal, useContext, onMount } from "solid-js";
import { supabase, getCurrentUser, signIn, signUp, signOut, resetPassword } from "../lib/supabase";
import { dataAPI } from "../lib/data";

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
      await updateUser(user().id, { profile: { ...user().profile, ...profileUpdates } });
      setUser(prev => ({ ...prev, profile: { ...prev.profile, ...profileUpdates } }));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const updatePreferences = async (preferenceUpdates) => {
    try {
      await updateUser(user().id, { profile: { ...user().profile, preferences: { ...user().preferences, ...preferenceUpdates } } });
      setUser(prev => ({ ...prev, profile: { ...prev.profile, preferences: { ...prev.preferences, ...preferenceUpdates } } }));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const updateSubscription = (subscriptionUpdates) => {
    updateUser({ subscription: { ...user().subscription, ...subscriptionUpdates } });
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
      if (data && data.user) {
        // Session will be set by onAuthStateChange
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
      // Session will be cleared by onAuthStateChange
    } catch (error) {
      console.error('Logout error:', error);
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
        setSession(data.session);
        setUser({
          id: data.session.user.id,
          email: data.session.user.email,
          profile: data.session.user.user_metadata || {},
          preferences: {
            notifications: { email: true, browser: false, projectUpdates: true },
            privacy: { profileVisibility: 'private', dataSharing: false }
          },
          subscription: { plan: 'free', status: 'active', price: 0, renewalDate: null, maxCredits: 100 },
          credits: { balance: 0, transactions: [] }
        });
        setIsAuthenticated(true);
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
      setSession(session);
      if (session) {
        setUser({
          id: session.user.id,
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
      addCreditTransaction
    }}>
      {props.children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};