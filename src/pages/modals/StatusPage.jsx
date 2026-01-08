import { createSignal, createEffect, onMount, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

const StatusPage = () => {
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = () => translations[currentLang()];

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    setCurrentLang(lang());
    if (window.lucide) window.lucide.createIcons();
  });

  const services = [
    { name: "AI Processing Engine", status: "operational", uptime: "99.9%" },
    { name: "Local Database (PGLite)", status: "operational", uptime: "100%" },
    { name: "Project Export Service", status: "operational", uptime: "99.5%" },
    { name: "User Interface", status: "operational", uptime: "100%" },
    { name: "Data Persistence", status: "operational", uptime: "99.8%" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'outage': return 'text-error';
      default: return 'text-base-content';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return 'check-circle';
      case 'degraded': return 'alert-triangle';
      case 'outage': return 'x-circle';
      default: return 'minus';
    }
  };

  return (
    <div class={`max-w-4xl mx-auto space-y-8 py-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Back Button */}
      <div class="mb-6">
        <button
          onClick={() => window.history.back()}
          class="btn btn-ghost btn-sm"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      </div>

      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().statusPage}</h1>
        <p class="text-lg text-base-content/70">
          {t().systemStatusAndAvailability}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-success">
            <i data-lucide="activity" class="w-8 h-8"></i>
          </div>
          <div class="stat-title">{t().overallStatus}</div>
          <div class="stat-value text-success">{t().operational}</div>
          <div class="stat-desc">{t().allSystemsRunningNormally}</div>
        </div>

        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-primary">
            <i data-lucide="clock" class="w-8 h-8"></i>
          </div>
          <div class="stat-title">{t().uptime30Days}</div>
          <div class="stat-value text-primary">99.7%</div>
          <div class="stat-desc">{t().last30DaysAverage}</div>
        </div>

        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-secondary">
            <i data-lucide="zap" class="w-8 h-8"></i>
          </div>
          <div class="stat-title">{t().activeProjects}</div>
          <div class="stat-value text-secondary">1,247</div>
          <div class="stat-desc">{t().projectsCurrentlyInProgress}</div>
        </div>
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-6">{t().serviceStatus}</h2>
        <div class="space-y-4">
          {services.map(service => (
            <div class="flex items-center justify-between p-4 bg-base-200 rounded-lg">
              <div class="flex items-center gap-3">
                <i data-lucide={getStatusIcon(service.status)} class={`w-5 h-5 ${getStatusColor(service.status)}`}></i>
                <div>
                  <h3 class="font-semibold">{service.name}</h3>
                   <p class="text-sm text-base-content/60 capitalize">{t()[service.status]}</p>
                </div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm">{service.uptime}</div>
                 <div class="text-xs text-base-content/50">{t().uptime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-4">{t().recentIncidents}</h2>
        <div class="space-y-4">
          <div class="alert alert-success">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <div>
              <h3 class="font-bold">{t().allSystemsOperational}</h3>
              <div class="text-xs">Jan 08, 2026 10:00 UTC</div>
            </div>
          </div>
        </div>
        <p class="text-sm text-base-content/60 mt-4">
          {t().noRecentIncidents}
        </p>
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-4">{t().subscribeToUpdates}</h2>
        <p class="text-base-content/70 mb-4">
          {t().getNotifiedAboutSystemStatus}
        </p>
        <div class="flex gap-4">
          <input
            type="email"
            placeholder={t().enterYourEmail}
            class="input input-bordered flex-1"
          />
          <button class="btn btn-primary">
            {t().subscribe}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;