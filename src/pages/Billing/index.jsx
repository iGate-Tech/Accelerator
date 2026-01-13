import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { getUserBilling, getUserSubscription, getCreditBalance } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import logger from '../../lib/logger.js';


const Billing = () => {
  logger.trace('Billing: Starting');
  const navigate = useNavigate();
  const { user, checkAuth, refreshUserData } = useUser();

  const [billingRecords, { refetch }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      return await getUserBilling(userId);
    }
  );

  const [subscription] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return null;
      return await getUserSubscription(userId);
    }
  );

  const [creditBalance] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return 0;
      return await getCreditBalance(userId);
    }
  );

  const [billingStats] = createResource(
    () => ({ userId: user()?.id, billingRecords: billingRecords() }),
    async ({ userId, billingRecords }) => {
      if (!userId || !billingRecords) return { totalSpent: 0, thisMonth: 0, average: 0, nextPayment: 'N/A' };

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Calculate total spent (only successful payments)
      const totalSpent = billingRecords
        .filter(record => record.status === 'paid' && record.type === 'payment')
        .reduce((sum, record) => sum + record.amount, 0);

      // Calculate this month's spending
      const thisMonthSpent = billingRecords
        .filter(record => {
          const recordDate = new Date(record.date);
          return record.status === 'paid' &&
                 record.type === 'payment' &&
                 recordDate.getMonth() === thisMonth &&
                 recordDate.getFullYear() === thisYear;
        })
        .reduce((sum, record) => sum + record.amount, 0);

      // Calculate average monthly spending
      const paidRecords = billingRecords.filter(record => record.status === 'paid' && record.type === 'payment');
      const average = paidRecords.length > 0 ? totalSpent / paidRecords.length : 0;

      // Find next payment date (next billing cycle)
      const nextPaymentDate = subscription()?.end_date ? new Date(subscription().end_date) : null;
      const nextPayment = nextPaymentDate ? nextPaymentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A';

      return {
        totalSpent: totalSpent.toFixed(2),
        thisMonth: thisMonthSpent.toFixed(2),
        average: average.toFixed(2),
        nextPayment
      };
    
  logger.trace('upgradePlan: Starting');}
  );

  const upgradePlan = () => {
    navigate('/packages');
  };

  const cancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) return;
    // In real app, call API to cancel
    toastManager.info('Subscription cancellation would be processed here');
  };

  const addPaymentMethod = () => {
    toastManager.info('Add payment method modal would open here');
  };

  const editPaymentMethod = () => {
    toastManager.info('Edit payment method modal would open here');
  };

  const removePaymentMethod = () => {
    if (!confirm('Remove this payment method?')) return;
    toastManager.info('Payment method would be removed');
  };

  const downloadInvoice = (invoiceId) => {
    toastManager.info(`Download invoice ${invoiceId} would start here`);
  };

  const contactSupport = () => {
    navigate('/help'); // Or open support modal
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-success bg-success/20';
      case 'pending': return 'text-warning bg-warning/20';
      case 'failed': return 'text-error bg-error/20';
      case 'cancelled': return 'text-base-content/70 bg-base-200';
      default: return 'text-base-content/70 bg-base-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '📄';
    }
  };

  onMount(async () => {
    if (user()) {
      // Refresh user data to ensure latest subscription and credits
      await refreshUserData();
    }
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      {/* Header */}
      <div class="bg-gradient-to-r from-primary to-secondary text-base-100 py-16">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-5xl font-bold mb-4">Billing & Payments</h1>
          <p class="text-xl opacity-90 max-w-2xl mx-auto">
            Manage your subscriptions, payment methods, and billing history in one place
          </p>
        </div>
      </div>

      <div class="container mx-auto px-4 py-12">
        <div class="max-w-6xl mx-auto">
          {/* Current Subscription & Billing Summary */}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Subscription Overview */}
            <div class="lg:col-span-2 bg-base-100 rounded-2xl shadow-xl p-8 border border-base-200">
               <div class="flex items-center justify-between mb-6">
                 <h2 class="text-2xl font-bold text-base-content">Current Subscription</h2>
                 <Show when={subscription()}>
                   <span class={`px-3 py-1 rounded-full text-sm font-medium ${
                     subscription().status === 'active' ? 'bg-success/20 text-success' :
                     subscription().status === 'pending' ? 'bg-warning/20 text-warning' :
                     subscription().status === 'cancelled' ? 'bg-error/20 text-error' :
                     'bg-base-200 text-base-content/70'
                   }`}>
                     {subscription().status.charAt(0).toUpperCase() + subscription().status.slice(1)}
                   </span>
                 </Show>
               </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Show when={subscription()} fallback={
                    <div>
                      <h3 class="text-lg font-semibold text-base-content mb-2">Free Plan</h3>
                      <p class="text-base-content/70 mb-4">Basic access with limited credits</p>
                      <div class="text-3xl font-bold text-base-content/70">$0<span class="text-lg text-gray-500">/month</span></div>
                      <p class="text-sm text-base-content/70 mt-1">No recurring charges</p>
                    </div>
                  }>
                    <h3 class="text-lg font-semibold text-base-content mb-2">{subscription().name} Plan</h3>
                    <p class="text-base-content/70 mb-4">{subscription().description}</p>
                    <div class="text-3xl font-bold text-primary">${subscription().price}<span class="text-lg text-base-content/60">/month</span></div>
                    <Show when={subscription().end_date}>
                      <p class="text-sm text-base-content/70 mt-1">Next billing: {new Date(subscription().end_date).toLocaleDateString()}</p>
                    </Show>
                  </Show>
                </div>

                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Current credits</span>
                    <span class="font-semibold">{creditBalance() || 0}</span>
                  </div>
                   <div class="w-full bg-base-200 rounded-full h-3">
                     <div
                       class="bg-success h-3 rounded-full"
                       style={`width: ${subscription() ? Math.min((creditBalance() || 0) / subscription().credits_included * 100, 100) : Math.min((creditBalance() || 0) / 100 * 100, 100)}%`}
                     ></div>
                   </div>
                   <div class="text-sm text-base-content/70">
                     <Show when={subscription()}>
                       {Math.max(0, subscription().credits_included - (creditBalance() || 0))} credits used this month
                     </Show>
                     <Show when={!subscription()}>
                       {Math.max(0, 100 - (creditBalance() || 0))} credits used this month
                     </Show>
                   </div>
                </div>
              </div>

               <div class="flex space-x-4 mt-8">
                 <button
                   class="bg-primary hover:bg-primary-focus text-base-100 px-6 py-3 rounded-xl font-semibold transition-colors"
                   onClick={upgradePlan}
                 >
                   Upgrade Plan
                 </button>
                 <button
                   class="bg-base-200 hover:bg-base-300 text-base-content/80 px-6 py-3 rounded-xl font-semibold transition-colors"
                   onClick={cancelSubscription}
                 >
                   Cancel Subscription
                 </button>
               </div>
            </div>

            {/* Quick Stats */}
            <div class="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-200">
              <h3 class="text-xl font-bold mb-6">Billing Overview</h3>
              <div class="space-y-6">
                 <div class="flex justify-between items-center">
                   <span class="text-base-content/70">Total spent</span>
                   <span class="text-2xl font-bold text-base-content">${billingStats()?.totalSpent || 0}</span>
                 </div>
                 <div class="flex justify-between items-center">
                   <span class="text-base-content/70">This month</span>
                   <span class="text-xl font-semibold text-primary">${billingStats()?.thisMonth || 0}</span>
                 </div>
                 <div class="flex justify-between items-center">
                   <span class="text-base-content/70">Avg. per month</span>
                   <span class="text-xl font-semibold text-success">${billingStats()?.average || 0}</span>
                 </div>
                 <hr class="border-base-300" />
                 <div class="flex justify-between items-center">
                   <span class="text-base-content/70">Next payment</span>
                   <span class="font-semibold">{billingStats()?.nextPayment || 'N/A'}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div class="bg-base-100 rounded-2xl shadow-xl p-8 mb-12 border border-base-200">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-3xl font-bold text-base-content">Payment Methods</h2>
              <button
                class="bg-primary hover:bg-primary-focus text-base-100 px-6 py-3 rounded-xl font-semibold transition-colors"
                onClick={addPaymentMethod}
              >
                Add Payment Method
              </button>
            </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Empty State - No Payment Methods */}
               <div class="md:col-span-2 border-2 border-dashed border-base-300 p-12 rounded-xl flex items-center justify-center">
                 <div class="text-center">
                   <div class="text-4xl mb-4">💳</div>
                   <h3 class="text-xl font-semibold text-base-content mb-2">No payment methods added</h3>
                   <p class="text-base-content/70 mb-6">Add a payment method to enable automatic billing and easier payments.</p>
                   <button
                     class="bg-primary hover:bg-primary-focus text-base-100 px-6 py-3 rounded-xl font-semibold transition-colors"
                     onClick={addPaymentMethod}
                   >
                     Add Your First Payment Method
                   </button>
                 </div>
               </div>
             </div>
          </div>

          {/* Billing History */}
          <div class="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-200">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-3xl font-bold text-base-content">Billing History</h2>
              <div class="flex space-x-4">
                <select class="bg-base-200 border border-base-300 rounded-lg px-4 py-2 text-sm">
                  <option>All Time</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
                <button
                  class="bg-base-200 hover:bg-base-300 text-base-content/80 px-4 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => downloadInvoice('all')}
                >
                  Download All
                </button>
              </div>
            </div>

            <Show when={!billingRecords.loading} fallback={
              <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <Show when={billingRecords().length > 0} fallback={
                <div class="text-center py-12">
                  <div class="text-6xl mb-4">📄</div>
                  <h3 class="text-xl font-semibold text-base-content mb-2">No billing records yet</h3>
                  <p class="text-base-content/70">Your invoices and payment history will appear here once you start your subscription.</p>
                </div>
              }>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-base-300">
                        <th class="text-left py-4 px-4 font-semibold text-base-content">Invoice</th>
                        <th class="text-left py-4 px-4 font-semibold text-base-content">Description</th>
                        <th class="text-left py-4 px-4 font-semibold text-base-content">Date</th>
                        <th class="text-left py-4 px-4 font-semibold text-base-content">Status</th>
                        <th class="text-right py-4 px-4 font-semibold text-base-content">Amount</th>
                        <th class="text-right py-4 px-4 font-semibold text-base-content">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={billingRecords()}>
                        {(record) => (
                          <tr class="border-b border-base-200 hover:bg-base-200 transition-colors">
                            <td class="py-4 px-4">
                              <div class="font-semibold text-primary">#{String(record.id).padStart(4, '0')}</div>
                            </td>
                            <td class="py-4 px-4">
                              <div class="font-medium text-base-content">{record.description}</div>
                              <div class="text-sm text-base-content/70">Invoice #{String(record.id).padStart(6, '0')}</div>
                            </td>
                            <td class="py-4 px-4 text-base-content/70">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td class="py-4 px-4">
                              <span class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                                <span class="mr-2">{getStatusIcon(record.status)}</span>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td class="py-4 px-4 text-right">
                              <div class="text-xl font-bold text-base-content">${record.amount.toFixed(2)}</div>
                            </td>
                            <td class="py-4 px-4 text-right">
                              <div class="flex justify-end space-x-2">
                                <button
                                  class="text-primary hover:text-primary-focus text-sm font-medium"
                                  onClick={() => downloadInvoice(record.id)}
                                >
                                  Download
                                </button>
                                <button
                                  class="text-base-content/70 hover:text-base-content/80 text-sm font-medium"
                                  onClick={() => toastManager.info(`View invoice ${record.id} would open modal`)}
                                >
                                  View
                                </button>
                              </div>
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

          {/* Support Section */}
          <div class="bg-base-200 rounded-2xl p-8 mt-12 border border-base-300">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-base-content mb-4">Need Help with Billing?</h3>
              <p class="text-base-content/70 mb-6 max-w-2xl mx-auto">
                Our support team is here to help with any billing questions, payment issues, or subscription changes.
              </p>
               <div class="flex justify-center space-x-4">
                 <button
                   class="bg-primary hover:bg-primary-focus text-base-100 px-6 py-3 rounded-xl font-semibold transition-colors"
                   onClick={contactSupport}
                 >
                   Contact Support
                 </button>
                 <button
                   class="bg-base-100 hover:bg-base-200 text-base-content px-6 py-3 rounded-xl font-semibold border border-base-300 transition-colors"
                   onClick={() => navigate('/help')}
                 >
                   Billing FAQ
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;