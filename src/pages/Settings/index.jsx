import { createSignal, onMount, For, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
// Removed supabase imports
import { getProjects, getUserCredits } from "../../lib/db";
import logger from "../../lib/logger.js";


const Settings = () => {
  logger.trace('Settings: Starting');
  const navigate = useNavigate();
  const { user, updateProfile, updatePreferences } = useUser();
  const { currentLang, t, setLang } = useLanguage();

  const [message, setMessage] = createSignal('');

  const [projects, setProjects] = createSignal([]);
  const [credits, setCredits] = createSignal([]);
  const [passwordForm, setPasswordForm] = createSignal({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = createSignal(false);

  const [saving, setSaving] = createSignal(false);
   const [preferencesForm, setPreferencesForm] = createSignal({
     notifications: {
       email: true,
       browser: true,
       projectUpdates: true
     },
     privacy: {
       profileVisibility: 'public',
       dataSharing: true
     },
     theme: 'light'
   });
  const [avatarFile, setAvatarFile] = createSignal(null);
  const [avatarPreview, setAvatarPreview] = createSignal(null);
  const [uploadingAvatar, setUploadingAvatar] = createSignal(false);

  // Removed deleteEntity for supabase

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };



   const savePreferences = async () => {
     setSaving(true);
     try {
       await updatePreferences(preferencesForm());
       showMessage('Preferences saved successfully');
     } catch (error) {
       logger.error('Error saving preferences:', error);
       showMessage('Failed to save preferences', 'error');
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
    UR
  logger.trace('handleAvatarChange: Starting');L.revokeObjectURL(url);
    showMessage('Data exported successfully!');
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size must be less than 5MB', 'error');
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
    // Avatar upload disabled for PGLite only
    showMessage('Avatar upload not available in local mode', 'error');
  };

  const removeAvatar = async () => {
    // Avatar removal disabled for PGLite only
    toastManager.error('Avatar removal not available in local mode');
  };

   const changePassword = async () => {
    // Password change disabled for PGLite only
    showMessage('Password change not available in local mode', 'error');
  };

  const deleteAccount = async () => {
    // Account deletion disabled for PGLite only
    showMessage('Account deletion not available in local mode', 'error');
  };

   onMount(async () => {
      if (window.lucide) window.lucide.createIcons();
       if (user() && typeof user() === 'object' && user().id && typeof user().id === 'string') {
         try {
           const userProjects = await getProjects(user().id);
           setProjects(userProjects || []);
         } catch (e) {
           logger.error('Error loading projects:', e);
           setProjects([]);
         }
        try {
          const userCredits = await getUserCredits(user().id);
          setCredits(userCredits || []);
        } catch (e) {
          logger.error('Error loading credits:', e);
          setCredits([]);
        }
        // Initialize preferences form
        if (user().preferences) {
          setPreferencesForm({
            notifications: {
              email: user().preferences.notifications?.email ?? true,
              browser: user().preferences.notifications?.browser ?? true,
              projectUpdates: user().preferences.notifications?.projectUpdates ?? true
            },
            privacy: {
              profileVisibility: user().preferences.privacy?.profileVisibility ?? 'public',
              dataSharing: user().preferences.privacy?.dataSharing ?? true
            },
            theme: user().preferences.theme ?? 'light'
          });
        }
      }
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

       {/* Settings Content */}
       <div class="bg-base-100 rounded-box p-8 shadow-sm border border-base-200">

        {/* Preferences */}
        <div class="card bg-base-200 p-6 rounded-lg mb-8">
          <h2 class="text-2xl font-bold mb-6 flex items-center"><i data-lucide="settings" class="w-6 h-6 mr-2"></i>{t().preferences}</h2>

          <div class="space-y-6">
             <div>
               <h3 class="text-lg font-semibold mb-4">{t().notifications}</h3>
               <div class="space-y-3">
                 <label class="flex items-center justify-between">
                   <div>
                     <span class="font-medium">Email Notifications</span>
                     <p class="text-sm text-base-content/60">Receive email updates</p>
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
               <h3 class="text-lg font-semibold mb-4">Appearance</h3>
               <div class="space-y-3">
                 <div>
                   <label class="label">
                     <span class="label-text">Theme</span>
                   </label>
                   <select
                     class="select select-bordered w-full"
                     value={preferencesForm().theme}
                     onChange={(e) => setPreferencesForm({
                       ...preferencesForm(),
                       theme: e.target.value
                     })}
                   >
                     <option value="light">Light</option>
                     <option value="dark">Dark</option>
                     <option value="auto">Auto</option>
                   </select>
                 </div>
                 <div>
                   <label class="label">
                     <span class="label-text">Language</span>
                   </label>
                   <select
                     class="select select-bordered w-full"
                     value={currentLang()}
                     onChange={(e) => setLang(e.target.value)}
                   >
                     <option value="en">English</option>
                     <option value="ar">العربية</option>
                   </select>
                 </div>
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

            <div class="flex justify-end mt-4">
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



        {/* Account */}
        <div class="card bg-base-200 p-6 rounded-lg mb-8">
          <h2 class="text-2xl font-bold mb-6 flex items-center"><i data-lucide="shield" class="w-6 h-6 mr-2"></i>Account Security</h2>

          <div class="space-y-6">
              <div class="card bg-base-200">
                <div class="card-body">
                  <h3 class="card-title">{t().changePassword}</h3>
                  <form onSubmit={(e) => { e.preventDefault(); changePassword(); }}>
                    <div class="space-y-4">
                      <input
                        type="email"
                        value={user()?.email || ''}
                        autocomplete="username"
                        class="hidden"
                        readonly
                      />
                      <input
                        type="password"
                        placeholder="Current password"
                        class="input input-bordered w-full"
                        autocomplete="current-password"
                        value={passwordForm().current}
                        onInput={(e) => setPasswordForm({ ...passwordForm(), current: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        class="input input-bordered w-full"
                        autocomplete="new-password"
                        value={passwordForm().new}
                        onInput={(e) => setPasswordForm({ ...passwordForm(), new: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        class="input input-bordered w-full"
                        autocomplete="new-password"
                        value={passwordForm().confirm}
                        onInput={(e) => setPasswordForm({ ...passwordForm(), confirm: e.target.value })}
                      />
                      <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={changingPassword()}
                      >
                        {changingPassword() ? <span class="loading loading-spinner loading-sm"></span> : 'Update Password'}
                      </button>
                    </div>
                  </form>
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

        {/* Data & Privacy */}
        <div class="card bg-base-200 p-6 rounded-lg mb-8">
          <h2 class="text-2xl font-bold mb-6 flex items-center"><i data-lucide="database" class="w-6 h-6 mr-2"></i>Data & Privacy</h2>

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
                        <div class="stat-value">{(projects() || []).length}</div>
                       <div class="stat-desc">Active projects</div>
                     </div>
                      <div class="stat">
                        <div class="stat-title">Credits Used</div>
                        <div class="stat-value">{(credits() || []).filter(c => c.type === 'usage').reduce((sum, c) => sum + Math.abs(c.amount), 0)}</div>
                        <div class="stat-desc">This month</div>
                      </div>
                      <div class="stat">
                        <div class="stat-title">Storage</div>
                        <div class="stat-value">{projects().length * 10 + 5} MB</div>
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
      </div>
    </div>
  );
};

export default Settings;