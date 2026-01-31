import {
  createSignal,
  createMemo,
  createEffect,
  onMount,
  useContext,
  For,
} from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { LangContext } from '@context/LangContext';
import { translations } from '@assets/translations/translations-index.js';
import { logger } from '@lib/core';
import { Activity, Clock, Zap, CheckCircle, AlertTriangle, XCircle, Minus } from 'lucide-solid';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

const StatusPage = () => {
  logger.trace('StatusPage: Starting');
  const { lang } = useContext(LangContext);

  // Set document title
  useDocumentTitle('System Status');
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = createMemo(() => translations[currentLang()]);


  createEffect(() => {
    setCurrentLang(lang());
    // Removed window.lucide.createIcons() call
  });

  const services = [
    { name: 'AI Processing Engine', status: 'operational', uptime: '99.9%' },
    { name: 'Local Database (PGLite)', status: 'operational', uptime: '100%' },
    { name: 'Project Export Service', status: 'operational', uptime: '99.5%' },
    { name: 'User Interface', status: 'operational', uptime: '100%' },
    { name: 'Data Persistence', status: 'operational', uptime: '99.8%' },
  ];
  logger.trace('getStatusColor: Starting');

  const getStatusColor = status => {
    switch (status) {
      case 'operational':
        return 'text-success';
      case 'degraded':
        return 'text-warning';
      case 'outage':
        return 'text-error';
        de;
        logger.trace('getStatusIcon: Starting');
        return 'text-base-content';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'operational':
        return CheckCircle;
      case 'degraded':
        return AlertTriangle;
      case 'outage':
        return XCircle;
      default:
        return Minus;
    }
  };

  return (
    <div class="h-full overflow-auto">
      <div class="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        {/* Back Button */}
        <div class="mb-6">
          <button
            onClick={() => window.history.back()}
            class="btn btn-ghost btn-sm"
          >
            <svg
              class="mr-2 h-4 w-4"
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
            Back
          </button>
        </div>

        <div class="text-center">
          <h1 class="text-base-content mb-4 text-3xl font-bold sm:text-4xl">
            {t().statusPage}
          </h1>
          <p class="text-base-content/70 text-base sm:text-lg">
            {t().systemStatusAndAvailability}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="stat bg-base-100 rounded-box shadow">
            <div class="stat-figure text-success">
              <Activity class="h-8 w-8" />
            </div>
            <div class="stat-title">{t().overallStatus}</div>
            <div class="stat-value text-success">{t().operational}</div>
            <div class="stat-desc">{t().allSystemsRunningNormally}</div>
          </div>

          <div class="stat bg-base-100 rounded-box shadow">
            <div class="stat-figure text-primary">
              <Clock class="h-8 w-8" />
            </div>
            <div class="stat-title">{t().uptime30Days}</div>
            <div class="stat-value text-primary">99.7%</div>
            <div class="stat-desc">{t().last30DaysAverage}</div>
          </div>

          <div class="stat bg-base-100 rounded-box shadow">
            <div class="stat-figure text-secondary">
              <Zap class="h-8 w-8" />
            </div>
            <div class="stat-title">{t().activeProjects}</div>
            <div class="stat-value text-secondary">1,247</div>
            <div class="stat-desc">{t().projectsCurrentlyInProgress}</div>
          </div>
        </div>

        <div class="bg-base-100 rounded-box p-6 shadow">
          <h2 class="mb-6 text-2xl font-bold">{t().serviceStatus}</h2>
          <div class="space-y-4">
            <For each={services}>
              {service => (
                <div class="bg-base-200 flex items-center justify-between rounded-lg p-4">
                  <div class="flex items-center gap-3">
                    {(() => {
                      const IconComponent = getStatusIcon(service.status);
                      return <IconComponent class={`h-5 w-5 ${getStatusColor(service.status)}`} />;
                    })()}
                    <div>
                      <h3 class="font-semibold">{service.name}</h3>
                      <p class="text-base-content/60 text-sm capitalize">
                        {t()[service.status]}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono text-sm">{service.uptime}</div>
                    <div class="text-base-content/50 text-xs">{t().uptime}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="bg-base-100 rounded-box p-6 shadow">
          <h2 class="mb-4 text-2xl font-bold">{t().recentIncidents}</h2>
          <div class="space-y-4">
            <div class="alert alert-success">
              <CheckCircle class="h-5 w-5" />
              <div>
                <h3 class="font-bold">{t().allSystemsOperational}</h3>
                <div class="text-xs">Jan 08, 2026 10:00 UTC</div>
              </div>
            </div>
          </div>
          <p class="text-base-content/60 mt-4 text-sm">
            {t().noRecentIncidents}
          </p>
        </div>

        <div class="bg-base-100 rounded-box p-6 shadow">
          <h2 class="mb-4 text-2xl font-bold">{t().subscribeToUpdates}</h2>
          <p class="text-base-content/70 mb-4">
            {t().getNotifiedAboutSystemStatus}
          </p>
          <div class="flex gap-4">
            <input
              type="email"
              placeholder={t().enterYourEmail}
              class="input input-bordered flex-1"
            />
            <button class="btn btn-primary">{t().subscribe}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
