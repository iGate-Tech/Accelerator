import { createSignal, onMount, createEffect, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { createUserSubscription, getUserSubscription, seedPackages } from "../../lib/db";
import { initDatabase } from "../../lib/db-core";
import { toastManager } from "../../lib/feedback";
import { packagesTranslations } from "../../assets/translations/translations-index.js";
import logger from "../../lib/logger.js";

const Packages = () => {
  logger.trace('Packages: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated, updateSubscription, checkAuth } = useUser();
  const { currentLang, t: langT } = useLanguage();

  // Get package translations reactively
  const t = () => {
    const langKey = currentLang() || 'ar';
    return packagesTranslations[langKey] || packagesTranslations.ar;
  };

  const [packages] = createSignal([
    {
      id: 'free',
      name: t().freePlan,
      price: t().freePrice,
      credits_included: 50,
      features: [
        t().aiBusinessPlan,
        t().basicMarket,
        t().financialProjections,
        t().projectsMaximum,
        t().communitySupport,
        t().basicExport
      ]
    },
    {
      id: 'pro',
      name: t().proPlan,
      price: t().proPrice,
      credits_included: 500,
      features: [
        t().everythingInFree,
        t().unlimitedProjects,
        t().advancedMarket,
        t().competitiveAnalysis,
        t().pitchDeck,
        t().financialModeling,
        t().prioritySupport,
        t().advancedExport,
        t().apiAccess,
        t().customTemplates
      ]
    },
    {
      id: 'enterprise',
      name: t().enterprisePlan,
      price: t().enterprisePrice,
      credits_included: 2000,
      features: [
        t().everythingInPro,
        t().teamCollaboration,
        t().advancedAnalytics,
        t().customIntegrationsFeature,
        t().whiteLabel,
        t().dedicatedManager,
        t().priorityRequests,
        t().advancedSecurity,
        t().customAITraining,
        t().premiumSupport
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
        toastManager.info(t().alreadySubscribed.replace('{plan}', packageData.name));
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
        maxCredits: packageData.credits_included,
        price: packageData.price
      });
      
      await checkAuth();
      toastManager.success(t().subscriptionSuccess.replace('{plan}', packageData.name));
    } catch (error) {
      logger.error('Error creating subscription:', error);
      toastManager.error(t().failedToSubscribe);
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
     <div class="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 py-6 sm:py-8 overflow-visible">
       {/* Header */}
       <div class="py-6">
         <div class="flex justify-start mb-4">
           <button
             onClick={() => navigate('/')}
             class="btn btn-ghost btn-sm gap-2"
           >
             <svg class="w-4 h-4 rtl:transform rtl:scale-x-[-1]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
             <span class="hidden sm:inline">Back</span>
           </button>
         </div>

         <div class="text-center">
           <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-3">{t().subscriptionPlans}</h1>
           <p class="text-sm sm:text-base text-base-content/70 max-w-2xl mx-auto mb-6">
             {t().choosePlan}
           </p>
         </div>
       </div>

       {/* Content */}
       <div class="bg-base-100 rounded-box p-4 sm:p-6 md:p-8 shadow-sm border border-base-200">
         {/* Current Plan Banner */}
         <div class="alert alert-info mb-8">
        <i data-lucide="info" class="w-5 h-5"></i>
        <div>
          <h3 class="font-bold">{t().currentPlanBanner.replace('{plan}', packages().find(p => p.id === currentPlan())?.name || t().freePlan)}</h3>
          <div class="text-xs">{t().creditsRemaining.replace('{remaining}', user()?.credits?.balance || 0).replace('{max}', user()?.subscription?.maxCredits || 50)}</div>
        </div>
      </div>

      {/* Packages Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <For each={packages()}>
          {(pkg) => (
            <div class={`card bg-base-100 shadow-lg border-2 ${
              pkg.id === currentPlan() ? 'border-primary' : 'border-base-200'
            } ${pkg.name === t().proPlan ? 'relative' : ''}`}>
                {pkg.name === t().proPlan && (
                  <div class="absolute -top-3 start-1/2 transform -translate-x-1/2">
                  <div class="badge badge-primary">{t().mostPopular}</div>
                </div>
              )}
              <div class="card-body">
                <div class="text-center">
                  <h2 class="card-title justify-center text-2xl">{pkg.name}</h2>
                  <div class="text-4xl font-bold text-primary my-4">
                    ${pkg.price}
                    <span class="text-lg font-normal text-base-content/60">{t().perMonth}</span>
                  </div>
                  <p class="text-base-content/60">{t().creditsIncluded.replace('{credits}', pkg.credits_included)}</p>
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
                      {t().currentPlanButton}
                    </button>
                  ) : (
                    <button
                      class="btn btn-primary btn-block"
                      onClick={() => handleSubscribe(pkg)}
                    >
                      {pkg.price === 0 ? t().getStarted : t().upgrade}
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
          <h3 class="card-title">{t().featureComparison}</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>{t().feature}</th>
                  <th>{t().free}</th>
                  <th>{t().pro}</th>
                  <th>{t().enterprise}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t().aiAssistance}</td>
                  <td>{t().aiAssistanceFree}</td>
                  <td>{t().aiAssistancePro}</td>
                  <td>{t().aiAssistanceEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().projectsPerMonth}</td>
                  <td>{t().projectsFree}</td>
                  <td>{t().projectsPro}</td>
                  <td>{t().projectsEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().creditsRow}</td>
                  <td>{t().creditsFree}</td>
                  <td>{t().creditsPro}</td>
                  <td>{t().creditsEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().supportRow}</td>
                  <td>{t().supportFree}</td>
                  <td>{t().supportPro}</td>
                  <td>{t().supportEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().templatesRow}</td>
                  <td>{t().templatesFree}</td>
                  <td>{t().templatesPro}</td>
                  <td>{t().templatesEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().collaborationRow}</td>
                  <td>{t().collaborationFree}</td>
                  <td>{t().collaborationPro}</td>
                  <td>{t().collaborationEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().apiAccessRow}</td>
                  <td>{t().apiAccessFree}</td>
                  <td>{t().apiAccessPro}</td>
                  <td>{t().apiAccessEnterprise}</td>
                </tr>
                <tr>
                  <td>{t().customIntegrations}</td>
                  <td>{t().customIntegrationsFree}</td>
                  <td>{t().customIntegrationsPro}</td>
                  <td>{t().customIntegrationsEnterprise}</td>
                </tr>
              </tbody>
            </table>
          </div>
         </div>
       </div>
     </div>
     </div>
   );
 };

export default Packages;
