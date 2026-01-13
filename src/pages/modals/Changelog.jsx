import { createSignal, createEffect, onMount, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import logger from '../../lib/logger.js';


const Changelog = () => {
  logger.trace('Changelog: Starting');
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

  const changelog = [
    {
      version: "v2.1.0",
      date: "January 8, 2026",
      changes: [
        { type: "feature", textKey: "v210Feature1" },
        { type: "feature", textKey: "v210Feature2" },
        { type: "improvement", textKey: "v210Improvement1" },
        { type: "fix", textKey: "v210Fix1" }
      ]
    },
    {
      version: "v2.0.0",
      date: "December 15, 2025",
      changes: [
        { type: "feature", textKey: "v200Feature1" },
        { type: "feature", textKey: "v200Feature2" },
        { type: "feature", textKey: "v200Feature3" },
        { type: "improvement", textKey: "v200Improvement1" },
        { type: "improvement", textKey: "v200Improvement2" }
      ]
    },
    {
      version: "v1.5.0",
      date: "October 20, 2025",
      changes: [
        { type: "feature", textKey: "v150Feature1" },
        { type: "feature", textKey: "v150Feature2" },
        { type: "improvement", textKey: "v150Improvement1" },
        { type: "fix", textKey: "v150Fix1" }
      ]
    },
    {
      version: "v1.0.0",
      date: "August 1, 2025",
      changes: [
        { type: "feature", textKey: "v100Feature1" },
        { type: "feature", textKey: "v100Feature2" },
        { type: "feature", textKey: "v100Feature3" },
        { type: "feature", textKey: "v100Feature4" }
      ]
    }
  ];

  const getChangeIcon = (type) => {
    switch (type) {
      case 'feature': return 'plus';
      case 'improvement': return 'arrow-up';
      case 'fix': return 'bug'
  logger.trace('getChangeColor: Starting');;
      default: return 'circle';
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'feature': return 'text-success';
      case 'improvement': return 'text-primary';
      case 'fix': return 'text-warning';
      default: return 'text-base-content';
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
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().changelog}</h1>
        <p class="text-lg text-base-content/70">
          {t().latestUpdatesAndImprovements}
        </p>
      </div>

      <div class="space-y-8">
        {changelog.map((release, index) => (
          <div class="bg-base-100 rounded-box p-6 shadow">
            <div class="flex items-center gap-4 mb-4">
              <div class="badge badge-primary badge-lg">v{release.version}</div>
              <div class="text-sm text-base-content/60">{release.date}</div>
              {index === 0 && (
                <div class="badge badge-success badge-sm">Latest</div>
              )}
            </div>

              <div class="space-y-3">
                {release.changes.map(change => (
                  <div class="flex items-start gap-3">
                    <i data-lucide={getChangeIcon(change.type)} class={`w-4 h-4 mt-0.5 ${getChangeColor(change.type)}`}></i>
                    <span class="text-sm">{t()[change.textKey]}</span>
                  </div>
                ))}
              </div>
          </div>
        ))}
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-4">{t().howToStayUpdated}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold mb-2">{t().automaticUpdates}</h3>
            <p class="text-sm text-base-content/70">
              {t().automaticUpdatesDesc}
            </p>
          </div>
          <div>
            <h3 class="font-semibold mb-2">{t().manualCheck}</h3>
            <p class="text-sm text-base-content/70">
              {t().manualCheckDesc}
            </p>
          </div>
        </div>
      </div>

      <div class="alert alert-info">
        <i data-lucide="info" class="w-5 h-5"></i>
        <div>
          <h3 class="font-bold">{t().versionHistory}</h3>
          <p>
            {t().versionHistoryDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Changelog;