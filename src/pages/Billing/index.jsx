import { createSignal, onMount, createEffect, For, Show, createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { getUserBilling, getUserSubscription } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import logger from "../../lib/logger.js";

const Billing = () => {
  logger.trace('Billing: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { currentLang, t } = useLanguage();

  const fetchBillingData = async () => {
    if (!user()?.id) return { invoices: [], paymentMethods: [] };
    try {
      const [billingRecords, subscription] = await Promise.all([
        getUserBilling(user().id),
        getUserSubscription(user().id)
      ]);
      
      const invoices = billingRecords.map(record => ({
        id: record.id,
        date: record.created_at || record.due_date,
        amount: record.amount,
        status: record.status || 'pending',
        description: record.description || record.type,
        downloadUrl: '#'
      }));

      return { invoices, paymentMethods: [], subscription };
    } catch (error) {
      logger.error('Error fetching billing data:', error);
      return { invoices: [], paymentMethods: [], subscription: null };
    }
  };

  const [billingData, { refetch }] = createResource(
    () => user()?.id,
    fetchBillingData
  );

  const [invoices, setInvoices] = createSignal([]);
  const [paymentMethods, setPaymentMethods] = createSignal([]);

  createEffect(() => {
    if (billingData() && !billingData.loading) {
      setInvoices(billingData().invoices || []);
      setPaymentMethods(billingData().paymentMethods || []);
    }
  });

  // Redirect if not authenticated
  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { replace: true });
    }
  });

  const handleDownloadInvoice = (invoice) => {
    const invoiceData = JSON.stringify(invoice, null, 2);
    const blob = new Blob([invoiceData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastManager.success(`Invoice ${invoice.id} downloaded`);
  };

  const handleUpdatePaymentMethod = () => {
    toastManager.info('Payment methods are managed locally. Add payment details when ready.');
  };

  const handleAddPaymentMethod = () => {
    toastManager.info('Payment method storage available. In production, integrate with payment provider.');
  };

  const currentPlan = () => user()?.subscription?.plan || 'free';
  const billingCycle = () => 'monthly';
  const nextBillingDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString();
  };

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
        <h1 class="text-3xl sm:text-4xl font-bold text-base-content mb-4">Billing</h1>
        <p class="text-base sm:text-lg text-base-content/70">
          Manage your billing information and payment methods
        </p>
      </div>

      {/* Current Billing Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="card bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 border border-primary/20">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-2xl font-bold text-primary">
              {currentPlan().toUpperCase()}
            </h2>
            <p class="text-base-content/70">Current Plan</p>
            <p class="text-sm text-base-content/60 mt-2">
              {billingCycle()} billing
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-2xl font-bold text-success">
              ${user()?.subscription?.price || 0}
            </h2>
            <p class="text-base-content/70">Monthly Cost</p>
            <p class="text-sm text-base-content/60 mt-2">
              Next billing: {nextBillingDate()}
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body text-center">
            <h2 class="card-title justify-center text-2xl font-bold text-info">
              {invoices().filter(inv => inv.status === 'paid').length}
            </h2>
            <p class="text-base-content/70">Paid Invoices</p>
            <p class="text-sm text-base-content/60 mt-2">
              All up to date
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <div class="flex justify-between items-center mb-6">
              <h3 class="card-title">
                <i data-lucide="credit-card" class="w-5 h-5 mr-2"></i>
                Payment Methods
              </h3>
              <button
                class="btn btn-outline btn-sm"
                onClick={handleAddPaymentMethod}
              >
                <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                Add Card
              </button>
            </div>
            <div class="space-y-4">
              <For each={paymentMethods()}>
                {(method) => (
                  <div class="flex items-center justify-between p-4 border border-base-200 rounded-lg">
                    <div class="flex items-center gap-4">
                      <div class="p-3 bg-primary/10 rounded-lg">
                        <i data-lucide="credit-card" class="w-6 h-6 text-primary"></i>
                      </div>
                      <div>
                        <p class="font-semibold">
                          {method.brand} •••• {method.last4}
                        </p>
                        <p class="text-sm text-base-content/60">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                        {method.isDefault && (
                          <span class="badge badge-primary badge-sm">Default</span>
                        )}
                      </div>
                    </div>
                    <button
                      class="btn btn-ghost btn-sm"
                      onClick={handleUpdatePaymentMethod}
                    >
                      <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                  </div>
                )}
              </For>
              {paymentMethods().length === 0 && (
                <div class="text-center py-8 text-base-content/60">
                  <i data-lucide="credit-card" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                  <p>No payment methods added</p>
                  <button
                    class="btn btn-primary btn-sm mt-2"
                    onClick={handleAddPaymentMethod}
                  >
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h3 class="card-title">
              <i data-lucide="receipt" class="w-5 h-5 mr-2"></i>
              Billing History
            </h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <For each={invoices()}>
                {(invoice) => (
                  <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class={`p-2 rounded-full ${
                        invoice.status === 'paid' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        <i data-lucide={invoice.status === 'paid' ? 'check-circle' : 'clock'} class="w-4 h-4"></i>
                      </div>
                      <div>
                        <p class="font-medium">{invoice.description}</p>
                        <p class="text-xs text-base-content/60">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold">${invoice.amount}</span>
                      <button
                        class="btn btn-ghost btn-xs"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <i data-lucide="download" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>
                )}
              </For>
              {invoices().length === 0 && (
                <div class="text-center py-8 text-base-content/60">
                  <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                  <p>No billing history</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Settings */}
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body">
          <h3 class="card-title">
            <i data-lucide="settings" class="w-5 h-5 mr-2"></i>
            Billing Settings
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">Billing Cycle</span>
                <p class="text-sm text-base-content/60">How often you're billed</p>
              </div>
              <span class="badge badge-primary">{billingCycle()}</span>
            </div>
            <div class="flex justify-between items-center">
              <div>
                <span class="font-medium">Email Receipts</span>
                <p class="text-sm text-base-content/60">Receive billing emails</p>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                checked={true}
                disabled
              />
            </div>
            <div class="alert alert-info">
              <i data-lucide="info" class="w-5 h-5"></i>
              <span>Billing features are simulated in local mode. Real billing integration would require payment processor setup.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
       