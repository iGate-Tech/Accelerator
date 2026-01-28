import {
  createSignal,
  onMount,
  createEffect,
  For,
  Show,
  createResource,
} from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import {
  getUserCredits,
  getUserCreditBalance,
  addCreditTransaction,
  consumeCredits,
} from '@lib/database';
import { initDatabase } from '@lib/database/core';
import { toastManager } from '@lib/ui/feedback';
import { logger } from '@lib/core';

const Credits = () => {
  logger.trace('Credits: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth, updateCredits } = useUser();
  const { currentLang, t } = useLanguage();

  const purchaseOptions = [
    { amount: 100, price: 5, type: 'purchase' },
    { amount: 500, price: 20, type: 'purchase' },
    { amount: 1000, price: 35, type: 'purchase' },
    { amount: 2500, price: 80, type: 'purchase' },
  ];

  const fetchCreditsData = async () => {
    if (!user()?.id)
      return { transactions: [], balance: user()?.credits?.balance || 0 };
    try {
      await initDatabase();
      const [transactions, balance] = await Promise.all([
        getUserCredits(user().id),
        getUserCreditBalance(user().id),
      ]);

      const formattedTransactions = transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || `${t.type} credits`,
        date: t.created_at || new Date().toISOString(),
      }));

      const finalBalance =
        balance !== null ? balance : user()?.credits?.balance || 0;
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

  const handlePurchase = async option => {
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
      toastManager.success(
        t()
          .successfullyPurchased.replace('{amount}', option.amount)
          .replace('${price}', option.price)
      );
    } catch (error) {
      logger.error('Error purchasing credits:', error);
      toastManager.error(t().failedToPurchase);
    }
  };

  const currentBalance = () => creditBalance() || user()?.credits?.balance || 0;
  const maxCredits = () => user()?.subscription?.maxCredits || 50;
  const usagePercent = () =>
    Math.min((currentBalance() / maxCredits()) * 100, 100);

  const transactionsList = () => transactions();

  const totalUsed = () =>
    transactionsList()
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalPurchased = () =>
    transactionsList()
      .filter(t => t.type === 'purchase' || t.amount > 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Analytics calculations
  const usageThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactionsList()
      .filter(t => t.type === 'usage' && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const averageDailyUsage = () => {
    const daysInMonth = new Date().getDate();
    return usageThisMonth() / daysInMonth;
  };

  const predictedMonthlyUsage = () => averageDailyUsage() * 30;

  const daysUntilDepletion = () => {
    const dailyUsage = averageDailyUsage();
    if (dailyUsage === 0) return Infinity;
    return Math.floor(currentBalance() / dailyUsage);
  };

  const depletionAlert = () => {
    const days = daysUntilDepletion();
    if (days <= 3)
      return {
        type: 'danger',
        message: `Critical: Credits will deplete in ${days} days`,
      };
    if (days <= 7)
      return {
        type: 'warning',
        message: `Warning: Credits will deplete in ${days} days`,
      };
    if (days <= 14)
      return {
        type: 'info',
        message: `Info: Credits will deplete in ${days} days`,
      };
    return null;
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="mx-auto max-w-6xl space-y-8 overflow-visible px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div class="py-6">
        <div class="mb-4 flex justify-start">
          <button
            onClick={() => navigate('/')}
            class="btn btn-ghost btn-sm gap-2"
          >
            <svg
              class="h-4 w-4 rtl:scale-x-[-1] rtl:transform"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span class="hidden sm:inline">Back</span>
          </button>
        </div>

        <div class="text-center">
          <h1 class="text-base-content mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
            {t().creditsUsage}
          </h1>
          <p class="text-base-content/70 mx-auto mb-6 max-w-2xl text-sm sm:text-base">
            {t().manageCredits}
          </p>
        </div>
      </div>

      {/* Content */}
      <div class="bg-base-100 rounded-box border-base-200 border p-4 shadow-sm sm:p-6 md:p-8">
        {/* Credit Balance Overview */}
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="card from-primary/5 via-base-100 to-secondary/5 border-primary/20 border bg-gradient-to-br">
            <div class="card-body text-center">
              <h2 class="card-title text-primary justify-center text-3xl font-bold">
                {currentBalance()}
              </h2>
              <p class="text-base-content/70">{t().availableCredits}</p>
              <div class="bg-base-200 mt-4 h-2 w-full rounded-full">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  style={`width: ${usagePercent()}%`}
                />
              </div>
              <p class="text-base-content/60 mt-2 text-xs">
                {currentBalance()} / {maxCredits()} {t().credits}
              </p>
            </div>
          </div>

          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body text-center">
              <h2 class="card-title text-success justify-center text-3xl font-bold">
                {totalUsed()}
              </h2>
              <p class="text-base-content/70">{t().creditsUsed}</p>
              <p class="text-base-content/60 mt-2 text-xs">{t().thisMonth}</p>
            </div>
          </div>

          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body text-center">
              <h2 class="card-title text-info justify-center text-3xl font-bold">
                {totalPurchased()}
              </h2>
              <p class="text-base-content/70">{t().creditsPurchased}</p>
              <p class="text-base-content/60 mt-2 text-xs">{t().total}</p>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="trending-up" class="me-2 h-5 w-5" />
                Usage Analytics
              </h3>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span class="text-sm">This Month Usage:</span>
                  <span class="font-semibold">{usageThisMonth()} credits</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm">Daily Average:</span>
                  <span class="font-semibold">
                    {averageDailyUsage().toFixed(1)} credits/day
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm">Predicted Monthly:</span>
                  <span class="font-semibold">
                    {predictedMonthlyUsage().toFixed(0)} credits
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm">Days Until Depletion:</span>
                  <span
                    class={`font-semibold ${daysUntilDepletion() <= 7 ? 'text-error' : 'text-success'}`}
                  >
                    {daysUntilDepletion() === Infinity
                      ? '∞'
                      : daysUntilDepletion()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="alert-triangle" class="me-2 h-5 w-5" />
                Alerts & Recommendations
              </h3>
              <div class="space-y-4">
                <Show when={depletionAlert()}>
                  <div class={`alert alert-${depletionAlert().type} shadow-sm`}>
                    <i data-lucide="alert-triangle" class="h-4 w-4" />
                    <span>{depletionAlert().message}</span>
                  </div>
                </Show>
                <Show when={currentBalance() < 50}>
                  <div class="alert alert-warning shadow-sm">
                    <i data-lucide="alert-circle" class="h-4 w-4" />
                    <span>Low balance: Consider purchasing more credits</span>
                  </div>
                </Show>
                <Show when={predictedMonthlyUsage() > currentBalance()}>
                  <div class="alert alert-error shadow-sm">
                    <i data-lucide="x-circle" class="h-4 w-4" />
                    <span>Projected usage exceeds current balance</span>
                  </div>
                </Show>
                <div class="alert alert-info shadow-sm">
                  <i data-lucide="info" class="h-4 w-4" />
                  <span>
                    Tip: Credits are consumed based on AI usage complexity
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Purchase Credits */}
          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="credit-card" class="me-2 h-5 w-5" />
                {t().purchaseCredits}
              </h3>
              <div class="space-y-4">
                <For each={purchaseOptions}>
                  {option => (
                    <div class="border-base-200 flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <span class="font-semibold">
                          {option.amount} {t().credits}
                        </span>
                        <p class="text-base-content/60 text-sm">
                          ${option.price} (
                          {((option.price / option.amount) * 100).toFixed(2)}
                          {t().perCredit})
                        </p>
                      </div>
                      <button
                        class="btn btn-primary btn-sm"
                        onClick={() => handlePurchase(option)}
                      >
                        {t().buy}
                      </button>
                    </div>
                  )}
                </For>
              </div>
              <div class="alert alert-info mt-4">
                <i data-lucide="info" class="h-5 w-5" />
                <span>{t().creditsStoredLocally}</span>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="history" class="me-2 h-5 w-5" />
                {t().transactionHistory}
              </h3>
              <div class="max-h-96 space-y-3 overflow-y-auto">
                <For each={transactionsList().slice().reverse()}>
                  {transaction => (
                    <div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
                      <div class="flex items-center gap-3">
                        <div
                          class={`rounded-full p-2 ${
                            transaction.amount > 0
                              ? 'bg-success/20 text-success'
                              : 'bg-error/20 text-error'
                          }`}
                        >
                          <i
                            data-lucide={
                              transaction.amount > 0 ? 'plus' : 'minus'
                            }
                            class="h-4 w-4"
                          />
                        </div>
                        <div>
                          <p class="font-medium">{transaction.description}</p>
                          <p class="text-base-content/60 text-xs">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div
                        class={`font-semibold ${
                          transaction.amount > 0 ? 'text-success' : 'text-error'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount}
                      </div>
                    </div>
                  )}
                </For>
                {transactionsList().length === 0 && (
                  <div class="text-base-content/60 py-8 text-center">
                    <i
                      data-lucide="inbox"
                      class="mx-auto mb-2 h-8 w-8 opacity-50"
                    />
                    <p>{t().noTransactions}</p>
                    <p class="text-xs">{t().purchaseCreditsToStart}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div class="card bg-base-100 border-base-200 border shadow-sm">
          <div class="card-body">
            <h3 class="card-title">
              <i data-lucide="bar-chart" class="me-2 h-5 w-5" />
              {t().usageAnalytics}
            </h3>
            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h4 class="mb-4 font-semibold">{t().creditsByType}</h4>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span>{t().aiGenerations}</span>
                    <span class="font-semibold">
                      {Math.floor(totalUsed() * 0.7)}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>{t().analysisTasks}</span>
                    <span class="font-semibold">
                      {Math.floor(totalUsed() * 0.2)}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>{t().exportOperations}</span>
                    <span class="font-semibold">
                      {Math.floor(totalUsed() * 0.1)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="mb-4 font-semibold">{t().monthlyTrends}</h4>
                <div class="text-base-content/60 py-8 text-center">
                  <i
                    data-lucide="trending-up"
                    class="mx-auto mb-2 h-12 w-12 opacity-50"
                  />
                  <p>{t().analyticsCharts}</p>
                  <p class="text-xs">{t().requiresChartingLibrary}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
