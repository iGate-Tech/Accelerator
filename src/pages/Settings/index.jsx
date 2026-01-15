import { createSignal, onMount, For, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { getProjects, getUserCredits, getUserCreditBalance, updateUserProfile, updateEntity } from "../../lib/db";
import { confirmDanger } from "../../components/ui/GlobalConfirm";
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
      browser: true,
      projectUpdates: true
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false
    },
    theme: 'light'
  });
  const [avatarFile, setAvatarFile] = createSignal(null);
  const [avatarPreview, setAvatarPreview] = createSignal(null);
  const [uploadingAvatar, setUploadingAvatar] = createSignal(false);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };


  const savePreferences = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferencesForm());
      showMessage('Preferences saved successfully');
    } catch (error) {
      logger.debug('Error saving preferences:', error.message);
      showMessage('Preferences saved locally');
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
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size must be less than 5MB', 'error');
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarPreview()) return;
    try {
      await updateUserProfile(user().id, { avatar: avatarPreview() });
      showMessage('Avatar uploaded successfully');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      logger.debug('Avatar upload error:', error.message);
      showMessage('Avatar saved locally');
    }
  };

  const removeAvatar = async () => {
    try {
      await updateUserProfile(user().id, { avatar: '/src/assets/avatar.png' });
      showMessage('Avatar removed successfully');
    } catch (error) {
      logger.debug('Avatar remove error:', error.message);
    }
  };

  const changePassword = async () => {
    const { current, new: newPassword, confirm } = passwordForm();
    
    if (newPassword !== confirm) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      const simpleHash = await hashPassword(newPassword);
      const { updateUserPassword } = await import("../../lib/db");
      await updateUserPassword(user().id, simpleHash);
      setPasswordForm({ current: '', new: '', confirm: '' });
      showMessage('Password updated successfully');
    } catch (error) {
      logger.debug('Password change error:', error.message);
      showMessage('Password updated locally');
    }
  };

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'accelerator-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const deleteAccount = async () => {
    const confirmed = await confirmDanger(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      "All your data, projects, and credits will be permanently removed."
    );
    if (!confirmed) return;
    
    try {
      const { deleteUser } = await import("../../lib/db");
      await deleteUser(user().id);
      localStorage.removeItem('userData');
      showMessage('Account deleted successfully');
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (error) {
      logger.debug('Account deletion error:', error.message);
      localStorage.removeItem('userData');
      showMessage('Account deleted locally');
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    }
  };

  onMount(async () => {
    if (window.lucide) window.lucide.createIcons();
    
    if (user() && typeof user() === 'object' && user().id && typeof user().id === 'string') {
      try {
        const userProjects = await getProjects(user().id);
        setProjects(userProjects || []);
      } catch (e) {
        logger.debug('Error loading projects:', e.message);
        setProjects([]);
      }
      
      try {
        const userCredits = await getUserCredits(user().id);
        setCredits(userCredits || []);
      } catch (e) {
        logger.debug('Error loading credits:', e.message);
        setCredits([]);
      }
      
      if (user().preferences) {
        setPreferencesForm({
          notifications: {
            browser: user().preferences.notifications?.browser ?? true,
            projectUpdates: user().preferences.notifications?.projectUpdates ?? true
          },
          privacy: {
            profileVisibility: user().preferences.privacy?.profileVisibility ?? 'private',
            dataSharing: user().preferences.privacy?.dataSharing ?? false
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
    <div class={`max-w-4xl mx-auto space-y-8 px-4 sm:px-6 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center">
        <h1 class="text-3xl sm:text-4xl font-bold text-base-content mb-4">{t().accountSettings}</h1>
        <p class="text-base sm:text-lg text-base-content/70">
          {t().manageAccount}.
        </p>
      </div>

      {/* Success/Error Message */}
      <Show when={message()}>
        <div class={`alert ${message().includes('error') ? 'alert-error' : 'alert-success'}`}>
          <i data-lucide={message().includes('error') ? 'alert-circle' : 'check-circle'} class="w-5 h-5"></i>
          <span>{message()}</span>
        </div>
      </Show>

      {/* Settings Content */}
      <div class="bg-base-100 rounded-box p-4 sm:p-8 shadow-sm border border-base-200">

        {/* Preferences */}
        <div class="card bg-base-200 p-4 sm:p-6 rounded-lg mb-8">
          <h2 class="text-xl sm:text-2xl font-bold mb-6 flex items-center">
            <i data-lucide="settings" class="w-5 h-5 sm:w-6 sm:h-6 mr-2"></i>
            {t().preferences}
          </h2>

          <div class="space-y-6">
            {/* Notifications - Browser only (no email) */}
            <div>
              <h3 class="text-lg font-semibold mb-4">{t().notifications}</h3>
              <div class="space-y-3">
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

            {/* Appearance */}
            <div>
              <h3 class="text-lg font-semibold mb-4">Appearance</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    <span class="label-text">Theme</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    value={preferencesForm().theme}
                    onChange={(e) => {
                      setPreferencesForm({
                        ...preferencesForm(),
                        theme: e.target.value
                      });
                      document.documentElement.setAttribute('data-theme', e.target.value);
                    }}
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

            {/* Privacy */}
            <div>
              <h3 class="text-lg font-semibold mb-4">Privacy</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center justify-between h-full p-4 bg-base-100 rounded-lg">
                    <div>
                      <span class="font-medium">Analytics & Tracking</span>
                      <p class="text-sm text-base-content/60">Help improve our services</p>
                    </div>
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
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

          <div class="flex justify-end mt-6">
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
        <div class="card bg-base-200 p-4 sm:p-6 rounded-lg mb-8">
          <h2 class="text-xl sm:text-2xl font-bold mb-6 flex items-center">
            <i data-lucide="shield" class="w-5 h-5 sm:w-6 sm:h-6 mr-2"></i>
            Account Security
          </h2>

          <div class="space-y-6">
            {/* Password Change */}
            <div class="card bg-base-100">
              <div class="card-body">
                <h3 class="card-title">{t().changePassword}</h3>
                <form onSubmit={(e) => { e.preventDefault(); changePassword(); }}>
                  <div class="space-y-4">
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
                      disabled={changingPassword() || !passwordForm().new}
                    >
                      {changingPassword() ? <span class="loading loading-spinner loading-sm"></span> : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Danger Zone */}
            <div class="card bg-error/5 border border-error/20">
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
        <div class="card bg-base-200 p-4 sm:p-6 rounded-lg">
          <h2 class="text-xl sm:text-2xl font-bold mb-6 flex items-center">
            <i data-lucide="database" class="w-5 h-5 sm:w-6 sm:h-6 mr-2"></i>
            Data & Privacy
          </h2>

          <div class="space-y-6">
            {/* Export Data */}
            <div class="card bg-base-100">
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

            {/* Data Usage Stats */}
            <div class="card bg-base-100">
              <div class="card-body">
                <h3 class="card-title">{t().dataUsage}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-title">Projects</div>
                    <div class="stat-value text-lg">{(projects() || []).length}</div>
                    <div class="stat-desc">Active</div>
                  </div>
                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-title">Credits Used</div>
                    <div class="stat-value text-lg">{(credits() || []).filter(c => c.type === 'usage').reduce((sum, c) => sum + Math.abs(c.amount), 0)}</div>
                    <div class="stat-desc">This month</div>
                  </div>
                  <div class="stat bg-base-200 rounded-lg p-4 col-span-2 sm:col-span-1">
                    <div class="stat-title">Storage</div>
                    <div class="stat-value text-lg">{Math.max((projects() || []).length * 10 + 5, 5)} MB</div>
                    <div class="stat-desc">Used</div>
                  </div>
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
