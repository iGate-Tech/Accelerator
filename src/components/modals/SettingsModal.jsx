import { createSignal, Show, For, Switch, Match, createEffect } from 'solid-js';
import { useUser } from '@context/UserContext';
import { useNavigate } from '@solidjs/router';
import { useLanguage } from '@hooks/useLanguage';
import { toastManager } from '@lib/ui/feedback';
import { confirmDanger } from './GlobalConfirm';
import { applyTheme } from '@lib/theme';
import {
  Settings, UserRound, CalendarDays, Bell, PanelTop, Puzzle, Cable, Plug,
  X, CreditCard, ChevronDown, ChevronRight, User, Database, Shield,
  ShieldCheck, LifeBuoy, Check, Bot, BarChart2, FileText, Code2,
  MessageSquare, Image, Table, Layers, HardDrive, Cloud,
  Folder, UploadCloud, Mail, MessageCircle, Video, Mic, Trello, Layout,
  ListChecks, GitBranch, Users, Send, MailOpen, BookOpen, PlayCircle,
  FileCode, ScrollText, Key, HelpCircle, Crown, Eye, Calendar, Clock,
  BellOff, MailCheck, Globe, Lock, EyeOff,
} from 'lucide-solid';

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Plans & Billing', icon: CalendarDays },
  { id: 'credits', label: 'Buy Credits', icon: CreditCard },
  { id: 'workspace', label: 'Workspace', icon: PanelTop },
  { id: 'apps', label: 'Apps & Skills', icon: Puzzle },
  { id: 'connectors', label: 'Connectors', icon: Cable },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'data', label: 'Data Control', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'roles', label: 'Roles & Governance', icon: ShieldCheck },
  { id: 'help', label: 'Help', icon: LifeBuoy },
];

const languages = [
  { value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' }, { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const themes = [
  { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const timeFormats = [
  { value: '12-hour', label: '12-hour' }, { value: '24-hour', label: '24-hour' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

function DropdownButton(props) {
  return (
    <button class="btn btn-ghost font-normal flex gap-2" onClick={(e) => { e.stopPropagation(); props.onToggle?.(); }}>
      <span class="dropdown-text font-normal">{props.selectedLabel}</span>
      <ChevronDown class="w-4 h-4" />
    </button>
  );
}

function DropdownMenu(props) {
  return (
    <ul class="dropdown menu w-40 rounded-box bg-base-100 shadow-sm border border-base-300 absolute z-10" classList={{ hidden: !props.isOpen }}>
      <For each={props.options}>{(option) => (
        <li>
          <a class="cursor-pointer" classList={{ active: props.selectedValue === option.value }} onClick={(e) => { e.stopPropagation(); props.onSelect?.(option); }}>
            {option.label}
          </a>
        </li>
      )}</For>
    </ul>
  );
}

function Toggle(props) {
  return (
    <label class="swap swap-rotate">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange?.(e.target.checked)} />
      <svg class="swap-on fill-current w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>
      <svg class="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
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
  const [selectedDateFormat, setSelectedDateFormat] = createSignal('MM/DD/YYYY');

  const handleLanguageSelect = (option) => { setSelectedLanguage(option.value); setLanguageOpen(false); setLanguage(option.value); };
  const handleThemeSelect = (option) => { setSelectedTheme(option.value); setThemeOpen(false); applyTheme(option.value); };
  const handleTimeFormatSelect = (option) => { setSelectedTimeFormat(option.value); setTimeFormatOpen(false); };
  const handleDateFormatSelect = (option) => { setSelectedDateFormat(option.value); setDateFormatOpen(false); };

  const getLanguageLabel = (value) => languages.find(l => l.value === value)?.label || 'English';
  const getThemeLabel = (value) => themes.find(t => t.value === value)?.label || 'System';
  const getTimeFormatLabel = (value) => timeFormats.find(t => t.value === value)?.label || '12-hour';
  const getDateFormatLabel = (value) => dateFormats.find(d => d.value === value)?.label || 'MM/DD/YYYY';

  const closeAllDropdowns = () => { setLanguageOpen(false); setThemeOpen(false); setTimeFormatOpen(false); setDateFormatOpen(false); };

  createEffect(() => {
    const handleClickOutside = (e) => { if (!e.target.closest('.dropdown-container')) { closeAllDropdowns(); } };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  // Access the global state
  const state = settingsModalState();

  return (
    <div class={`modal ${state.isOpen ? 'modal-open' : ''}`}>
      <div class="modal-box w-full max-w-[760px] max-h-[600px] p-0">
        <div class="flex gap-2 justify-between mx-5 my-3">
          <div class="font-medium">Settings</div>
          <X class="w-5 h-5 text-gray-600 cursor-pointer"
             onClick={() => setSettingsModalState({isOpen: false})} />
        </div>

        <div class="hover:overflow-x-auto m-2 border-b border-base-300 md:hidden">
          <div class="tabs tabs-bordered flex-nowrap min-w-max">
            <For each={tabs}>{(tab) => (
              <label class={`tab hover:text-primary ${activeTab() === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </label>
            )}</For>
          </div>
        </div>

        <div class="flex flex-1 overflow-hidden h-[calc(600px-80px)]">
          <aside class="hidden md:flex w-[200px] flex flex-col relative bg-base-100 border-r border-base-300 min-h-0 overflow-hidden">
            <div class="flex-1 px-3 overflow-y-auto h-full">
              <ul class="menu w-full gap-1 space-y-0.5 p-0">
                <For each={tabs}>{(tab) => (
                  <li>
                    <a class={`flex gap-2 items-center ${activeTab() === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                      <tab.icon class="w-5 h-5" />
                      {tab.label}
                    </a>
                  </li>
                )}</For>
              </ul>
            </div>
          </aside>

          <main class="flex-1 bg-white p-4 overflow-y-auto h-full min-h-0">
            <div class="w-full h-full">
              {/* General Tab Content */}
              <Show when={activeTab() === 'general'}>
                <div class="divide-y divide-gray-200">
                  <div class="form-control flex flex-row justify-between items-start py-2 border-b border-base-300">
                    <div>
                      <label class="text-base text-base-content mb-1">Language</label>
                      <p class="text-sm text-base-content/70">Select the language for the interface</p>
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

                  <div class="form-control flex flex-row justify-between items-start py-2 border-b border-base-300">
                    <div>
                      <label class="label text-base text-base-content mb-1">Theme</label>
                      <p class="text-sm text-base-content/70">Choose between light, dark, and system themes</p>
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

                  <div class="form-control flex flex-row justify-between items-start py-2 border-b border-base-300">
                    <div>
                      <label class="label text-base text-base-content mb-1">Time Format</label>
                      <p class="text-sm text-base-content/70">Select your preferred time format</p>
                    </div>
                    <div class="dropdown-container relative">
                      <DropdownButton
                        selectedLabel={getTimeFormatLabel(selectedTimeFormat())}
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

                  <div class="form-control flex flex-row justify-between items-start py-2 border-b border-base-300">
                    <div>
                      <label class="label text-base text-base-content mb-1">Date Format</label>
                      <p class="text-sm text-base-content/70">Select your preferred date format</p>
                    </div>
                    <div class="dropdown-container relative">
                      <DropdownButton
                        selectedLabel={getDateFormatLabel(selectedDateFormat())}
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

                  <div class="flex flex-row justify-between items-start py-4">
                    <div>
                      <label class="text-base text-base-content">Danger Zone</label>
                      <p class="text-sm text-base-content/60 mt-1">Permanently delete your account and all associated data</p>
                    </div>
                    <button class="btn btn-ghost btn-sm text-error hover:bg-error/5"
                      onClick={() => confirmDanger(
                        'Delete Account',
                        'Are you sure you want to delete your account? This action cannot be undone.',
                        async () => {
                          // Handle account deletion
                          toastManager.info('Account deletion is not implemented in this demo');
                        }
                      )}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </Show>

              {/* Profile Tab Content */}
              <Show when={activeTab() === 'profile'}>
                <div class="space-y-6">
                  <section>
                    <div class="flex items-center py-3 border-b border-base-200">
                      <h3 class="text-lg text-base-content">Profile</h3>
                    </div>
                    <div class="flex items-center justify-between border-b border-base-200 py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <span class="text-sm text-base-content">Name</span>
                          <button class="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content">
                            <span>{user()?.name || 'Enter your name'}</span>
                            <ChevronRight class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between border-b border-base-200 py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <span class="text-sm text-base-content">Email</span>
                          <button class="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content">
                            <span>{user()?.email || 'your.email@example.com'}</span>
                            <ChevronRight class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between border-b border-base-200 py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <div class="flex items-center gap-3">
                            <div class="avatar">
                              <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center">
                                <User class="w-6 h-6 text-base-content/40" />
                              </div>
                            </div>
                            <div>
                              <span class="text-sm text-base-content">Profile Picture</span>
                              <p class="text-xs text-base-content/60">Upload a custom profile picture</p>
                            </div>
                          </div>
                          <div class="flex gap-2">
                            <input type="file" id="avatar-upload" class="hidden" accept="image/*" />
                            <button class="btn btn-ghost btn-sm"
                              onClick={() => document.getElementById('avatar-upload').click()}>
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <span class="text-sm text-base-content">Bio</span>
                          <button class="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content">
                            <span>Add a bio</span>
                            <ChevronRight class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div class="flex items-center py-3 border-b border-base-200">
                      <h3 class="text-lg text-base-content">Personal Information</h3>
                    </div>
                    <div class="flex items-center justify-between border-b border-base-200 py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <span class="text-sm text-base-content">Phone Number</span>
                          <button class="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content">
                            <span>Add phone number</span>
                            <ChevronRight class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between border-b border-base-200 py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <span class="text-sm text-base-content">Location</span>
                          <button class="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content">
                            <span>Add location</span>
                            <ChevronRight class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between py-3">
                      <div class="w-full">
                        <div class="flex items-center justify-between gap-4">
                          <span class="text-sm text-base-content">Website</span>
                          <button class="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content">
                            <span>Add website</span>
                            <ChevronRight class="w-4 h-4" />
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
                    <h2 class="text-xl font-semibold mb-4">Notifications Settings</h2>
                    <p>Notifications settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'billing'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Billing Settings</h2>
                    <p>Billing settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'credits'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Credits Settings</h2>
                    <p>Credits settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'workspace'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Workspace Settings</h2>
                    <p>Workspace settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'apps'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Apps & Skills Settings</h2>
                    <p>Apps & Skills settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'connectors'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Connectors Settings</h2>
                    <p>Connectors settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'integrations'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Integrations Settings</h2>
                    <p>Integrations settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'data'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Data Control Settings</h2>
                    <p>Data Control settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'security'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Security Settings</h2>
                    <p>Security settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'roles'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Roles & Governance Settings</h2>
                    <p>Roles & Governance settings would appear here.</p>
                  </div>
                </Match>
                <Match when={activeTab() === 'help'}>
                  <div class="p-4">
                    <h2 class="text-xl font-semibold mb-4">Help Settings</h2>
                    <p>Help settings would appear here.</p>
                  </div>
                </Match>
              </Switch>
            </div>
          </main>
        </div>
      </div>

      {/* Close modal when clicking on backdrop */}
      <div class="modal-backdrop"
           onClick={() => setSettingsModalState({isOpen: false})}></div>
    </div>
  );
};
