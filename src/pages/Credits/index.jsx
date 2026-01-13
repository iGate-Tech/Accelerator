import { createSignal, createResource, For, Show, onMount, createEffect } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getCreditBalance, getCreditTransactions, addCreditTransaction } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import { useActivityLogger } from "../../lib/activity";
import logger from '../../lib/logger.js';



const Credits = () => {
  logger.trace('Credits: Starting');
  const { user, refreshUserData, updatePreferences } = useUser();
  const activityLogger = useActivityLogger();

  const [balance, { refetch: refetchBalance }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return 0;
      try {
        return await getCreditBalance(userId);
      } catch (e) {
        logger.error('Error fetching balance:', e);
        return 0;
      }
    }
  );

  const [transactions, { refetch: refetchTransactions }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      try {
        return await getCreditTransactions(userId);
      } catch (e) {
        logger.error('Error fetching transactions:', e);
        return [];
      }
    }
  );

  const [usageReportModal, setUsageReportModal] = createSignal(false);
  const [autoRechargeModal, setAutoRechargeModal] = createSignal(false);
  const [autoRechargeSettings, setAutoRechargeSettings] = createSignal({
    enabled: false,
    threshold: 50,
    amount: 100
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase': return '🛒';
      case 'usage': return '⚡';
      case 'bonus': return '🎁';
      case 'refund': return '↩️';
      default: return '💰';
    }
  };

  onMount(async () => {
    if (user()) {
      // Refresh user data to ensure latest credits and subscription
      await refreshUserData();
    }
  });

  createEffect(() => {
    if (user()) {
      setAutoRechargeSettings(user().preferences?.autoRecharge || { enabled: false, threshold: 50, amount: 100 });
    }
  });

  const getTransactionColor = (amount) => {
    return amount > 0 ? 'text-success' : 'text-error';
  
  logger.trace('getCreditHealth: Starting');};

  const getCreditHealth = () => {
    const txns = transactions() || [];
    const purchased = txns.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);
    const used = txns.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCreditsEver = purchased + used;
    const usageRate = totalCreditsEver > 0 ? (used / totalCreditsEver) * 100 : 0;

    let status, color;
    if (usageRate < 30) {
      status = 'Excellent';
      color = 'text-success';
    } else if (usageRate < 60) {
      status = 'Healthy';
      color = 'text-success';
    } else if (usageRate < 80) {
      status = 'Moderate';
      color = 'text-warning';
    } else {
      status = 'High Usage';
      color = 'text-error';
    }

    return { usageRate, status, color };
  };

  const handleBuyCredits = async (amount = 100) => {
    try {
      if (!user() || !user().id) {
        logger.error('Credit purchase error: User not authenticated');
        toastManager.error('You must be logged in to purchase credits.');
        return;
      }

      logger.debug('Purchasing credits for user:', user().id, 'amount:', amount);
      await addCreditTransaction(user().id, 'purchase', amount, `Purchased ${amount} credits`);
      toastManager.success(`Successfully purchased ${amount} credits!`);

      // Log credit purchase
      activityLogger.logCredit('purchased', amount);

      refetchBalance();
       refetchTransactions();
     } catch (error) {
      logger.error('Credit purchase error:', error);
      toastManager.error('Failed to purchase credits. Please try again.');
    }
  };

  const exportCSV = () => {
    const csvTransactions = transactions() || [];
    if (csvTransactions.length === 0) {
      toastManager.info('No transactions to export');
      return;
    }

    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Balance After'],
      ...csvTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.description,
        t.amount,
        t.balance_after
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.do
  logger.trace('setAutoRecharge: Starting');wnload = `credits-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
   
  logger.trace('setAutoRecharge: Starting'); URL.revokeObjectURL(url);
    toastManager.success('CSV exported successfully');
  };

  const setAutoRecharge = () => {
    toastManager.info('Auto-recharge settings modal would open here');
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-success/5 via-base-100 to-primary/5">
      {/* Header */}
      <div class="bg-gradient-to-r from-success to-primary text-base-100 py-16">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-5xl font-bold mb-4">Credit Management</h1>
          <p class="text-xl text-base-100/80 max-w-2xl mx-auto">
            Monitor your AI usage, purchase credits, and track your spending history
          </p>
        </div>
      </div>

      <div class="container mx-auto px-4 py-12">
        <div class="max-w-6xl mx-auto">
          {/* Balance Overview */}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Main Balance Card */}
            <div class="lg:col-span-2 bg-base-100 rounded-2xl shadow-xl p-8 border border-base-200">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-base-content mb-2">Available Credits</h2>
                  <div class="flex items-baseline">
                    <span class="text-5xl font-bold text-success">
                       <Show when={!balance.loading} fallback={<span class="loading loading-spinner loading-lg"></span>}>
                         {balance() || 0}
                       </Show>
                    </span>
                    <span class="text-xl text-base-content/60 ml-2">credits</span>
                  </div>
                   <p class="text-base-content/70 mt-2">≈ ${(((balance() || 0) * 0.1).toFixed(2))} worth of AI processing</p>
                </div>
                <div class="text-8xl text-base-content/10">⚡</div>
              </div>

              {/* Usage Stats */}
              <div class="grid grid-cols-3 gap-6">
                <div class="text-center p-4 bg-success/10 rounded-xl">
                  <div class="text-2xl font-bold text-success mb-1">+{(transactions() || []).filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0)}</div>
                  <div class="text-sm text-base-content/70">Purchased</div>
                </div>
                <div class="text-center p-4 bg-error/10 rounded-xl">
                  <div class="text-2xl font-bold text-error mb-1">-{(transactions() || []).filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}</div>
                  <div class="text-sm text-base-content/70">Used</div>
                </div>
                <div class="text-center p-4 bg-info/10 rounded-xl">
                  <div class="text-2xl font-bold text-info mb-1">
                    {(transactions() || []).filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0) - (transactions() || []).filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
                  </div>
                  <div class="text-sm text-base-content/70">Net Gain</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-200">
              <h3 class="text-xl font-bold mb-6">Quick Actions</h3>
              <div class="space-y-4">
                 <button
                   onClick={() => handleBuyCredits(100)}
                   class="w-full bg-gradient-to-r from-success to-success-focus text-success-content py-3 px-4 rounded-xl font-semibold hover:from-success-focus hover:to-success-focus transition-all duration-200 shadow-md hover:shadow-lg"
                 >
                   Buy Credits
                 </button>
                 <button
                   class="w-full bg-base-100 border-2 border-base-300 text-base-content/80 py-3 px-4 rounded-xl font-semibold hover:bg-base-200 transition-all duration-200"
                   onClick={() => setUsageReportModal(true)}
                 >
                   View Usage Report
                 </button>
                 <button
                   class="w-full bg-base-100 border-2 border-base-300 text-base-content/80 py-3 px-4 rounded-xl font-semibold hover:bg-base-200 transition-all duration-200"
                   onClick={() => setAutoRechargeModal(true)}
                 >
                   Set Auto-recharge
                 </button>
              </div>

               {/* Credit Health */}
               <div class="mt-8 pt-6 border-t border-base-300">
                 <h4 class="font-semibold mb-3">Credit Health</h4>
                 <div class="space-y-2">
                   <div class="flex justify-between text-sm">
                     <span>Usage Rate</span>
                     <span class={getCreditHealth().color}>{getCreditHealth().status}</span>
                   </div>
                   <div class="w-full bg-base-200 rounded-full h-2">
                     <div class={`h-2 rounded-full ${getCreditHealth().color.replace('text-', 'bg-')}`} style={`width: ${getCreditHealth().usageRate}%`}></div>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Purchase Options */}
          <div class="bg-base-100 rounded-2xl shadow-xl p-8 mb-12 border border-base-200">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-base-content mb-4">Need More Credits?</h2>
              <p class="text-base-content/70">Upgrade your plan or purchase additional credits</p>
            </div>

            <div class="flex justify-center space-x-4">
              <a href="/packages" class="bg-primary hover:bg-primary-focus text-base-100 px-8 py-3 rounded-xl font-semibold transition-colors">
                View Subscription Plans
              </a>
               <button
                 onClick={() => handleBuyCredits(500)}
                 class="bg-base-200 hover:bg-base-300 text-base-content/80 px-8 py-3 rounded-xl font-semibold transition-colors"
               >
                 Buy Credits
               </button>
            </div>
          </div>

          {/* Transaction History */}
          <div class="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-200">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-3xl font-bold text-base-content">Transaction History</h2>
              <button
                class="bg-base-200 hover:bg-base-300 text-base-content/80 px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={exportCSV}
              >
                Export CSV
              </button>
            </div>

            <Show when={!transactions.loading} fallback={
              <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
               <Show when={transactions() && transactions().length > 0} fallback={
                <div class="text-center py-12">
                  <div class="text-6xl mb-4">📊</div>
                  <h3 class="text-xl font-semibold text-base-content mb-2">No transactions yet</h3>
                  <p class="text-base-content/70">Your credit transactions will appear here once you start using the platform.</p>
                </div>
              }>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-base-300">
                        <th class="text-left py-3 px-4 font-semibold text-base-content">Type</th>
                        <th class="text-left py-3 px-4 font-semibold text-base-content">Description</th>
                        <th class="text-left py-3 px-4 font-semibold text-base-content">Date</th>
                        <th class="text-right py-3 px-4 font-semibold text-base-content">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={transactions()}>
                        {(transaction) => (
                          <tr class="border-b border-base-200 hover:bg-base-200 transition-colors">
                            <td class="py-4 px-4">
                              <div class="flex items-center">
                                <span class="text-2xl mr-3 text-base-content">{getTransactionIcon(transaction.type)}</span>
                                <span class="font-medium capitalize">{transaction.type}</span>
                              </div>
                            </td>
                            <td class="py-4 px-4 text-base-content/80">{transaction.description}</td>
                            <td class="py-4 px-4 text-base-content/70">
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td class="py-4 px-4 text-right">
                              <span class={`font-bold text-lg ${getTransactionColor(transaction.amount)}`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </span>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </div>

      {/* Usage Report Modal */}
      <Show when={usageReportModal()}>
        <div class="modal modal-open">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Usage Report</h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="stat">
                  <div class="stat-title">Total Purchased</div>
                  <div class="stat-value text-success">
                    {(transactions() || []).filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0)}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">Total Used</div>
                  <div class="stat-value text-error">
                    {(transactions() || []).filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">Net Gain</div>
                  <div class="stat-value">
                    {(transactions() || []).filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0) -
                     (transactions() || []).filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">Transactions Count</div>
                  <div class="stat-value">{(transactions() || []).length}</div>
                </div>
              </div>
              <div class="divider"></div>
              <div>
                <h4 class="font-semibold mb-2">Recent Activity (Last 30 Days)</h4>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  <For each={(transactions() || []).filter(t => new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).slice(0, 10)}>
                    {(transaction) => (
                      <div class="flex justify-between text-sm">
                        <span>{transaction.description}</span>
                        <span class={transaction.amount > 0 ? 'text-success' : 'text-error'}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
            <div class="modal-action">
              <button class="btn" onClick={() => setUsageReportModal(false)}>Close</button>
            </div>
          </div>
        </div>
      </Show>

      {/* Auto-recharge Modal */}
      <Show when={autoRechargeModal()}>
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Auto-recharge Settings</h3>
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Enable Auto-recharge</span>
                  <input
                    type="checkbox"
                    class="checkbox"
                    checked={autoRechargeSettings().enabled}
                    onChange={(e) => setAutoRechargeSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                </label>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Recharge Threshold (min credits)</span>
                </label>
                <input
                  type="number"
                  class="input input-bordered"
                  value={autoRechargeSettings().threshold}
                  onInput={(e) => setAutoRechargeSettings(prev => ({ ...prev, threshold: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Recharge Amount</span>
                </label>
                <input
                  type="number"
                  class="input input-bordered"
                  value={autoRechargeSettings().amount}
                  onInput={(e) => setAutoRechargeSettings(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>
            </div>
            <div class="modal-action">
              <button class="btn" onClick={() => setAutoRechargeModal(false)}>Cancel</button>
              <button
                class="btn btn-primary"
                onClick={async () => {
                  try {
                    await updatePreferences({ autoRecharge: autoRechargeSettings() });
                    toastManager.success('Auto-recharge settings saved');
                    setAutoRechargeModal(false);
                  } catch (error) {
                    toastManager.error('Failed to save settings');
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Credits;