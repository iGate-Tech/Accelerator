import { createSignal, onMount, createEffect, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { createUserSubscription, getUserSubscription, seedPackages } from "../../lib/db";
import { initDatabase } from "../../lib/db-core";
import { toastManager } from "../../lib/feedback";
import logger from "../../lib/logger.js";

const Packages = () => {
  logger.trace('Packages: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated, updateSubscription, checkAuth } = useUser();
  const { currentLang, t } = useLanguage();

  const [packages] = createSignal([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits_included: 50,
      features: [
        'AI-powered business plan generation',
        'Basic market analysis',
        'Financial projections',
        '3 projects maximum',
        'Community support',
        'Basic export options'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      credits_included: 500,
      features: [
        'Everything in Free plan',
        'Unlimited projects',
        'Advanced market research',
        'Competitive analysis',
        'Pitch deck generation',
        'Financial modeling',
        'Priority customer support',
        'Advanced export formats',
        'API access',
        'Custom templates'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      credits_included: 2000,
      features: [
        'Everything in Pro plan',
        'Team collaboration tools',
        'Advanced analytics dashboard',
        'Custom integrations',
        'White-label options',
        'Dedicated success manager',
        'Priority feature requests',
        'Advanced security features',
        'Custom AI model training',
        '24/7 premium support'
      ]
    }
  ]);

  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { replace: true });
    }
  });

  const handleSubscribe = async (packageData) => {
    try {
      await initDatabase();
      await seedPackages();
      
      const currentSub = await getUserSubscription(user().id);
      if (currentSub && currentSub.package_id === packageData.id) {
        toastManager.info(`You already have the ${packageData.name} plan!`);
        return;
      }

      await createUserSubscription(
        user().id,
        packageData.id,
        {
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: null,
          auto_renew: 1,
          credits_included: packageData.credits_included,
          price: packageData.price
        }
      );

      updateSubscription({
        plan: packageData.id,
        status: 'active',
        maxCredits: packageData.credits_included,
        credits_included: packageData.credits_included,
        price: packageData.price
      });

      await checkAuth();
      toastManager.success(`Successfully upgraded to ${packageData.name} plan!`);
    } catch (error) {
      logger.error('Subscription error:', error);
      toastManager.error('Failed to process subscription. Please try again.');
    }
  };

  const currentPlan = () => user()?.subscription?.plan || 'free';

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
        <h1 class="text-3xl sm:text-4xl font-bold text-base-content mb-4">Subscription Packages</h1>
        <p class="text-base sm:text-lg text-base-content/70">
          Choose the perfect plan for your needs
        </p>
      </div>

      {/* Current Plan Banner */}
      <div class="alert alert-info">
        <i data-lucide="info" class="w-5 h-5"></i>
        <div>
          <h3 class="font-bold">Current Plan: {packages().find(p => p.id === currentPlan())?.name || 'Free'}</h3>
          <div class="text-xs">Credits remaining: {user()?.credits?.balance || 0} / {user()?.subscription?.maxCredits || 50}</div>
        </div>
      </div>

      {/* Packages Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <For each={packages()}>
          {(pkg) => (
            <div class={`card bg-base-100 shadow-lg border-2 ${
              pkg.id === currentPlan() ? 'border-primary' : 'border-base-200'
            } ${pkg.name === 'Pro' ? 'relative' : ''}`}>
              {pkg.name === 'Pro' && (
                <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div class="badge badge-primary">Most Popular</div>
                </div>
              )}
              <div class="card-body">
                <div class="text-center">
                  <h2 class="card-title justify-center text-2xl">{pkg.name}</h2>
                  <div class="text-4xl font-bold text-primary my-4">
                    ${pkg.price}
                    <span class="text-lg font-normal text-base-content/60">/month</span>
                  </div>
                  <p class="text-base-content/60">{pkg.credits_included} credits included</p>
                </div>

                <div class="divider"></div>

                <ul class="space-y-3">
                  <For each={pkg.features}>
                    {(feature) => (
                      <li class="flex items-center gap-3">
                        <i data-lucide="check" class="w-5 h-5 text-success"></i>
                        <span>{feature}</span>
                      </li>
                    )}
                  </For>
                </ul>

                <div class="card-actions justify-center mt-6">
                  {pkg.id === currentPlan() ? (
                    <button class="btn btn-primary btn-block" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button
                      class="btn btn-primary btn-block"
                      onClick={() => handleSubscribe(pkg)}
                    >
                      {pkg.price === 0 ? 'Get Started' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Feature Comparison */}
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body">
          <h3 class="card-title">Feature Comparison</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free</th>
                  <th>Pro</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI Assistance</td>
                  <td>Basic</td>
                  <td>Advanced</td>
                  <td>Advanced</td>
                </tr>
                <tr>
                  <td>Projects per Month</td>
                  <td>3</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Credits</td>
                  <td>50</td>
                  <td>500</td>
                  <td>2000</td>
                </tr>
                <tr>
                  <td>Support</td>
                  <td>Community</td>
                  <td>Priority</td>
                  <td>Dedicated</td>
                </tr>
                <tr>
                  <td>Templates</td>
                  <td>Basic</td>
                  <td>Premium</td>
                  <td>Premium</td>
                </tr>
                <tr>
                  <td>Collaboration</td>
                  <td>-</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>API Access</td>
                  <td>-</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Custom Integrations</td>
                  <td>-</td>
                  <td>-</td>
                  <td>✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;