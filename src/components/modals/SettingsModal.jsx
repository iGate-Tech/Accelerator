import { createSignal, Show, For, Switch, Match, onMount, createEffect } from 'solid-js';
import { useUser } from '@context/UserContext';
import { useNavigate } from '@solidjs/router';
import { useLanguage } from '@hooks/useLanguage';
import { toastManager } from '@lib/ui/feedback';
import { confirmDanger } from './GlobalConfirm';
import { applyTheme } from '@lib/theme';
import {
  Settings,
  UserRound,
  CalendarDays,
  Bell,
  PanelTop,
  Puzzle,
  Cable,
  Plug,
  CircleQuestionMark,
  LogOut,
  X,
  Monitor,
  Sun,
  Moon,
  ArrowUpRight,
  CreditCard,
} from 'lucide-solid';

// ─── Global Modal State ────────────────────────────────────────────────
const [isOpen, setIsOpen] = createSignal(false);
let originalThemeOnOpen = null;
let originalLanguageOnOpen = null;
let settingsWereSaved = false;
export const openSettings = () => setIsOpen(true);
export const closeSettings = () => setIsOpen(false);

// ─── Tab Definition ─────────────────────────────────────────────────────
const tabs = [
  { id: 'general',     label: 'general',     icon: Settings },
  { id: 'profile',     label: 'profile',     icon: UserRound },
  { id: 'notifications', label: 'notifications', icon: Bell },
  { id: 'billing',     label: 'plansAndBilling', icon: CalendarDays },
  { id: 'credits',     label: 'buyCredits', icon: CreditCard },
  { id: 'workspace',   label: 'workspace',   icon: PanelTop },
  { id: 'apps',        label: 'appsAndSkills', icon: Puzzle },
  { id: 'connectors',  label: 'connectors',  icon: Cable },
  { id: 'integrations', label: 'integrations', icon: Plug },
];

// type TabId = typeof tabs[number]['id'];

// ─── Main Component ─────────────────────────────────────────────────────
export default function SettingsModal() {
  const [activeTab, setActiveTab] = createSignal('general');
  const { user, logout, updatePreferences } = useUser();
  const { currentLang, t, setLang } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = createSignal({
    language: currentLang(),
    theme: user()?.preferences?.theme ?? 'system',
    email: user()?.email ?? '',
    avatar: user()?.avatar ?? '',
    profile: {
      firstName: user()?.profile?.firstName ?? '',
      lastName: user()?.profile?.lastName ?? '',
      phone: user()?.profile?.phone ?? '',
      bio: user()?.profile?.bio ?? '',
      location: user()?.profile?.location ?? '',
      jobTitle: user()?.profile?.jobTitle ?? '',
      website: user()?.profile?.website ?? '',
      linkedin: user()?.profile?.linkedin ?? ''
    },
    notifications: {
      exclusiveContent: false,
      taskStartEmail: true,
      browser: user()?.preferences?.notifications?.browser ?? false,
      projectUpdates: true,
      weeklyReports: false,
      securityAlerts: true,
      productUpdates: true,
      realTimeAlerts: false,
      taskCompletion: true,
      doNotDisturb: false,
      quietHours: {
        from: '22:00',
        to: '07:00'
      }
    },
  });

  // Save handler (debounce in real app)
  const save = async () => {
    try {
      await updatePreferences({
        theme: form().theme,
        language: form().language,
        email: form().email,
        avatar: form().avatar,
        profile: form().profile,
        notifications: {
          exclusiveContent: form().notifications.exclusiveContent,
          taskStartEmail: form().notifications.taskStartEmail,
          browser: form().notifications.browser,
          projectUpdates: form().notifications.projectUpdates,
          weeklyReports: form().notifications.weeklyReports,
          securityAlerts: form().notifications.securityAlerts,
          productUpdates: form().notifications.productUpdates,
          realTimeAlerts: form().notifications.realTimeAlerts,
          taskCompletion: form().notifications.taskCompletion,
          doNotDisturb: form().notifications.doNotDisturb,
          quietHours: form().notifications.quietHours,
        }
      });
      setLang(form().language);
      applyTheme(form().theme); // Apply the new theme
      settingsWereSaved = true; // Mark that settings were saved
      toastManager.success(t('settingsSaved'));
      closeSettings(); // Close the modal after saving
    } catch (err) {
      toastManager.error(t('settingsSaveFailed'));
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/auth/login');
    closeSettings();
  };

  const deleteAccountFlow = async () => {
    const confirmed = await confirmDanger(
      'Delete Account',
      'This cannot be undone.',
      'All projects, files, credits and history will be permanently deleted.'
    );
    if (!confirmed) return;
    // ... delete logic ...
    toastManager.success('Account scheduled for deletion');
    setTimeout(() => navigate('/auth/login'), 1800);
  };

  // Function to temporarily apply theme for preview
  const previewTheme = (themeValue) => {
    applyTheme(themeValue);
  };

  // Apply the current theme when the modal opens and restore original when closing (unless saved)
  createEffect(() => {
    if (isOpen()) {
      originalThemeOnOpen = user()?.preferences?.theme ?? 'system';
      originalLanguageOnOpen = currentLang();
      settingsWereSaved = false; // Reset the flag when opening
      applyTheme(form().theme);
    } else if (originalThemeOnOpen && !settingsWereSaved) {
      // When modal closes without saving, restore the original theme and language
      applyTheme(originalThemeOnOpen);
      setLang(originalLanguageOnOpen); // Restore original language
    }
  });

  return (
    <div class={`modal ${isOpen() ? 'modal-open' : ''}`}>
      <div class="modal-box w-1/2 h-[600px] p-0 overflow-hidden">
        <div class="flex h-full flex-col md:flex-row">
          {/* ─── Sidebar ──────────────────────────────────────── */}
          <aside class=" bg-base-100 border-r border-base-200 gap-2 flex flex-col">
            <div class="p-5 border-b border-base-200">
              <h2 class="text-xl font-semibold flex items-center gap-2.5">
                <Settings size={22} /> Settings
              </h2>
            </div>

            <div class="flex-1 overflow-y-auto p-3">
              <ul class="menu w-full gap-1">
                <For each={tabs}>
                  {(tab) => (
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        class={`w-full text-left ${activeTab() === tab.id ? 'bg-primary text-primary-content rounded-md' : ''}`}
                      >
                        <tab.icon size={18} strokeWidth={activeTab() === tab.id ? 2.4 : 1.8} />
                        <span>{t(tab.label)}</span>
                      </button>
                    </li>
                  )}
                </For>
              </ul>

              <div class="divider my-4" />

              <ul class="menu w-full">
                <li>
                  <a
                    href="/help"
                    rel="noreferrer"
                  >
                    <CircleQuestionMark size={18} />
                    <span>{t('help')}</span>
                    <ArrowUpRight size={14} />
                  </a>
                </li>
              </ul>
            </div>

            <div class="p-4 border-t border-base-200">
              <button
                onClick={signOut}
                class="btn btn-ghost btn-error btn-sm w-full justify-start gap-3"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </aside>

          {/* ─── Main Content Area ────────────────────────────── */}
          <main class="flex-1 flex flex-col overflow-hidden bg-base-100">
            {/* Mobile header */}
            <div class="md:hidden p-4 border-b bg-base-100">
              <h2 class="text-xl font-semibold">{t('settings')}</h2>
            </div>

            <div class="flex-1 overflow-y-auto p-5 sm:p-7">
              <Switch>
                <Match when={activeTab() === 'general'}>
                  <GeneralSettings
                    form={form()}
                    setForm={setForm}
                    currentLang={currentLang()}
                    setLang={setLang}
                    deleteAccountFlow={deleteAccountFlow}
                    previewTheme={previewTheme}
                    t={t}
                  />
                </Match>

                <Match when={activeTab() === 'billing'}>
                  <div class="max-w-3xl flex flex-col">
                    <div class="flex flex-col">
                      <h3 class="text-2xl font-semibold">{t('plansAndBilling')}</h3>
                      <p class="text-base-content/70 mb-6">{t('manageSubscriptionAndPayment')}</p>
                    </div>

                    <div class="space-y-6 flex-1 overflow-y-auto pr-2 -mr-2">
                      <div class="card bg-base-100 shadow-lg">
                        <div class="card-body p-6">
                          <h4 class="text-lg font-semibold mb-4">{t('currentPlan')}</h4>
                          <div class="flex items-center justify-between p-4 bg-base-200 rounded-box">
                            <div>
                              <h5 class="font-medium">{t('professionalPlan')}</h5>
                              <p class="text-sm text-base-content/60">{t('unlimitedProjectsAdvancedFeatures')}</p>
                            </div>
                            <div class="text-right">
                              <div class="font-semibold">$19/{t('monthly')}</div>
                              <div class="text-sm text-success">{t('active')}</div>
                            </div>
                          </div>

                          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 class="font-medium mb-3">{t('billingInformation')}</h5>
                              <div class="space-y-3">
                                <div class="flex justify-between">
                                  <span class="text-base-content/70">{t('nextBillingDate')}</span>
                                  <span>March 15, 2024</span>
                                </div>
                                <div class="flex justify-between">
                                  <span class="text-base-content/70">{t('paymentMethod')}</span>
                                  <span>•••• 4242 (Visa)</span>
                                </div>
                                <div class="flex justify-between">
                                  <span class="text-base-content/70">{t('billingCycle')}</span>
                                  <span>{t('monthly')}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 class="font-medium mb-3">{t('usage')}</h5>
                              <div class="space-y-3">
                                <div>
                                  <div class="flex justify-between text-sm mb-1">
                                    <span>{t('projects')}</span>
                                    <span>12/∞</span>
                                  </div>
                                  <progress class="progress progress-primary w-full" value="25" max="100">25%</progress>
                                </div>
                                <div>
                                  <div class="flex justify-between text-sm mb-1">
                                    <span>{t('credits')}</span>
                                    <span>420/500</span>
                                  </div>
                                  <progress class="progress progress-primary w-full" value="84" max="100">84%</progress>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="card-actions mt-6 justify-end">
                            <button class="btn btn-primary">{t('upgradePlan')}</button>
                            <button class="btn btn-ghost">{t('viewInvoiceHistory')}</button>
                            <button class="btn btn-ghost">{t('updatePaymentMethod')}</button>
                          </div>
                        </div>
                      </div>

                      <div class="card bg-base-100 shadow-lg">
                        <div class="card-body p-6">
                          <h4 class="text-lg font-semibold mb-4">{t('subscriptionOptions')}</h4>
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="card border border-base-200 hover:shadow-xl transition-shadow">
                              <div class="card-body p-5">
                                <h5 class="font-medium text-lg mb-2">{t('starter')}</h5>
                                <div class="text-2xl font-bold mb-3">$9<span class="text-sm font-normal text-base-content/70">/{t('month')}</span></div>
                                <ul class="space-y-2 mb-4 text-sm">
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> 5 {t('projects')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('basicFeatures')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('emailSupport')}</li>
                                </ul>
                                <div class="card-actions">
                                  <button class="btn btn-ghost btn-sm w-full">{t('select')}</button>
                                </div>
                              </div>
                            </div>

                            <div class="card border-2 border-primary bg-primary/5 relative">
                              <div class="badge badge-primary absolute top-3 right-3">{t('popular')}</div>
                              <div class="card-body p-5">
                                <h5 class="font-semibold text-lg mb-2">{t('professional')}</h5>
                                <div class="text-2xl font-bold mb-3">$19<span class="text-sm font-normal text-base-content/70">/{t('month')}</span></div>
                                <ul class="space-y-2 mb-4 text-sm">
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('unlimitedProjects')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('advancedFeatures')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('prioritySupport')}</li>
                                </ul>
                                <div class="card-actions">
                                  <button class="btn btn-primary btn-sm w-full">{t('currentPlan')}</button>
                                </div>
                              </div>
                            </div>

                            <div class="card border border-base-200 hover:shadow-xl transition-shadow">
                              <div class="card-body p-5">
                                <h5 class="font-semibold text-lg mb-2">{t('enterprise')}</h5>
                                <div class="text-2xl font-bold mb-3">$49<span class="text-sm font-normal text-base-content/70">/{t('month')}</span></div>
                                <ul class="space-y-2 mb-4 text-sm">
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('unlimitedEverything')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('customIntegrations')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('dedicatedSupport')}</li>
                                </ul>
                                <div class="card-actions">
                                  <button class="btn btn-ghost btn-sm w-full">{t('contactSales')}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Match>

                <Match when={activeTab() === 'notifications'}>
                  <NotificationSettings
                    form={form()}
                    setForm={setForm}
                    t={t}
                  />
                </Match>

                <Match when={activeTab() === 'profile'}>
                  <ProfileSettings
                    form={form()}
                    setForm={setForm}
                    t={t}
                  />
                </Match>

                <Match when={activeTab() === 'credits'}>
                  <div class="max-w-3xl flex flex-col">
                    <div class="flex flex-col">
                      <h3 class="text-2xl font-semibold">{t('buyCredits')}</h3>
                      <p class="text-base-content/70 mb-6">{t('purchaseAdditionalCredits')}</p>
                    </div>

                    <div class="space-y-6 flex-1 overflow-y-auto pr-2 -mr-2">
                      <div class="card bg-base-100 shadow-lg">
                        <div class="card-body p-6">
                          <h4 class="text-lg font-semibold mb-4">{t('currentBalance')}</h4>
                          <div class="flex items-center justify-between p-4 bg-base-200 rounded-box">
                            <div>
                              <h5 class="font-medium">{t('availableCredits')}</h5>
                              <p class="text-sm text-base-content/60">{t('creditsAvailable')}</p>
                            </div>
                            <div class="text-right">
                              <div class="font-semibold text-2xl text-primary">420</div>
                              <div class="text-sm text-success">Active</div>
                            </div>
                          </div>

                          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 class="font-medium mb-3">{t('creditUsage')}</h5>
                              <div class="space-y-3">
                                <div class="flex justify-between">
                                  <span class="text-base-content/70">{t('usedThisMonth')}</span>
                                  <span>80</span>
                                </div>
                                <div class="flex justify-between">
                                  <span class="text-base-content/70">{t('remaining')}</span>
                                  <span>340</span>
                                </div>
                                <div class="flex justify-between">
                                  <span class="text-base-content/70">{t('renewalDate')}</span>
                                  <span>Feb 15, 2024</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 class="font-medium mb-3">{t('usageStatistics')}</h5>
                              <div class="space-y-3">
                                <div>
                                  <div class="flex justify-between text-sm mb-1">
                                    <span>{t('aiProcessing')}</span>
                                    <span>45/500</span>
                                  </div>
                                  <progress class="progress progress-primary w-full" value="9" max="100">9%</progress>
                                </div>
                                <div>
                                  <div class="flex justify-between text-sm mb-1">
                                    <span>{t('storage')}</span>
                                    <span>120/500</span>
                                  </div>
                                  <progress class="progress progress-secondary w-full" value="24" max="100">24%</progress>
                                </div>
                                <div>
                                  <div class="flex justify-between text-sm mb-1">
                                    <span>{t('apiCalls')}</span>
                                    <span>255/500</span>
                                  </div>
                                  <progress class="progress progress-accent w-full" value="51" max="100">51%</progress>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="card bg-base-100 shadow-lg">
                        <div class="card-body p-6">
                          <h4 class="text-lg font-semibold mb-4">{t('creditPackages')}</h4>
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="card border border-base-200 hover:shadow-xl transition-shadow">
                              <div class="card-body p-5">
                                <h5 class="font-medium text-lg mb-2">{t('basicPack')}</h5>
                                <div class="text-2xl font-bold mb-3">100<span class="text-sm font-normal text-base-content/70"> {t('credits')}</span></div>
                                <div class="text-lg font-semibold mb-4">$9.99</div>
                                <ul class="space-y-2 mb-4 text-sm">
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('validForOneYear')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('instantActivation')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('noExpirationFees')}</li>
                                </ul>
                                <div class="card-actions">
                                  <button class="btn btn-ghost btn-sm w-full">{t('addToCart')}</button>
                                </div>
                              </div>
                            </div>

                            <div class="card border-2 border-primary bg-primary/5 relative">
                              <div class="badge badge-primary absolute top-3 right-3">{t('bestValue')}</div>
                              <div class="card-body p-5">
                                <h5 class="font-semibold text-lg mb-2">{t('standardPack')}</h5>
                                <div class="text-2xl font-bold mb-3">500<span class="text-sm font-normal text-base-content/70"> {t('credits')}</span></div>
                                <div class="text-lg font-semibold mb-4">$39.99</div>
                                <ul class="space-y-2 mb-4 text-sm">
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('validForOneYear')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('bulkDiscountApplied')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('prioritySupport')}</li>
                                </ul>
                                <div class="card-actions">
                                  <button class="btn btn-primary btn-sm w-full">{t('recommended')}</button>
                                </div>
                              </div>
                            </div>

                            <div class="card border border-base-200 hover:shadow-xl transition-shadow">
                              <div class="card-body p-5">
                                <h5 class="font-semibold text-lg mb-2">{t('premiumPack')}</h5>
                                <div class="text-2xl font-bold mb-3">1200<span class="text-sm font-normal text-base-content/70"> {t('credits')}</span></div>
                                <div class="text-lg font-semibold mb-4">$79.99</div>
                                <ul class="space-y-2 mb-4 text-sm">
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('validForOneYear')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('bestUnitPrice')}</li>
                                  <li class="flex items-center gap-2"><span class="text-success">✓</span> {t('exclusiveFeatures')}</li>
                                </ul>
                                <div class="card-actions">
                                  <button class="btn btn-ghost btn-sm w-full">{t('addToCart')}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="card bg-base-100 shadow-lg">
                        <div class="card-body p-6">
                          <h4 class="text-lg font-semibold mb-4">{t('recentTransactions')}</h4>
                          <div class="overflow-x-auto">
                            <table class="table">
                              <thead>
                                <tr>
                                  <th>{t('date')}</th>
                                  <th>{t('description')}</th>
                                  <th>{t('type')}</th>
                                  <th>{t('amount')}</th>
                                  <th>{t('status')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Jan 15, 2024</td>
                                  <td>{t('purchaseStandardPack')}</td>
                                  <td><span class="badge badge-success">{t('credit')}</span></td>
                                  <td>+500</td>
                                  <td><span class="badge badge-outline">{t('completed')}</span></td>
                                </tr>
                                <tr>
                                  <td>Dec 28, 2023</td>
                                  <td>{t('serviceUsage')}</td>
                                  <td><span class="badge badge-error">{t('debit')}</span></td>
                                  <td>-25</td>
                                  <td><span class="badge badge-outline">{t('completed')}</span></td>
                                </tr>
                                <tr>
                                  <td>Dec 15, 2023</td>
                                  <td>{t('purchaseBasicPack')}</td>
                                  <td><span class="badge badge-success">{t('credit')}</span></td>
                                  <td>+100</td>
                                  <td><span class="badge badge-outline">{t('completed')}</span></td>
                                </tr>
                                <tr>
                                  <td>Nov 30, 2023</td>
                                  <td>{t('serviceUsage')}</td>
                                  <td><span class="badge badge-error">{t('debit')}</span></td>
                                  <td>-42</td>
                                  <td><span class="badge badge-outline">{t('completed')}</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Match>

                {/* Other tabs follow similar pattern */}

                <Match when={true}>
                  <div class="flex text-base-content/50 items-center justify-center h-full w-full">
                    <div class="text-center py-12">
                      <h3 class="text-xl font-medium mb-2">{t('comingSoon')}</h3>
                      <p class="text-base-content/50">{activeTab()} {t('settingsAreUnderDevelopment')}</p>
                    </div>
                  </div>
                </Match>
              </Switch>
            </div>

            {/* Sticky bottom bar on mobile / save actions */}
            <div class="modal-action flex justify-end gap-3 p-2">
              <button class="btn btn-ghost" onClick={closeSettings}>
                {t('cancel')}
              </button>
              <button class="btn btn-primary min-w-[140px]" onClick={save}>
                {t('saveChanges')}
              </button>
            </div>
          </main>
        </div>

        {/* Close button – top right corner */}
        <button
          onClick={closeSettings}
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          aria-label="Close settings"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── Notification Settings Sub-component ─────────────────────────────────────
function NotificationSettings(props) {
  const [activeNotificationTab, setActiveNotificationTab] = createSignal('all');

  return (
    <div class="max-w-3xl flex flex-col">
      <div class="flex flex-col">
        <h3 class="text-2xl font-semibold">{props.t('notifications')}</h3>
        <p class="text-base-content/70 mb-6">{props.t('chooseWhatToBeNotifiedAbout')}</p>

        {/* Tabs */}
        <div class="tabs tabs-lifted mb-6">
          <button
            class={`tab ${activeNotificationTab() === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveNotificationTab('all')}
          >
            {props.t('all')}
          </button>
          <button
            class={`tab ${activeNotificationTab() === 'updates' ? 'tab-active' : ''}`}
            onClick={() => setActiveNotificationTab('updates')}
          >
            {props.t('updates')}
          </button>
          <button
            class={`tab ${activeNotificationTab() === 'messages' ? 'tab-active' : ''}`}
            onClick={() => setActiveNotificationTab('messages')}
          >
            {props.t('messages')}
          </button>
          <button
            class={`tab ${activeNotificationTab() === 'settings' ? 'tab-active' : ''}`}
            onClick={() => setActiveNotificationTab('settings')}
          >
            {props.t('settings')}
          </button>
        </div>
      </div>

      <div class="space-y-6 flex-1 overflow-y-auto pr-2 -mr-2">
        <Show when={activeNotificationTab() === 'all' || activeNotificationTab() === 'updates'}>
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body p-6">
              <h4 class="text-lg font-semibold mb-4">{props.t('updates')}</h4>
              <div class="space-y-4">
                <div class="flex items-start gap-4 p-4 bg-base-200/50 rounded-lg">
                  <div class="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div class="flex-1">
                    <h5 class="font-medium">{props.t('projectCompleted')}</h5>
                    <p class="text-sm text-base-content/70">{props.t('projectCompletedMessage')}</p>
                    <p class="text-xs text-base-content/50 mt-1">{props.t('twoHoursAgo')}</p>
                  </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-base-200/50 rounded-lg">
                  <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
                  <div class="flex-1">
                    <h5 class="font-medium">{props.t('newFeatureAvailable')}</h5>
                    <p class="text-sm text-base-content/70">{props.t('newFeatureAvailableMessage')}</p>
                    <p class="text-xs text-base-content/50 mt-1">{props.t('yesterday')}</p>
                  </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-base-200/50 rounded-lg">
                  <div class="w-2 h-2 rounded-full bg-warning mt-2"></div>
                  <div class="flex-1">
                    <h5 class="font-medium">{props.t('weeklyReportReady')}</h5>
                    <p class="text-sm text-base-content/70">{props.t('weeklyReportReadyMessage')}</p>
                    <p class="text-xs text-base-content/50 mt-1">{props.t('threeDaysAgo')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeNotificationTab() === 'all' || activeNotificationTab() === 'messages'}>
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body p-6">
              <h4 class="text-lg font-semibold mb-4">{props.t('messages')}</h4>
              <div class="space-y-4">
                <div class="flex items-start gap-4 p-4 bg-base-200/50 rounded-lg">
                  <div class="avatar">
                    <div class="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">
                      JD
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h5 class="font-medium">{props.t('johnDoe')}</h5>
                      <span class="badge badge-sm">{props.t('teamMember')}</span>
                    </div>
                    <p class="text-sm text-base-content/70">{props.t('reviewMockupsMessage')}</p>
                    <p class="text-xs text-base-content/50 mt-1">{props.t('tenMinutesAgo')}</p>
                  </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-base-200/50 rounded-lg">
                  <div class="avatar">
                    <div class="w-8 h-8 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-sm font-medium">
                      AS
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h5 class="font-medium">{props.t('alexSmith')}</h5>
                      <span class="badge badge-sm">{props.t('admin')}</span>
                    </div>
                    <p class="text-sm text-base-content/70">{props.t('meetingRescheduledMessage')}</p>
                    <p class="text-xs text-base-content/50 mt-1">{props.t('fortyFiveMinutesAgo')}</p>
                  </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-base-200/50 rounded-lg">
                  <div class="avatar">
                    <div class="w-8 h-8 rounded-full bg-accent text-accent-content flex items-center justify-center text-sm font-medium">
                      MJ
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h5 class="font-medium">{props.t('mariaJohnson')}</h5>
                      <span class="badge badge-sm">{props.t('client')}</span>
                    </div>
                    <p class="text-sm text-base-content/70">{props.t('thanksProposalMessage')}</p>
                    <p class="text-xs text-base-content/50 mt-1">{props.t('twoHoursAgo')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeNotificationTab() === 'settings'}>
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body p-6">
              <h4 class="text-lg font-semibold mb-4">{props.t('notificationSettings')}</h4>
              <div class="space-y-6">
                <div class="card bg-base-100 shadow-sm">
                  <div class="card-body p-6">
                    <h4 class="text-lg font-semibold mb-4">{props.t('emailNotifications')}</h4>
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="font-medium">{props.t('projectUpdates')}</h5>
                          <p class="text-sm text-base-content/60">{props.t('getNotifiedWhenProjectsCompleted')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={props.form.notifications.projectUpdates}
                          onChange={(e) => props.setForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              projectUpdates: e.currentTarget.checked
                            }
                          }))}
                          class="toggle toggle-primary"
                        />
                      </div>

                      <div class="divider"></div>

                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="font-medium">{props.t('weeklyReports')}</h5>
                          <p class="text-sm text-base-content/60">{props.t('receiveWeeklyActivitySummary')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={props.form.notifications.weeklyReports}
                          onChange={(e) => props.setForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              weeklyReports: e.currentTarget.checked
                            }
                          }))}
                          class="toggle toggle-primary"
                        />
                      </div>

                      <div class="divider"></div>

                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="font-medium">{props.t('securityAlerts')}</h5>
                          <p class="text-sm text-base-content/60">{props.t('getNotifiedAboutAccountSecurityEvents')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={props.form.notifications.securityAlerts}
                          onChange={(e) => props.setForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              securityAlerts: e.currentTarget.checked
                            }
                          }))}
                          class="toggle toggle-primary"
                        />
                      </div>

                      <div class="divider"></div>

                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="font-medium">{props.t('productUpdates')}</h5>
                          <p class="text-sm text-base-content/60">{props.t('stayInformedAboutNewFeatures')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={props.form.notifications.productUpdates}
                          onChange={(e) => props.setForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              productUpdates: e.currentTarget.checked
                            }
                          }))}
                          class="toggle toggle-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card bg-base-100 shadow-sm">
                  <div class="card-body p-6">
                    <h4 class="text-lg font-semibold mb-4">{props.t('browserNotifications')}</h4>
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="font-medium">{props.t('realTimeAlerts')}</h5>
                          <p class="text-sm text-base-content/60">{props.t('getInstantNotificationsInBrowser')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={props.form.notifications.realTimeAlerts}
                          onChange={(e) => props.setForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              realTimeAlerts: e.currentTarget.checked
                            }
                          }))}
                          class="toggle toggle-primary"
                        />
                      </div>

                      <div class="divider"></div>

                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="font-medium">{props.t('taskCompletion')}</h5>
                          <p class="text-sm text-base-content/60">{props.t('notifyWhenBackgroundTasksFinish')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={props.form.notifications.taskCompletion}
                          onChange={(e) => props.setForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              taskCompletion: e.currentTarget.checked
                            }
                          }))}
                          class="toggle toggle-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card bg-base-100 shadow-sm">
                  <div class="card-body p-6">
                    <h4 class="text-lg font-semibold mb-4">{props.t('notificationSchedule')}</h4>
                    <div class="space-y-4">
                      <div>
                        <label class="label">
                          <span class="label-text">{props.t('doNotDisturb')}</span>
                        </label>
                        <div class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={props.form.notifications.doNotDisturb}
                            onChange={(e) => props.setForm(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                doNotDisturb: e.currentTarget.checked
                              }
                            }))}
                            class="toggle toggle-primary"
                          />
                          <span>{props.t('enableQuietHours')}</span>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="label">
                            <span class="label-text">{props.t('from')}</span>
                          </label>
                          <input
                            type="time"
                            value={props.form.notifications.quietHours.from}
                            onChange={(e) => props.setForm(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                quietHours: {
                                  ...prev.notifications.quietHours,
                                  from: e.currentTarget.value
                                }
                              }
                            }))}
                            class="input input-bordered w-full"
                          />
                        </div>

                        <div>
                          <label class="label">
                            <span class="label-text">{props.t('to')}</span>
                          </label>
                          <input
                            type="time"
                            value={props.form.notifications.quietHours.to}
                            onChange={(e) => props.setForm(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                quietHours: {
                                  ...prev.notifications.quietHours,
                                  to: e.currentTarget.value
                                }
                              }
                            }))}
                            class="input input-bordered w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

// ─── Profile Settings Sub-component ─────────────────────────────────────
function ProfileSettings(props) {
  const { user } = useUser();

  return (
    <div class="max-w-3xl flex flex-col">
      <div class="flex flex-col">
        <h3 class="text-2xl font-semibold">{props.t('profile')}</h3>
        <p class="text-base-content/70 mb-6">{props.t('managePersonalInfo')}</p>
      </div>

      <div class="space-y-6 flex-1 overflow-y-auto pr-2 -mr-2">
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body p-6">
            <h4 class="text-lg font-semibold mb-6">{props.t('personalInformation')}</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('firstName')}</span>
                </label>
                <input
                  type="text"
                  value={props.form.profile?.firstName || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      firstName: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('enterFirstName')}
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('lastName')}</span>
                </label>
                <input
                  type="text"
                  value={props.form.profile?.lastName || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      lastName: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('enterLastName')}
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('emailAddress')}</span>
                </label>
                <input
                  type="email"
                  value={props.form.email || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    email: e.currentTarget.value
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('enterEmail')}
                />
                <div class="label-text-alt mt-2 text-base-content/60">We'll never share your email with anyone else.</div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('phoneNumber')}</span>
                </label>
                <input
                  type="tel"
                  value={props.form.profile?.phone || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      phone: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('enterPhone')}
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body p-6">
            <h4 class="text-lg font-semibold mb-6">{props.t('profilePicture')}</h4>

            <div class="flex items-start gap-6">
              <div class="avatar">
                <div class="w-20 h-20 rounded-full border-2 border-base-200">
                  <img
                    src={props.form.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHJlY3QgeD0iMiIgeT0iNiIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE0IiByeD0iMiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjwvc3ZnPg=='}
                    alt="Profile picture"
                  />
                </div>
              </div>

              <div class="flex-1">
                <p class="text-sm text-base-content/70 mb-3">Upload a photo to make your profile more recognizable</p>
                <div class="flex gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    class="file-input file-input-bordered w-full max-w-xs"
                  />
                  <button class="btn btn-ghost">Remove</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body p-6">
            <h4 class="text-lg font-semibold mb-6">{props.t('bioAndLocation')}</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <label class="label">
                  <span class="label-text font-medium">{props.t('bio')}</span>
                </label>
                <textarea
                  value={props.form.profile?.bio || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      bio: e.currentTarget.value
                    }
                  }))}
                  class="textarea textarea-bordered w-full h-24"
                  placeholder={props.t('tellUsAboutYourself')}
                ></textarea>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('location')}</span>
                </label>
                <input
                  type="text"
                  value={props.form.profile?.location || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      location: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('cityCountry')}
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('jobTitle')}</span>
                </label>
                <input
                  type="text"
                  value={props.form.profile?.jobTitle || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      jobTitle: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('yourPosition')}
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body p-6">
            <h4 class="text-lg font-semibold mb-6">{props.t('socialLinks')}</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('website')}</span>
                </label>
                <input
                  type="url"
                  value={props.form.profile?.website || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      website: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('websitePlaceholder')}
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">{props.t('linkedin')}</span>
                </label>
                <input
                  type="url"
                  value={props.form.profile?.linkedin || ''}
                  onChange={(e) => props.setForm(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      linkedin: e.currentTarget.value
                    }
                  }))}
                  class="input input-bordered w-full"
                  placeholder={props.t('linkedinPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── General Settings Sub-component ─────────────────────────────────────
function GeneralSettings(props) {

  const themeOptions = [
    { value: 'light',  label: () => props.t('lightTheme'),  icon: Sun },
    { value: 'dark',   label: () => props.t('darkTheme'),   icon: Moon },
    { value: 'system', label: () => props.t('autoTheme'), icon: Monitor },
  ];

  return (
    <div class="max-w-3xl flex flex-col">
      <div class="flex flex-col">
        <h3 class="text-2xl font-semibold mb-1">{props.t('general')}</h3>
        <p class="text-base-content/60 mb-6">{props.t('languageAppearancePrefs')}</p>
      </div>

      <div class="space-y-8 flex-1 overflow-y-auto pr-2 -mr-2">
        {/* Language */}
        <div class="form-control w-full flex justify-between">
          <label class="label">
            <span class="label-text font-medium">{props.t('interfaceLanguage')}</span>
          </label>
          <select
            class="select select-bordered w-full max-w-md"
            value={props.form.language}
            onChange={(e) => {
              const newLanguage = e.currentTarget.value;
              props.setForm(prev => ({ ...prev, language: newLanguage }));
              props.setLang(newLanguage); // Change language immediately
            }}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <div>
          <label class="label">
            <span class="label-text font-medium">{props.t('appearance')}</span>
          </label>

          <div class="grid grid-cols-3 gap-3 mt-3">
            <For each={themeOptions}>
              {(option) => (
                <button
                  type="button"
                  onClick={() => {
                    props.setForm(prev => ({ ...prev, theme: option.value }));
                    props.previewTheme(option.value); // Preview the theme change
                  }}
                  class={`
            group relative
            flex flex-col items-center gap-2.5
            p-4 rounded-xl
            border-2 border-transparent
            bg-base-200/40
            transition-all duration-200
            hover:bg-base-200/70
            focus:outline-none focus:ring-2 focus:ring-primary/40
            ${props.form.theme === option.value
                      ? 'border-primary/70 bg-primary/10 ring-2 ring-primary/40'
                      : 'hover:border-base-300/50'
                    }
          `}
                >
                  {/* icon preview */}
                  <div class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
                    <option.icon size={24} class="text-base-content/80" />
                  </div>

                  <span class="text-sm font-medium tracking-tight">
                    {option.label()}
                  </span>

                  {/* checkmark when selected */}
                  <Show when={props.form.theme === option.value}>
                    <div class="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                      <svg class="w-3 h-3 text-primary-content" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </Show>
                </button>
              )}
            </For>
          </div>
        </div>

        <section>
          <h4 class="text-xl font-semibold mb-4">{props.t('communicationPreferences')}</h4>
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body p-6 space-y-6">
              <div class="flex items-start justify-between gap-6">
                <div>
                  <div class="font-medium">Receive exclusive content & updates</div>
                  <div class="text-sm text-base-content/65 mt-1">
                    Get special offers, early feature access, success stories and product tips.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={props.form.notifications.exclusiveContent}
                  onChange={(e) =>
                    props.setForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, exclusiveContent: e.currentTarget.checked },
                    }))
                  }
                  class="toggle toggle-primary toggle-lg"
                />
              </div>

              <div class="divider" />

              <div class="flex items-start justify-between gap-6">
                <div>
                  <div class="font-medium">{props.t('emailQueuedTask')}</div>
                  <div class="text-sm text-base-content/65 mt-1">
                    Receive an email notification as soon as your task moves from queue to processing.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={props.form.notifications.taskStartEmail}
                  onChange={(e) =>
                    props.setForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, taskStartEmail: e.currentTarget.checked },
                    }))
                  }
                  class="toggle toggle-primary toggle-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Danger zone example */}
        <section class="pt-6 border-t border-error/20">
          <h4 class="text-lg font-semibold text-error mb-4">{props.t('dangerZone')}</h4>
          <button class="btn btn-ghost btn-error" onClick={props.deleteAccountFlow}>
            {props.t('deleteAccount')}
          </button>
        </section>
      </div>
    </div>
  );
}