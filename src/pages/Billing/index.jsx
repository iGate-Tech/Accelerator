import { createSignal, createResource, For, Show } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getUserBilling } from "../../lib/db";
import { toastManager } from "../../lib/feedback";

const Billing = () => {
  const { user } = useUser();

  const [billingRecords, { refetch }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      return await getUserBilling(userId);
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Billing</h1>

        {/* Payment Methods Section */}
        <div class="bg-white rounded-xl p-6 mb-8 shadow-sm border">
          <h3 class="text-xl font-semibold mb-4">Payment Methods</h3>
          <div class="text-center py-8">
            <div class="text-4xl mb-4">💳</div>
            <p class="text-gray-600 mb-4">No payment methods added yet</p>
            <button class="btn btn-primary">Add Payment Method</button>
          </div>
        </div>

        {/* Billing History */}
        <div class="bg-white rounded-xl p-6 shadow-sm border">
          <h3 class="text-xl font-semibold mb-4">Billing History</h3>
          <Show when={!billingRecords.loading} fallback={<div class="text-center py-8">Loading billing records...</div>}>
            <Show when={billingRecords().length > 0} fallback={
              <div class="text-center py-8">
                <div class="text-4xl mb-4">📄</div>
                <h4 class="text-lg font-semibold mb-2">No billing records yet</h4>
                <p class="text-gray-600">Your invoices and payments will appear here.</p>
              </div>
            }>
              <div class="space-y-4">
                <For each={billingRecords()}>
                  {(record) => (
                    <div class="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-shadow">
                      <div class="flex items-center space-x-4">
                        <div class="text-2xl">{getStatusIcon(record.status)}</div>
                        <div>
                          <h4 class="font-semibold">{record.description}</h4>
                          <p class="text-sm text-gray-600">
                            {new Date(record.date).toLocaleDateString()}
                            <Show when={record.due_date}>
                              {' • Due: ' + new Date(record.due_date).toLocaleDateString()}
                            </Show>
                          </p>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xl font-bold text-green-600">
                          ${record.amount.toFixed(2)}
                        </div>
                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default Billing;