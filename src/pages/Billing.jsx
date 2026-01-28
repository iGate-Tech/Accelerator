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
import { getUserBilling, getUserSubscription } from '@lib/database';
import { toastManager } from '@lib/ui/feedback';
import { logger } from '@lib/core';

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
        getUserSubscription(user().id),
      ]);

      const invoices = billingRecords.map(record => ({
        id: record.id,
        date: record.created_at || record.due_date,
        amount: record.amount,
        status: record.status || 'pending',
        description: record.description || record.type,
        downloadUrl: '#',
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

  const handleDownloadInvoice = invoice => {
    const invoiceData = JSON.stringify(invoice, null, 2);
    const blob = new Blob([invoiceData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastManager.success(t().invoiceDownloaded.replace('{id}', invoice.id));
  };

  const handleUpdatePaymentMethod = () => {
    toastManager.info(t().paymentMethodManaged);
  };

  const handleAddPaymentMethod = () => {
    toastManager.info(t().addPaymentMethodStorage);
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
            {t().billingPayments}
          </h1>
          <p class="text-base-content/70 mx-auto mb-6 max-w-2xl text-sm sm:text-base">
            {t().manageSubscription}
          </p>
        </div>
      </div>

      {/* Content */}
      <div class="bg-base-100 rounded-box border-base-200 border p-4 shadow-sm sm:p-6 md:p-8">
        {/* Current Billing Overview */}
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="card from-primary/5 via-base-100 to-secondary/5 border-primary/20 border bg-gradient-to-br">
            <div class="card-body text-center">
              <h2 class="card-title text-primary justify-center text-2xl font-bold">
                {currentPlan().toUpperCase()}
              </h2>
              <p class="text-base-content/70">{t().currentPlan}</p>
              <p class="text-base-content/60 mt-2 text-sm">
                {billingCycle()} {t().billingCycle}
              </p>
            </div>
          </div>

          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body text-center">
              <h2 class="card-title text-success justify-center text-2xl font-bold">
                ${user()?.subscription?.price || 0}
              </h2>
              <p class="text-base-content/70">{t().monthlyCost}</p>
              <p class="text-base-content/60 mt-2 text-sm">
                {t().nextBilling}: {nextBillingDate()}
              </p>
            </div>
          </div>

          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body text-center">
              <h2 class="card-title text-info justify-center text-2xl font-bold">
                {invoices().filter(inv => inv.status === 'paid').length}
              </h2>
              <p class="text-base-content/70">{t().paidInvoices}</p>
              <p class="text-base-content/60 mt-2 text-sm">{t().allUpToDate}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Payment Methods */}
          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body">
              <div class="mb-6 flex items-center justify-between">
                <h3 class="card-title">
                  <i data-lucide="credit-card" class="me-2 h-5 w-5" />
                  {t().paymentMethods}
                </h3>
                <button
                  class="btn btn-outline btn-sm"
                  onClick={handleAddPaymentMethod}
                >
                  <i data-lucide="plus" class="me-2 h-4 w-4" />
                  {t().addCard}
                </button>
              </div>
              <div class="space-y-4">
                <For each={paymentMethods()}>
                  {method => (
                    <div class="border-base-200 flex items-center justify-between rounded-lg border p-4">
                      <div class="flex items-center gap-4">
                        <div class="bg-primary/10 rounded-lg p-3">
                          <i
                            data-lucide="credit-card"
                            class="text-primary h-6 w-6"
                          />
                        </div>
                        <div>
                          <p class="font-semibold">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p class="text-base-content/60 text-sm">
                            {t().expiryDate}: {method.expiryMonth}/
                            {method.expiryYear}
                          </p>
                          {method.isDefault && (
                            <span class="badge badge-primary badge-sm">
                              {t().setDefault}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        class="btn btn-ghost btn-sm"
                        onClick={handleUpdatePaymentMethod}
                      >
                        <i data-lucide="edit" class="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </For>
                {paymentMethods().length === 0 && (
                  <div class="text-base-content/60 py-8 text-center">
                    <i
                      data-lucide="credit-card"
                      class="mx-auto mb-2 h-12 w-12 opacity-50"
                    />
                    <p>{t().noPaymentMethods}</p>
                    <button
                      class="btn btn-primary btn-sm mt-2"
                      onClick={handleAddPaymentMethod}
                    >
                      {t().addPaymentMethod}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div class="card bg-base-100 border-base-200 border shadow-sm">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="receipt" class="me-2 h-5 w-5" />
                {t().billingHistory}
              </h3>
              <div class="max-h-96 space-y-3 overflow-y-auto">
                <For each={invoices()}>
                  {invoice => (
                    <div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
                      <div class="flex items-center gap-3">
                        <div
                          class={`rounded-full p-2 ${
                            invoice.status === 'paid'
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          <i
                            data-lucide={
                              invoice.status === 'paid'
                                ? 'check-circle'
                                : 'clock'
                            }
                            class="h-4 w-4"
                          />
                        </div>
                        <div>
                          <p class="font-medium">{invoice.description}</p>
                          <p class="text-base-content/60 text-xs">
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
                          <i data-lucide="download" class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </For>
                {invoices().length === 0 && (
                  <div class="text-base-content/60 py-8 text-center">
                    <i
                      data-lucide="inbox"
                      class="mx-auto mb-2 h-8 w-8 opacity-50"
                    />
                    <p>{t().noBillingHistory}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Settings */}
        <div class="card bg-base-100 border-base-200 border shadow-sm">
          <div class="card-body">
            <h3 class="card-title">
              <i data-lucide="settings" class="me-2 h-5 w-5" />
              {t().billingSettings}
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{t().billingCycle}</span>
                  <p class="text-base-content/60 text-sm">
                    How often you're billed
                  </p>
                </div>
                <span class="badge badge-primary">{billingCycle()}</span>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{t().emailReceipts}</span>
                  <p class="text-base-content/60 text-sm">
                    Receive billing emails
                  </p>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary"
                  checked={true}
                  disabled
                />
              </div>
              <div class="alert alert-info">
                <i data-lucide="info" class="h-5 w-5" />
                <span>{t().billingFeaturesSimulated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
