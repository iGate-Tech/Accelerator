import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getCreditBalance, getCreditTransactions } from "../../lib/db";
import { toastManager } from "../../lib/feedback";

const Credits = () => {
  const { user } = useUser();

  const [balance, { refetch: refetchBalance }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return 0;
      return await getCreditBalance(userId);
    }
  );

  const [transactions, { refetch: refetchTransactions }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      return await getCreditTransactions(userId);
    }
  );

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase': return '🛒';
      case 'usage': return '⚡';
      case 'bonus': return '🎁';
      case 'refund': return '↩️';
      default: return '💰';
    }
  };

  const getTransactionColor = (amount) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Credits</h1>

        {/* Balance Card */}
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8 mb-8 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">Current Balance</h2>
              <div class="text-4xl font-bold">
                <Show when={!balance.loading} fallback={<span class="loading loading-spinner loading-lg"></span>}>
                  {balance()} Credits
                </Show>
              </div>
            </div>
            <div class="text-6xl opacity-20">💰</div>
          </div>
        </div>

        {/* Purchase Options */}
        <div class="bg-white rounded-xl p-6 mb-8 shadow-sm border">
          <h3 class="text-xl font-semibold mb-4">Purchase Credits</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 class="font-semibold">100 Credits</h4>
              <p class="text-2xl font-bold text-green-600">$9.99</p>
              <button class="btn btn-primary btn-sm mt-2 w-full">Purchase</button>
            </div>
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 class="font-semibold">500 Credits</h4>
              <p class="text-2xl font-bold text-green-600">$39.99</p>
              <button class="btn btn-primary btn-sm mt-2 w-full">Purchase</button>
            </div>
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 class="font-semibold">1000 Credits</h4>
              <p class="text-2xl font-bold text-green-600">$69.99</p>
              <button class="btn btn-primary btn-sm mt-2 w-full">Purchase</button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div class="bg-white rounded-xl p-6 shadow-sm border">
          <h3 class="text-xl font-semibold mb-4">Transaction History</h3>
          <Show when={!transactions.loading} fallback={<div class="text-center py-8">Loading transactions...</div>}>
            <Show when={transactions().length > 0} fallback={
              <div class="text-center py-8">
                <div class="text-4xl mb-4">📊</div>
                <p class="text-gray-600">No transactions yet</p>
              </div>
            }>
              <div class="space-y-4">
                <For each={transactions()}>
                  {(transaction) => (
                    <div class="flex items-center justify-between p-4 border rounded-lg">
                      <div class="flex items-center space-x-4">
                        <div class="text-2xl">{getTransactionIcon(transaction.type)}</div>
                        <div>
                          <p class="font-medium">{transaction.description}</p>
                          <p class="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div class={`font-bold text-lg ${getTransactionColor(transaction.amount)}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
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

export default Credits;