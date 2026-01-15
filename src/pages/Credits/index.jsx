import { createSignal, onMount, createEffect, For, Show, createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { getUserCredits, getUserCreditBalance, addCreditTransaction, consumeCredits } from "../../lib/db";
import { initDatabase } from "../../lib/db-core";
import { toastManager } from "../../lib/feedback";
import logger from "../../lib/logger.js";

const Credits = () => {
  logger.trace('Credits: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth, updateCredits } = useUser();
  const { currentLang, t } = useLanguage();

  const purchaseOptions = [
    { amount: 100, price: 5, type: 'purchase' },
    { amount: 500, price: 20, type: 'purchase' },
    { amount: 1000, price: 35, type: 'purchase' },
    { amount: 2500, price: 80, type: 'purchase' }
  ];

  const fetchCreditsData = async () => {
    if (!user()?.id) return { transactions: [], balance: user()?.credits?.balance || 0 };
    try {
      await initDatabase();
      const [transactions, balance] = await Promise.all([
        getUserCredits(user().id),
        getUserCreditBalance(user().id)
      ]);
      
      const formattedTransactions = transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || `${t.type} credits`,
        date: t.created_at || new Date().toISOString()
      }));
      
      const finalBalance = balance !== null ? balance : (user()?.credits?.balance || 0);
      return { transactions: formattedTransactions, balance: finalBalance };
    } catch (error) {
      logger.error('Error fetching credits data:', error);
      return { transactions: [], balance: user()?.credits?.balance || 0 };
    }
  };

  const [creditsData, { refetch, mutate }] = createResource(
    () => user()?.id,
    fetchCreditsData
  );

  const [transactions, setTransactions] = createSignal([]);
  const [creditBalance, setCreditBalance] = createSignal(0);

  createEffect(() => {
    if (creditsData() && !creditsData.loading) {
      setTransactions(creditsData().transactions || []);
      setCreditBalance(creditsData().balance || 0);
    }
  });

  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { replace: true });
    }
  });

  const handlePurchase = async (option) => {
    try {
      await initDatabase();
      
      await addCreditTransaction(
        user().id,
        option.type,
        option.amount,
        `Purchased ${option.amount} credits for $${option.price}`
      );
      
      await consumeCredits(
        user().id,
        option.price,
        `Payment for ${option.amount} credits`
      );
      
      const newBalance = (creditBalance() || 0) + option.amount - option.price;
      setCreditBalance(newBalance);
      
      updateCredits({ balance: newBalance });
      
      await checkAuth();
      await refetch();
      toastManager.success(`Successfully purchased ${option.amount} credits for $${option.price}`);
    } catch (error) {
      logger.error('Error purchasing credits:', error);
      toastManager.error('Failed to purchase credits. Please try again.');
    }
  };

  const currentBalance = () => creditBalance() || user()?.credits?.balance || 0;
  const maxCredits = () => user()?.subscription?.maxCredits || 50;
  const usagePercent = () => Math.min((currentBalance() / maxCredits()) * 100, 100);

  const transactionsList = () => transactions();

  const totalUsed = () => transactionsList().filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalPurchased = () => transactionsList().filter(t => t.type === 'purchase' || t.amount > 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class={`max-w-6xl mx-auto space-y-8 px-4 sm:px-6 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center">
        <h1 class="text-3xl sm:text-4xl font-bold text-base-content mb-4">Credits</h1>
        <p class="text-base sm:text-lg text-base-content/70">
          Manage your AI credits and view usage history
        </p>
      </div>

      {/* Credit Balance Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="card bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 border border-primary/20">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-3xl font-bold text-primary">
              {currentBalance()}
            </h2>
            <p class="text-base-content/70">Available Credits</p>
            <div class="w-full bg-base-200 rounded-full h-2 mt-4">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                style={`width: ${usagePercent()}%`}
              ></div>
            </div>
            <p class="text-xs text-base-content/60 mt-2">
              {currentBalance()} / {maxCredits()} credits
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-3xl font-bold text-success">
              {totalUsed()}
            </h2>
            <p class="text-base-content/70">Credits Used</p>
            <p class="text-xs text-base-content/60 mt-2">This month</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-3xl font-bold text-info">
              {totalPurchased()}
            </h2>
            <p class="text-base-content/70">Credits Purchased</p>
            <p class="text-xs text-base-content/60 mt-2">Total</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Purchase Credits */}
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h3 class="card-title">
              <i data-lucide="credit-card" class="w-5 h-5 mr-2"></i>
              Purchase Credits
            </h3>
            <div class="space-y-4">
              <For each={purchaseOptions}>
                {(option) => (
                  <div class="flex justify-between items-center p-4 border border-base-200 rounded-lg">
                    <div>
                      <span class="font-semibold">{option.amount} Credits</span>
                      <p class="text-sm text-base-content/60">${option.price} ({(option.price / option.amount * 100).toFixed(2)}¢ per credit)</p>
                    </div>
                    <button
                      class="btn btn-primary btn-sm"
                      onClick={() => handlePurchase(option)}
                    >
                      Buy
                    </button>
                  </div>
                )}
              </For>
            </div>
            <div class="alert alert-info mt-4">
              <i data-lucide="info" class="w-5 h-5"></i>
              <span>Credits are stored locally in your browser. For production, integrate with a payment provider.</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h3 class="card-title">
              <i data-lucide="history" class="w-5 h-5 mr-2"></i>
              Transaction History
            </h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <For each={transactionsList().slice().reverse()}>
                {(transaction) => (
                  <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class={`p-2 rounded-full ${
                        transaction.amount > 0 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                      }`}>
                        <i data-lucide={transaction.amount > 0 ? 'plus' : 'minus'} class="w-4 h-4"></i>
                      </div>
                      <div>
                        <p class="font-medium">{transaction.description}</p>
                        <p class="text-xs text-base-content/60">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div class={`font-semibold ${
                      transaction.amount > 0 ? 'text-success' : 'text-error'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </div>
                  </div>
                )}
              </For>
              {transactionsList().length === 0 && (
                <div class="text-center py-8 text-base-content/60">
                  <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                  <p>No transactions yet</p>
                  <p class="text-xs">Purchase credits to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Analytics */}
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body">
          <h3 class="card-title">
            <i data-lucide="bar-chart" class="w-5 h-5 mr-2"></i>
            Usage Analytics
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 class="font-semibold mb-4">Credits by Type</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span>AI Generations</span>
                  <span class="font-semibold">{Math.floor(totalUsed() * 0.7)}</span>
                </div>
                <div class="flex justify-between">
                  <span>Analysis Tasks</span>
                  <span class="font-semibold">{Math.floor(totalUsed() * 0.2)}</span>
                </div>
                <div class="flex justify-between">
                  <span>Export Operations</span>
                  <span class="font-semibold">{Math.floor(totalUsed() * 0.1)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-semibold mb-4">Monthly Trends</h4>
              <div class="text-center py-8 text-base-content/60">
                <i data-lucide="trending-up" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p>Analytics charts would be displayed here</p>
                <p class="text-xs">Requires additional charting library</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;