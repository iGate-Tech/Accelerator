import { createSignal, onMount, For, Show, useContext } from "solid-js";
import { useUser } from "../../context/UserContext";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import { toastManager } from "../../lib/feedback";

const Billing = () => {
  const { user } = useUser();
  const { lang } = useContext(LangContext);
  const [showAddCardModal, setShowAddCardModal] = createSignal(false);
  const [selectedInvoice, setSelectedInvoice] = createSignal(null);

  const t = () => translations[lang()];

  const billing = user()?.billing || { paymentMethods: [], invoices: [] };
  const paymentMethods = billing.paymentMethods;
  const invoices = billing.invoices;

  const addPaymentMethod = () => {
    // Simulate adding a payment method
    toastManager.success('Payment method added successfully! Card ending in ****1234 has been saved as your default payment method. (Demo)');
    setShowAddCardModal(false);
  };

  const removePaymentMethod = (id) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      // In a real app, this would call an API
      toastManager.success(`Payment method ending in ****${paymentMethods.find(m => m.id === id)?.last4 || '0000'} removed successfully. (Demo)`);
    }
  };

  const downloadInvoice = (invoice) => {
    // Simulate downloading invoice
    toastManager.info(`Downloading invoice ${invoice.id} for $${invoice.amount.toFixed(2)} dated ${new Date(invoice.date).toLocaleDateString()}... (Demo)`);
  };

  const cancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? This will take effect at the end of your current billing period.')) {
      const renewalDate = user().subscription.renewalDate ? new Date(user().subscription.renewalDate).toLocaleDateString() : 'end of current period';
      toastManager.warning(`Subscription cancellation scheduled for ${user().subscription.plan} plan. You will continue to have access until ${renewalDate}. Credits remaining: ${user().credits.balance}.`);
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="max-w-6xl mx-auto space-y-8 ">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().billingPayments}</h1>
        <p class="text-lg text-base-content/70">
          {t().manageSubscription}.
        </p>
       </div>

       <Show when={user()}>
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Current Subscription */}
           <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
             <h2 class="text-2xl font-bold mb-6">{t().currentSubscription}</h2>

             <div class="space-y-4">
               <div class="flex justify-between items-center">
                 <span class="font-medium">Plan</span>
                 <span class="font-semibold">{user().subscription.plan}</span>
               </div>
               <div class="flex justify-between items-center">
                 <span class="font-medium">Status</span>
                 <div class={`badge ${user().subscription.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                   {user().subscription.status}
                 </div>
               </div>
               <div class="flex justify-between items-center">
                 <span class="font-medium">Billing Cycle</span>
                 <span>{user().subscription.billingCycle}</span>
               </div>
               <div class="flex justify-between items-center">
                 <span class="font-medium">Amount</span>
                 <span class="font-semibold">${user().subscription.price}/month</span>
               </div>
               <Show when={user().subscription.renewalDate}>
                 <div class="flex justify-between items-center">
                   <span class="font-medium">Next Billing</span>
                   <span>{new Date(user().subscription.renewalDate).toLocaleDateString()}</span>
         </div>
        </Show>
      </div>

             <div class="divider"></div>

          <div class="flex gap-3">
            <button class="btn btn-outline flex-1">
              Change Plan
            </button>
            <button class="btn btn-error btn-outline flex-1" onClick={cancelSubscription}>
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">{t().paymentMethods}</h2>
            <button
              class="btn btn-primary btn-sm"
              onClick={() => setShowAddCardModal(true)}
            >
              <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
              {t().addCard}
            </button>
          </div>

          <div class="space-y-4">
            <For each={paymentMethods}>
              {(method) => (
                <div class="flex items-center justify-between p-4 border border-base-200 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-base-200 rounded">
                      <i data-lucide="credit-card" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <div class="font-medium">
                        •••• •••• •••• {method.last4}
                      </div>
                      <div class="text-sm text-base-content/60">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </div>
                    </div>
                    <Show when={method.isDefault}>
                      <div class="badge badge-primary">Default</div>
                    </Show>
                  </div>
                  <button
                    class="btn btn-ghost btn-sm text-error"
                    onClick={() => removePaymentMethod(method.id)}
                  >
                    <i data-lucide="trash" class="w-4 h-4"></i>
                  </button>
                </div>
              )}
            </For>

            <Show when={paymentMethods.length === 0}>
              <div class="text-center py-8 text-base-content/50">
                <i data-lucide="credit-card" class="w-12 h-12 mx-auto mb-2"></i>
                <p>No payment methods added</p>
                <button
                  class="btn btn-primary mt-4"
                  onClick={() => setShowAddCardModal(true)}
                >
                  Add Payment Method
                </button>
              </div>
            </Show>
           </div>
         </div>
       </div>
       </Show>

       <Show when={!user()}>
         <div class="text-center py-12">
           <i data-lucide="lock" class="w-16 h-16 mx-auto mb-4 text-base-content/50"></i>
           <h2 class="text-2xl font-bold mb-2">Authentication Required</h2>
           <p class="text-base-content/70 mb-4">Please log in to view your billing information.</p>
           <button class="btn btn-primary" onClick={() => navigate('/login')}>
             Log In
           </button>
         </div>
       </Show>

       {/* Billing History */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">
        <h2 class="text-2xl font-bold mb-6">{t().billingHistory}</h2>

        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={invoices}>
                {(invoice) => (
                  <tr>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>{invoice.id}</td>
                    <td>${invoice.amount.toFixed(2)}</td>
                    <td>
                      <div class={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {invoice.status}
                      </div>
                    </td>
                    <td>
                      <button
                        class="btn btn-ghost btn-xs"
                        onClick={() => downloadInvoice(invoice)}
                      >
                        <i data-lucide="download" class="w-4 h-4 mr-1"></i>
                        Download
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={invoices.length === 0}>
          <div class="text-center py-8 text-base-content/50">
            <i data-lucide="receipt" class="w-12 h-12 mx-auto mb-2"></i>
            <p>No billing history yet</p>
          </div>
        </Show>
      </div>

      {/* Usage & Limits */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">
        <h2 class="text-2xl font-bold mb-6">Usage & Limits</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary mb-1">
              {user().credits.balance}
            </div>
            <div class="text-sm text-base-content/60">Credits Remaining</div>
            <progress
              class="progress progress-primary w-full mt-2"
              value={user().credits.balance}
              max={user().subscription.maxCredits}
            ></progress>
          </div>

          <div class="text-center">
            <div class="text-2xl font-bold text-secondary mb-1">
              12
            </div>
            <div class="text-sm text-base-content/60">Active Projects</div>
            <div class="text-xs text-base-content/50 mt-2">
              {user().subscription.plan === 'Free' ? '3 max' : 'Unlimited'}
            </div>
          </div>

          <div class="text-center">
            <div class="text-2xl font-bold text-accent mb-1">
              98%
            </div>
            <div class="text-sm text-base-content/60">Uptime</div>
            <div class="text-xs text-base-content/50 mt-2">
              Last 30 days
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <Show when={showAddCardModal()}>
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Add Payment Method</h3>
            <div class="space-y-4">
              <div>
                <label class="label">
                  <span class="label-text">Card Number</span>
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  class="input input-bordered w-full"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    <span class="label-text">Expiry Date</span>
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    class="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">CVV</span>
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    class="input input-bordered w-full"
                  />
                </div>
              </div>
              <div>
                <label class="label">
                  <span class="label-text">Cardholder Name</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  class="input input-bordered w-full"
                />
              </div>
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Set as default payment method</span>
                  <input type="checkbox" class="checkbox checkbox-primary" />
                </label>
              </div>
            </div>
            <div class="modal-action">
              <button
                class="btn"
                onClick={() => setShowAddCardModal(false)}
              >
                Cancel
              </button>
              <button
                class="btn btn-primary"
                onClick={addPaymentMethod}
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Billing;