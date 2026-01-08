import { createSignal, onMount, For, Show, useContext } from "solid-js";
import { useUser } from "../context/UserContext";
import { LangContext } from "../context/LangContext";
import { translations } from "../assets/translations/translations-index.js";

const Packages = () => {
  const { user, updateSubscription } = useUser();
  const { lang } = useContext(LangContext);
  const [billingCycle, setBillingCycle] = createSignal(user().subscription.billingCycle);
  const [selectedPlan, setSelectedPlan] = createSignal(user().subscription.plan);

  const t = () => translations[lang()];

  const plans = [
    {
      id: "Free",
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      credits: 100,
      features: [
        "5 AI sessions per month",
        "Basic project templates",
        "Community support",
        "Export to PDF",
        "Basic analytics"
      ],
      limitations: [
        "Limited to 3 active projects",
        "No advanced analytics",
        "No priority support"
      ],
      popular: false,
      recommended: false
    },
    {
      id: "Pro",
      name: "Pro",
      price: { monthly: 29.99, yearly: 299.99 },
      credits: 1000,
      features: [
        "Unlimited AI sessions",
        "Advanced project templates",
        "Priority email support",
        "Full export options (PDF, JSON)",
        "Advanced analytics & insights",
        "Portfolio organization",
        "Custom branding",
        "API access"
      ],
      limitations: [],
      popular: true,
      recommended: true
    },
    {
      id: "Enterprise",
      name: "Enterprise",
      price: { monthly: 99.99, yearly: 999.99 },
      credits: 5000,
      features: [
        "Everything in Pro",
        "Unlimited team members",
        "Dedicated success manager",
        "Phone & video support",
        "Custom integrations",
        "Advanced security features",
        "SLA guarantee",
        "White-label options"
      ],
      limitations: [],
      popular: false,
      recommended: false
    }
  ];

  const currentPlan = () => plans.find(p => p.id === user().subscription.plan);
  const selectedPlanDetails = () => plans.find(p => p.id === selectedPlan());

  const calculateSavings = (plan) => {
    if (billingCycle() === 'yearly') {
      const monthlyCost = plan.price.monthly * 12;
      const yearlyCost = plan.price.yearly;
      return ((monthlyCost - yearlyCost) / monthlyCost * 100).toFixed(0);
    }
    return 0;
  };

  const upgradePlan = async (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (confirm(`Are you sure you want to ${planId === user().subscription.plan ? 'stay on' : 'upgrade to'} the ${plan.name} plan?`)) {
      updateSubscription({
        plan: planId,
        credits: plan.credits,
        maxCredits: plan.credits,
        billingCycle: billingCycle(),
        price: billingCycle() === 'yearly' ? plan.price.yearly / 12 : plan.price.monthly,
        renewalDate: new Date(Date.now() + (billingCycle() === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      alert(`Successfully ${planId === user().subscription.plan ? 'renewed' : 'upgraded to'} ${plan.name} plan!`);
    }
  };

  const cancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      updateSubscription({
        plan: "Free",
        status: "cancelled",
        credits: 100,
        maxCredits: 100
      });
      alert('Subscription cancelled. You now have access to the Free plan.');
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="max-w-6xl mx-auto space-y-8 mt-20">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().subscriptionPlans}</h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          {t().choosePlan}.
        </p>
      </div>

      {/* Current Plan Status */}
      <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-box p-6 border border-primary/20">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold">Current Plan: {currentPlan()?.name}</h3>
            <p class="text-base-content/70">
              {user().subscription.status === 'active' ? 'Active' : 'Inactive'} •
              {user().credits.balance} credits remaining •
              {user().subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing
            </p>
            <Show when={user().subscription.renewalDate}>
              <p class="text-sm text-base-content/60">
                Next billing: {new Date(user().subscription.renewalDate).toLocaleDateString()}
              </p>
            </Show>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold">${user().subscription.price.toFixed(2)}</div>
            <div class="text-sm text-base-content/60">per month</div>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div class="flex justify-center">
        <div class="bg-base-200 rounded-full p-1">
          <button
            class={`btn btn-sm ${billingCycle() === 'monthly' ? 'btn-active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            {t().monthly}
          </button>
          <button
            class={`btn btn-sm ${billingCycle() === 'yearly' ? 'btn-active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            {t().yearly}
            <div class="badge badge-success ml-1">{t().savePercent}</div>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <For each={plans}>
          {(plan) => (
            <div class={`card shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
              plan.id === user().subscription.plan
                ? 'border-primary bg-primary/5'
                : plan.recommended
                ? 'border-secondary'
                : 'border-base-200'
            }`}>
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="card-title text-xl">{plan.name}</h3>
                  <Show when={plan.popular}>
                    <div class="badge badge-primary">Most Popular</div>
                  </Show>
                  <Show when={plan.id === user().subscription.plan}>
                    <div class="badge badge-success">Current Plan</div>
                  </Show>
                </div>

                <div class="mb-4">
                  <div class="text-3xl font-bold">
                    ${billingCycle() === 'yearly' ? (plan.price.yearly / 12).toFixed(2) : plan.price.monthly.toFixed(2)}
                    <span class="text-base font-normal text-base-content/60">/month</span>
                  </div>
                  <Show when={billingCycle() === 'yearly' && plan.price.yearly > 0}>
                    <div class="text-sm text-success">
                      Save {calculateSavings(plan)}% annually
                    </div>
                  </Show>
                </div>

                <div class="mb-4">
                  <div class="text-sm font-semibold mb-2">Credits per month</div>
                  <div class="text-2xl font-bold text-primary">{plan.credits.toLocaleString()}</div>
                </div>

                <div class="space-y-2 mb-6">
                  <For each={plan.features}>
                    {(feature) => (
                      <div class="flex items-center gap-2">
                        <i data-lucide="check" class="w-4 h-4 text-success"></i>
                        <span class="text-sm">{feature}</span>
                      </div>
                    )}
                  </For>
                  <For each={plan.limitations}>
                    {(limitation) => (
                      <div class="flex items-center gap-2">
                        <i data-lucide="x" class="w-4 h-4 text-error"></i>
                        <span class="text-sm">{limitation}</span>
                      </div>
                    )}
                  </For>
                </div>

                <div class="card-actions justify-end">
                  <Show when={plan.id === user().subscription.plan}>
                    <button class="btn btn-outline w-full" onClick={cancelSubscription}>
                      Cancel Subscription
                    </button>
                  </Show>
                  <Show when={plan.id !== user().subscription.plan}>
                    <button
                      class={`btn w-full ${plan.recommended ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => upgradePlan(plan.id)}
                    >
                      {plan.price.monthly === 0 ? 'Get Started' : 'Upgrade'}
                    </button>
                  </Show>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Plan Comparison */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">
        <h2 class="text-2xl font-bold mb-6">Plan Comparison</h2>

        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
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
                <td>AI Sessions</td>
                <td>5/month</td>
                <td>Unlimited</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Active Projects</td>
                <td>3</td>
                <td>Unlimited</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Credits</td>
                <td>100</td>
                <td>1000</td>
                <td>5000</td>
              </tr>
              <tr>
                <td>Export Options</td>
                <td>PDF</td>
                <td>PDF, JSON</td>
                <td>All formats</td>
              </tr>
              <tr>
                <td>Support</td>
                <td>Community</td>
                <td>Email</td>
                <td>Dedicated</td>
              </tr>
              <tr>
                <td>Analytics</td>
                <td>Basic</td>
                <td>Advanced</td>
                <td>Custom</td>
              </tr>
              <tr>
                <td>API Access</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Team Collaboration</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">
        <h2 class="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

        <div class="space-y-4">
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              Can I change my plan at any time?
            </div>
            <div class="collapse-content">
              <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.</p>
            </div>
          </div>

          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              What happens to my credits when I change plans?
            </div>
            <div class="collapse-content">
              <p>When upgrading, credits are added immediately. When downgrading, your credit limit changes but existing credits remain until used.</p>
            </div>
          </div>

          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              Do you offer refunds?
            </div>
            <div class="collapse-content">
              <p>We offer a 30-day money-back guarantee for all paid plans. Contact support within 30 days of purchase for a full refund.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;