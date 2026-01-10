import { createSignal, onMount, For, Show, createEffect, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import { supabase } from "../../lib/supabase";
import { toastManager } from "../../lib/feedback";

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateProfile, updatePreferences } = useUser();
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [activeTab, setActiveTab] = createSignal('profile');
  const [profileForm, setProfileForm] = createSignal({
    name: user().profile.name,
    email: user().profile.email,
    bio: user().profile.bio
  });
  const [preferencesForm, setPreferencesForm] = createSignal({
    notifications: { ...user().preferences.notifications },
    privacy: { ...user().preferences.privacy }
  });
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [avatarFile, setAvatarFile] = createSignal(null);
  const [avatarPreview, setAvatarPreview] = createSignal(null);
  const [uploadingAvatar, setUploadingAvatar] = createSignal(false);
  const [currentTheme, setCurrentTheme] = createSignal(localStorage.getItem('theme') || 'light');

  const t = () => translations[currentLang()];

  createEffect(() => {
    setCurrentLang(lang());
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'account', label: 'Account', icon: 'shield' },
    { id: 'data', label: 'Data & Privacy', icon: 'database' }
  ];

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      updateProfile(profileForm());
      showMessage('Profile updated successfully!');
    } catch (error) {
      showMessage('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      updatePreferences(preferencesForm());
      showMessage('Preferences updated successfully!');
    } catch (error) {
      showMessage('Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    const data = JSON.stringify(user(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Data exported successfully!');
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toastManager.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toastManager.error('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile()) return;

    setUploadingAvatar(true);
    try {
      const fileExt = avatarFile().name.split('.').pop();
      const fileName = `${user().id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile(), {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      await updateProfile({ avatar: publicUrl });

      setAvatarFile(null);
      setAvatarPreview(null);
      toastManager.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toastManager.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await updateProfile({ avatar: '/src/assets/avatar.png' });
      toastManager.success('Avatar removed successfully!');
    } catch (error) {
      toastManager.error('Failed to remove avatar');
    }
  };

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    toastManager.success(`Theme changed to ${theme}`);
  };

  const deleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
        // In a real app, this would call an API
        showMessage('Account deletion initiated. You will be logged out.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/');
        }, 2000);
      }
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class={`max-w-4xl mx-auto space-y-8  ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().accountSettings}</h1>
        <p class="text-lg text-base-content/70">
          {t().manageAccount}.
        </p>
      </div>

      {/* Success/Error Message */}
      <Show when={message()}>
        <div class={`alert ${message().includes('success') ? 'alert-success' : 'alert-error'}`}>
          <i data-lucide={message().includes('success') ? 'check-circle' : 'alert-circle'} class="w-5 h-5"></i>
          <span>{message()}</span>
        </div>
      </Show>

      {/* Navigation Tabs */}
      <div class="tabs tabs-boxed bg-base-200">
        <For each={tabs}>
          {(tab) => (
            <button
              class={`tab ${activeTab() === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i data-lucide={tab.icon} class="w-4 h-4 mr-2"></i>
              {t()[tab.id]}
            </button>
          )}
        </For>
      </div>

      {/* Tab Content */}
      <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">

        {/* Profile Tab */}
        <Show when={activeTab() === 'profile'}>
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">{t().profileInfo}</h2>

             <div class="flex items-center gap-6">
               <div class="avatar">
                 <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                   <img src={avatarPreview() || user().profile.avatar} alt="Profile" />
                 </div>
               </div>
               <div class="flex-1">
                 <h3 class="text-lg font-semibold">{user().profile.name}</h3>
                 <p class="text-base-content/60">{user().profile.email}</p>
                 <div class="flex gap-2 mt-2">
                   <label class="btn btn-outline btn-sm cursor-pointer">
                     <i data-lucide="camera" class="w-4 h-4 mr-1"></i>
                     {t().changePhoto}
                     <input
                       type="file"
                       accept="image/*"
                       class="hidden"
                       onChange={handleAvatarChange}
                     />
                   </label>
                   <Show when={avatarPreview()}>
                     <button
                       class="btn btn-primary btn-sm"
                       onClick={uploadAvatar}
                       disabled={uploadingAvatar()}
                     >
                       <Show when={uploadingAvatar()}>
                         <span class="loading loading-spinner loading-sm"></span>
                       </Show>
                       <i data-lucide="upload" class="w-4 h-4 mr-1"></i>
                       Upload
                     </button>
                   </Show>
                   <button
                     class="btn btn-ghost btn-sm"
                     onClick={() => {
                       setAvatarFile(null);
                       setAvatarPreview(null);
                     }}
                     disabled={uploadingAvatar()}
                   >
                     <i data-lucide="x" class="w-4 h-4 mr-1"></i>
                     Cancel
                   </button>
                   <Show when={!avatarPreview() && user().profile.avatar !== '/src/assets/avatar.png'}>
                     <button
                       class="btn btn-error btn-sm"
                       onClick={removeAvatar}
                     >
                       <i data-lucide="trash" class="w-4 h-4 mr-1"></i>
                       Remove
                     </button>
                   </Show>
                 </div>
                 <Show when={avatarFile()}>
                   <p class="text-sm text-base-content/60 mt-1">
                     Selected: {avatarFile().name} ({(avatarFile().size / 1024 / 1024).toFixed(2)} MB)
                   </p>
                 </Show>
               </div>
             </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="label">
                  <span class="label-text">{t().fullName}</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered w-full"
                  value={profileForm().name}
                  onInput={(e) => setProfileForm({...profileForm(), name: e.target.value})}
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text">{t().email}</span>
                </label>
                <input
                  type="email"
                  class="input input-bordered w-full"
                  value={profileForm().email}
                  onInput={(e) => setProfileForm({...profileForm(), email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label class="label">
                <span class="label-text">{t().bio}</span>
              </label>
              <textarea
                class="textarea textarea-bordered w-full"
                rows="3"
                placeholder={t().bio.toLowerCase() + "..."}
                value={profileForm().bio}
                onInput={(e) => setProfileForm({...profileForm(), bio: e.target.value})}
              ></textarea>
            </div>

            <div class="flex justify-end">
              <button
                class="btn btn-primary"
                onClick={saveProfile}
                disabled={saving()}
              >
                <Show when={saving()}>
                  <span class="loading loading-spinner loading-sm"></span>
                </Show>
                {t().save}
              </button>
            </div>
          </div>
        </Show>

        {/* Preferences Tab */}
        <Show when={activeTab() === 'preferences'}>
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">{t().preferences}</h2>

            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold mb-4">{t().notifications}</h3>
                <div class="space-y-3">
                  <label class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">{t().emailNotifications}</span>
                      <p class="text-sm text-base-content/60">{t().emailNotifications.toLowerCase()}</p>
                    </div>
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      checked={preferencesForm().notifications.email}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm(),
                        notifications: { ...preferencesForm().notifications, email: e.target.checked }
                      })}
                    />
                  </label>

                  <label class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">Browser Notifications</span>
                      <p class="text-sm text-base-content/60">Show desktop notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      checked={preferencesForm().notifications.browser}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm(),
                        notifications: { ...preferencesForm().notifications, browser: e.target.checked }
                      })}
                    />
                  </label>

                  <label class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">Project Updates</span>
                      <p class="text-sm text-base-content/60">Get notified about project changes</p>
                    </div>
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      checked={preferencesForm().notifications.projectUpdates}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm(),
                        notifications: { ...preferencesForm().notifications, projectUpdates: e.target.checked }
                      })}
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-semibold mb-4">Privacy</h3>
                <div class="space-y-3">
                  <div>
                    <label class="label">
                      <span class="label-text">Profile Visibility</span>
                    </label>
                    <select
                      class="select select-bordered w-full"
                      value={preferencesForm().privacy.profileVisibility}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm(),
                        privacy: { ...preferencesForm().privacy, profileVisibility: e.target.value }
                      })}
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                class="btn btn-primary"
                onClick={savePreferences}
                disabled={saving()}
              >
                <Show when={saving()}>
                  <span class="loading loading-spinner loading-sm"></span>
                </Show>
                Save Preferences
              </button>
            </div>
          </div>
        </Show>

        {/* Appearance Tab */}
        <Show when={activeTab() === 'appearance'}>
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Appearance</h2>

            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold mb-4">Theme</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    class={`p-4 border-2 rounded-lg transition-all ${
                      currentTheme() === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-base-content/20'
                    }`}
                    onClick={() => changeTheme('light')}
                  >
                    <div class="text-center">
                      <div class="w-12 h-12 bg-white border border-base-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <div class="w-6 h-6 bg-yellow-400 rounded-full"></div>
                      </div>
                      <h4 class="font-medium">Light</h4>
                      <p class="text-sm text-base-content/60">Clean and bright</p>
                    </div>
                  </button>

                  <button
                    class={`p-4 border-2 rounded-lg transition-all ${
                      currentTheme() === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-base-content/20'
                    }`}
                    onClick={() => changeTheme('dark')}
                  >
                    <div class="text-center">
                      <div class="w-12 h-12 bg-gray-900 border border-base-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <div class="w-6 h-6 bg-gray-600 rounded-full"></div>
                      </div>
                      <h4 class="font-medium">Dark</h4>
                      <p class="text-sm text-base-content/60">Easy on the eyes</p>
                    </div>
                  </button>

                  <button
                    class={`p-4 border-2 rounded-lg transition-all ${
                      currentTheme() === 'auto'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-base-content/20'
                    }`}
                    onClick={() => changeTheme('auto')}
                  >
                    <div class="text-center">
                      <div class="w-12 h-12 bg-gradient-to-r from-yellow-400 to-gray-600 border border-base-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <div class="w-6 h-6 bg-gray-800 rounded-full"></div>
                      </div>
                      <h4 class="font-medium">Auto</h4>
                      <p class="text-sm text-base-content/60">Follow system</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Account Tab */}
        <Show when={activeTab() === 'account'}>
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Account Security</h2>

            <div class="space-y-6">
               <div class="card bg-base-200">
                 <div class="card-body">
                   <h3 class="card-title">{t().changePassword}</h3>
                  <div class="space-y-4">
                    <input type="password" placeholder="Current password" class="input input-bordered w-full" />
                    <input type="password" placeholder="New password" class="input input-bordered w-full" />
                    <input type="password" placeholder="Confirm new password" class="input input-bordered w-full" />
                    <button class="btn btn-primary">Update Password</button>
                  </div>
                </div>
              </div>

               <div class="card bg-base-200">
                 <div class="card-body">
                   <h3 class="card-title">{t().twoFactorAuth}</h3>
                   <p class="text-base-content/70 mb-4">
                     Add an extra layer of security to your account.
                   </p>
                   <div class="badge badge-warning">{t().notConfigured}</div>
                  <button class="btn btn-outline mt-4">Enable 2FA</button>
                </div>
              </div>

               <div class="card bg-base-200">
                 <div class="card-body">
                   <h3 class="card-title text-error">{t().dangerZone}</h3>
                  <p class="text-base-content/70 mb-4">
                    Irreversible and destructive actions.
                  </p>
                  <button class="btn btn-error btn-outline" onClick={deleteAccount}>
                    <i data-lucide="trash" class="w-4 h-4 mr-2"></i>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Data & Privacy Tab */}
        <Show when={activeTab() === 'data'}>
          <div class="space-y-6">
            <h2 class="text-2xl font-bold">Data & Privacy</h2>

            <div class="space-y-6">
               <div class="card bg-base-200">
                 <div class="card-body">
                   <h3 class="card-title">{t().exportYourData}</h3>
                  <p class="text-base-content/70 mb-4">
                    Download a copy of all your data including projects, settings, and usage history.
                  </p>
                  <button class="btn btn-outline" onClick={exportData}>
                    <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                    Export Data
                  </button>
                </div>
              </div>

               <div class="card bg-base-200">
                 <div class="card-body">
                   <h3 class="card-title">{t().dataUsage}</h3>
                  <div class="stats stats-vertical lg:stats-horizontal">
                    <div class="stat">
                      <div class="stat-title">Projects</div>
                      <div class="stat-value">12</div>
                      <div class="stat-desc">Active projects</div>
                    </div>
                    <div class="stat">
                      <div class="stat-title">Credits Used</div>
                      <div class="stat-value">{user().credits.balance}</div>
                      <div class="stat-desc">This month</div>
                    </div>
                    <div class="stat">
                      <div class="stat-title">Storage</div>
                      <div class="stat-value">2.4MB</div>
                      <div class="stat-desc">Used space</div>
                    </div>
                  </div>
                </div>
              </div>

               <div class="card bg-warning/10 border-warning">
                 <div class="card-body">
                   <h3 class="card-title text-warning">{t().privacySettings}</h3>
                  <div class="space-y-3">
                    <label class="flex items-center justify-between">
                      <div>
                        <span class="font-medium">Analytics & Tracking</span>
                        <p class="text-sm text-base-content/60">Help improve our services</p>
                      </div>
                      <input
                        type="checkbox"
                        class="toggle toggle-warning"
                        checked={preferencesForm().privacy.dataSharing}
                        onChange={(e) => setPreferencesForm({
                          ...preferencesForm(),
                          privacy: { ...preferencesForm().privacy, dataSharing: e.target.checked }
                        })}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Settings;