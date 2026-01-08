import { createSignal, createEffect, onMount, useContext } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

const Changelog = () => {
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
        { type: "feature", text: "Added iGate branding and company name to footer" },
        { type: "feature", text: "New Privacy Policy, Terms of Service, Status Page, and Changelog pages" },
        { type: "improvement", text: "Updated copyright year to 2026" },
        { type: "fix", text: "Fixed footer link navigation" }
      ]
    },
    {
      version: "v2.0.0",
      date: "December 15, 2025",
      changes: [
        { type: "feature", text: "Complete UI redesign with dark mode support" },
        { type: "feature", text: "Multi-language support (English and Arabic)" },
        { type: "feature", text: "Offline capability with local PGLite database" },
        { type: "improvement", text: "Enhanced AI processing with better prompt engineering" },
        { type: "improvement", text: "Improved portfolio organization and tagging" }
      ]
    },
    {
      version: "v1.5.0",
      date: "October 20, 2025",
      changes: [
        { type: "feature", text: "Added project export functionality (JSON, PDF)" },
        { type: "feature", text: "Real-time progress tracking and analytics" },
        { type: "improvement", text: "Better error handling and user feedback" },
        { type: "fix", text: "Fixed issue with project state persistence" }
      ]
    },
    {
      version: "v1.0.0",
      date: "August 1, 2025",
      changes: [
        { type: "feature", text: "Initial release of Startup Accelerator" },
        { type: "feature", text: "51-step structured business plan methodology" },
        { type: "feature", text: "AI-powered analysis and recommendations" },
        { type: "feature", text: "Local data storage with IndexedDB" }
      ]
    }
  ];

  const getChangeIcon = (type) => {
    switch (type) {
      case 'feature': return 'plus';
      case 'improvement': return 'arrow-up';
      case 'fix': return 'bug';
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
    <div class={`max-w-4xl mx-auto space-y-8  py-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().changelog}</h1>
        <p class="text-lg text-base-content/70">
          Latest updates and improvements to the Startup Accelerator
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
                  <span class="text-sm">{change.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div class="bg-base-100 rounded-box p-6 shadow">
        <h2 class="text-2xl font-bold mb-4">How to Stay Updated</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold mb-2">Automatic Updates</h3>
            <p class="text-sm text-base-content/70">
              The application checks for updates automatically. You'll be notified
              when a new version is available.
            </p>
          </div>
          <div>
            <h3 class="font-semibold mb-2">Manual Check</h3>
            <p class="text-sm text-base-content/70">
              You can manually check for updates in Settings > About section.
            </p>
          </div>
        </div>
      </div>

      <div class="alert alert-info">
        <i data-lucide="info" class="w-5 h-5"></i>
        <div>
          <h3 class="font-bold">Version History</h3>
          <p>
            This changelog shows the most recent updates. For older versions,
            check our GitHub repository or documentation archives.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Changelog;