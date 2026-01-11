import { createSignal, onMount, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { getUserCredits, getUserCreditBalance, getProjects } from "../../lib/db";
import { formatLocaleDate } from "../../lib/utils";
import { toastManager } from "../../lib/feedback";
import avatar from "../../assets/avatar.png";
import { supabase } from "../../lib/supabase";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, checkAuth } = useUser();
  const { currentLang, t } = useLanguage();
  const [credits, setCredits] = createSignal([]);
  const [creditBalance, setCreditBalance] = createSignal(0);
  const [projectsCount, setProjectsCount] = createSignal(0);
  const [storageUsed, setStorageUsed] = createSignal(0);
  const [avatarFile, setAvatarFile] = createSignal(null);
  const [avatarPreview, setAvatarPreview] = createSignal(null);
  const [uploadingAvatar, setUploadingAvatar] = createSignal(false);
  const [editingProfile, setEditingProfile] = createSignal(false);
  const [profileForm, setProfileForm] = createSignal({
    name: '',
    bio: ''
  });

  // Redirect if not authenticated
  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { replace: true });
    }
  });

   onMount(async () => {
    if (window.lucide) window.lucide.createIcons();
    if (user() && typeof user().id === 'string') {
      // Refresh profile data
      await checkAuth();

      try {
        const userCredits = await getUserCredits(user().id);
        setCredits(userCredits || []);
      } catch (e) {
        console.error('Error loading credits:', e);
        setCredits([]);
      }
      try {
        const balance = await getUserCreditBalance(user().id);
        setCreditBalance(balance);
      } catch (e) {
        console.error('Error loading credit balance:', e);
        setCreditBalance(0);
      }
      try {
        const userProjects = await getProjects(user().id);
        setProjectsCount(userProjects.length);
      } catch (e) {
        console.error('Error loading projects:', e);
        setProjectsCount(0);
      }
      try {
        const { data, error } = await supabase.storage.from('avatars').list(user().id + '/');
        if (!error && data && data.length > 0) {
          const fileName = data[0].name;
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(user().id + '/' + fileName);
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length')) || 0;
          setStorageUsed((size / (1024 * 1024)).toFixed(2));
        } else {
          setStorageUsed(0);
        }
      } catch (e) {
        console.error('Error loading storage used:', e);
        setStorageUsed(0);
      }
    }
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const formatDate = (dateString) => formatLocaleDate(dateString, currentLang());

  const getCreditUsage = () => {
    const transactions = credits() || [];
    const usage = transactions.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return usage;
  };

  const getLastActivity = () => {
    const transactions = credits() || [];
    if (transactions.length === 0) return null;
    const latest = transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return new Date(latest.date);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastManager.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastManager.error('File size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile()) return;

    setUploadingAvatar(true);
    try {
      const fileName = `${user().id}/${Date.now()}.${avatarFile().name.split('.').pop()}`;
      console.log('Attempting to upload file:', fileName, 'to bucket: avatars');

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile(), {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      console.log('Upload successful, getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL obtained:', publicUrl);
      await updateProfile({ avatar: publicUrl });
      setAvatarFile(null);
      setAvatarPreview(null);
      toastManager.success('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toastManager.error(`Failed to upload avatar: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return;
    try {
      await updateProfile({ avatar: '/src/assets/avatar.png' });
      toastManager.success('Avatar removed successfully');
    } catch (error) {
      toastManager.error('Failed to remove avatar');
    }
  };

  const saveProfile = async () => {
    try {
      const form = profileForm();
      await updateProfile({
        name: form.name.trim() || user().profile?.name,
        bio: form.bio.trim()
      });
      setEditingProfile(false);
      toastManager.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toastManager.error('Failed to update profile');
    }
  };

  const startEditing = () => {
    setProfileForm({
      name: user().profile?.name || '',
      bio: user().profile?.bio || ''
    });
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    setEditingProfile(false);
    setProfileForm({ name: '', bio: '' });
  };

  return (
    <div class={`max-w-6xl mx-auto space-y-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().profile}</h1>
        <p class="text-lg text-base-content/70">
          {t().viewManageProfile}
        </p>
        <Show when={editingProfile()}>
          <div class="flex justify-center gap-2 mt-4">
            <button
              class="btn btn-primary"
              onClick={saveProfile}
            >
              Save Profile
            </button>
            <button
              class="btn btn-ghost"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </Show>
      </div>

      <Show when={user()}>
        {/* Profile Header Card */}
        <div class="card bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 border border-primary/20">
          <div class="card-body">
            <div class="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Section */}
              <div class="avatar relative">
                <div class="w-32 h-32 rounded-full ring ring-primary/30 ring-offset-base-100 ring-offset-4">
                  <img
                    src={avatarPreview() || (user().avatar && user().avatar !== '/src/assets/avatar.png' ? user().avatar : avatar)}
                    alt="Profile avatar"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  id="avatar-input"
                />
                <label for="avatar-input" class="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary">
                  <i data-lucide="camera" class="w-4 h-4"></i>
                </label>
              </div>

               {/* User Info */}
               <div class="flex-1 text-center md:text-left">
                 <Show when={editingProfile()} fallback={
                   <>
                     <h2 class="text-3xl font-bold text-base-content">{user().profile?.name || 'User'}</h2>
                     <p class="text-xl text-base-content/70 mb-2">{user().profile?.email || user().email}</p>
                     <p class="text-base text-base-content/60 mb-4">{user().profile?.bio || 'No bio yet'}</p>
                   </>
                 }>
                   <div class="space-y-2">
                     <input
                       type="text"
                       class="input input-bordered text-3xl font-bold text-center md:text-left"
                       placeholder="Enter your full name"
                       value={profileForm().name}
                       onInput={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                     />
                     <p class="text-xl text-base-content/70">{user().profile?.email || user().email}</p>
                     <textarea
                       class="textarea textarea-bordered text-base text-center md:text-left"
                       placeholder="Tell us about yourself..."
                       rows="2"
                       value={profileForm().bio}
                       onInput={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                     ></textarea>
                   </div>
                 </Show>

                <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <div class="badge badge-primary badge-outline">
                    <i data-lucide="calendar" class="w-3 h-3 mr-1"></i>
                    Joined {formatDate(user().profile?.joinDate || user().created_at)}
                  </div>
                  <div class="badge badge-secondary badge-outline">
                    <i data-lucide="star" class="w-3 h-3 mr-1"></i>
                    {user().subscription?.plan || 'Free'} Plan
                  </div>
                </div>

                {/* Avatar Controls */}
                {avatarFile() && (
                  <div class="flex gap-2 mt-4">
                    <button
                      class="btn btn-primary btn-sm"
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar()}
                    >
                      {uploadingAvatar() ? <span class="loading loading-spinner loading-sm"></span> : 'Upload'}
                    </button>
                    <button
                      class="btn btn-ghost btn-sm"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {!avatarFile() && user().avatar !== '/src/assets/avatar.png' && (
                  <button
                    class="btn btn-outline btn-sm mt-4"
                    onClick={removeAvatar}
                  >
                    Remove Avatar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info & Activity */}
          <div class="lg:col-span-2 space-y-6">
             {/* Personal Information */}
             <div class="card bg-base-100 shadow-sm border border-base-200">
               <div class="card-body">
                 <div class="flex justify-between items-center">
                   <h3 class="card-title">
                     <i data-lucide="user" class="w-5 h-5 mr-2"></i>
                     {t().personalInformation}
                   </h3>
                   <Show when={!editingProfile()}>
                     <button
                       class="btn btn-outline btn-sm"
                       onClick={startEditing}
                     >
                       <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
                       Edit
                     </button>
                   </Show>
                 </div>
                 <div class="space-y-4">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label class="label">
                         <span class="label-text font-medium">{t().fullName}</span>
                       </label>
                       <Show when={editingProfile()} fallback={
                         <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                           <i data-lucide="user" class="w-4 h-4 text-base-content/60"></i>
                           <span>{user().profile?.name || 'Not set'}</span>
                         </div>
                       }>
                         <input
                           type="text"
                           class="input input-bordered w-full"
                           placeholder="Enter your full name"
                           value={profileForm().name}
                           onInput={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                         />
                       </Show>
                     </div>
                     <div>
                       <label class="label">
                         <span class="label-text font-medium">{t().emailAddress}</span>
                       </label>
                       <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                         <i data-lucide="mail" class="w-4 h-4 text-base-content/60"></i>
                         <span>{user().profile?.email || user().email}</span>
                       </div>
                     </div>
                   </div>
                   <div>
                     <label class="label">
                       <span class="label-text font-medium">{t().bio}</span>
                     </label>
                     <Show when={editingProfile()} fallback={
                       <div class="p-3 bg-base-200 rounded-lg">
                         <p class="text-base-content/80">{user().profile?.bio || t().noBioYet}</p>
                       </div>
                     }>
                       <textarea
                         class="textarea textarea-bordered w-full"
                         placeholder="Tell us about yourself..."
                         rows="3"
                         value={profileForm().bio}
                         onInput={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                       ></textarea>
                     </Show>
                   </div>
                   <div>
                     <label class="label">
                       <span class="label-text font-medium">{t().memberSince}</span>
                     </label>
                     <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                       <i data-lucide="calendar" class="w-4 h-4 text-base-content/60"></i>
                       <span>{formatDate(user().profile?.joinDate || user().created_at)}</span>
                     </div>
                   </div>
                   <Show when={editingProfile()}>
                     <div class="flex gap-2 pt-4">
                       <button
                         class="btn btn-primary btn-sm"
                         onClick={saveProfile}
                       >
                         Save Changes
                       </button>
                       <button
                         class="btn btn-ghost btn-sm"
                         onClick={cancelEditing}
                       >
                         Cancel
                       </button>
                     </div>
                   </Show>
                 </div>
               </div>
             </div>

            {/* Recent Activity */}
            <div class="card bg-base-100 shadow-sm border border-base-200">
              <div class="card-body">
                <h3 class="card-title">
                  <i data-lucide="activity" class="w-5 h-5 mr-2"></i>
                  {t().recentActivity}
                </h3>
                <div class="space-y-3">
                   {(credits() || []).slice(0, 5).map((transaction) => (
                    <div class="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                      <div class={`p-2 rounded-full ${transaction.amount > 0 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                        <i data-lucide={transaction.amount > 0 ? 'plus' : 'minus'} class="w-4 h-4"></i>
                      </div>
                      <div class="flex-1">
                        <p class="font-medium">{transaction.description}</p>
                        <p class="text-sm text-base-content/60">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div class={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-error'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </div>
                    </div>
                  ))}
                   {(credits() || []).length === 0 && (
                    <div class="text-center py-8 text-base-content/60">
                      <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                      <p>{t().noRecentActivity}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div class="space-y-6">
            {/* Subscription Status */}
            <div class="card bg-base-100 shadow-sm border border-base-200">
              <div class="card-body">
                <h3 class="card-title">
                  <i data-lucide="credit-card" class="w-5 h-5 mr-2"></i>
                  {t().subscription}
                </h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{t().plan}</span>
                    <span class="badge badge-primary">{(user().subscription?.plan || 'free').toUpperCase()}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{t().status}</span>
                    <span class={`badge ${user().subscription?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {user().subscription?.status || 'inactive'}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{t().credits}</span>
                     <span class="font-semibold">{creditBalance() || 0} / {user().subscription?.maxCredits || 100}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{t().renewal}</span>
                    <span class="text-sm">{user().subscription?.renewalDate ? formatDate(user().subscription.renewalDate) : 'N/A'}</span>
                  </div>
                  <div class="w-full bg-base-200 rounded-full h-2">
                    <div
                      class="bg-primary h-2 rounded-full"
                      style={`width: ${Math.min((creditBalance() || 0) / (user().subscription?.maxCredits || 100) * 100, 100)}%`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div class="card bg-base-100 shadow-sm border border-base-200">
              <div class="card-body">
                <h3 class="card-title">
                  <i data-lucide="bar-chart" class="w-5 h-5 mr-2"></i>
                  {t().statistics}
                </h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span>{t().totalCreditsUsed}</span>
                    <span class="font-semibold">{getCreditUsage()}</span>
                  </div>
                   <div class="flex justify-between">
                     <span>{t().projects}</span>
                     <span class="font-semibold">{projectsCount()}</span>
                   </div>
                   <div class="flex justify-between">
                     <span>{t().storageUsed}</span>
                     <span class="font-semibold">{storageUsed()} MB</span>
                   </div>
                  {getLastActivity() && (
                    <div class="flex justify-between">
                      <span>{t().lastActivity}</span>
                      <span class="font-semibold text-sm">
                        {formatDate(getLastActivity().toISOString().split('T')[0])}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Profile;