import { createSignal, onMount, useContext, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { LangContext } from "../../context/LangContext";
import { useUser } from "../../context/UserContext";
import { translations } from "../../assets/translations/translations-index.js";

const Onboarding = () => {
  const navigate = useNavigate();
  const { lang } = useContext(LangContext);
  const { updateProfile, updateSubscription } = useUser();
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [step, setStep] = createSignal(1);
  const [loading, setLoading] = createSignal(false);

  const [onboardingData, setOnboardingData] = createSignal({
    bio: '',
    interests: [],
    goals: '',
    selectedPackage: '',
    paymentMethod: { type: '', number: '', expiry: '', cvv: '' }
  });

  const t = () => translations[currentLang()];

   createEffect(() => {
     setCurrentLang(lang());
   });

   // Ensure Lucide icons render on step changes
   createEffect(() => {
     step();
     if (window.lucide) window.lucide.createIcons();
   });

  const nextStep = () => {
    if (step() < 4) {
      setStep(step() + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (step() > 1) {
      setStep(step() - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await updateProfile({
        bio: onboardingData().bio,
        interests: onboardingData().interests,
        goals: onboardingData().goals,
        onboardingCompleted: true
      });
      // Optionally set subscription
      if (onboardingData().selectedPackage && onboardingData().selectedPackage !== 'free') {
        const pkg = onboardingData().selectedPackage === 'pro' ? 'Pro' : 'Enterprise';
        await updateSubscription({ plan: pkg });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = (field, value) => {
    setOnboardingData({ ...onboardingData(), [field]: value });
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class={`overflow-y-auto max-h-[calc(100vw-30rem)]   bg-gradient-to-br from-primary/5 via-base-200 to-secondary/5 py-12 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="container mx-auto px-4">
        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mb-6 shadow-lg">
            <i data-lucide="rocket" class="w-10 h-10 text-white"></i>
          </div>
           <h1 class="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
             {t().welcomeToAccelerator}
           </h1>
           <p class="text-xl text-base-content/70 max-w-2xl mx-auto">
             {t().setupMessage}
           </p>
        </div>

        {/* Progress Indicator */}
        <div class="mb-12">
          <div class="flex justify-center mb-4">
            <ul class="steps w-full max-w-2xl mx-auto bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 md:steps-horizontal steps-vertical">
              <li class={`step ${step() >= 1 ? 'step-primary' : ''}`}>
                <div class="step-circle"></div>
                 <span class="step-title">{t().profile}</span>
              </li>
              <li class={`step ${step() >= 2 ? 'step-primary' : ''}`}>
                <div class="step-circle"></div>
                 <span class="step-title">{t().package}</span>
              </li>
              <li class={`step ${step() >= 3 ? 'step-primary' : ''}`}>
                <div class="step-circle"></div>
                 <span class="step-title">{t().payment}</span>
              </li>
              <li class={`step ${step() >= 4 ? 'step-primary' : ''}`}>
                <div class="step-circle"></div>
                 <span class="step-title">{t().welcome}</span>
              </li>
            </ul>
          </div>
          <div class="text-center">
             <div class="text-sm text-base-content/60">{t().stepOf.replace('{step}', step())}</div>
            <progress
              class="progress progress-primary w-64 mx-auto mt-2"
              value={step()}
              max="4"
            ></progress>
          </div>
        </div>

        {/* Content Card */}
        <div class="bg-base-100 rounded-2xl shadow-xl border border-base-200">
          <div class="p-12 lg:p-20">

            {/* Step 1: Profile Setup */}
            {step() === 1 && (
              <div class="space-y-8">
                <div class="text-center mb-8">
                  <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-4">
                    <i data-lucide="user" class="w-8 h-8 text-primary"></i>
                  </div>
                   <h2 class="text-3xl font-bold mb-2">{t().setupProfile}</h2>
                   <p class="text-base-content/60">{t().tellAboutYourself}</p>
                </div>

                <div class="space-y-6">
                  <div class="form-control">
                    <label class="label">
                       <span class="label-text font-semibold">{t().bio}</span>
                       <span class="label-text-alt text-base-content/50">{t().tellUsAboutYourself}</span>
                    </label>
                    <textarea
                      class="textarea textarea-bordered w-full min-h-24 resize-none"
                      placeholder="I'm a startup founder passionate about building innovative solutions..."
                      value={onboardingData().bio}
                      onInput={(e) => updateData('bio', e.target.value)}
                    ></textarea>
                  </div>

                  <div class="form-control">
                    <label class="label">
                       <span class="label-text font-semibold">{t().interests}</span>
                       <span class="label-text-alt text-base-content/50">{t().whatInterestsYou}</span>
                    </label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {[
                         { name: t().technology, icon: 'cpu' },
                         { name: t().business, icon: 'briefcase' },
                         { name: t().design, icon: 'palette' },
                         { name: t().marketing, icon: 'megaphone' },
                         { name: t().finance, icon: 'dollar-sign' },
                         { name: t().aiMl, icon: 'brain' }
                       ].map((interest) => (
                        <label class={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          onboardingData().interests.includes(interest.name)
                            ? 'border-primary bg-primary/5 shadow-md scale-105'
                            : 'border-base-300 hover:border-primary/50 hover:bg-primary/5'
                        }`}>
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary checkbox-sm"
                            checked={onboardingData().interests.includes(interest.name)}
                            onChange={(e) => {
                              const interests = onboardingData().interests;
                              if (e.target.checked) {
                                updateData('interests', [...interests, interest.name]);
                              } else {
                                updateData('interests', interests.filter(i => i !== interest.name));
                              }
                            }}
                          />
                          <i data-lucide={interest.icon} class="w-4 h-4 text-base-content/60"></i>
                          <span class="font-medium">{interest.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div class="form-control">
                    <label class="label">
                       <span class="label-text font-semibold">{t().goals}</span>
                       <span class="label-text-alt text-base-content/50">{t().whatAchieve}</span>
                    </label>
                    <textarea
                      class="textarea textarea-bordered w-full min-h-24 resize-none"
                      placeholder="I want to validate my startup idea, build an MVP, and find product-market fit..."
                      value={onboardingData().goals}
                      onInput={(e) => updateData('goals', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Package Selection */}
            {step() === 2 && (
              <div class="space-y-8">
                <div class="text-center mb-8">
                  <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full mb-4">
                    <i data-lucide="package" class="w-8 h-8 text-secondary"></i>
                  </div>
                   <h2 class="text-3xl font-bold mb-2">{t().choosePackage}</h2>
                   <p class="text-base-content/60">{t().selectPlan}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      id: 'free',
                       name: t().free,
                      credits: 100,
                      price: 0,
                      period: 'forever',
                      popular: false,
                       features: [t().basicAiFeatures, 'Limited calls', 'Community support'],
                      color: 'neutral'
                    },
                    {
                      id: 'pro',
                       name: t().pro,
                      credits: 1000,
                      price: 9.99,
                      period: 'month',
                      popular: true,
                       features: [t().allAiFeatures, 'Priority support', 'Advanced analytics', t().exportCapabilities],
                      color: 'primary'
                    },
                    {
                      id: 'enterprise',
                       name: t().enterprise,
                      credits: 5000,
                      price: 29.99,
                      period: 'month',
                      popular: false,
                       features: [t().everythingInPro, 'Custom integrations', 'Dedicated support', 'Team collaboration'],
                      color: 'secondary'
                    }
                  ].map((pkg) => (
                    <div
                      class={`card border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        onboardingData().selectedPackage === pkg.id
                          ? `border-${pkg.color} bg-${pkg.color}/5 shadow-md scale-105`
                          : 'border-base-300 hover:border-base-400'
                      } ${pkg.popular ? 'ring-2 ring-primary/20' : ''}`}
                      onClick={() => updateData('selectedPackage', pkg.id)}
                    >
                      <div class="card-body p-6 text-center">
                        {pkg.popular && (
                          <div class="badge badge-primary badge-sm mb-2">{t().mostPopular}</div>
                        )}
                        <h3 class="card-title justify-center text-xl mb-2">{pkg.name}</h3>
                        <div class="mb-4">
                          <span class="text-4xl font-bold">${pkg.price}</span>
                          <span class="text-base-content/60">/{pkg.period}</span>
                        </div>
                        <div class="text-sm text-base-content/70 mb-4">
                          <strong>{pkg.credits.toLocaleString()}</strong> AI credits
                        </div>
                        <ul class="text-sm space-y-2">
                          {pkg.features.map(feature => (
                            <li class="flex items-center gap-2">
                              <i data-lucide="check" class="w-4 h-4 text-success flex-shrink-0"></i>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div class="alert alert-info">
                  <i data-lucide="info" class="w-5 h-5"></i>
                  <div>
                     <h4 class="font-bold">{t().flexiblePlans}</h4>
                     <p>{t().planChangeMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step() === 3 && (
              <div class="space-y-8">
                <div class="text-center mb-8">
                  <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full mb-4">
                    <i data-lucide="credit-card" class="w-8 h-8 text-accent"></i>
                  </div>
                   <h2 class="text-3xl font-bold mb-2">{t().addPaymentMethod}</h2>
                   <p class="text-base-content/60">{t().securelyAddPayment}</p>
                </div>

                <div class="mx-auto">
                  <div class="bg-gradient-to-br from-base-200 to-base-300 p-6 rounded-xl border border-base-300">
                    <div class="flex items-center justify-center mb-4">
                      <i data-lucide="credit-card" class="w-12 h-12 text-base-content/40"></i>
                    </div>

                    <div class="space-y-4">
                      <div class="form-control">
                        <label class="label">
                           <span class="label-text font-semibold">{t().cardType}</span>
                        </label>
                        <select
                          class="select select-bordered w-full"
                          value={onboardingData().paymentMethod.type}
                          onChange={(e) => updateData('paymentMethod', { ...onboardingData().paymentMethod, type: e.target.value })}
                        >
                          <option value="">Select card type</option>
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="amex">American Express</option>
                        </select>
                      </div>

                      <div class="form-control">
                        <label class="label">
                           <span class="label-text font-semibold">{t().cardNumber}</span>
                        </label>
                        <input
                          type="text"
                          class="input input-bordered w-full"
                          placeholder="1234 5678 9012 3456"
                          value={onboardingData().paymentMethod.number}
                          onInput={(e) => updateData('paymentMethod', { ...onboardingData().paymentMethod, number: e.target.value })}
                        />
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div class="form-control">
                          <label class="label">
                             <span class="label-text font-semibold">{t().expiryDate}</span>
                          </label>
                          <input
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="MM/YY"
                            value={onboardingData().paymentMethod.expiry}
                            onInput={(e) => updateData('paymentMethod', { ...onboardingData().paymentMethod, expiry: e.target.value })}
                          />
                        </div>
                        <div class="form-control">
                          <label class="label">
                             <span class="label-text font-semibold">{t().cvv}</span>
                          </label>
                          <input
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="123"
                            value={onboardingData().paymentMethod.cvv}
                            onInput={(e) => updateData('paymentMethod', { ...onboardingData().paymentMethod, cvv: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="alert alert-success mt-6">
                    <i data-lucide="shield" class="w-5 h-5"></i>
                    <div>
                       <h4 class="font-bold">{t().securePayment}</h4>
                       <p>{t().paymentSecurityMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Welcome */}
            {step() === 4 && (
              <div class="text-center space-y-8">
                <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-success/20 to-success/10 rounded-full mb-6">
                  <i data-lucide="check-circle" class="w-12 h-12 text-success"></i>
                </div>
                 <h2 class="text-4xl font-bold mb-4">{t().welcomeToAcceleratorExclaim}</h2>
                 <p class="text-xl text-base-content/70 mb-8 max-w-2xl mx-auto">
                   {t().allSetMessage}
                 </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-figure text-primary">
                      <i data-lucide="user" class="w-6 h-6"></i>
                    </div>
                     <div class="stat-title">{t().profile}</div>
                     <div class="stat-value text-lg">{t().complete}</div>
                     <div class="stat-desc">{t().personalizedExperience}</div>
                  </div>

                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-figure text-secondary">
                      <i data-lucide="package" class="w-6 h-6"></i>
                    </div>
                     <div class="stat-title">{t().package}</div>
                     <div class="stat-value text-lg">{onboardingData().selectedPackage || t().free}</div>
                     <div class="stat-desc">{t().readyToUse}</div>
                  </div>

                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-figure text-accent">
                      <i data-lucide="credit-card" class="w-6 h-6"></i>
                    </div>
                     <div class="stat-title">{t().payment}</div>
                     <div class="stat-value text-lg">{t().setUp}</div>
                     <div class="stat-desc">{t().secureReady}</div>
                  </div>
                </div>

                <div class="text-6xl mb-6">🚀</div>
                 <p class="text-base-content/60">{t().clickGetStarted}</p>
              </div>
            )}

          </div>

          {/* Navigation */}
          <div class="flex justify-between items-center mt-8 p-8 border-t border-base-200">
            <button
              class={`btn btn-ghost btn-lg gap-2 transition-all duration-200 ${
                step() === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-base-200 shadow-sm hover:shadow-md'
              }`}
              onClick={prevStep}
              disabled={step() === 1}
            >
              <i data-lucide="arrow-left" class="w-5 h-5"></i>
               {t().previous}
            </button>

            <div class="flex flex-col items-center gap-2">
              <span class="text-sm font-medium text-base-content/70">
                Step {step()} of 4
              </span>
              <progress
                class="progress progress-primary w-24 h-2"
                value={step()}
                max="4"
              ></progress>
            </div>

            <button
              class={`btn btn-ghost btn-lg gap-2 transition-all duration-200 ${
                step() === 4
                  ? 'text-success hover:bg-success/10 shadow-sm hover:shadow-md'
                  : 'text-primary hover:bg-primary/10 shadow-sm hover:shadow-md'
              }`}
              onClick={nextStep}
              disabled={loading()}
            >
              {loading() ? (
                <>
                  <span class="loading loading-spinner loading-sm"></span>
                   {t().processing}
                </>
              ) : step() === 4 ? (
                <>
                   {t().getStarted}
                  <i data-lucide="rocket" class="w-5 h-5"></i>
                </>
              ) : (
                <>
                  {t().next}
                  <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;