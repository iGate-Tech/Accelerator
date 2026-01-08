import { createSignal, createEffect, onMount, useContext } from "solid-js";
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
    <div class={`max-w-4xl mx-auto space-y-8  py-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().statusPage}</h1>
        <p class="text-lg text-base-content/70">
          System status and service availability
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-success">
            <i data-lucide="activity" class="w-8 h-8"></i>
          </div>
          <div class="stat-title">Overall Status</div>
          <div class="stat-value text-success">Operational</div>
          <div class="stat-desc">All systems running normally</div>
        </div>

        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-primary">
            <i data-lucide="clock" class="w-8 h-8"></i>
          </div>
          <div class="stat-title">Uptime (30 days)</div>
          <div class="stat-value text-primary">99.7%</div>
          <div class="stat-desc">Last 30 days average</div>
        </div>

        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-secondary">
            <i data-lucide="zap" class="w-8 h-8"></i>
          </div>
          <div class="stat-title">Active Projects</div>
          <div class="stat-value text-secondary">1,247</div>
          <div class="stat-desc">Projects currently in progress</div>
        </div>
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-6">Service Status</h2>
        <div class="space-y-4">
          {services.map(service => (
            <div class="flex items-center justify-between p-4 bg-base-200 rounded-lg">
              <div class="flex items-center gap-3">
                <i data-lucide={getStatusIcon(service.status)} class={`w-5 h-5 ${getStatusColor(service.status)}`}></i>
                <div>
                  <h3 class="font-semibold">{service.name}</h3>
                  <p class="text-sm text-base-content/60 capitalize">{service.status}</p>
                </div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm">{service.uptime}</div>
                <div class="text-xs text-base-content/50">Uptime</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-4">Recent Incidents</h2>
        <div class="space-y-4">
          <div class="alert alert-success">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <div>
              <h3 class="font-bold">All Systems Operational</h3>
              <div class="text-xs">Jan 08, 2026 10:00 UTC</div>
            </div>
          </div>
        </div>
        <p class="text-sm text-base-content/60 mt-4">
          No recent incidents. Subscribe to status updates for real-time notifications.
        </p>
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-4">Subscribe to Updates</h2>
        <p class="text-base-content/70 mb-4">
          Get notified about system status changes and maintenance windows.
        </p>
        <div class="flex gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            class="input input-bordered flex-1"
          />
          <button class="btn btn-primary">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;