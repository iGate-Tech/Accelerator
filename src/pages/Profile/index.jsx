import { createSignal, onMount, createEffect, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { getUserCredits, getUserCreditBalance } from "../../lib/db";
import { formatLocaleDate } from "../../lib/utils";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { currentLang, t } = useLanguage();
  const [credits, setCredits] = createSignal([]);
  const [creditBalance, setCreditBalance] = createSignal(0);

  // Redirect if not authenticated
  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  });



  onMount(async () => {
    if (window.lucide) window.lucide.createIcons();
    if (user()) {
      const userCredits = await getUserCredits(user().id);
      setCredits(userCredits);
      const balance = await getUserCreditBalance(user().id);
      setCreditBalance(balance);
    }
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const formatDate = (dateString) => formatLocaleDate(dateString, currentLang());

  const getCreditUsage = () => {
    const transactions = user().credits.transactions;
    const usage = transactions.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return usage;
  };

  const getLastActivity = () => {
    const transactions = user().credits.transactions;
    if (transactions.length === 0) return null;
    const latest = transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return new Date(latest.date);
  };

  return (
    <div class={`max-w-6xl mx-auto space-y-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().profile}</h1>
         <p class="text-lg text-base-content/70">
           {t().viewManageProfile}
         </p>
       </div>

       <Show when={user()}>
         {/* Profile Overview Card */}
      <div class="card bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 border border-primary/20">
        <div class="card-body">
          <div class="flex flex-col md:flex-row items-center gap-6">
             <div class="avatar">
               <div class="w-32 h-32 rounded-full ring ring-primary/30 ring-offset-base-100 ring-offset-4">
                 <img src={user().avatar || '/src/assets/avatar.png'} alt="Profile avatar" />
               </div>
             </div>
            <div class="flex-1 text-center md:text-left">
              <h2 class="text-3xl font-bold text-base-content">{user().profile.name}</h2>
              <p class="text-xl text-base-content/70 mb-2">{user().profile.email}</p>
              <p class="text-base text-base-content/60 mb-4">{user().profile.bio}</p>
              <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                <div class="badge badge-primary badge-outline">
                  <i data-lucide="calendar" class="w-3 h-3 mr-1"></i>
                  Joined {formatDate(user().profile.joinDate)}
                </div>
                <div class="badge badge-secondary badge-outline">
                  <i data-lucide="star" class="w-3 h-3 mr-1"></i>
                  {user().subscription.plan} Plan
                </div>
                <div class="badge badge-accent badge-outline">
                  <i data-lucide="zap" class="w-3 h-3 mr-1"></i>
                  {creditBalance()} Credits
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <button class="btn btn-primary btn-sm">
                <i data-lucide="edit" class="w-4 h-4 mr-1"></i>
                   {t().editProfile}
              </button>
              <div class="flex items-center gap-2 text-sm text-base-content/60">
                <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                 {t().online}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div class="lg:col-span-2 space-y-6">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="user" class="w-5 h-5 mr-2"></i>
                 {t().personalInformation}
              </h3>
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="label">
                       <span class="label-text font-medium">{t().fullName}</span>
                    </label>
                    <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                      <i data-lucide="user" class="w-4 h-4 text-base-content/60"></i>
                      <span>{user().profile.name}</span>
                    </div>
                  </div>
                  <div>
                    <label class="label">
                       <span class="label-text font-medium">{t().emailAddress}</span>
                    </label>
                    <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                      <i data-lucide="mail" class="w-4 h-4 text-base-content/60"></i>
                      <span>{user().profile.email}</span>
          </div>
        </div>
      </div>
                <div>
                  <label class="label">
                     <span class="label-text font-medium">{t().bio}</span>
                  </label>
                  <div class="p-3 bg-base-200 rounded-lg">
                     <p class="text-base-content/80">{user().profile.bio || t().noBioYet}</p>
                  </div>
                </div>
                <div>
                  <label class="label">
                     <span class="label-text font-medium">{t().memberSince}</span>
                  </label>
                  <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                    <i data-lucide="calendar" class="w-4 h-4 text-base-content/60"></i>
                    <span>{formatDate(user().profile.joinDate)}</span>
                  </div>
                </div>
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
                {credits().slice(0, 5).map((transaction) => (
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
                {user().credits.transactions.length === 0 && (
                  <div class="text-center py-8 text-base-content/60">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                     <p>{t().noRecentActivity}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
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
                  <span class="badge badge-primary">{user().subscription.plan}</span>
                </div>
                <div class="flex justify-between items-center">
                   <span class="font-medium">{t().status}</span>
                  <span class={`badge ${user().subscription.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {user().subscription.status}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                   <span class="font-medium">{t().credits}</span>
                  <span class="font-semibold">{user().credits.balance} / {user().subscription.maxCredits}</span>
                </div>
                <div class="flex justify-between items-center">
                   <span class="font-medium">{t().renewal}</span>
                  <span class="text-sm">{formatDate(user().subscription.renewalDate)}</span>
                </div>
                <div class="w-full bg-base-200 rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full"
                    style={`width: ${(user().credits.balance / user().subscription.maxCredits) * 100}%`}
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
                  <span class="font-semibold">{credits().filter(c => c.type === 'usage').reduce((sum, c) => sum + Math.abs(c.amount), 0)}</span>
                </div>
                <div class="flex justify-between">
                   <span>{t().projects}</span>
                  <span class="font-semibold">0</span>
                </div>
                <div class="flex justify-between">
                   <span>{t().storageUsed}</span>
                  <span class="font-semibold">0 MB</span>
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

          {/* Quick Actions */}
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="settings" class="w-5 h-5 mr-2"></i>
                 {t().quickActions}
              </h3>
              <div class="space-y-2">
                <button class="btn btn-outline btn-sm w-full justify-start">
                  <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
                  {t().editProfile}
                </button>
                <button class="btn btn-outline btn-sm w-full justify-start">
                  <i data-lucide="key" class="w-4 h-4 mr-2"></i>
                   {t().changePassword}
                </button>
                <button class="btn btn-outline btn-sm w-full justify-start">
                  <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                   {t().exportData}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
       </Show>

       <Show when={!user()}>
         <div class="text-center py-12">
           <i data-lucide="lock" class="w-16 h-16 mx-auto mb-4 text-base-content/50"></i>
           <h2 class="text-2xl font-bold mb-2">Authentication Required</h2>
           <p class="text-base-content/70 mb-4">Please log in to view your profile.</p>
           <button class="btn btn-primary" onClick={() => navigate('/login')}>
             Log In
           </button>
         </div>
       </Show>
      </div>
  );
};

export default Profile;