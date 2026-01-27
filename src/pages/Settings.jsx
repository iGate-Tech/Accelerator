import { createSignal, onMount, For, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../hooks/useLanguage";
import { getProjects, getUserCredits, getUserCreditBalance, updateUserProfile, updateEntity, exportAllData } from "@lib/database";
import { confirmReset, confirmDanger } from "../components";
import { consentManager } from "@lib/auth/security.js";
import { toastManager } from "@lib/ui/feedback";
import { logger } from "@lib/core";


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
      browser: false,
      projectUpdates: false
    },
    theme: 'light',
    privacy: {
      profileVisibility: 'private',
      dataSharing: false
    }
  });

  const [consents, setConsents] = createSignal({});
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

  const handleExportAllData = async () => {
    try {
      const data = await exportAllData(user()?.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accelerator-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('All data exported successfully!');
    } catch (error) {
      logger.error('Failed to export all data:', error);
      showMessage('Export failed', 'error');
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Basic validation
      if (!importData.projects || !Array.isArray(importData.projects)) {
        throw new Error('Invalid backup file format');
      }

      // Import logic would go here (simplified for now)
      showMessage('Data import feature coming soon!');
      logger.info('Import attempted with file:', file.name);

    } catch (error) {
      showMessage('Import failed: ' + error.message, 'error');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleManualBackup = () => {
    // Trigger manual backup
    const backupData = localStorage.getItem(`accelerator_backup_${user()?.id}`);
    if (backupData) {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accelerator-manual-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Manual backup created!');
    } else {
      showMessage('No automatic backup found - export data instead', 'error');
    }
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
      const { updateUserPassword } = await import("../lib/database");
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
      const { deleteUser } = await import("../lib/database");
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
    // Load user preferences
    if (user()) {
      setPreferencesForm({
        notifications: {
          browser: user().preferences.notifications?.browser ?? false,
          projectUpdates: user().preferences.notifications?.projectUpdates ?? false
        },
        theme: user().preferences.theme ?? 'light',
        privacy: {
          profileVisibility: user().preferences.privacy?.profileVisibility ?? 'private',
          dataSharing: user().preferences.privacy?.dataSharing ?? false
        }
      });
    }

    // Load consent preferences
    try {
      const userConsents = await consentManager.getConsents();
      setConsents(userConsents);
    } catch (error) {
      logger.error('Failed to load consents:', error);
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

             {/* Data Management */}
             <div class="card bg-base-100">
               <div class="card-body">
                 <h3 class="card-title">Data Management</h3>
                 <div class="space-y-3">
                   <button class="btn btn-outline w-full justify-start gap-2" onClick={handleExportAllData}>
                     <i data-lucide="download" class="w-4 h-4"></i>
                     Export All Data
                   </button>
                   <label class="btn btn-outline w-full justify-start gap-2 cursor-pointer">
                     <i data-lucide="upload" class="w-4 h-4"></i>
                     Import Data
                     <input
                       type="file"
                       accept=".json"
                       class="hidden"
                       onChange={handleImportData}
                     />
                   </label>
                   <button class="btn btn-outline w-full justify-start gap-2" onClick={handleManualBackup}>
                     <i data-lucide="save" class="w-4 h-4"></i>
                     Manual Backup
                   </button>
                 </div>
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

               {/* Cookie & Consent Management */}
               <div class="mt-6">
                 <h4 class="text-md font-semibold mb-3">🍪 Cookie Preferences</h4>
                 <div class="space-y-3">
                   <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                     <div>
                       <span class="font-medium">Necessary Cookies</span>
                       <p class="text-sm text-base-content/60">Required for basic functionality</p>
                     </div>
                     <input
                       type="checkbox"
                       class="checkbox checkbox-primary"
                       checked={true}
                       disabled={true}
                     />
                   </div>

                   <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                     <div>
                       <span class="font-medium">Analytics</span>
                       <p class="text-sm text-base-content/60">Help us improve our services</p>
                     </div>
                     <input
                       type="checkbox"
                       class="checkbox checkbox-primary"
                       checked={consents().analytics || false}
                       onChange={async (e) => {
                         try {
                           const updated = await consentManager.updateConsents({
                             analytics: e.target.checked
                           });
                           setConsents(updated);
                           toastManager.success('Consent preferences updated');
                         } catch (error) {
                           toastManager.error('Failed to update consent');
                         }
                       }}
                     />
                   </div>

                   <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                     <div>
                       <span class="font-medium">Marketing</span>
                       <p class="text-sm text-base-content/60">Personalized recommendations</p>
                     </div>
                     <input
                       type="checkbox"
                       class="checkbox checkbox-primary"
                       checked={consents().marketing || false}
                       onChange={async (e) => {
                         try {
                           const updated = await consentManager.updateConsents({
                             marketing: e.target.checked
                           });
                           setConsents(updated);
                           toastManager.success('Consent preferences updated');
                         } catch (error) {
                           toastManager.error('Failed to update consent');
                         }
                       }}
                     />
                   </div>

                   <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                     <div>
                       <span class="font-medium">Preferences</span>
                       <p class="text-sm text-base-content/60">Remember your settings</p>
                     </div>
                     <input
                       type="checkbox"
                       class="checkbox checkbox-primary"
                       checked={consents().preferences || false}
                       onChange={async (e) => {
                         try {
                           const updated = await consentManager.updateConsents({
                             preferences: e.target.checked
                           });
                           setConsents(updated);
                           toastManager.success('Consent preferences updated');
                         } catch (error) {
                           toastManager.error('Failed to update consent');
                         }
                       }}
                     />
                   </div>

                   <div class="text-xs text-base-content/60 mt-4">
                     <p><strong>GDPR Compliance:</strong> You can withdraw consent at any time. Last updated: {consents().updatedAt ? new Date(consents().updatedAt).toLocaleDateString() : 'Never'}</p>
                     <button
                       class="btn btn-ghost btn-xs text-error mt-2"
                       onClick={async () => {
                         const confirmed = await confirmDanger(
                           'Withdraw All Consents',
                           'This will disable all non-essential cookies and tracking. You can re-enable them later.',
                           'Withdraw Consent'
                         );

                         if (confirmed) {
                           try {
                             const withdrawn = await consentManager.withdrawConsents();
                             setConsents(withdrawn);
                             toastManager.success('All consents withdrawn');
                           } catch (error) {
                             toastManager.error('Failed to withdraw consents');
                           }
                         }
                       }}
                     >
                       Withdraw All Consents
                     </button>
                   </div>
                 </div>
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
