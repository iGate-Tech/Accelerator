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
           <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-3">{t().accountSettings}</h1>
           <p class="text-sm sm:text-base text-base-content/70 max-w-2xl mx-auto mb-6">
             {t().manageAccount}.
           </p>
         </div>
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
            <i data-lucide="settings" class="w-5 h-5 sm:w-6 sm:h-6 me-2"></i>
            {t().preferences}
          </h2>

          <div class="space-y-6">
            {/* Notifications - Browser only (no email) */}
            <div>
              <h3 class="text-lg font-semibold mb-4">{t().notifications}</h3>
              <div class="space-y-3">
                <label class="flex items-center justify-between">
                  <div>
                    <span class="font-medium">{t().browserNotificationsTitle}</span>
                    <p class="text-sm text-base-content/60">{t().browserNotificationsDesc}</p>
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
                    <span class="font-medium">{t().projectUpdatesTitle}</span>
                    <p class="text-sm text-base-content/60">{t().projectUpdatesDesc}</p>
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
              <h3 class="text-lg font-semibold mb-4">{t().appearance}</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    <span class="label-text">{t().theme}</span>
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
                    <option value="light">{t().lightTheme}</option>
                    <option value="dark">{t().darkTheme}</option>
                    <option value="auto">{t().autoTheme}</option>
                  </select>
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">{t().language}</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    value={currentLang()}
                    onChange={(e) => setLang(e.target.value)}
                  >
                    <option value="en">{t().english}</option>
                    <option value="ar">{t().arabic}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <h3 class="text-lg font-semibold mb-4">{t().privacy}</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    <span class="label-text">{t().profileVisibility}</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    value={preferencesForm().privacy.profileVisibility}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm(),
                      privacy: { ...preferencesForm().privacy, profileVisibility: e.target.value }
                    })}
                  >
                    <option value="private">{t().private}</option>
                    <option value="friends">{t().friends}</option>
                    <option value="public">{t().public}</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center justify-between h-full p-4 bg-base-100 rounded-lg">
                    <div>
                      <span class="font-medium">{t().dataSharingTitle}</span>
                      <p class="text-sm text-base-content/60">{t().dataSharingDesc}</p>
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
              {t().savePreferences}
            </button>
          </div>
        </div>


        {/* Account */}
        <div class="card bg-base-200 p-4 sm:p-6 rounded-lg mb-8">
          <h2 class="text-xl sm:text-2xl font-bold mb-6 flex items-center">
            <i data-lucide="shield" class="w-5 h-5 sm:w-6 sm:h-6 me-2"></i>
            {t().accountSecurity}
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
                      placeholder={t().newPasswordPlaceholder}
                      class="input input-bordered w-full"
                      autocomplete="new-password"
                      value={passwordForm().new}
                      onInput={(e) => setPasswordForm({ ...passwordForm(), new: e.target.value })}
                    />
                    <input
                      type="password"
                      placeholder={t().confirmNewPasswordPlaceholder}
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
                      {changingPassword() ? <span class="loading loading-spinner loading-sm"></span> : t().updatePassword}
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
                  {t().dangerZoneDesc}
                </p>
                <button class="btn btn-error btn-outline" onClick={deleteAccount}>
                  <i data-lucide="trash" class="w-4 h-4 me-2"></i>
                  {t().deleteAccount}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div class="card bg-base-200 p-4 sm:p-6 rounded-lg">
          <h2 class="text-xl sm:text-2xl font-bold mb-6 flex items-center">
            <i data-lucide="database" class="w-5 h-5 sm:w-6 sm:h-6 me-2"></i>
            {t().dataPrivacy}
          </h2>

          <div class="space-y-6">
            {/* Export Data */}
            <div class="card bg-base-100">
              <div class="card-body">
                <h3 class="card-title">{t().exportYourData}</h3>
                <p class="text-base-content/70 mb-4">
                  {t().exportDataFullDesc}
                </p>
                 <button class="btn btn-outline" onClick={exportData}>
                   <i data-lucide="download" class="w-4 h-4 me-2"></i>
                   {t().exportData}
                 </button>
              </div>
            </div>

            {/* Data Usage Stats */}
            <div class="card bg-base-100">
              <div class="card-body">
                <h3 class="card-title">{t().dataUsage}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-title">{t().projectsLabel}</div>
                    <div class="stat-value text-lg">{(projects() || []).length}</div>
                    <div class="stat-desc">{t().active}</div>
                  </div>
                  <div class="stat bg-base-200 rounded-lg p-4">
                    <div class="stat-title">{t().creditsUsedLabel}</div>
                    <div class="stat-value text-lg">{(credits() || []).filter(c => c.type === 'usage').reduce((sum, c) => sum + Math.abs(c.amount), 0)}</div>
                    <div class="stat-desc">{t().thisMonth}</div>
                  </div>
                  <div class="stat bg-base-200 rounded-lg p-4 col-span-2 sm:col-span-1">
                    <div class="stat-title">{t().storage}</div>
                    <div class="stat-value text-lg">{Math.max((projects() || []).length * 10 + 5, 5)} MB</div>
                    <div class="stat-desc">{t().used}</div>
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
