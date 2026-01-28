import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import {
  getUserCredits,
  getUserCreditBalance,
  getProjects,
  getUserById,
  updateUserProfile,
} from '@lib/database';
import { formatLocaleDate } from '@lib/generalUtils';
import { toastManager } from '@lib/ui/feedback';
import { confirmDelete } from '../components';
import { profileTranslations } from '../assets/translations/translations-index.js';
import { logger } from '@lib/core';

const Profile = () => {
  logger.trace('Profile: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, updatePreferences, checkAuth } =
    useUser();
  const { currentLang, t: langT } = useLanguage();

  // Get profile translations reactively
  const t = () => {
    const langKey = currentLang() || 'ar';
    return profileTranslations[langKey] || profileTranslations.ar;
  };

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
    bio: '',
    location: '',
    website: '',
  });
  const [preferences, setPreferences] = createSignal({
    notifications: { email: true, browser: false, projectUpdates: true },
    privacy: { profileVisibility: 'private', dataSharing: false },
  });
  const [exportingData, setExportingData] = createSignal(false);

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
        logger.error('Error loading credits:', e);
        setCredits([]);
      }
      try {
        const balance = await getUserCreditBalance(user().id);
        setCreditBalance(balance);
      } catch (e) {
        logger.error('Error loading credit balance:', e);
        setCreditBalance(0);
      }
      try {
        const userProjects = await getProjects(user().id);
        setProjectsCount(userProjects.length);
        // Rough storage calculation: 10MB per project + base 5MB
        setStorageUsed(userProjects.length * 10 + 5);
      } catch (e) {
        logger.error('Error loading projects:', e);
        setProjectsCount(0);
        setStorageUsed(5);
      }
      try {
        const userData = await getUserById(user().id);
        if (userData) {
          setProfileForm({
            name: userData.name || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
          });
        }
      } catch (e) {
        logger.error('Error loading user data:', e);
      }
    }
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const formatDate = dateString => formatLocaleDate(dateString, currentLang());

  const getCreditUsage = () => {
    const transactions = credits() || [];
    const usage = transactions
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return usage;
  };

  const getLastActivity = () => {
    const transactions = credits() || [];
    if (transactions.length === 0) return null;
    const latest = transactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
    const date = new Date(latest.date);
    return isNaN(date.getTime()) ? null : date;
  };

  const translateTransaction = description => {
    if (!description) return '';
    const desc = description.toLowerCase();
    if (desc.includes('initialization') || desc.includes('تهيئة'))
      return t().stepInitialization;
    if (desc.includes('chat') || desc.includes('دردشة')) return t().chatMessage;
    if (desc.includes('llm') || desc.includes('LLM'))
      return t().quickLlmRequest;
    if (desc.includes('payment') || desc.includes('دفع')) {
      const match = description.match(/(\d+)/);
      const amount = match ? match[1] : '';
      return t().paymentCredits.replace('{amount}', amount);
    }
    if (
      desc.includes('purchased') ||
      desc.includes('purchase') ||
      desc.includes('شراء') ||
      desc.includes('تم شراء')
    ) {
      const amountMatch = description.match(/(\d+)/);
      const priceMatch = description.match(/\$([\d.]+)/);
      const amount = amountMatch ? amountMatch[1] : '';
      const price = priceMatch ? priceMatch[1] : '';
      return t()
        .purchasedCredits.replace('{amount}', amount)
        .replace('{price}', price);
    }
    return description;
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastManager.error(t().pleaseSelectImage);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastManager.error(t().fileSizeLimit);
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = e => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (avatarPreview()) {
      setUploadingAvatar(true);
      try {
        await updateUserProfile(user().id, { avatar: avatarPreview() });
        await checkAuth();
        setAvatarFile(null);
        setAvatarPreview(null);
        toastManager.success(t().avatarUpdated);
      } catch (error) {
        logger.error('Avatar update error:', error);
        toastManager.error(t().avatarUpdateFailed);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const saveProfile = async () => {
    try {
      const form = profileForm();
      const updates = {
        name: form.name.trim() || user().profile?.name,
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
      };
      if (avatarPreview()) {
        updates.avatar = avatarPreview();
        setAvatarFile(null);
        setAvatarPreview(null);
      }
      await updateUserProfile(user().id, updates);
      await checkAuth();
      setEditingProfile(false);
      toastManager.success(t().profileUpdated);
    } catch (error) {
      logger.error('Profile update error:', error);
      toastManager.error(t().profileUpdateFailed);
    }
  };

  const startEditing = () => {
    setProfileForm({
      name: user().profile?.name || '',
      bio: user().profile?.bio || '',
      location: user().profile?.location || '',
      website: user().profile?.website || '',
    });
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    setEditingProfile(false);
    setProfileForm({ name: '', bio: '', location: '', website: '' });
  };

  // Preferences management
  const savePreferences = async () => {
    try {
      await updatePreferences(preferences());
      toastManager.success(
        t().preferencesUpdated || 'Preferences updated successfully'
      );
    } catch (error) {
      logger.error('Preferences update error:', error);
      toastManager.error(
        t().preferencesUpdateFailed || 'Failed to update preferences'
      );
    }
  };

  const handlePreferenceChange = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  // Data export functionality (GDPR compliance)
  const exportPersonalData = async () => {
    try {
      setExportingData(true);

      // Gather all user data
      const userData = user();
      const userProjects = await getProjects(user().id);
      const userCredits = await getUserCredits(user().id);
      const creditBalance = await getUserCreditBalance(user().id);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userData.id,
        personalData: {
          profile: userData.profile,
          preferences: userData.preferences,
          joinDate: userData.profile?.joinDate,
          email: userData.email,
        },
        projects: userProjects,
        credits: {
          balance: creditBalance,
          transactions: userCredits,
        },
        dataRetention: {
          exportUnder: 'GDPR Article 20 - Right to Data Portability',
          retentionPeriod: 'Data retained until account deletion',
          lastActivity: getLastActivity()?.toISOString(),
        },
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileName = `personal-data-export-${userData.id}-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();

      toastManager.success(
        t().dataExported || 'Personal data exported successfully'
      );
    } catch (error) {
      logger.error('Data export error:', error);
      toastManager.error(
        t().dataExportFailed || 'Failed to export personal data'
      );
    } finally {
      setExportingData(false);
    }
  };

  return (
    <div class="mx-auto max-w-6xl space-y-8 overflow-visible px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div class="py-6">
        <div class="mb-4 flex justify-start">
          <button
            onClick={() => navigate('/')}
            class="btn btn-ghost btn-sm gap-2"
          >
            <svg
              class="h-4 w-4 rtl:scale-x-[-1] rtl:transform"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span class="hidden sm:inline">Back</span>
          </button>
        </div>

        <div class="text-center">
          <h1 class="text-base-content mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">
            {t().profile}
          </h1>
          <p class="text-base-content/70 mx-auto mb-6 max-w-2xl text-sm sm:text-base">
            {t().viewManageProfile}
          </p>
          <Show when={editingProfile()}>
            <div class="mt-4 flex justify-center gap-2">
              <button class="btn btn-primary" onClick={saveProfile}>
                {t().saveProfile}
              </button>
              <button class="btn btn-ghost" onClick={cancelEditing}>
                {t().cancel}
              </button>
            </div>
          </Show>
        </div>
      </div>

      <Show when={user()}>
        {/* Content */}
        <div class="bg-base-100 rounded-box border-base-200 border p-4 shadow-sm sm:p-6 md:p-8">
          {/* Profile Header Card */}
          <div class="card from-primary/5 via-base-200 to-secondary/5 border-primary/20 mb-8 border bg-gradient-to-br">
            <div class="card-body">
              <div class="flex flex-col items-center gap-6 md:flex-row">
                {/* Avatar Section */}
                <div class="avatar relative">
                  <div class="ring-primary/30 ring-offset-base-100 h-32 w-32 rounded-full ring ring-offset-4">
                    {avatarPreview() ||
                    (user()?.avatar &&
                      !user()?.avatar.startsWith('/default')) ? (
                      <img
                        src={avatarPreview() || user()?.avatar}
                        alt={t().avatarAlt}
                        class="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div class="flex h-full w-full items-center justify-center">
                        <i
                          data-lucide="user"
                          class="text-base-content/60 h-16 w-16"
                        />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    class="absolute inset-0 cursor-pointer opacity-0"
                    id="avatar-input"
                  />
                  <label
                    for="avatar-input"
                    class="btn btn-circle btn-sm btn-primary absolute end-0 bottom-0"
                  >
                    <i data-lucide="camera" class="h-4 w-4" />
                  </label>
                </div>

                {/* User Info */}
                <div class="flex-1 text-center md:text-left">
                  <Show
                    when={editingProfile()}
                    fallback={
                      <div>
                        <h2 class="text-base-content text-3xl font-bold">
                          {user().profile?.name || t().defaultName}
                        </h2>
                        <p class="text-base-content/70 mb-2 text-xl">
                          {user().profile?.email || user().email}
                        </p>
                        <p class="text-base-content/60 mb-4 text-base">
                          {user().profile?.bio || t().noBio}
                        </p>
                      </div>
                    }
                  >
                    <div class="space-y-2">
                      <input
                        type="text"
                        class="input input-bordered text-center text-3xl font-bold md:text-left"
                        placeholder={t().enterFullName}
                        value={profileForm().name}
                        onInput={e =>
                          setProfileForm(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <p class="text-base-content/70 text-xl">
                        {user().profile?.email || user().email}
                      </p>
                      <textarea
                        class="textarea textarea-bordered text-center text-base md:text-left"
                        placeholder={t().tellAboutYourself}
                        rows="2"
                        value={profileForm().bio}
                        onInput={e =>
                          setProfileForm(prev => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </Show>

                  <div class="flex flex-wrap justify-center gap-4 text-sm md:justify-start">
                    <div class="badge badge-primary badge-outline">
                      <i data-lucide="calendar" class="me-1 h-3 w-3" />
                      {t().joined}{' '}
                      {formatDate(
                        user().profile?.joinDate || user().created_at
                      )}
                    </div>
                    <div class="badge badge-secondary badge-outline">
                      <i data-lucide="star" class="me-1 h-3 w-3" />
                      {user().subscription?.plan
                        ? currentLang() === 'ar' &&
                          user().subscription?.plan === 'free'
                          ? t().freePlan
                          : user().subscription?.plan
                        : t().freePlan}
                    </div>
                  </div>

                  {/* Avatar Controls */}
                  {avatarFile() && (
                    <div class="mt-4 flex gap-2">
                      <button
                        class="btn btn-primary btn-sm"
                        onClick={uploadAvatar}
                        disabled={uploadingAvatar()}
                      >
                        {uploadingAvatar() ? (
                          <span class="loading loading-spinner loading-sm" />
                        ) : (
                          t().upload
                        )}
                      </button>
                      <button
                        class="btn btn-ghost btn-sm"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                      >
                        {t().cancel}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Personal Info & Activity */}
            <div class="space-y-6 lg:col-span-2">
              {/* Personal Information */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <div class="flex items-center justify-between">
                    <h3 class="card-title">
                      <i data-lucide="user" class="me-2 h-5 w-5" />
                      {t().personalInformation}
                    </h3>
                    <Show when={!editingProfile()}>
                      <button
                        class="btn btn-outline btn-sm"
                        onClick={startEditing}
                      >
                        <i data-lucide="edit" class="me-2 h-4 w-4" />
                        {t().edit}
                      </button>
                    </Show>
                  </div>
                  <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label class="label">
                          <span class="label-text font-medium">
                            {t().fullName}
                          </span>
                        </label>
                        <Show
                          when={editingProfile()}
                          fallback={
                            <div class="bg-base-200 flex items-center gap-2 rounded-lg p-3">
                              <i
                                data-lucide="user"
                                class="text-base-content/60 h-4 w-4"
                              />
                              <span>{user().profile?.name || t().notSet}</span>
                            </div>
                          }
                        >
                          <input
                            type="text"
                            class="input input-bordered w-full"
                            placeholder={t().enterFullName}
                            value={profileForm().name}
                            onInput={e =>
                              setProfileForm(prev => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </Show>
                      </div>
                      <div>
                        <label class="label">
                          <span class="label-text font-medium">
                            {t().emailAddress}
                          </span>
                        </label>
                        <div class="bg-base-200 flex items-center gap-2 rounded-lg p-3">
                          <i
                            data-lucide="mail"
                            class="text-base-content/60 h-4 w-4"
                          />
                          <span>{user().profile?.email || user().email}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="label">
                        <span class="label-text font-medium">{t().bio}</span>
                      </label>
                      <Show
                        when={editingProfile()}
                        fallback={
                          <div class="bg-base-200 rounded-lg p-3">
                            <p class="text-base-content/80">
                              {user().profile?.bio || t().noBioYet}
                            </p>
                          </div>
                        }
                      >
                        <textarea
                          class="textarea textarea-bordered w-full"
                          placeholder={t().tellAboutYourself}
                          rows="3"
                          value={profileForm().bio}
                          onInput={e =>
                            setProfileForm(prev => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                        />
                      </Show>
                    </div>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label class="label">
                          <span class="label-text font-medium">
                            {t().location}
                          </span>
                        </label>
                        <Show
                          when={editingProfile()}
                          fallback={
                            <div class="bg-base-200 flex items-center gap-2 rounded-lg p-3">
                              <i
                                data-lucide="map-pin"
                                class="text-base-content/60 h-4 w-4"
                              />
                              <span>
                                {user().profile?.location || t().notSet}
                              </span>
                            </div>
                          }
                        >
                          <input
                            type="text"
                            class="input input-bordered w-full"
                            placeholder={t().enterLocation}
                            value={profileForm().location}
                            onInput={e =>
                              setProfileForm(prev => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                          />
                        </Show>
                      </div>
                      <div>
                        <label class="label">
                          <span class="label-text font-medium">
                            {t().website}
                          </span>
                        </label>
                        <Show
                          when={editingProfile()}
                          fallback={
                            <div class="bg-base-200 flex items-center gap-2 rounded-lg p-3">
                              <i
                                data-lucide="globe"
                                class="text-base-content/60 h-4 w-4"
                              />
                              <span>
                                {user().profile?.website ? (
                                  <a
                                    href={user().profile.website}
                                    target="_blank"
                                    class="link link-primary"
                                  >
                                    {user().profile.website}
                                  </a>
                                ) : (
                                  t().notSet
                                )}
                              </span>
                            </div>
                          }
                        >
                          <input
                            type="url"
                            class="input input-bordered w-full"
                            placeholder={t().websiteUrl}
                            value={profileForm().website}
                            onInput={e =>
                              setProfileForm(prev => ({
                                ...prev,
                                website: e.target.value,
                              }))
                            }
                          />
                        </Show>
                      </div>
                    </div>
                    <div>
                      <label class="label">
                        <span class="label-text font-medium">
                          {t().memberSince}
                        </span>
                      </label>
                      <div class="bg-base-200 flex items-center gap-2 rounded-lg p-3">
                        <i
                          data-lucide="calendar"
                          class="text-base-content/60 h-4 w-4"
                        />
                        <span>
                          {formatDate(
                            user().profile?.joinDate || user().created_at
                          )}
                        </span>
                      </div>
                    </div>
                    <Show when={editingProfile()}>
                      <div class="flex gap-2 pt-4">
                        <button
                          class="btn btn-primary btn-sm"
                          onClick={saveProfile}
                        >
                          {t().saveChanges}
                        </button>
                        <button
                          class="btn btn-ghost btn-sm"
                          onClick={cancelEditing}
                        >
                          {t().cancel}
                        </button>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <h3 class="card-title">
                    <i data-lucide="settings" class="me-2 h-5 w-5" />
                    Preferences
                  </h3>
                  <div class="space-y-6">
                    {/* Notification Preferences */}
                    <div>
                      <h4 class="mb-3 font-medium">Notifications</h4>
                      <div class="space-y-3">
                        <label class="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={preferences().notifications.email}
                            onChange={e =>
                              handlePreferenceChange(
                                'notifications',
                                'email',
                                e.target.checked
                              )
                            }
                          />
                          <span class="text-sm">Email notifications</span>
                        </label>
                        <label class="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={preferences().notifications.browser}
                            onChange={e =>
                              handlePreferenceChange(
                                'notifications',
                                'browser',
                                e.target.checked
                              )
                            }
                          />
                          <span class="text-sm">Browser notifications</span>
                        </label>
                        <label class="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={preferences().notifications.projectUpdates}
                            onChange={e =>
                              handlePreferenceChange(
                                'notifications',
                                'projectUpdates',
                                e.target.checked
                              )
                            }
                          />
                          <span class="text-sm">Project updates</span>
                        </label>
                      </div>
                    </div>

                    {/* Privacy Preferences */}
                    <div>
                      <h4 class="mb-3 font-medium">Privacy</h4>
                      <div class="space-y-3">
                        <div>
                          <label class="label">
                            <span class="label-text text-sm">
                              Profile visibility
                            </span>
                          </label>
                          <select
                            class="select select-bordered select-sm w-full"
                            value={preferences().privacy.profileVisibility}
                            onChange={e =>
                              handlePreferenceChange(
                                'privacy',
                                'profileVisibility',
                                e.target.value
                              )
                            }
                          >
                            <option value="private">Private</option>
                            <option value="public">Public</option>
                            <option value="friends">Friends only</option>
                          </select>
                        </div>
                        <label class="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            checked={preferences().privacy.dataSharing}
                            onChange={e =>
                              handlePreferenceChange(
                                'privacy',
                                'dataSharing',
                                e.target.checked
                              )
                            }
                          />
                          <span class="text-sm">
                            Allow anonymized data sharing for improvements
                          </span>
                        </label>
                      </div>
                    </div>

                    <div class="flex justify-end">
                      <button
                        class="btn btn-primary btn-sm"
                        onClick={savePreferences}
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Export (GDPR Compliance) */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <h3 class="card-title">
                    <i data-lucide="download" class="me-2 h-5 w-5" />
                    Data & Privacy
                  </h3>
                  <div class="space-y-4">
                    <div class="alert alert-info">
                      <i data-lucide="info" class="h-4 w-4" />
                      <div>
                        <h4 class="font-medium">GDPR Compliance</h4>
                        <p class="text-sm">
                          You have the right to access, export, and delete your
                          personal data.
                        </p>
                      </div>
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row">
                      <button
                        class="btn btn-outline btn-sm flex-1"
                        onClick={exportPersonalData}
                        disabled={exportingData()}
                      >
                        {exportingData() ? (
                          <>
                            <span class="loading loading-spinner loading-sm" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <i data-lucide="download" class="me-2 h-4 w-4" />
                            Export My Data
                          </>
                        )}
                      </button>

                      <button
                        class="btn btn-outline btn-error btn-sm flex-1"
                        onClick={async () => {
                          const confirmed = await confirmDelete(
                            'Delete Account',
                            'This action cannot be undone. All your data, projects, tasks, and activity history will be permanently deleted in accordance with GDPR Article 17 (Right to Erasure).',
                            'Delete Everything'
                          );

                          if (confirmed) {
                            try {
                              const { deleteUserAccount } =
                                await import('../lib/database');
                              const result = await deleteUserAccount(
                                user().id,
                                'user_request'
                              );

                              if (result.success) {
                                toastManager.success(
                                  'Account deleted successfully. You will be logged out.'
                                );
                                // Logout user
                                const { logout } =
                                  await import('../context/UserContext');
                                logout();
                              } else {
                                toastManager.error(
                                  'Account deletion failed: ' + result.error
                                );
                              }
                            } catch (error) {
                              toastManager.error(
                                'Account deletion failed: ' + error.message
                              );
                            }
                          }
                        }}
                      >
                        <i data-lucide="trash-2" class="me-2 h-4 w-4" />
                        Delete Account
                      </button>
                    </div>

                    <div class="text-base-content/60 text-xs">
                      <p>Last data export: Never</p>
                      <p>Data retention: Until account deletion</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <h3 class="card-title">
                    <i data-lucide="activity" class="me-2 h-5 w-5" />
                    {t().recentActivity}
                  </h3>
                  <div class="space-y-3">
                    <For each={(credits() || []).slice(0, 5)}>
                      {transaction => (
                        <div class="bg-base-200 flex items-center gap-4 rounded-lg p-3">
                          <div
                            class={`rounded-full p-2 ${transaction.amount > 0 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}
                          >
                            <i
                              data-lucide={
                                transaction.amount > 0 ? 'plus' : 'minus'
                              }
                              class="h-4 w-4"
                            />
                          </div>
                          <div class="flex-1">
                            <p class="font-medium">
                              {translateTransaction(transaction.description)}
                            </p>
                            <p class="text-base-content/60 text-sm">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                          <div
                            class={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-error'}`}
                          >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount}
                          </div>
                        </div>
                      )}
                    </For>
                    {(credits() || []).length === 0 && (
                      <div class="text-base-content/60 py-8 text-center">
                        <i
                          data-lucide="inbox"
                          class="mx-auto mb-2 h-8 w-8 opacity-50"
                        />
                        <p>{t().noRecentActivity}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div class="space-y-6">
              {/* Privacy Settings */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <h3 class="card-title">
                    <i data-lucide="shield" class="me-2 h-5 w-5" />
                    {t().privacy}
                  </h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{t().profileVisibility}</span>
                      <select
                        class="select select-bordered select-sm"
                        value={
                          user().preferences?.privacy?.profileVisibility ||
                          'private'
                        }
                        onChange={async e => {
                          try {
                            await updatePreferences({
                              privacy: {
                                ...user().preferences.privacy,
                                profileVisibility: e.target.value,
                              },
                            });
                            toastManager.success(t().privacySettingsUpdated);
                          } catch (error) {
                            toastManager.error(t().privacySettingsFailed);
                          }
                        }}
                      >
                        <option value="public">{t().public}</option>
                        <option value="friends">{t().friends}</option>
                        <option value="private">{t().private}</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{t().dataSharing}</span>
                      <input
                        type="checkbox"
                        class="toggle toggle-primary"
                        checked={
                          user().preferences?.privacy?.dataSharing || false
                        }
                        onChange={async e => {
                          try {
                            await updatePreferences({
                              privacy: {
                                ...user().preferences.privacy,
                                dataSharing: e.target.checked,
                              },
                            });
                            toastManager.success(t().privacySettingsUpdated);
                          } catch (error) {
                            toastManager.error(t().privacySettingsFailed);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Status */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <h3 class="card-title">
                    <i data-lucide="credit-card" class="me-2 h-5 w-5" />
                    {t().subscription}
                  </h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{t().plan}</span>
                      <span class="badge badge-primary">
                        {(user().subscription?.plan
                          ? currentLang() === 'ar' &&
                            user().subscription?.plan === 'free'
                            ? t().freePlan
                            : user().subscription?.plan
                          : t().freePlan
                        ).toUpperCase()}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{t().status}</span>
                      <span
                        class={`badge ${user().subscription?.status === 'active' ? 'badge-success' : 'badge-warning'}`}
                      >
                        {user().subscription?.status || t().inactive}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{t().credits}</span>
                      <span class="font-semibold">
                        {creditBalance() || 0} /{' '}
                        {user().subscription?.maxCredits || 100}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{t().renewal}</span>
                      <span class="text-sm">
                        {user().subscription?.renewalDate
                          ? formatDate(user().subscription.renewalDate)
                          : t().na}
                      </span>
                    </div>
                    <div class="bg-base-200 h-2 w-full rounded-full">
                      <div
                        class="bg-primary h-2 rounded-full"
                        style={`width: ${Math.min(((creditBalance() || 0) / (user().subscription?.maxCredits || 100)) * 100, 100)}%`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div class="card bg-base-100 border-base-200 border shadow-sm">
                <div class="card-body">
                  <h3 class="card-title">
                    <i data-lucide="bar-chart" class="me-2 h-5 w-5" />
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
                        <span class="text-sm font-semibold">
                          {formatDate(
                            getLastActivity().toISOString().split('T')[0]
                          )}
                        </span>
                      </div>
                    )}
                  </div>
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
