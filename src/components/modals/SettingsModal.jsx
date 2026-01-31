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
  { value: 'en', label: { en: 'English', ar: 'الإنجليزية' } },
  { value: 'ar', label: { en: 'Arabic', ar: 'العربية' } },
];

const themes = [
  { value: 'light', label: { en: 'Light', ar: 'فاتح' } },
  { value: 'dark', label: { en: 'Dark', ar: 'داكن' } },
  { value: 'system', label: { en: 'System', ar: 'النظام' } },
];

const timeFormats = [
  { value: '12-hour', label: { en: '12-hour', ar: '12 ساعة' } },
  { value: '24-hour', label: { en: '24-hour', ar: '24 ساعة' } },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: { en: 'MM/DD/YYYY', ar: 'شهر/يوم/سنة' } },
  { value: 'DD/MM/YYYY', label: { en: 'DD/MM/YYYY', ar: 'يوم/شهر/سنة' } },
  { value: 'YYYY-MM-DD', label: { en: 'YYYY-MM-DD', ar: 'سنة-شهر-يوم' } },
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
      class={`dropdown menu rounded-box bg-base-100 text-base-content border-base-300 absolute z-10 w-40 border shadow-sm ${language() === 'ar' ? 'right-0 left-auto' : 'left-0 right-auto'}`}
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
              {typeof option.label === 'object' ? option.label[language()] || option.label.en : option.label}
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

  const getLanguageLabel = value => {
    const lang = languages.find(l => l.value === value);
    if (lang && typeof lang.label === 'object') {
      return lang.label[language()] || lang.label.en;
    }
    return lang?.label || (language() === 'ar' ? 'الإنجليزية' : 'English');
  };
  const getThemeLabel = value => {
    const theme = themes.find(t => t.value === value);
    if (theme && typeof theme.label === 'object') {
      return theme.label[language()] || theme.label.en;
    }
    return theme?.label || 'System';
  };

  const getTimeFormatLabel = value => {
    const format = timeFormats.find(t => t.value === value);
    if (format && typeof format.label === 'object') {
      return format.label[language()] || format.label.en;
    }
    return format?.label || '12-hour';
  };

  const getDateFormatLabel = value => {
    const format = dateFormats.find(d => d.value === value);
    if (format && typeof format.label === 'object') {
      return format.label[language()] || format.label.en;
    }
    return format?.label || 'MM/DD/YYYY';
  };

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
      <div class={`fixed inset-0 z-50 flex items-center justify-center ${language() === 'ar' ? 'rtl' : 'ltr'}`}>
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSettingsModalState({ isOpen: false })}
        />

        {/* Modal Content */}
        <div class={`bg-base-100 text-base-content animate-in fade-in zoom-in-95 relative z-10 max-h-[85vh] w-full max-w-[760px] overflow-hidden rounded-2xl shadow-2xl duration-200 ${language() === 'ar' ? 'rtl' : 'ltr'}`}>
          <div class="mx-5 my-3 flex items-center justify-between gap-2">
            <div class="text-lg font-medium">{language() === 'ar' ? 'الإعدادات' : 'Settings'}</div>
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
                    {typeof tab.label === 'object' ? tab.label[language()] || tab.label.en : tab.label}
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
                          {typeof tab.label === 'object' ? tab.label[language()] || tab.label.en : tab.label}
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
                          {language() === 'ar' ? 'اللغة' : 'Language'}
                        </label>
                        <p class="text-base-content/70 text-sm">
                          {language() === 'ar' ? 'اختر اللغة للواجهة' : 'Select the language for the interface'}
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
                          {language() === 'ar' ? 'السمة' : 'Theme'}
                        </label>
                        <p class="text-base-content/70 text-sm">
                          {language() === 'ar' ? 'اختر بين السمة الفاتحة والداكنة والنظام' : 'Choose between light, dark, and system themes'}
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
                          {language() === 'ar' ? 'تنسيق الوقت' : 'Time Format'}
                        </label>
                        <p class="text-base-content/70 text-sm">
                          {language() === 'ar' ? 'اختر تنسيق الوقت المفضل لديك' : 'Select your preferred time format'}
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
                          {language() === 'ar' ? 'تنسيق التاريخ' : 'Date Format'}
                        </label>
                        <p class="text-base-content/70 text-sm">
                          {language() === 'ar' ? 'اختر تنسيق التاريخ المفضل لديك' : 'Select your preferred date format'}
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
                          {language() === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
                        </label>
                        <p class="text-base-content/60 mt-1 text-sm">
                          {language() === 'ar' ? 'احذف حسابك وجميع البيانات المرتبطة به بشكل دائم' : 'Permanently delete your account and all associated data'}
                        </p>
                      </div>
                      <button
                        class="btn btn-ghost btn-sm text-error hover:bg-error hover:bg-opacity-10"
                        onClick={() =>
                          confirmDanger(
                            language() === 'ar' ? 'حذف الحساب' : 'Delete Account',
                            language() === 'ar'
                              ? 'هل أنت متأكد أنك تريد حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.'
                              : 'Are you sure you want to delete your account? This action cannot be undone.',
                            async () => {
                              // Handle account deletion
                              toastManager.info(
                                language() === 'ar'
                                  ? 'حذف الحساب غير مُنفّذ في هذا العرض التوضيحي'
                                  : 'Account deletion is not implemented in this demo'
                              );
                            }
                          )
                        }
                      >
                        {language() === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </Show>

                {/* Profile Tab Content */}
                <Show when={activeTab() === 'profile'}>
                  <div class="space-y-6">
                    <section>
                      <div class="border-base-300 flex items-center border-b py-3">
                        <h3 class="text-base-content text-lg">{language() === 'ar' ? 'الملف الشخصي' : 'Profile'}</h3>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">{language() === 'ar' ? 'الاسم' : 'Name'}</span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>{user()?.name || (language() === 'ar' ? 'أدخل اسمك' : 'Enter your name')}</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">{language() === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>
                                {user()?.email || (language() === 'ar' ? 'بريدك.الإلكتروني@مثال.com' : 'your.email@example.com')}
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
                                  {language() === 'ar' ? 'صورة الملف الشخصي' : 'Profile Picture'}
                                </span>
                                <p class="text-base-content/60 text-xs">
                                  {language() === 'ar' ? 'قم بتحميل صورة ملف شخصية مخصصة' : 'Upload a custom profile picture'}
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
                                {language() === 'ar' ? 'تحميل' : 'Upload'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">{language() === 'ar' ? 'السيرة الذاتية' : 'Bio'}</span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>{language() === 'ar' ? 'أضف سيرة ذاتية' : 'Add a bio'}</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div class="border-base-300 flex items-center border-b py-3">
                        <h3 class="text-base-content text-lg">
                          {language() === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                        </h3>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">
                              {language() === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                            </span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>{language() === 'ar' ? 'أضف رقم هاتف' : 'Add phone number'}</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">
                              {language() === 'ar' ? 'الموقع' : 'Location'}
                            </span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>{language() === 'ar' ? 'أضف موقعًا' : 'Add location'}</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <span class="text-base-content text-sm">
                              {language() === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
                            </span>
                            <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                              <span>{language() === 'ar' ? 'أضف موقعًا إلكترونيًا' : 'Add website'}</span>
                              <ChevronRight class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </Show>

                {/* Notifications Tab Content */}
                <Show when={activeTab() === 'notifications'}>
                  <div class="space-y-6">
                    <section>
                      <div class="border-base-300 flex items-center border-b py-3">
                        <h3 class="text-base-content text-lg">
                          {language() === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                        </h3>
                      </div>

                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'تلقي الإشعارات عبر البريد الإلكتروني' : 'Receive notifications via email'}
                              </p>
                            </div>
                            <Toggle
                              checked={true}
                              onChange={(checked) => {}}
                            />
                          </div>
                        </div>
                      </div>

                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'إشعارات الدفع' : 'Push Notifications'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'تلقي إشعارات الدفع في المتصفح' : 'Receive push notifications in browser'}
                              </p>
                            </div>
                            <Toggle
                              checked={true}
                              onChange={(checked) => {}}
                            />
                          </div>
                        </div>
                      </div>

                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'إشعارات الرسائل القصيرة' : 'SMS Notifications'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'تلقي الإشعارات عبر الرسائل القصيرة' : 'Receive notifications via SMS'}
                              </p>
                            </div>
                            <Toggle
                              checked={false}
                              onChange={(checked) => {}}
                            />
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'صوت الإشعار' : 'Notification Sound'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'تشغيل الصوت للإشعارات الجديدة' : 'Play sound for new notifications'}
                              </p>
                            </div>
                            <Toggle
                              checked={true}
                              onChange={(checked) => {}}
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div class="border-base-300 flex items-center border-b py-3">
                        <h3 class="text-base-content text-lg">
                          {language() === 'ar' ? 'فئات الإشعارات' : 'Notification Categories'}
                        </h3>
                      </div>

                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'تحديثات المشروع' : 'Project Updates'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'الإنشاءات، والنشر، وأحداث المشروع' : 'Builds, deployments, and project events'}
                              </p>
                            </div>
                            <div class="dropdown-container relative">
                              <DropdownButton
                                selectedLabel={language() === 'ar' ? 'مهم فقط' : 'Important only'}
                                onToggle={() => {}}
                              />
                              <DropdownMenu
                                options={[
                                  { value: 'all', label: { en: 'All', ar: 'الكل' } },
                                  { value: 'important', label: { en: 'Important only', ar: 'مهم فقط' } },
                                  { value: 'none', label: { en: 'None', ar: 'لا شيء' } },
                                ]}
                                selectedValue={'important'}
                                isOpen={false}
                                onSelect={() => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="border-base-300 flex items-center justify-between border-b py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الرسائل المباشرة' : 'Direct Messages'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'عندما يرسل لك أحد رسالة' : 'When someone sends you a message'}
                              </p>
                            </div>
                            <div class="dropdown-container relative">
                              <DropdownButton
                                selectedLabel={language() === 'ar' ? 'الكل' : 'All'}
                                onToggle={() => {}}
                              />
                              <DropdownMenu
                                options={[
                                  { value: 'all', label: { en: 'All', ar: 'الكل' } },
                                  { value: 'important', label: { en: 'Important only', ar: 'مهم فقط' } },
                                  { value: 'none', label: { en: 'None', ar: 'لا شيء' } },
                                ]}
                                selectedValue={'all'}
                                isOpen={false}
                                onSelect={() => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between py-3">
                        <div class="w-full">
                          <div class="flex items-center justify-between gap-4">
                            <div>
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الإشارات' : 'Mentions'}
                              </span>
                              <p class="text-base-content/70 text-xs">
                                {language() === 'ar' ? 'عندما يشير إليك أحد' : 'When someone mentions you'}
                              </p>
                            </div>
                            <div class="dropdown-container relative">
                              <DropdownButton
                                selectedLabel={language() === 'ar' ? 'الكل' : 'All'}
                                onToggle={() => {}}
                              />
                              <DropdownMenu
                                options={[
                                  { value: 'all', label: { en: 'All', ar: 'الكل' } },
                                  { value: 'important', label: { en: 'Important only', ar: 'مهم فقط' } },
                                  { value: 'none', label: { en: 'None', ar: 'لا شيء' } },
                                ]}
                                selectedValue={'all'}
                                isOpen={false}
                                onSelect={() => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </Show>
                  <Switch>
                  <Match when={activeTab() === 'billing'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'إعدادات الفوترة' : 'Billing Settings'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'خطة الحساب' : 'Account Plan'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'الخطة الأساسية' : 'Basic Plan'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الفواتير' : 'Invoices'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'عرض الفواتير' : 'View invoices'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'Visa ending in 1234' : 'Visa ending in 1234'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'تفاصيل الفوترة' : 'Billing Details'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'تعديل' : 'Edit'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'credits'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'إدارة الرصيد' : 'Credit Management'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}
                              </span>
                              <span class="text-base-content text-sm font-medium">1,250 {language() === 'ar' ? 'ائتمان' : 'credits'}</span>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'استخدام الرصيد' : 'Credit Usage'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'عرض التفاصيل' : 'View details'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'شراء رصيد إضافي' : 'Purchase Additional Credits'}
                              </span>
                              <button class="btn btn-primary btn-sm">
                                {language() === 'ar' ? 'شراء الآن' : 'Buy Now'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'workspace'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'إعدادات مساحة العمل' : 'Workspace Settings'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'اسم مساحة العمل' : 'Workspace Name'}
                              </span>
                              <input
                                type="text"
                                placeholder={language() === 'ar' ? 'اسم مساحة العمل' : 'Workspace name'}
                                class="input input-bordered w-40 text-right"
                                value={language() === 'ar' ? 'مساحتي' : 'My Workspace'}
                              />
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'رابط مساحة العمل' : 'Workspace URL'}
                              </span>
                              <input
                                type="text"
                                placeholder={language() === 'ar' ? 'رابط مساحة العمل' : 'Workspace URL'}
                                class="input input-bordered w-40 text-right"
                                value="my-workspace.accelerator.io"
                              />
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <div class="flex items-center gap-3">
                                <div class="avatar">
                                  <div class="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center">
                                    <Image class="w-6 h-6 text-base-content/40" />
                                  </div>
                                </div>
                                <div>
                                  <span class="text-base-content text-sm">
                                    {language() === 'ar' ? 'شعار مساحة العمل' : 'Workspace Logo'}
                                  </span>
                                  <p class="text-base-content/60 text-xs">
                                    {language() === 'ar' ? 'تحميل شعار مخصص لمساحة العمل' : 'Upload a custom logo for your workspace'}
                                  </p>
                                </div>
                              </div>
                              <div class="flex gap-2">
                                <input type="file" id="workspace-logo-upload" class="hidden" accept="image/*" />
                                <button class="btn btn-ghost btn-sm" onClick={() => document.getElementById('workspace-logo-upload').click()}>
                                  {language() === 'ar' ? 'تحميل' : 'Upload'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الوصف' : 'Description'}
                              </span>
                              <textarea
                                placeholder={language() === 'ar' ? 'وصف مساحة العمل' : 'Workspace description'}
                                class="textarea textarea-bordered w-40 h-16 text-right"
                              >
                                {language() === 'ar' ? 'مساحة عمل تعاونية للمشاريع المبتكرة.' : 'A collaborative workspace for innovative projects.'}
                              </textarea>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'التفضيلات' : 'Preferences'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'عرض المشاريع الافتراضي' : 'Default Project View'}
                              </span>
                              <div class="dropdown-container relative">
                                <DropdownButton
                                  selectedLabel={language() === 'ar' ? 'شبكة' : 'Grid'}
                                  onToggle={() => {}}
                                />
                                <DropdownMenu
                                  options={[
                                    { value: 'grid', label: { en: 'Grid', ar: 'شبكة' } },
                                    { value: 'list', label: { en: 'List', ar: 'قائمة' } },
                                    { value: 'kanban', label: { en: 'Kanban', ar: 'كانبان' } },
                                  ]}
                                  selectedValue={'grid'}
                                  isOpen={false}
                                  onSelect={() => {}}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'فرز المهام' : 'Task Sorting'}
                              </span>
                              <div class="dropdown-container relative">
                                <DropdownButton
                                  selectedLabel={language() === 'ar' ? 'تاريخ الإنشاء' : 'Date Created'}
                                  onToggle={() => {}}
                                />
                                <DropdownMenu
                                  options={[
                                    { value: 'priority', label: { en: 'Priority', ar: 'الأولوية' } },
                                    { value: 'due-date', label: { en: 'Due Date', ar: 'تاريخ الاستحقاق' } },
                                    { value: 'created', label: { en: 'Date Created', ar: 'تاريخ الإنشاء' } },
                                  ]}
                                  selectedValue={'created'}
                                  isOpen={false}
                                  onSelect={() => {}}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <div>
                                <span class="text-base-content text-sm">
                                  {language() === 'ar' ? 'حفظ تلقائي' : 'Auto-save'}
                                </span>
                                <p class="text-base-content/70 text-xs">
                                  {language() === 'ar' ? 'حفظ التغييرات تلقائيًا' : 'Automatically save changes'}
                                </p>
                              </div>
                              <Toggle
                                checked={true}
                                onChange={(checked) => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'apps'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'التطبيقات والمهارات' : 'Apps & Skills'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'التطبيقات المثبتة' : 'Installed Apps'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'عرض التطبيقات' : 'View apps'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'المهارات المخصصة' : 'Custom Skills'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'إدارة المهارات' : 'Manage skills'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'متجر التطبيقات' : 'App Store'}
                              </span>
                              <button class="btn btn-outline btn-sm">
                                {language() === 'ar' ? 'تصفح' : 'Browse'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'connectors'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'المتصلات' : 'Connectors'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'المتصلات النشطة' : 'Active Connectors'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>5 {language() === 'ar' ? 'متصل' : 'connectors'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'متصلات جديدة' : 'New Connectors'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'إضافة متصل' : 'Add connector'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'متصلات مخصصة' : 'Custom Connectors'}
                              </span>
                              <button class="btn btn-outline btn-sm">
                                {language() === 'ar' ? 'إنشاء' : 'Create'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'integrations'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'التكاملات' : 'Integrations'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'التكاملات النشطة' : 'Active Integrations'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>8 {language() === 'ar' ? 'تكامل' : 'integrations'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'مكتبة التكامل' : 'Integration Library'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'تصفح' : 'Browse'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'تكامل مخصص' : 'Custom Integration'}
                              </span>
                              <button class="btn btn-outline btn-sm">
                                {language() === 'ar' ? 'تكوين' : 'Configure'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'data'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'التحكم بالبيانات' : 'Data Control'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'النسخ الاحتياطي' : 'Backup'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'النسخ الاحتياطي الآن' : 'Backup now'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الاستعادة' : 'Restore'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'استعادة البيانات' : 'Restore data'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'تصدير البيانات' : 'Export Data'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'تصدير' : 'Export'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الاحتفاظ بالبيانات' : 'Data Retention'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'security'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <div>
                                <span class="text-base-content text-sm">
                                  {language() === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}
                                </span>
                                <p class="text-base-content/70 text-xs">
                                  {language() === 'ar' ? 'إضافة أمان إضافي لحسابك' : 'Add extra security to your account'}
                                </p>
                              </div>
                              <Toggle
                                checked={false}
                                onChange={(checked) => {}}
                              />
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'كلمة المرور' : 'Password'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'إدارة الجلسات' : 'Session Management'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'عرض الجلسات' : 'View Sessions'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'تسجيل الدخول الموحّد' : 'Single Sign-On'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'تكوين SSO' : 'Configure SSO'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <div>
                                <span class="text-base-content text-sm">
                                  {language() === 'ar' ? 'مشاركة التحليلات' : 'Share Analytics'}
                                </span>
                                <p class="text-base-content/70 text-xs">
                                  {language() === 'ar' ? 'المساعدة في تحسين خدمتنا من خلال مشاركة بيانات الاستخدام' : 'Help improve our service by sharing usage data'}
                                </p>
                              </div>
                              <Toggle
                                checked={true}
                                onChange={(checked) => {}}
                              />
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <div>
                                <span class="text-base-content text-sm">
                                  {language() === 'ar' ? 'القياس' : 'Telemetry'}
                                </span>
                                <p class="text-base-content/70 text-xs">
                                  {language() === 'ar' ? 'السماح بجمع بيانات التشخيص' : 'Allow collection of diagnostic data'}
                                </p>
                              </div>
                              <Toggle
                                checked={false}
                                onChange={(checked) => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'roles'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'الأدوار والحوكمة' : 'Roles & Governance'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'أدوار المستخدمين' : 'User Roles'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'إدارة الأدوار' : 'Manage roles'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'صلاحيات الوصول' : 'Access Permissions'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'عرض الصلاحيات' : 'View permissions'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'سجلات الحوكمة' : 'Governance Logs'}
                              </span>
                              <button class="text-base-content/70 hover:text-base-content flex items-center gap-2 text-sm">
                                <span>{language() === 'ar' ? 'عرض السجلات' : 'View logs'}</span>
                                <ChevronRight class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </Match>

                  <Match when={activeTab() === 'help'}>
                    <div class="space-y-6">
                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'المساعدة والدعم' : 'Help & Support'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الوثائق' : 'Documentation'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'عرض الوثائق' : 'View Docs'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الدورات التعليمية' : 'Tutorials'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'مشاهدة الدورات' : 'Watch Tutorials'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الاتصال بالدعم' : 'Contact Support'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'اتصال بالدعم' : 'Contact Support'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'منتدى المجتمع' : 'Community Forum'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'زيارة المنتدى' : 'Visit Forum'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div class="border-base-300 flex items-center border-b py-3">
                          <h3 class="text-base-content text-lg">
                            {language() === 'ar' ? 'الملاحظات' : 'Feedback'}
                          </h3>
                        </div>

                        <div class="border-base-300 flex items-center justify-between border-b py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'الإبلاغ عن خطأ' : 'Report a Bug'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'الإبلاغ' : 'Report'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                          <div class="w-full">
                            <div class="flex items-center justify-between gap-4">
                              <span class="text-base-content text-sm">
                                {language() === 'ar' ? 'طلب ميزة' : 'Feature Request'}
                              </span>
                              <button class="btn btn-ghost btn-sm">
                                {language() === 'ar' ? 'طلب' : 'Request'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
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
