import { createSignal, createResource, For, Show } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getPackages, getUserSubscription } from "../../lib/db";
import { toastManager } from "../../lib/feedback";

const Packages = () => {
  const { user } = useUser();

  const [packages, { refetch: refetchPackages }] = createResource(async () => {
    return await getPackages();
  });

  const [subscription, { refetch: refetchSubscription }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return null;
      return await getUserSubscription(userId);
    }
  );

  const handleSubscribe = async (packageData) => {
    // TODO: Implement subscription logic
    toastManager.info(`Subscription to ${packageData.name} coming soon!`);
  };

  const getPackageFeatures = (features) => {
    try {
      return JSON.parse(features || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p class="text-xl text-gray-600">Select the perfect plan for your startup journey</p>
        </div>

        <Show when={!packages.loading} fallback={<div class="text-center py-8">Loading packages...</div>}>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <For each={packages()}>
              {(pkg) => (
                <div class={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  pkg.name === 'Pro' ? 'border-blue-500 transform scale-105' : 'border-gray-200'
                }`}>
                  <Show when={pkg.name === 'Pro'}>
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  </Show>

                  <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold mb-2">{pkg.name}</h3>
                    <div class="text-4xl font-bold text-green-600 mb-1">
                      ${pkg.price}
                      <span class="text-lg text-gray-500">/month</span>
                    </div>
                    <p class="text-gray-600">{pkg.credits_included} credits included</p>
                  </div>

                  <div class="mb-6">
                    <h4 class="font-semibold mb-3">Features:</h4>
                    <ul class="space-y-2">
                      <For each={getPackageFeatures(pkg.features)}>
                        {(feature) => (
                          <li class="flex items-center text-sm">
                            <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSubscribe(pkg)}
                    class={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      pkg.name === 'Free'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                    }`}
                  >
                    {pkg.price === 0 ? 'Get Started' : 'Subscribe Now'}
                  </button>

                  <Show when={subscription() && subscription().package_id === pkg.id}>
                    <div class="mt-4 text-center">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Current Plan
                      </span>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Current Subscription */}
        <Show when={subscription()}>
          <div class="mt-12 bg-white rounded-xl p-6 shadow-sm border">
            <h3 class="text-xl font-semibold mb-4">Current Subscription</h3>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-lg">{subscription().name}</h4>
                <p class="text-gray-600">{subscription().description}</p>
                <p class="text-sm text-gray-500 mt-1">
                  Started: {new Date(subscription().start_date).toLocaleDateString()}
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-green-600">${subscription().price}/month</p>
                <p class="text-sm text-gray-600">{subscription().credits_included} credits/month</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Packages;