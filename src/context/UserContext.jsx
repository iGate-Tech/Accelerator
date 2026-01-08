import { createContext, createSignal, useContext, onMount } from "solid-js";

const UserContext = createContext();

export const UserProvider = (props) => {
  const [user, setUser] = createSignal({
    profile: {
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/src/assets/avatar.png",
      joinDate: new Date().toISOString().split('T')[0],
      bio: "Entrepreneur and startup enthusiast"
    },
    preferences: {
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('lang') || 'en',
      notifications: {
        email: true,
        browser: true,
        projectUpdates: true,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public',
        dataSharing: false
      }
    },
    subscription: {
      plan: "Pro",
      status: "active",
      credits: 500,
      maxCredits: 1000,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingCycle: "monthly",
      price: 29.99
    },
    billing: {
      paymentMethods: [
        {
          id: "card_1",
          type: "credit_card",
          last4: "4242",
          brand: "Visa",
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ],
      invoices: [
        {
          id: "inv_001",
          date: "2024-01-01",
          amount: 29.99,
          status: "paid",
          downloadUrl: "#"
        },
        {
          id: "inv_002",
          date: "2023-12-01",
          amount: 29.99,
          status: "paid",
          downloadUrl: "#"
        }
      ]
    },
    credits: {
      balance: 500,
      transactions: [
        {
          id: "txn_001",
          type: "usage",
          amount: -50,
          description: "AI Accelerator Session - Project Analysis",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          projectId: "proj_123"
        },
        {
          id: "txn_002",
          type: "purchase",
          amount: 500,
          description: "Credit Purchase - Pro Plan",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  });

  const updateUser = (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(newUser));
      return newUser;
    });
  };

  const updateProfile = (profileUpdates) => {
    updateUser({ profile: { ...user().profile, ...profileUpdates } });
  };

  const updatePreferences = (preferenceUpdates) => {
    updateUser({ preferences: { ...user().preferences, ...preferenceUpdates } });
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

  const logout = () => {
    // Clear all user data
    localStorage.removeItem('userData');
    localStorage.removeItem('theme');
    localStorage.removeItem('lang');
    localStorage.removeItem('tutorial-progress');

    // Reset user to default
    setUser({
      profile: {
        name: "Guest User",
        email: "",
        avatar: "/src/assets/avatar.png",
        joinDate: new Date().toISOString().split('T')[0],
        bio: ""
      },
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: false,
          browser: false,
          projectUpdates: false,
          marketing: false
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false
        }
      },
      subscription: {
        plan: "Free",
        status: "inactive",
        credits: 0,
        maxCredits: 100,
        renewalDate: null,
        billingCycle: null,
        price: 0
      },
      billing: {
        paymentMethods: [],
        invoices: []
      },
      credits: {
        balance: 0,
        transactions: []
      }
    });

    // Redirect to home
    window.location.href = '/';
  };

  onMount(() => {
    // Load user data from localStorage if available
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData);
        setUser(parsedData);
      } catch (e) {
        console.log('Error loading user data:', e);
      }
    }
  });

  return (
    <UserContext.Provider value={{
      user,
      updateUser,
      updateProfile,
      updatePreferences,
      updateSubscription,
      updateCredits,
      addCreditTransaction,
      logout
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