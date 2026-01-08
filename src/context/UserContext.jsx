import { createContext, createSignal, useContext, onMount } from "solid-js";
import { authAPI, dataAPI } from "../lib/data";

const UserContext = createContext();

export const UserProvider = (props) => {
  const [user, setUser] = createSignal(null);
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);

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
      const result = await authAPI.login(email, password);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('userToken', result.token);
        return true;
      } else {
        console.error('Login failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      localStorage.removeItem('userToken');
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return false;

    const result = await authAPI.getCurrentUser();
    if (!result.success) {
      localStorage.removeItem('userToken');
      return false;
    }

    setUser(result.user);
    setIsAuthenticated(true);
    return true;
  };



  onMount(async () => {
    await checkAuth();
  });

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
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