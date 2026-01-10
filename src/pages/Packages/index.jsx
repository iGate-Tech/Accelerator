import { createSignal, createResource, For, Show } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getPackages, getUserSubscription, createUserSubscription } from "../../lib/db";
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
    try {
      // Check if user already has an active subscription
      const currentSubscription = subscription();
      if (currentSubscription && currentSubscription.name === packageData.name) {
        toastManager.info(`You already have the ${packageData.name} plan!`);
        return;
      }

      // For free plan, create subscription immediately
      if (packageData.price === 0) {
        await createUserSubscription(user().id, packageData.id);
        toastManager.success(`Successfully subscribed to ${packageData.name} plan!`);
        refetchSubscription();
        return;
      }

      // For paid plans, show payment required message (in real app, integrate payment processor)
      toastManager.info(`Payment processing for ${packageData.name} plan would happen here. Subscription created for demo purposes.`);

      // For demo purposes, create the subscription anyway
      await createUserSubscription(user().id, packageData.id);
      toastManager.success(`Demo: Subscribed to ${packageData.name} plan!`);
      refetchSubscription();

    } catch (error) {
      console.error('Subscription error:', error);
      toastManager.error('Failed to process subscription. Please try again.');
    }
  };

  const getPackageFeatures = (features, packageName) => {
    // Features are already parsed as arrays from the database
    if (Array.isArray(features) && features.length > 0) {
      return features;
    }

    // If no features, provide defaults based on package name
    switch (packageName) {
      case 'Free':
        return ['AI-powered business plan generation', 'Basic market analysis', 'Financial projections', '3 projects maximum', 'Community support', 'Basic export options'];
      case 'Pro':
        return ['Everything in Free plan', 'Unlimited projects', 'Advanced market research', 'Competitive analysis', 'Pitch deck generation', 'Financial modeling', 'Priority customer support', 'Advanced export formats', 'API access', 'Custom templates'];
      case 'Enterprise':
        return ['Everything in Pro plan', 'Team collaboration tools', 'Advanced analytics dashboard', 'Custom integrations', 'White-label options', 'Dedicated success manager', 'Priority feature requests', 'Advanced security features', 'Custom AI model training', '24/7 premium support'];
      default:
        return ['AI-powered tools', 'Project management', 'Community support'];
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      {/* Hero Section */}
      <div class="bg-gradient-to-r from-primary to-secondary text-base-100 py-20">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-5xl font-bold mb-6">Choose Your Growth Plan</h1>
          <p class="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Accelerate your startup journey with our tailored plans. Get the right tools and credits to turn your vision into reality.
          </p>
          <div class="flex justify-center space-x-8 text-sm">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              30-day money back guarantee
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Cancel anytime
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              24/7 support
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-16">
        <Show when={!packages.loading} fallback={
          <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <div class="max-w-7xl mx-auto">
            {/* Pricing Cards */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 -mt-16 relative z-10">
              <For each={packages()}>
                {(pkg, index) => (
                  <div class={`relative bg-base-100 rounded-3xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                    pkg.name === 'Pro'
                      ? 'border-primary lg:transform lg:scale-105 lg:z-10'
                      : pkg.name === 'Enterprise'
                        ? 'border-secondary'
                        : 'border-base-300'
                  }`}>

                     {/* Popular Badge */}
                     <Show when={pkg.name === 'Pro'}>
                       <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-30">
                         <span class="bg-gradient-to-r from-primary to-primary-focus text-base-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                           🔥 Most Popular
                         </span>
                       </div>
                     </Show>

                    {/* Header */}
                    <div class={`p-8 text-center ${pkg.name === 'Pro' ? 'bg-gradient-to-br from-primary/10 to-primary/20' : 'bg-base-200'}`}>
                      <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                        <span class="text-2xl text-white font-bold">{pkg.name[0]}</span>
                      </div>
                      <h3 class="text-2xl font-bold mb-2">{pkg.name}</h3>
                      <div class="text-center">
                         <span class="text-5xl font-bold text-base-content">
                          {pkg.price === 0 ? 'Free' : `$${pkg.price}`}
                        </span>
                        {pkg.price > 0 && <span class="text-base-content/60">/month</span>}
                      </div>
                      <p class="text-base-content/70 mt-2">{pkg.credits_included} AI credits included</p>
                    </div>

                    {/* Features */}
                    <div class="p-8">
                      <div class="mb-6">
                         <h4 class="font-semibold mb-4 text-base-content">What's included:</h4>
                        <ul class="space-y-3">
                           <For each={getPackageFeatures(pkg.features, pkg.name)}>
                            {(feature) => (
                              <li class="flex items-start">
                                <svg class="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span class="text-base-content/80">{feature}</span>
                              </li>
                            )}
                          </For>
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleSubscribe(pkg)}
                        disabled={subscription() && subscription().name === pkg.name}
                        class={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                          subscription() && subscription().name === pkg.name
                            ? 'bg-success/20 text-success border border-success/30 cursor-not-allowed'
                            : pkg.name === 'Starter'
                            ? 'bg-base-200 text-base-content/80 hover:bg-base-300 border border-base-300'
                            : 'bg-gradient-to-r from-primary to-primary-focus text-base-100 hover:from-primary-focus hover:to-primary-focus shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        }`}
                      >
                        {subscription() && subscription().name === pkg.name
                          ? 'Current Plan'
                          : pkg.price === 0
                            ? 'Get Started Free'
                            : 'Start Free Trial'
                        }
                      </button>


                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Testimonials Section */}
            <div class="mt-20 text-center">
              <h2 class="text-3xl font-bold mb-12">Trusted by Startup Founders</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 border-base-300">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center mr-4">
                      <span class="text-info font-bold">SJ</span>
                    </div>
                    <div>
                      <h4 class="font-semibold">Sarah Johnson</h4>
                      <p class="text-sm text-base-content/70">CEO, TechStart</p>
                    </div>
                  </div>
                  <p class="text-base-content/80 italic">"The Pro plan helped us validate our MVP in just 2 weeks. The AI insights were game-changing."</p>
                </div>

                <div class="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 border-base-300">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mr-4">
                      <span class="text-success font-bold">MR</span>
                    </div>
                    <div>
                      <h4 class="font-semibold">Mike Rodriguez</h4>
                      <p class="text-sm text-base-content/70">Founder, GreenTech</p>
                    </div>
                  </div>
                  <p class="text-base-content/80 italic">"Enterprise plan gave us the tools to scale from idea to Series A. Worth every penny."</p>
                </div>

                <div class="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 border-base-300">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mr-4">
                      <span class="text-secondary font-bold">AL</span>
                    </div>
                    <div>
                      <h4 class="font-semibold">Anna Liu</h4>
                      <p class="text-sm text-base-content/70">CTO, InnovateLab</p>
                    </div>
                  </div>
                  <p class="text-base-content/80 italic">"Started with free plan, upgraded to Pro. The credit system made budgeting AI costs effortless."</p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div class="mt-20 bg-base-100 rounded-2xl p-8 shadow-sm border border-base-300 border-base-300">
              <h2 class="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 class="font-semibold mb-2">Can I change plans anytime?</h3>
                  <p class="text-base-content/70">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">What happens to unused credits?</h3>
                  <p class="text-base-content/70">Credits roll over to the next month. Enterprise plans have unlimited carryover.</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">Is there a free trial?</h3>
                  <p class="text-base-content/70">All paid plans come with a 30-day free trial. No credit card required to start.</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">Do you offer refunds?</h3>
                  <p class="text-base-content/70">Yes, we offer a 30-day money-back guarantee if you're not satisfied.</p>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Packages;