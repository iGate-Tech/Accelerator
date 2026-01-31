import { createSignal, Show, For, Switch, Match, createEffect } from 'solid-js';
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
  X,
  CreditCard,
  ChevronDown,
  ChevronRight,
  User,
  Database,
  Shield,
  ShieldCheck,
  LifeBuoy,
  Check,
  Bot,
  BarChart2,
  FileText,
  Code2,
  MessageSquare,
  Image,
  Table,
  Layers,
  HardDrive,
  Cloud,
  Folder,
  UploadCloud,
  Mail,
  MessageCircle,
  Video,
  Mic,
  Trello,
  Layout,
  ListChecks,
  GitBranch,
  Users,
  Send,
  MailOpen,
  BookOpen,
  PlayCircle,
  FileCode,
  ScrollText,
  Key,
  HelpCircle,
  Crown,
  Eye,
  Calendar,
  Clock,
  BellOff,
  MailCheck,
  Globe,
  Lock,
  EyeOff,
} from 'lucide-solid';

const tabs = [
  { id: 'general', label: { en: 'General', ar: 'عام' }, icon: Settings },
  { id: 'profile', label: { en: 'Profile', ar: 'الملف الشخصي' }, icon: UserRound },
  { id: 'notifications', label: { en: 'Notifications', ar: 'الإشعارات' }, icon: Bell },
  { id: 'billing', label: { en: 'Plans & Billing', ar: 'الخطط والفوترة' }, icon: CalendarDays },
  { id: 'credits', label: { en: 'Buy Credits', ar: 'شراء الرصيد' }, icon: CreditCard },
  { id: 'workspace', label: { en: 'Workspace', ar: 'مساحة العمل' }, icon: PanelTop },
  { id: 'apps', label: { en: 'Apps & Skills', ar: 'التطبيقات والمهارات' }, icon: Puzzle },
  { id: 'connectors', label: { en: 'Connectors', ar: 'المتصلات' }, icon: Cable },
  { id: 'integrations', label: { en: 'Integrations', ar: 'التكاملات' }, icon: Plug },
  { id: 'data', label: { en: 'Data Control', ar: 'التحكم بالبيانات' }, icon: Database },
  { id: 'security', label: { en: 'Security', ar: 'الأمن' }, icon: Shield },
  { id: 'roles', label: { en: 'Roles & Governance', ar: 'الأدوار والحوكمة' }, icon: ShieldCheck },
  { id: 'help', label: { en: 'Help', ar: 'المساعدة' }, icon: LifeBuoy },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const timeFormats = [
  { value: '12-hour', label: '12-hour' },
  { value: '24-hour', label: '24-hour' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

function DropdownButton(props) {
  return (
    <button
      class="btn btn-ghost text-base-content flex gap-2 font-normal"
      onClick={e => {
        e.stopPropagation();
        props.onToggle?.();
      }}
    >
      <span class="dropdown-text font-normal">{props.selectedLabel}</span>
      <ChevronDown class="h-4 w-4" />
    </button>
  );
}

function DropdownMenu(props) {
  return (
    <ul
      class="dropdown menu rounded-box bg-base-100 text-base-content border-base-300 absolute z-10 w-40 border shadow-sm"
      classList={{ hidden: !props.isOpen }}
    >
      <For each={props.options}>
        {option => (
          <li>
            <a
              class="cursor-pointer hover:bg-base-200"
              classList={{ active: props.selectedValue === option.value }}
              onClick={e => {
                e.stopPropagation();
                props.onSelect?.(option);
              }}
            >
              {option.label}
            </a>
          </li>
        )}
      </For>
    </ul>
  );
}

function Toggle(props) {
  return (
    <label class="swap swap-rotate">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={e => props.onChange?.(e.target.checked)}
      />
      <svg
        class="swap-on text-primary h-6 w-6 fill-current"
        xmlns="http://www.w3.org/2000/svg"
        viewbox="0 0 24 24"
      >
        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
      </svg>
      <svg
        class="swap-off text-base-content h-6 w-6 fill-current"
        xmlns="http://www.w3.org/2000/svg"
        viewbox="0 0 24 24"
      >
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
    </label>
  );
}

// Global state for settings modal
const [settingsModalState, setSettingsModalState] = createSignal({
  isOpen: false,
});

// Export function to open the modal from anywhere
export const openSettings = () => {
  setSettingsModalState({
    isOpen: true,
  });
};

export default function SettingsModal() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const [activeTab, setActiveTab] = createSignal('general');
  const [activeNotificationTab, setActiveNotificationTab] = createSignal('all');

  const [languageOpen, setLanguageOpen] = createSignal(false);
  const [themeOpen, setThemeOpen] = createSignal(false);
  const [timeFormatOpen, setTimeFormatOpen] = createSignal(false);
  const [dateFormatOpen, setDateFormatOpen] = createSignal(false);

  const [selectedLanguage, setSelectedLanguage] = createSignal('en');
  const [selectedTheme, setSelectedTheme] = createSignal('system');
  const [selectedTimeFormat, setSelectedTimeFormat] = createSignal('12-hour');
  const [selectedDateFormat, setSelectedDateFormat] =
    createSignal('MM/DD/YYYY');

  const handleLanguageSelect = option => {
    setSelectedLanguage(option.value);
    setLanguageOpen(false);
    setLanguage(option.value);
  };
  const handleThemeSelect = option => {
    setSelectedTheme(option.value);
    setThemeOpen(false);
    applyTheme(option.value);
  };
  const handleTimeFormatSelect = option => {
    setSelectedTimeFormat(option.value);
    setTimeFormatOpen(false);
  };
  const handleDateFormatSelect = option => {
    setSelectedDateFormat(option.value);
    setDateFormatOpen(false);
  };

  const getLanguageLabel = value =>
    languages.find(l => l.value === value)?.label || 'English';
  const getThemeLabel = value =>
    themes.find(t => t.value === value)?.label || 'System';
  const getTimeFormatLabel = value =>
    timeFormats.find(t => t.value === value)?.label || '12-hour';
  const getDateFormatLabel = value =>
    dateFormats.find(d => d.value === value)?.label || 'MM/DD/YYYY';

  const closeAllDropdowns = () => {
    setLanguageOpen(false);
    setThemeOpen(false);
    setTimeFormatOpen(false);
    setDateFormatOpen(false);
  };

  createEffect(() => {
    const handleClickOutside = e => {
      if (!e.target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  return (
    <Show when={settingsModalState().isOpen}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSettingsModalState({ isOpen: false })}
        />

        {/* Modal Content */}
        <div class="bg-base-100 text-base-content animate-in fade-in zoom-in-95 relative z-10 max-h-[85vh] w-full max-w-[760px] overflow-hidden rounded-2xl shadow-2xl duration-200">
          <div class="mx-5 my-3 flex items-center justify-between gap-2">
            <div class="text-lg font-medium">Settings</div>
            <button
              class="btn btn-ghost btn-circle btn-sm"
              onClick={() => setSettingsModalState({ isOpen: false })}
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="border-base-300 m-2 border-b hover:overflow-x-auto md:hidden">
            <div class="tabs tabs-bordered min-w-max flex-nowrap">
              <For each={tabs}>
                {tab => (
                  <label
                    class={`tab ${activeTab() === tab.id ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="flex h-[calc(600px-80px)] flex-1 overflow-hidden">
            <aside class="bg-base-100 text-base-content border-base-300 relative flex hidden min-h-0 w-[200px] flex-col overflow-hidden border-r md:flex">
              <div class="h-full flex-1 overflow-y-auto px-3">
                <ul class="menu w-full gap-1 space-y-0.5 p-0">
                  <For each={tabs}>
                    {tab => (
                      <li>
                        <a
                          class={`flex items-center gap-2 ${activeTab() === tab.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <tab.icon class="h-5 w-5" />
                          {tab.label}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </aside>

            <main class="h-full min-h-0 flex-1 overflow-y-auto bg-base-100 p-4">
              <div class="h-full w-full">
                {/* General Tab Content */}
                <Show when={activeTab() === 'general'}>
                  <div class="divide-y divide-base-300">
                    <div class="form-control border-base-300 flex flex-row items-start justify-between border-b py-2">
                      <div>
                        <label class="text-base-content mb-1 text-base">
                          Language
                        </label>
                        <p class="text-base-content/70 text-sm">
                          Select the language for the interface
                        </p>
                      </div>
                      <div class="dropdown-container relative">
                        <DropdownButton
                          selectedLabel={getLanguageLabel(selectedLanguage())}
                          onToggle={() => setLanguageOpen(!languageOpen())}
                        />
                        <Show when={languageOpen()}>
                          <DropdownMenu
                            options={languages}
                            selectedValue={selectedLanguage()}
                            isOpen={languageOpen()}
                            onSelect={handleLanguageSelect}
                          />
                        </Show>
                      </div>
                    </div>

                    <div class="form-control border-base-300 flex flex-row items-start justify-between border-b py-2">
                      <div>
                        <label class="label text-base-content mb-1 text-base">
                          Theme
                        </label>
                        <p class="text-base-content/70 text-sm">
                          Choose between light, dark, and system themes
                        </p>
                      </div>
                      <div class="dropdown-container relative">
                        <DropdownButton
                          selectedLabel={getThemeLabel(selectedTheme())}
                          onToggle={() => setThemeOpen(!themeOpen())}
                        />
                        <Show when={themeOpen()}>
                          <DropdownMenu
                            options={themes}
                            selectedValue={selectedTheme()}
                            isOpen={themeOpen()}
                            onSelect={handleThemeSelect}
                          />
                        </Show>
                      </div>
                    </div>

                    <div class="form-control border-base-300 flex flex-row items-start justify-between border-b py-2">
                      <div>
                        <label class="label text-base-content mb-1 text-base">
                          Time Format
                        </label>
                        <p class="text-base-content/70 text-sm">
                          Select your preferred time format
                        </p>
                      </div>
                      <div class="dropdown-container relative">
                        <DropdownButton
                          selectedLabel={getTimeFormatLabel(
                            selectedTimeFormat()
                          )}
                          onToggle={() => setTimeFormatOpen(!timeFormatOpen())}
                        />
                        <Show when={timeFormatOpen()}>
                          <DropdownMenu
                            options={timeFormats}
                            selectedValue={selectedTimeFormat()}
                            isOpen={timeFormatOpen()}
                            onSelect={handleTimeFormatSelect}
                          />
                        </Show>
                      </div>
                    </div>

                    <div class="form-control border-base-300 flex flex-row items-start justify-between border-b py-2">
                      <div>
                        <label class="label text-base-content mb-1 text-base">
                          Date Format
                        </label>
                        <p class="text-base-content/70 text-sm">
                          Select your preferred date format
                        </p>
                      </div>
                      <div class="dropdown-container relative">
                        <DropdownButton
                          selectedLabel={getDateFormatLabel(
                            selectedDateFormat()
                          )}
                          onToggle={() => setDateFormatOpen(!dateFormatOpen())}
                        />
                        <Show when={dateFormatOpen()}>
                          <DropdownMenu
                            options={dateFormats}
                            selectedValue={selectedDateFormat()}
                            isOpen={dateFormatOpen()}
                            onSelect={handleDateFormatSelect}
                          />
                        </Show>
                      </div>
                    </div>

                    <div class="flex flex-row items-start justify-between py-4">
                      <div>
                        <label class="text-base-content text-base">
                          Danger Zone
                        </label>
                        <p class="text-base-content/60 mt-1 text-sm">
                          Permanently delete your account and all associated
                          data
                        </p>
                      </div>
                      <button
                        class="btn btn-ghost btn-sm text-error hover:bg-error hover:bg-opacity-10"
                        onClick={() =>
                          confirmDanger(
                            'Delete Account',
                            'Are you sure you want to delete your account? This action cannot be undone.',
                            async () => {
                              // Handle account deletion
                              toastManager.info(
                                'Account deletion is not implemented in this demo'
                              );
                            }
                          )
                        }
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </Show>

                {/* Profile Tab Content */}
                <Show when={activeTab() === 'profile'}>
                  <div class="space-y-6">
                    <section>
                      <div class="border-base-300 flex items-center border-b py-3">
                        <h3 class="text-base-content text-lg">Profile</h3>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">Name</span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>{user()?.name || 'Enter your name'}</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">Email</span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>
                                {user()?.email || 'your.email@example.com'}
                              </span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                              <div class="avatar">
                                <div class="bg-base-200 flex h-12 w-12 items-center justify-center rounded-full">
                                  <User class="text-base-content/40 h-6 w-6" />
                                </div>
                              </div>
                              <div>
                                <span class="text-base-content text-sm">
                                  Profile Picture
                                </span>
                                <p class="text-base-content/60 text-xs">
                                  Upload a custom profile picture
                                </p>
                              </div>
                            </div>
                            <div class="flex gap-2">
                              <input
                                type="file"
                                id="avatar-upload"
                                class="hidden"
                                accept="image/*"
                              />
                              <button
                                class="btn btn-ghost btn-sm"
                                onClick={() =>
                                  document
                                    .getElementById('avatar-upload')
                                    .click()
                                }
                              >
                                Upload
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">Bio</span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>Add a bio</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div class="border-base-300 flex items-center border-b py-3">
                        <h3 class="text-base-content text-lg">
                          Personal Information
                        </h3>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">
                              Phone Number
                            </span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>Add phone number</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">
                              Location
                            </span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>Add location</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">
                              Website
                            </span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>Add website</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </Show>

                {/* Placeholder for other tabs */}
                <Switch>
                  <Match when={activeTab() === 'notifications'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Notifications Settings
                      </h2>
                      <p class="text-base-content">Notifications settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'billing'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Billing Settings
                      </h2>
                      <p class="text-base-content">Billing settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'credits'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Credits Settings
                      </h2>
                      <p class="text-base-content">Credits settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'workspace'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Workspace Settings
                      </h2>
                      <p class="text-base-content">Workspace settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'apps'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Apps & Skills Settings
                      </h2>
                      <p class="text-base-content">Apps & Skills settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'connectors'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Connectors Settings
                      </h2>
                      <p class="text-base-content">Connectors settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'integrations'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Integrations Settings
                      </h2>
                      <p class="text-base-content">Integrations settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'data'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Data Control Settings
                      </h2>
                      <p class="text-base-content">Data Control settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'security'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Security Settings
                      </h2>
                      <p class="text-base-content">Security settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'roles'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">
                        Roles & Governance Settings
                      </h2>
                      <p class="text-base-content">Roles & Governance settings would appear here.</p>
                    </div>
                  </Match>
                  <Match when={activeTab() === 'help'}>
                    <div class="p-4">
                      <h2 class="text-base-content mb-4 text-xl font-semibold">Help Settings</h2>
                      <p class="text-base-content">Help settings would appear here.</p>
                    </div>
                  </Match>
                </Switch>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Show>
  );
}
