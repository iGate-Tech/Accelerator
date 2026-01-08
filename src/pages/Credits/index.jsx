import { createSignal, onMount, For, Show, useContext } from "solid-js";
import { useUser } from "../../context/UserContext";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import { toastManager } from "../../lib/feedback";

const Credits = () => {
  const { user, addCreditTransaction } = useUser();
  const { lang } = useContext(LangContext);
  const [selectedPackage, setSelectedPackage] = createSignal(null);
  const [showPurchaseModal, setShowPurchaseModal] = createSignal(false);

  const t = () => translations[lang()];

  const creditPackages = [
    {
      id: "starter",
      name: "Starter Pack",
      credits: 500,
      price: 9.99,
      popular: false,
      description: "Perfect for getting started"
    },
    {
      id: "professional",
      name: "Professional Pack",
      credits: 1500,
      price: 24.99,
      popular: true,
      description: "Most popular choice"
    },
    {
      id: "enterprise",
      name: "Enterprise Pack",
      credits: 5000,
      price: 69.99,
      popular: false,
      description: "For power users"
    },
    {
      id: "unlimited",
      name: "Unlimited Monthly",
      credits: "unlimited",
      price: 49.99,
      popular: false,
      description: "Unlimited AI sessions",
      recurring: true
    }
  ];

  const purchaseCredits = async (packageData) => {
    // Simulate payment processing
    const confirmPurchase = confirm(`Purchase ${packageData.name} for $${packageData.price}?`);
    if (!confirmPurchase) return;

    // Simulate API call delay
    setShowPurchaseModal(false);

    setTimeout(() => {
      if (packageData.recurring) {
        // Handle recurring subscription
        toastManager.success(`Successfully subscribed to ${packageData.name} for $${packageData.price}/month! Recurring billing activated.`);
      } else {
        // Add credits to balance
        addCreditTransaction({
          type: "purchase",
          amount: packageData.credits,
          description: `Purchased ${packageData.name}`
        });
        const newBalance = (user().credits.balance || 0) + packageData.credits;
        toastManager.success(`Successfully purchased ${packageData.credits} credits for $${packageData.price}! New balance: ${newBalance} credits.`);
      }
    }, 1000);
  };

  const usageBreakdown = [
    { category: "Project Analysis", credits: 150, percentage: 30 },
    { category: "Market Research", credits: 120, percentage: 24 },
    { category: "Financial Modeling", credits: 100, percentage: 20 },
    { category: "Competitor Analysis", credits: 80, percentage: 16 },
    { category: "Other", credits: 50, percentage: 10 }
  ];

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="max-w-6xl mx-auto space-y-8 ">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().creditsUsage}</h1>
        <p class="text-lg text-base-content/70">
          {t().manageAccount.toLowerCase() + ' ' + t().credits.toLowerCase()}.
        </p>
      </div>

      {/* Credit Balance Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold">Available Credits</h3>
                <p class="text-3xl font-bold">{user().credits.balance.toLocaleString()}</p>
              </div>
              <i data-lucide="credit-card" class="w-10 h-10 opacity-80"></i>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold">Monthly Limit</h3>
                <p class="text-3xl font-bold">{user().subscription.maxCredits.toLocaleString()}</p>
              </div>
              <i data-lucide="target" class="w-10 h-10 opacity-80"></i>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold">Usage Rate</h3>
                <p class="text-3xl font-bold">
                  {user().subscription.maxCredits > 0
                    ? Math.round((1 - user().credits.balance / user().subscription.maxCredits) * 100)
                    : 0
                  }%
                </p>
              </div>
              <i data-lucide="trending-up" class="w-10 h-10 opacity-80"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Breakdown */}
        <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
          <h2 class="text-2xl font-bold mb-6">{t().analytics}</h2>

          <div class="space-y-4">
            <For each={usageBreakdown}>
              {(item) => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-primary"></div>
                    <span class="font-medium">{item.category}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-semibold">{item.credits}</span>
                    <span class="text-sm text-base-content/60 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="mt-6">
            <div class="text-sm font-semibold mb-2">Monthly Progress</div>
            <progress
              class="progress progress-primary w-full h-3"
              value={user().subscription.maxCredits - user().credits.balance}
              max={user().subscription.maxCredits}
            ></progress>
            <div class="text-xs text-base-content/60 mt-1">
              {user().subscription.maxCredits - user().credits.balance} credits used this month
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
          <h2 class="text-2xl font-bold mb-6">{t().recentTransactions}</h2>

          <div class="space-y-4">
            <For each={user().credits.transactions.slice(0, 5)}>
              {(transaction) => (
                <div class="flex items-center justify-between py-3 border-b border-base-200 last:border-b-0">
                  <div class="flex items-center gap-3">
                    <div class={`p-2 rounded-full ${
                      transaction.type === 'purchase' ? 'bg-success/10 text-success' :
                      transaction.type === 'usage' ? 'bg-warning/10 text-warning' :
                      'bg-info/10 text-info'
                    }`}>
                      <i data-lucide={
                        transaction.type === 'purchase' ? 'plus' :
                        transaction.type === 'usage' ? 'minus' :
                        'arrow-right'
                      } class="w-4 h-4"></i>
                    </div>
                    <div>
                      <div class="font-medium">{transaction.description}</div>
                      <div class="text-xs text-base-content/60">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
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
          </div>

          <Show when={user().credits.transactions.length === 0}>
            <div class="text-center py-8 text-base-content/50">
              <i data-lucide="receipt" class="w-12 h-12 mx-auto mb-2"></i>
              <p>No transactions yet</p>
            </div>
          </Show>
        </div>
      </div>

      {/* Purchase Credits */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold">{t().purchaseCredits}</h2>
            <p class="text-base-content/70">{t().topUpCredits}</p>
          </div>
          <Show when={user().credits.balance < 100}>
            <div class="badge badge-warning">{t().lowBalance}</div>
          </Show>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <For each={creditPackages}>
            {(pkg) => (
              <div class={`card shadow-sm border transition-all duration-200 hover:shadow-md ${
                pkg.popular ? 'border-primary bg-primary/5' : 'border-base-200'
              }`}>
                <div class="card-body">
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="card-title text-lg">{pkg.name}</h3>
                    <Show when={pkg.popular}>
                      <div class="badge badge-primary">Popular</div>
                    </Show>
                  </div>

                  <div class="mb-3">
                    <div class="text-2xl font-bold">${pkg.price}</div>
                    <Show when={!pkg.recurring}>
                      <div class="text-sm text-base-content/60">one-time purchase</div>
                    </Show>
                    <Show when={pkg.recurring}>
                      <div class="text-sm text-base-content/60">per month</div>
                    </Show>
                  </div>

                  <div class="mb-4">
                    <div class="text-sm font-semibold mb-1">Credits</div>
                    <div class="text-xl font-bold text-primary">
                      {pkg.recurring ? '∞' : pkg.credits.toLocaleString()}
                    </div>
                  </div>

                  <p class="text-sm text-base-content/70 mb-4">{pkg.description}</p>

                  <button
                    class="btn btn-primary w-full"
                    onClick={() => purchaseCredits(pkg)}
                  >
                    {pkg.recurring ? 'Subscribe' : 'Purchase'}
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Usage Tips */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">
        <h2 class="text-2xl font-bold mb-6">Credit Saving Tips</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex gap-4">
            <div class="p-3 bg-primary/10 rounded-lg">
              <i data-lucide="lightbulb" class="w-6 h-6 text-primary"></i>
            </div>
            <div>
              <h3 class="font-semibold mb-1">Batch Your Questions</h3>
              <p class="text-sm text-base-content/70">Combine multiple related questions into one AI session to save credits.</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="p-3 bg-success/10 rounded-lg">
              <i data-lucide="target" class="w-6 h-6 text-success"></i>
            </div>
            <div>
              <h3 class="font-semibold mb-1">Use Templates</h3>
              <p class="text-sm text-base-content/70">Start with pre-built templates to reduce the number of AI interactions needed.</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="p-3 bg-warning/10 rounded-lg">
              <i data-lucide="clock" class="w-6 h-6 text-warning"></i>
            </div>
            <div>
              <h3 class="font-semibold mb-1">Plan Ahead</h3>
              <p class="text-sm text-base-content/70">Prepare detailed descriptions before starting to minimize follow-up questions.</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="p-3 bg-info/10 rounded-lg">
              <i data-lucide="refresh-cw" class="w-6 h-6 text-info"></i>
            </div>
            <div>
              <h3 class="font-semibold mb-1">Review & Edit</h3>
              <p class="text-sm text-base-content/70">Use the edit feature instead of starting new sessions for minor changes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;