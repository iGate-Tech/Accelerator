import { createSignal, onMount, For, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { supabase, supabaseAdmin, signOut, deleteFromSupabase } from "../../lib/supabase.js";
import { getProjects, getUserCredits } from "../../lib/db";

const Settings = () => {
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
    }
  });
  const [avatarFile, setAvatarFile] = createSignal(null);
  const [avatarPreview, setAvatarPreview] = createSignal(null);
  const [uploadingAvatar, setUploadingAvatar] = createSignal(false);

  const deleteEntity = async (table, column, value) => {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) throw error;
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };



  const savePreferences = async () => {
    setSaving(true);
    try {
      await updateProfile({ avatar: avatar });
      showMessage('Avatar removed successfully');
    } catch (error) {
      showMessage('Failed to remove avatar', 'error');
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
    if (!avatarFile()) return;

    setUploadingAvatar(true);
    try {
      const fileExt = avatarFile().name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user().id}/${fileName}`;

      console.log('Attempting to upload file:', filePath, 'to bucket: avatars');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile(), {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      console.log('Upload successful, getting public URL...');
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL obtained:', publicUrl);
      // Update user profile
      await updateProfile({ avatar: publicUrl });

      setAvatarFile(null);
      setAvatarPreview(null);
      showMessage('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      showMessage(`Failed to upload avatar: ${error.message}`, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await updateProfile({ avatar: avatar });
      setAvatarPreview(null);
      setAvatarFile(null);
      toastManager.success('Avatar removed successfully!');
    } catch (error) {
      toastManager.error('Failed to remove avatar');
    }
   };

   const changePassword = async () => {
    const form = passwordForm();
    if (!form.current || !form.new || !form.confirm) {
      showMessage('All fields are required', 'error');
      return;
    }
    if (form.new !== form.confirm) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    if (form.new.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.new
      });
      if (error) throw error;

      setPasswordForm({ current: '', new: '', confirm: '' });
      showMessage('Password updated successfully');
    } catch (error) {
      showMessage('Failed to update password', 'error');
      console.error('Password change error:', error);
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
      return;
    }

    try {
      // Try to delete from Supabase first
      if (supabaseAdmin) {
        const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(user().id);
        if (supabaseError) {
          console.warn('Supabase delete failed, proceeding with local cleanup:', supabaseError);
        }
      } else {
        console.warn('Supabase admin not available, skipping remote delete');
      }

      // Clean up local data
      await deleteEntity('profiles', 'id', user().id);
      await deleteEntity('credits', 'user_id', user().id);
      await deleteEntity('notifications', 'user_id', user().id);

      showMessage('Account deleted successfully. You will be logged out.');
      await signOut();
      // Navigate to login or home
       navigate('/auth/login');
    } catch (error) {
      showMessage('Failed to delete account. Please contact support.', 'error');
      console.error('Delete account error:', error);
    }
  };

   onMount(async () => {
     if (window.lucide) window.lucide.createIcons();
      if (user() && typeof user() === 'object' && user().id && typeof user().id === 'string') {
        try {
          const userProjects = await getProjects(user().id);
          setProjects(userProjects || []);
        } catch (e) {
          console.error('Error loading projects:', e);
          setProjects([]);
        }
       try {
         const userCredits = await getUserCredits(user().id);
         setCredits(userCredits || []);
       } catch (e) {
         console.error('Error loading credits:', e);
         setCredits([]);
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
                       <div class="stat-value">0 MB</div>
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