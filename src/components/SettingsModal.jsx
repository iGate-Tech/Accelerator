import { createSignal, Show, For } from 'solid-js';
import { useUser } from '../context/UserContext';
import { useNavigate } from '@solidjs/router';
import { useLanguage } from '../hooks/useLanguage';
import { consentManager } from '@lib/auth/security.js';
import { toastManager } from '@lib/ui/feedback';
import { confirmDanger } from './GlobalConfirm';

/* ---------------- GLOBAL MODAL STATE ---------------- */

const [settingsModalState, setSettingsModalState] = createSignal(false);

export const openSettingsModal = () => setSettingsModalState(true);
export const closeSettingsModal = () => setSettingsModalState(false);

/* ---------------- COMPONENT ---------------- */

const SettingsModal = () => {
  const [activeTab, setActiveTab] = createSignal('general');
  const { user, logout, updateProfile, updatePreferences } = useUser();
  const { currentLang, t, setLang } = useLanguage();
  const navigate = useNavigate();

  const [preferencesForm, setPreferencesForm] = createSignal({
    notifications: {
      browser: false,
      projectUpdates: false,
    },
    theme: 'light',
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
    },
  });

  const [consents, setConsents] = createSignal({});

  const handleSignOut = async () => {
    await logout();
    navigate('/auth/login');
    closeSettingsModal();
  };

  const savePreferences = async () => {
    try {
      await updatePreferences(preferencesForm());
      toastManager.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toastManager.error('Preferences saved locally');
    }
  };

  const deleteAccount = async () => {
    const confirmed = await confirmDanger(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      'All your data, projects, and credits will be permanently removed.'
    );
    if (!confirmed) return;

    try {
      const { deleteUser } = await import('../lib/database');
      await deleteUser(user().id);
      localStorage.removeItem('userData');
      toastManager.success('Account deleted successfully');
      setTimeout(() => {
        navigate('/auth/login');
        closeSettingsModal();
      }, 1500);
    } catch (error) {
      console.error('Account deletion error:', error);
      localStorage.removeItem('userData');
      toastManager.success('Account deleted locally');
      setTimeout(() => {
        navigate('/auth/login');
        closeSettingsModal();
      }, 1500);
    }
  };

  // Initialize preferences when user data is available
  if (user()) {
    setPreferencesForm({
      notifications: {
        browser: user().preferences?.notifications?.browser ?? false,
        projectUpdates:
          user().preferences?.notifications?.projectUpdates ?? false,
      },
      theme: user().preferences?.theme ?? 'light',
      privacy: {
        profileVisibility:
          user().preferences?.privacy?.profileVisibility ?? 'private',
        dataSharing: user().preferences?.privacy?.dataSharing ?? false,
      },
    });
  }

  // Load consent preferences
  consentManager
    .getConsents()
    .then(userConsents => {
      setConsents(userConsents);
    })
    .catch(error => {
      console.error('Failed to load consents:', error);
    });

  return (
    <div class={`modal ${settingsModalState() ? 'modal-open' : ''}`}>
      <div class="modal-box w-full max-w-5xl p-0 sm:max-w-3xl">
        {/* LAYOUT - Mobile: Stacked, Desktop: Side-by-side */}
        <div class="flex h-[80vh] flex-col sm:h-[65vh]">
          {/* MOBILE TABS - Horizontal tabs at the top on mobile */}
          <div class="border-base-300 bg-base-200 overflow-x-auto border-b sm:hidden">
            <div class="flex space-x-1 py-2">
              <For
                each={[
                  ['general', 'General'],
                  ['notifications', 'Notifications'],
                  ['personalization', 'Personalization'],
                  ['profile', 'Profile'],
                  ['apps', 'Apps'],
                  ['billing', 'Billing'],
                  ['credits', 'Credits'],
                  ['packages', 'Packages'],
                  ['data', 'Data controls'],
                  ['security', 'Security'],
                  ['account', 'Account'],
                  ['signout', 'Sign Out'],
                ]}
              >
                {([key, label]) => (
                  <button
                    class={`btn btn-sm whitespace-nowrap ${activeTab() === key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                )}
              </For>
            </div>
          </div>
          {/* DESKTOP LAYOUT - Side-by-side */}
          <div class="hidden h-full flex-row sm:flex">
            {/* LEFT SIDEBAR - Shown as drawer on desktop */}
            <aside class="border-base-300 bg-base-200 w-[200px] border-r">
              <div
                class="overflow-y-auto"
                style={{ height: 'calc(65vh - 50px)' }}
              >
                <ul class="menu w-full gap-1 px-2">
                  <For
                    each={[
                      ['general', 'General'],
                      ['notifications', 'Notifications'],
                      ['personalization', 'Personalization'],
                      ['profile', 'Profile'],
                      ['apps', 'Apps'],
                      ['billing', 'Billing'],
                      ['credits', 'Credits'],
                      ['packages', 'Packages'],
                      ['data', 'Data controls'],
                      ['security', 'Security'],
                      ['account', 'Account'],
                      ['signout', 'Sign Out'],
                    ]}
                  >
                    {([key, label]) => (
                      <li class="w-full">
                        <a
                          classList={{ active: activeTab() === key }}
                          onClick={() => setActiveTab(key)}
                        >
                          {label}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </aside>

            {/* RIGHT CONTENT - Desktop */}
            <main
              class="flex-1 overflow-y-auto p-4 text-sm sm:px-4 sm:py-3"
              style={{
                'max-height': 'calc(65vh - 50px)',
                'min-height': '40vh',
              }}
            >
              {/* Desktop content will be dynamically shown based on activeTab */}

              {/* GENERAL TAB - Desktop */}
              <Show when={activeTab() === 'general'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    General
                  </h2>

                  {/* Appearance */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Appearance</span>
                    </div>
                    <details class="dropdown dropdown-end w-full sm:w-auto">
                      <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                        {preferencesForm().theme === 'dark'
                          ? 'Dark'
                          : preferencesForm().theme === 'light'
                            ? 'Light'
                            : 'System'}
                        <span class="opacity-60">▾</span>
                      </summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-36">
                        <li>
                          <a
                            onClick={() => {
                              setPreferencesForm({
                                ...preferencesForm(),
                                theme: 'dark',
                              });
                              document.documentElement.setAttribute(
                                'data-theme',
                                'dark'
                              );
                              localStorage.setItem('theme', 'dark');
                            }}
                          >
                            Dark
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() => {
                              setPreferencesForm({
                                ...preferencesForm(),
                                theme: 'light',
                              });
                              document.documentElement.setAttribute(
                                'data-theme',
                                'light'
                              );
                              localStorage.setItem('theme', 'light');
                            }}
                          >
                            Light
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() => {
                              setPreferencesForm({
                                ...preferencesForm(),
                                theme: 'auto',
                              });
                              const systemPrefersDark = window.matchMedia(
                                '(prefers-color-scheme: dark)'
                              ).matches;
                              document.documentElement.setAttribute(
                                'data-theme',
                                systemPrefersDark ? 'dark' : 'light'
                              );
                              localStorage.setItem('theme', 'auto');
                            }}
                          >
                            System
                          </a>
                        </li>
                      </ul>
                    </details>
                  </div>

                  {/* Accent Color */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Accent color</span>
                    </div>
                    <details class="dropdown dropdown-end w-full sm:w-auto">
                      <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                        Blue
                        <span class="opacity-60">▾</span>
                      </summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-36">
                        <li>
                          <a>Blue</a>
                        </li>
                        <li>
                          <a>Green</a>
                        </li>
                        <li>
                          <a>Purple</a>
                        </li>
                      </ul>
                    </details>
                  </div>

                  {/* Language */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Language</span>
                    </div>
                    <details class="dropdown dropdown-end w-full sm:w-auto">
                      <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                        {currentLang() === 'en'
                          ? 'English'
                          : currentLang() === 'ar'
                            ? 'Arabic'
                            : 'Auto-detect'}
                        <span class="opacity-60">▾</span>
                      </summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-44">
                        <li>
                          <a onClick={() => setLang('en')}>English</a>
                        </li>
                        <li>
                          <a onClick={() => setLang('ar')}>Arabic</a>
                        </li>
                        <li>
                          <a onClick={() => setLang('ur')}>Urdu</a>
                        </li>
                      </ul>
                    </details>
                  </div>

                  {/* Spoken language */}
                  <div class="border-base-300 border-b py-3">
                    <div class="flex min-h-[50px] flex-col items-start justify-between sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Spoken language</span>
                      </div>
                      <details class="dropdown dropdown-end w-full sm:w-auto">
                        <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                          Auto-detect
                          <span class="opacity-60">▾</span>
                        </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-44">
                          <li>
                            <a>English</a>
                          </li>
                          <li>
                            <a>Arabic</a>
                          </li>
                        </ul>
                      </details>
                    </div>
                    <p class="mt-2 text-xs opacity-60">
                      For best results, select the language you mainly speak.
                    </p>
                  </div>

                  {/* Voice */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Voice</span>
                    </div>
                    <div class="flex w-full items-center gap-2 sm:w-auto">
                      <button class="btn btn-sm btn-secondary w-full sm:w-auto">
                        ▶ Play
                      </button>
                      <details class="dropdown dropdown-end w-full sm:w-auto">
                        <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                          Cove
                          <span class="opacity-60">▾</span>
                        </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-36">
                          <li>
                            <a>Cove</a>
                          </li>
                          <li>
                            <a>Alloy</a>
                          </li>
                          <li>
                            <a>Echo</a>
                          </li>
                        </ul>
                      </details>
                    </div>
                  </div>

                  {/* Separate Voice */}
                  <div class="py-3">
                    <div class="flex min-h-[50px] flex-col items-start justify-between sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Separate Voice</span>
                      </div>
                      <input type="checkbox" class="toggle toggle-sm" />
                    </div>
                    <p class="mt-2 text-xs opacity-60">
                      Keep ChatGPT Voice in a separate fullscreen without
                      transcripts.
                    </p>
                  </div>
                </section>
              </Show>

              {/* NOTIFICATIONS TAB - Desktop */}
              <Show when={activeTab() === 'notifications'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Notifications
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Browser notifications</span>
                        <p class="text-xs opacity-60">
                          Receive notifications in your browser
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm"
                        checked={preferencesForm().notifications.browser}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            notifications: {
                              ...preferencesForm().notifications,
                              browser: e.target.checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Project updates</span>
                        <p class="text-xs opacity-60">
                          Get notified when your projects are updated
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm"
                        checked={preferencesForm().notifications.projectUpdates}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            notifications: {
                              ...preferencesForm().notifications,
                              projectUpdates: e.target.checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Weekly digest</span>
                        <p class="text-xs opacity-60">
                          Receive a weekly summary of your activity
                        </p>
                      </div>
                      <input type="checkbox" class="toggle toggle-sm" />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">New features</span>
                        <p class="text-xs opacity-60">
                          Be notified when new features are released
                        </p>
                      </div>
                      <input type="checkbox" class="toggle toggle-sm" />
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-primary btn-sm w-full sm:w-auto"
                      onClick={savePreferences}
                    >
                      Save Notification Settings
                    </button>
                  </div>
                </section>
              </Show>

              {/* PERSONALIZATION TAB - Desktop */}
              <Show when={activeTab() === 'personalization'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Personalization
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Profile visibility</span>
                        <p class="text-xs opacity-60">
                          Who can see your profile
                        </p>
                      </div>
                      <select
                        class="select select-sm select-bordered mt-2 w-full sm:mt-0 sm:w-32"
                        value={preferencesForm().privacy.profileVisibility}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            privacy: {
                              ...preferencesForm().privacy,
                              profileVisibility: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="private">Private</option>
                        <option value="friends">Friends</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Data sharing</span>
                        <p class="text-xs opacity-60">
                          Allow sharing of anonymized data to improve service
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked={preferencesForm().privacy.dataSharing}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            privacy: {
                              ...preferencesForm().privacy,
                              dataSharing: e.target.checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">
                          Personalized recommendations
                        </span>
                        <p class="text-xs opacity-60">
                          Show personalized content based on your usage
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Custom dashboard layout</span>
                        <p class="text-xs opacity-60">
                          Enable customizing your dashboard widgets
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-primary btn-sm w-full sm:w-auto"
                      onClick={savePreferences}
                    >
                      Save Personalization Settings
                    </button>
                  </div>
                </section>
              </Show>

              {/* PROFILE TAB - Desktop */}
              <Show when={activeTab() === 'profile'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Profile
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Profile picture</span>
                        <p class="text-xs opacity-60">
                          Upload a photo to personalize your account
                        </p>
                      </div>
                      <div class="mt-2 flex items-center gap-2 sm:mt-0">
                        <img
                          src={user()?.avatar || '/default-avatar.png'}
                          alt="Profile"
                          class="border-base-300 h-10 w-10 rounded-full border object-cover"
                        />
                        <button class="btn btn-outline btn-sm">Change</button>
                      </div>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Display name</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.name || 'Not set'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Bio</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.bio || 'Tell people about yourself'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Location</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.location || 'Not specified'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Website</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.website || 'Not specified'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>
                  </div>
                </section>
              </Show>

              {/* APPS TAB - Desktop */}
              <Show when={activeTab() === 'apps'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Apps
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Mobile app sync</span>
                        <p class="text-xs opacity-60">
                          Sync data with mobile applications
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Desktop app integration</span>
                        <p class="text-xs opacity-60">
                          Enable integration with desktop applications
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">
                          Third-party integrations
                        </span>
                        <p class="text-xs opacity-60">
                          Connect with external services and tools
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">API access</span>
                        <p class="text-xs opacity-60">
                          Enable API access for custom integrations
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>
                  </div>

                  <div class="mt-6">
                    <button class="btn btn-primary btn-sm w-full sm:w-auto">
                      Manage Connected Apps
                    </button>
                  </div>
                </section>
              </Show>

              {/* BILLING TAB - Desktop */}
              <Show when={activeTab() === 'billing'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Billing
                  </h2>

                  <div class="space-y-4">
                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Current Plan</h3>
                      <p class="mb-3 text-sm opacity-70">
                        {user()?.subscription?.plan || 'Free'} Plan
                      </p>
                      <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <span class="text-lg font-semibold">
                          ${user()?.subscription?.price || 0}/month
                        </span>
                        <button class="btn btn-primary btn-sm w-full sm:w-auto">
                          Change Plan
                        </button>
                      </div>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Payment Method</h3>
                      <p class="mb-3 text-sm opacity-70">
                        **** **** **** {user()?.paymentInfo?.last4 || '1234'}
                      </p>
                      <button class="btn btn-outline btn-sm w-full sm:w-auto">
                        Update Payment
                      </button>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Billing History</h3>
                      <p class="mb-3 text-sm opacity-70">
                        View your past invoices and payments
                      </p>
                      <button class="btn btn-outline btn-sm w-full sm:w-auto">
                        View History
                      </button>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Auto-renewal</h3>
                      <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <p class="text-sm opacity-70">
                          Automatically renew your subscription
                        </p>
                        <input
                          type="checkbox"
                          class="toggle toggle-sm mt-1 sm:mt-0"
                          checked={user()?.subscription?.autoRenew}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </Show>

              {/* CREDITS TAB - Desktop */}
              <Show when={activeTab() === 'credits'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Credits
                  </h2>

                  <div class="space-y-4">
                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Current Balance</h3>
                      <p class="text-primary mb-3 text-2xl font-bold">
                        {user()?.credits?.balance || 0} credits
                      </p>
                      <p class="text-sm opacity-70">
                        Used{' '}
                        {user()?.credits?.transactions?.filter(
                          t => t.amount < 0
                        )?.length || 0}{' '}
                        of {user()?.subscription?.maxCredits || 100} monthly
                        credits
                      </p>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Purchase More Credits</h3>
                      <p class="mb-3 text-sm opacity-70">
                        Buy additional credits for AI features
                      </p>
                      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button class="btn btn-outline btn-sm w-full">
                          100 credits - $5
                        </button>
                        <button class="btn btn-outline btn-sm w-full">
                          500 credits - $20
                        </button>
                        <button class="btn btn-outline btn-sm w-full">
                          1000 credits - $35
                        </button>
                      </div>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Recent Transactions</h3>
                      <div class="overflow-x-auto">
                        <table class="table-compact table w-full">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Description</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user()
                              ?.credits?.transactions?.slice(0, 5)
                              .map(transaction => (
                                <tr>
                                  <td>
                                    {new Date(
                                      transaction.date
                                    ).toLocaleDateString()}
                                  </td>
                                  <td>{transaction.description}</td>
                                  <td
                                    class={
                                      transaction.amount > 0
                                        ? 'text-success'
                                        : 'text-error'
                                    }
                                  >
                                    {transaction.amount > 0 ? '+' : ''}
                                    {transaction.amount}
                                  </td>
                                </tr>
                              )) || (
                              <tr>
                                <td colspan="3" class="text-center">
                                  No transactions yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
              </Show>

              {/* PACKAGES TAB - Desktop */}
              <Show when={activeTab() === 'packages'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Packages
                  </h2>

                  <div class="space-y-4">
                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Available Packages</h3>
                      <p class="mb-4 text-sm opacity-70">
                        Choose a package that fits your needs
                      </p>

                      <div class="grid grid-cols-1 gap-4">
                        <div class="card bg-base-200 border-primary border p-4">
                          <h4 class="text-lg font-bold">Starter</h4>
                          <p class="my-2 text-2xl font-bold">
                            $0<span class="text-sm font-normal">/month</span>
                          </p>
                          <ul class="mb-4 space-y-1 text-sm">
                            <li>• 100 credits/month</li>
                            <li>• Basic features</li>
                            <li>• Community support</li>
                          </ul>
                          <button class="btn btn-outline btn-sm w-full">
                            Current Plan
                          </button>
                        </div>

                        <div class="card bg-base-200 border-primary border-2 p-4">
                          <h4 class="text-lg font-bold">Professional</h4>
                          <p class="my-2 text-2xl font-bold">
                            $19<span class="text-sm font-normal">/month</span>
                          </p>
                          <ul class="mb-4 space-y-1 text-sm">
                            <li>• 1000 credits/month</li>
                            <li>• Advanced features</li>
                            <li>• Priority support</li>
                            <li>• Early access</li>
                          </ul>
                          <button class="btn btn-primary btn-sm w-full">
                            Upgrade
                          </button>
                        </div>

                        <div class="card bg-base-200 border-primary border p-4">
                          <h4 class="text-lg font-bold">Enterprise</h4>
                          <p class="my-2 text-2xl font-bold">
                            $49<span class="text-sm font-normal">/month</span>
                          </p>
                          <ul class="mb-4 space-y-1 text-sm">
                            <li>• 5000 credits/month</li>
                            <li>• All features</li>
                            <li>• 24/7 support</li>
                            <li>• Custom integrations</li>
                          </ul>
                          <button class="btn btn-outline btn-sm w-full">
                            Contact Sales
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Compare Plans</h3>
                      <p class="mb-3 text-sm opacity-70">
                        See detailed comparison of all features
                      </p>
                      <button class="btn btn-outline btn-sm w-full sm:w-auto">
                        View Comparison
                      </button>
                    </div>
                  </div>
                </section>
              </Show>

              {/* DATA CONTROLS TAB - Desktop */}
              <Show when={activeTab() === 'data'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Data Controls
                  </h2>

                  <div class="space-y-4">
                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Export your data</h3>
                      <p class="mb-3 text-sm opacity-70">
                        Download a copy of your personal data
                      </p>
                      <button class="btn btn-outline btn-sm w-full sm:w-auto">
                        Export Data
                      </button>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Delete your account</h3>
                      <p class="mb-3 text-sm opacity-70">
                        Permanently delete your account and all associated data
                      </p>
                      <button class="btn btn-error btn-sm w-full sm:w-auto">
                        Delete Account
                      </button>
                    </div>

                    <div class="card bg-base-100 p-4">
                      <h3 class="mb-2 font-medium">Cookie preferences</h3>
                      <p class="mb-3 text-sm opacity-70">
                        Manage your cookie and privacy settings
                      </p>
                      <div class="mt-3 space-y-3">
                        <div class="bg-base-200 flex flex-col items-start justify-between gap-2 rounded p-2 sm:flex-row sm:items-center">
                          <div class="mb-1 sm:mb-0">
                            <span class="font-medium">Necessary</span>
                            <p class="text-xs opacity-60">
                              Essential for basic functionality
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked
                            disabled
                          />
                        </div>

                        <div class="bg-base-200 flex flex-col items-start justify-between gap-2 rounded p-2 sm:flex-row sm:items-center">
                          <div class="mb-1 sm:mb-0">
                            <span class="font-medium">Analytics</span>
                            <p class="text-xs opacity-60">
                              Help us improve our services
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={consents().analytics || false}
                            onChange={async e => {
                              try {
                                const updated =
                                  await consentManager.updateConsents({
                                    analytics: e.target.checked,
                                  });
                                setConsents(updated);
                                toastManager.success(
                                  'Consent preferences updated'
                                );
                              } catch (error) {
                                toastManager.error('Failed to update consent');
                              }
                            }}
                          />
                        </div>

                        <div class="bg-base-200 flex flex-col items-start justify-between gap-2 rounded p-2 sm:flex-row sm:items-center">
                          <div class="mb-1 sm:mb-0">
                            <span class="font-medium">Marketing</span>
                            <p class="text-xs opacity-60">
                              Personalized recommendations
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={consents().marketing || false}
                            onChange={async e => {
                              try {
                                const updated =
                                  await consentManager.updateConsents({
                                    marketing: e.target.checked,
                                  });
                                setConsents(updated);
                                toastManager.success(
                                  'Consent preferences updated'
                                );
                              } catch (error) {
                                toastManager.error('Failed to update consent');
                              }
                            }}
                          />
                        </div>

                        <div class="bg-base-200 flex flex-col items-start justify-between gap-2 rounded p-2 sm:flex-row sm:items-center">
                          <div class="mb-1 sm:mb-0">
                            <span class="font-medium">Preferences</span>
                            <p class="text-xs opacity-60">
                              Remember your settings
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={consents().preferences || false}
                            onChange={async e => {
                              try {
                                const updated =
                                  await consentManager.updateConsents({
                                    preferences: e.target.checked,
                                  });
                                setConsents(updated);
                                toastManager.success(
                                  'Consent preferences updated'
                                );
                              } catch (error) {
                                toastManager.error('Failed to update consent');
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </Show>

              {/* SECURITY TAB - Desktop */}
              <Show when={activeTab() === 'security'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Security
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">
                          Two-factor authentication
                        </span>
                        <p class="text-xs opacity-60">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Login alerts</span>
                        <p class="text-xs opacity-60">
                          Get notified when your account is accessed
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Password reset</span>
                        <p class="text-xs opacity-60">
                          Change your account password
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Change
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Active sessions</span>
                        <p class="text-xs opacity-60">
                          View and manage devices logged into your account
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        View
                      </button>
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-error btn-sm w-full sm:w-auto"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </section>
              </Show>

              {/* ACCOUNT TAB - Desktop */}
              <Show when={activeTab() === 'account'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Account
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Account email</span>
                        <p class="text-xs opacity-60">
                          {user()?.email || 'Not set'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Change
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Account name</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.name || 'Not set'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Subscription</span>
                        <p class="text-xs opacity-60">
                          {user()?.subscription?.plan || 'Free'} plan
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Manage
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Storage</span>
                        <p class="text-xs opacity-60">Used: 120 MB of 1 GB</p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-error btn-sm w-full sm:w-auto"
                      onClick={deleteAccount}
                    >
                      Delete Account
                    </button>
                  </div>
                </section>
              </Show>

              {/* SIGN OUT TAB - Desktop */}
              <Show when={activeTab() === 'signout'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Sign Out
                  </h2>

                  <div class="card bg-warning/10 border-warning mb-4 border p-4">
                    <div class="flex flex-col items-start sm:flex-row">
                      <i class="fas fa-exclamation-triangle text-warning mt-0.5 mr-3 mb-2 text-xl sm:mb-0" />
                      <div>
                        <h3 class="text-warning font-bold">Sign Out Warning</h3>
                        <p class="text-sm">
                          You will be logged out of your current session. You'll
                          need to log back in to access your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Current session</span>
                        <p class="text-xs opacity-60">
                          You are currently logged in as {user()?.email}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        View Details
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Remember me</span>
                        <p class="text-xs opacity-60">
                          Keep me logged in on this device
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked
                      />
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-error w-full"
                      onClick={handleSignOut}
                    >
                      Sign Out of All Devices
                    </button>
                    <p class="mt-2 text-center text-xs opacity-60">
                      This will sign you out of all devices and browsers
                    </p>
                  </div>
                </section>
              </Show>
            </main>
          </div>{' '}
          {/* End desktop layout */}
          {/* MOBILE CONTENT AREA - Visible only on mobile */}
          <div class="sm:hidden">
            <main
              class="overflow-y-auto p-4 text-sm"
              style={{
                'max-height': 'calc(80vh - 100px)',
                'min-height': '40vh',
              }}
            >
              {/* Mobile content will be dynamically shown based on activeTab */}

              {/* GENERAL TAB - Mobile */}
              <Show when={activeTab() === 'general'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    General
                  </h2>

                  {/* Appearance */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Appearance</span>
                    </div>
                    <details class="dropdown dropdown-end w-full sm:w-auto">
                      <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                        {preferencesForm().theme === 'dark'
                          ? 'Dark'
                          : preferencesForm().theme === 'light'
                            ? 'Light'
                            : 'System'}
                        <span class="opacity-60">▾</span>
                      </summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-36">
                        <li>
                          <a
                            onClick={() => {
                              setPreferencesForm({
                                ...preferencesForm(),
                                theme: 'dark',
                              });
                              document.documentElement.setAttribute(
                                'data-theme',
                                'dark'
                              );
                              localStorage.setItem('theme', 'dark');
                            }}
                          >
                            Dark
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() => {
                              setPreferencesForm({
                                ...preferencesForm(),
                                theme: 'light',
                              });
                              document.documentElement.setAttribute(
                                'data-theme',
                                'light'
                              );
                              localStorage.setItem('theme', 'light');
                            }}
                          >
                            Light
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() => {
                              setPreferencesForm({
                                ...preferencesForm(),
                                theme: 'auto',
                              });
                              const systemPrefersDark = window.matchMedia(
                                '(prefers-color-scheme: dark)'
                              ).matches;
                              document.documentElement.setAttribute(
                                'data-theme',
                                systemPrefersDark ? 'dark' : 'light'
                              );
                              localStorage.setItem('theme', 'auto');
                            }}
                          >
                            System
                          </a>
                        </li>
                      </ul>
                    </details>
                  </div>

                  {/* Accent Color */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Accent color</span>
                    </div>
                    <details class="dropdown dropdown-end w-full sm:w-auto">
                      <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                        Blue
                        <span class="opacity-60">▾</span>
                      </summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-36">
                        <li>
                          <a>Blue</a>
                        </li>
                        <li>
                          <a>Green</a>
                        </li>
                        <li>
                          <a>Purple</a>
                        </li>
                      </ul>
                    </details>
                  </div>

                  {/* Language */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Language</span>
                    </div>
                    <details class="dropdown dropdown-end w-full sm:w-auto">
                      <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                        {currentLang() === 'en'
                          ? 'English'
                          : currentLang() === 'ar'
                            ? 'Arabic'
                            : 'Auto-detect'}
                        <span class="opacity-60">▾</span>
                      </summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-44">
                        <li>
                          <a onClick={() => setLang('en')}>English</a>
                        </li>
                        <li>
                          <a onClick={() => setLang('ar')}>Arabic</a>
                        </li>
                        <li>
                          <a onClick={() => setLang('ur')}>Urdu</a>
                        </li>
                      </ul>
                    </details>
                  </div>

                  {/* Spoken language */}
                  <div class="border-base-300 border-b py-3">
                    <div class="flex min-h-[50px] flex-col items-start justify-between sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Spoken language</span>
                      </div>
                      <details class="dropdown dropdown-end w-full sm:w-auto">
                        <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                          Auto-detect
                          <span class="opacity-60">▾</span>
                        </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-44">
                          <li>
                            <a>English</a>
                          </li>
                          <li>
                            <a>Arabic</a>
                          </li>
                        </ul>
                      </details>
                    </div>
                    <p class="mt-2 text-xs opacity-60">
                      For best results, select the language you mainly speak.
                    </p>
                  </div>

                  {/* Voice */}
                  <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b py-3 sm:flex-row sm:items-center">
                    <div class="mb-2 sm:mb-0">
                      <span class="font-medium">Voice</span>
                    </div>
                    <div class="flex w-full items-center gap-2 sm:w-auto">
                      <button class="btn btn-sm btn-secondary w-full sm:w-auto">
                        ▶ Play
                      </button>
                      <details class="dropdown dropdown-end w-full sm:w-auto">
                        <summary class="btn btn-sm btn-ghost w-full sm:w-auto">
                          Cove
                          <span class="opacity-60">▾</span>
                        </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box w-full shadow sm:w-36">
                          <li>
                            <a>Cove</a>
                          </li>
                          <li>
                            <a>Alloy</a>
                          </li>
                          <li>
                            <a>Echo</a>
                          </li>
                        </ul>
                      </details>
                    </div>
                  </div>

                  {/* Separate Voice */}
                  <div class="py-3">
                    <div class="flex min-h-[50px] flex-col items-start justify-between sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Separate Voice</span>
                      </div>
                      <input type="checkbox" class="toggle toggle-sm" />
                    </div>
                    <p class="mt-2 text-xs opacity-60">
                      Keep ChatGPT Voice in a separate fullscreen without
                      transcripts.
                    </p>
                  </div>
                </section>
              </Show>

              {/* NOTIFICATIONS TAB - Mobile */}
              <Show when={activeTab() === 'notifications'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Notifications
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Browser notifications</span>
                        <p class="text-xs opacity-60">
                          Receive notifications in your browser
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm"
                        checked={preferencesForm().notifications.browser}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            notifications: {
                              ...preferencesForm().notifications,
                              browser: e.target.checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Project updates</span>
                        <p class="text-xs opacity-60">
                          Get notified when your projects are updated
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm"
                        checked={preferencesForm().notifications.projectUpdates}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            notifications: {
                              ...preferencesForm().notifications,
                              projectUpdates: e.target.checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Weekly digest</span>
                        <p class="text-xs opacity-60">
                          Receive a weekly summary of your activity
                        </p>
                      </div>
                      <input type="checkbox" class="toggle toggle-sm" />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">New features</span>
                        <p class="text-xs opacity-60">
                          Be notified when new features are released
                        </p>
                      </div>
                      <input type="checkbox" class="toggle toggle-sm" />
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-primary btn-sm w-full sm:w-auto"
                      onClick={savePreferences}
                    >
                      Save Notification Settings
                    </button>
                  </div>
                </section>
              </Show>

              {/* Include other mobile tabs as needed */}
              {/* For brevity, I'll include the most important ones */}

              {/* Personalization Tab - Mobile */}
              <Show when={activeTab() === 'personalization'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Personalization
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Profile visibility</span>
                        <p class="text-xs opacity-60">
                          Who can see your profile
                        </p>
                      </div>
                      <select
                        class="select select-sm select-bordered mt-2 w-full sm:mt-0 sm:w-32"
                        value={preferencesForm().privacy.profileVisibility}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            privacy: {
                              ...preferencesForm().privacy,
                              profileVisibility: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="private">Private</option>
                        <option value="friends">Friends</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Data sharing</span>
                        <p class="text-xs opacity-60">
                          Allow sharing of anonymized data to improve service
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked={preferencesForm().privacy.dataSharing}
                        onChange={e =>
                          setPreferencesForm({
                            ...preferencesForm(),
                            privacy: {
                              ...preferencesForm().privacy,
                              dataSharing: e.target.checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">
                          Personalized recommendations
                        </span>
                        <p class="text-xs opacity-60">
                          Show personalized content based on your usage
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Custom dashboard layout</span>
                        <p class="text-xs opacity-60">
                          Enable customizing your dashboard widgets
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-primary btn-sm w-full sm:w-auto"
                      onClick={savePreferences}
                    >
                      Save Personalization Settings
                    </button>
                  </div>
                </section>
              </Show>

              {/* Profile Tab - Mobile */}
              <Show when={activeTab() === 'profile'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Profile
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Profile picture</span>
                        <p class="text-xs opacity-60">
                          Upload a photo to personalize your account
                        </p>
                      </div>
                      <div class="mt-2 flex items-center gap-2 sm:mt-0">
                        <img
                          src={user()?.avatar || '/default-avatar.png'}
                          alt="Profile"
                          class="border-base-300 h-10 w-10 rounded-full border object-cover"
                        />
                        <button class="btn btn-outline btn-sm">Change</button>
                      </div>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Display name</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.name || 'Not set'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Bio</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.bio || 'Tell people about yourself'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Location</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.location || 'Not specified'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Website</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.website || 'Not specified'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 sm:mt-0">
                        Edit
                      </button>
                    </div>
                  </div>
                </section>
              </Show>

              {/* Security Tab - Mobile */}
              <Show when={activeTab() === 'security'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Security
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">
                          Two-factor authentication
                        </span>
                        <p class="text-xs opacity-60">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Login alerts</span>
                        <p class="text-xs opacity-60">
                          Get notified when your account is accessed
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-sm mt-2 sm:mt-0"
                        checked
                      />
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Password reset</span>
                        <p class="text-xs opacity-60">
                          Change your account password
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Change
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Active sessions</span>
                        <p class="text-xs opacity-60">
                          View and manage devices logged into your account
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        View
                      </button>
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-error btn-sm w-full sm:w-auto"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </section>
              </Show>

              {/* Account Tab - Mobile */}
              <Show when={activeTab() === 'account'}>
                <section class="w-full max-w-2xl">
                  <h2 class="border-base-300 mb-4 border-b pb-3 text-lg font-semibold">
                    Account
                  </h2>

                  <div class="space-y-4">
                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Account email</span>
                        <p class="text-xs opacity-60">
                          {user()?.email || 'Not set'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Change
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Account name</span>
                        <p class="text-xs opacity-60">
                          {user()?.profile?.name || 'Not set'}
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Edit
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Subscription</span>
                        <p class="text-xs opacity-60">
                          {user()?.subscription?.plan || 'Free'} plan
                        </p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Manage
                      </button>
                    </div>

                    <div class="border-base-300 flex min-h-[60px] flex-col items-start justify-between border-b pb-3 sm:flex-row sm:items-center">
                      <div class="mb-2 sm:mb-0">
                        <span class="font-medium">Storage</span>
                        <p class="text-xs opacity-60">Used: 120 MB of 1 GB</p>
                      </div>
                      <button class="btn btn-outline btn-sm mt-2 w-full sm:mt-0 sm:w-auto">
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div class="mt-6">
                    <button
                      class="btn btn-error btn-sm w-full sm:w-auto"
                      onClick={deleteAccount}
                    >
                      Delete Account
                    </button>
                  </div>
                </section>
              </Show>
            </main>
          </div>{' '}
          {/* End mobile content area */}
        </div>
      </div>

      {/* BACKDROP */}
      <form
        method="dialog"
        class="modal-backdrop"
        onSubmit={closeSettingsModal}
      >
        <button />
      </form>
    </div>
  );
};

export default SettingsModal;
