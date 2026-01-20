import { createSignal, createEffect, onMount, onCleanup, For, Show, createResource, useContext, createMemo } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { LangContext } from "../context/LangContext";
import { translations } from "../assets/translations/translations-index.js";
import { logger } from '../lib/core';


const Help = () => {
  logger.trace('Help: Starting');
  const navigate = useNavigate();
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = createMemo(() => translations[currentLang()]);
  const [activeSection, setActiveSection] = createSignal('getting-started');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [expandedFaq, setExpandedFaq] = createSignal(new Set());
  const [showContactForm, setShowContactForm] = createSignal(false);
  const [contactForm, setContactForm] = createSignal({ name: '', email: '', subject: '', message: '' });
  const [tutorialProgress, setTutorialProgress] = createSignal(0);
  const [completedSteps, setCompletedSteps] = createSignal(new Set());



    onMount(() => {
      if (window.lucide) window.lucide.createIcons();

      const savedProgress = localStorage.getItem('tutorial-progress');
      if (savedProgress) {
        setCompletedSteps(new Set(JSON.parse(savedProgress)));
        setTutorialProgress(JSON.parse(savedProgress).length);
      }

      document.addEventListener('keydown', handleKeyPress);
    });

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyPress);
    });

    createEffect(() => {
      setCurrentLang(lang());
    });


  logger.trace('handleKeyPress: Starting');   const handleKeyPress = (e) => {
    // Ctrl+K for search
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      document.getElementById('help-search')?.focus();
    }
    // Escape to close modals
    if (e.key === 'Escape') {
      setShowContactForm(false);
    }
  };

  const faqs = () => [
     {
       id: 'what-is-accelerator',
       category: t().general,
       question: t().whatIsAccelerator,
       answer: t().acceleratorDesc,
       tags: ['overview', 'ai', 'process']
     },
     {
       id: 'create-project',
       category: t().gettingStartedCat,
       question: t().createProject,
       answer: t().createProjectDesc,
       tags: ['create', 'start', 'project']
     },
     {
       id: 'project-statuses',
       category: t().projects,
       question: t().projectStatuses,
       answer: t().projectStatusesDesc,
       tags: ['status', 'progress', 'states']
     },
     {
       id: 'portfolio-feature',
       category: t().organization,
       question: t().portfolioFeature,
       answer: t().portfolioFeatureDesc,
       tags: ['portfolio', 'organization', 'collections']
     },
      {
        id: 'resources-tracked',
        category: t().resources,
        question: t().resourcesTracked,
        answer: t().resourcesTrackedDesc,
        tags: ['credits', 'time', 'resources', 'metrics']
      },
      {
        id: 'export-projects',
        category: t().dataManagement,
        question: t().exportProjects,
        answer: t().exportProjectsDesc,
        tags: ['export', 'backup', 'data', 'json']
      },
      {
        id: 'pause-resume',
        category: t().workflow,
        question: t().pauseResume,
        answer: t().pauseResumeDesc,
        tags: ['pause', 'resume', 'workflow', 'continue']
      },
      {
        id: 'ai-response-fails',
        category: t().troubleshooting,
        question: t().aiResponseFails,
        answer: t().aiResponseFailsDesc,
        tags: ['error', 'retry', 'network', 'ai']
      },
      {
        id: 'edit-completed',
        category: t().projects,
        question: t().editCompleted,
        answer: t().editCompletedDesc,
        tags: ['edit', 'completed', 'continue', 'update']
      },
      {
        id: 'delete-projects',
        category: t().dataManagement,
        question: t().deleteProjects,
        answer: t().deleteProjectsDesc,
        tags: ['delete', 'remove', 'cleanup', 'backup']
      },
      {
        id: 'keyboard-shortcuts',
        category: t().interface,
        question: t().keyboardShortcuts,
        answer: t().keyboardShortcutsDesc,
        tags: ['shortcuts', 'keyboard', 'navigation', 'efficiency']
      },
      {
        id: 'dark-mode',
        category: t().interface,
        question: t().darkMode,
        answer: t().darkModeDesc,
        tags: ['theme', 'dark', 'light', 'appearance']
      },
      {
        id: 'multi-language',
        category: t().interface,
        question: t().multiLanguage,
        answer: t().multiLanguageDesc,
        tags: ['language', 'arabic', 'english', 'localization']
      },
      {
        id: 'offline-capability',
        category: t().technical,
        question: t().offlineCapability,
        answer: t().offlineCapabilityDesc,
        tags: ['offline', 'local', 'storage', 'connectivity']
      },
      {
        id: 'data-privacy',
        category: t().privacy,
        question: t().dataPrivacy,
        answer: t().dataPrivacyDesc,
        tags: ['privacy', 'security', 'local', 'data']
      }
   ];

  const gettingStartedSteps = () => [
     {
       id: 'create-first-project',
       title: "1. " + t().createFirstProject,
       description: t().createProjectDesc,
       icon: "lightbulb",
       details: t().createProjectDesc,
       completed: completedSteps().has('create-first-project')
     },
     {
       id: 'follow-process',
       title: "2. " + t().followProcess,
       description: t().followProcessDesc,
       icon: "route",
       details: t().followProcessDesc,
       completed: completedSteps().has('follow-process')
     },
     {
       id: 'monitor-progress',
       title: "3. " + t().monitorProgress,
       description: t().monitorProgressDesc,
       icon: "bar-chart",
       details: t().monitorProgressDesc,
       completed: completedSteps().has('monitor-progress')
     },
     {
       id: 'organize-portfolio',
       title: "4. " + t().organizePortfolio,
       description: t().organizePortfolioDesc,
       icon: "folder",
       details: t().organizePortfolioDesc,
       completed: completedSteps().has('organize-portfolio')
     },
     {
       id: 'explore-manage',
       title: "5. " + t().exploreManage,
       description: t().exploreManageDesc,
       icon: "compass",
       details: t().exploreManageDesc,
       completed: completedSteps().has('explore-manage')
     }
   ];

   const advancedGuides = () => [
      {
        title: t().effectiveDescriptions,
        icon: "pen-tool",
        content: currentLang() === 'ar'
          ? `**بيان المشكلة:** حدد بوضوح المشكلة التي تحلها. اشمل من يعاني منها ولماذا الحلول الحالية غير كافية.

**نظرة عامة على الحل:** وصف الحل المقترح وما يجعله فريداً.

**السوق المستهدف:** حدد ملف العميل المثالي وحجم السوق.

**اقتراح القيمة:** شرح لماذا سيختار العملاء حلك.

**مثال:** "تكافح الشركات الصغيرة مع برمجيات المحاسبة التي تكون إما باهظة الثمن (QuickBooks) أو معقدة جداً (Excel). يقدم MySaaS محاسبة ميسورة التكلفة وسهلة الاستخدام للعاملين المستقلين والفرق الصغيرة، مع تصنيف مدعوم بالذكاء الاصطناعي وتقديم الضرائب بنقرة واحدة."`
          : `**Problem Statement:** Clearly define the problem you're solving. Include who suffers from it and why current solutions are inadequate.

**Solution Overview:** Describe your proposed solution and what makes it unique.

**Target Market:** Define your ideal customer profile and market size.

**Value Proposition:** Explain why customers will choose your solution.

**Example:** "Small businesses struggle with accounting software that's either too expensive (QuickBooks) or too complex (Excel). MySaaS offers affordable, user-friendly accounting for freelancers and small teams, with AI-powered categorization and one-click tax filing."`
      },
      {
        title: t().understandingProcess,
        icon: "git-branch",
        content: currentLang() === 'ar'
          ? `يتبع المسرع منهجية منظمة:

**الأساس (الخطوات 1-10):** التحقق من المشكلة وبحث المستخدمين
**تحليل السوق (الخطوات 11-20):** المناظر التنافسية وحجم السوق
**نموذج العمل (الخطوات 21-30):** تدفقات الإيرادات والتخطيط المالي
**الاستراتيجية والتمويل (الخطوات 31-40):** الوصول إلى السوق وجمع التبرعات
**العمليات والفريق (الخطوات 41-51):** تخطيط التنفيذ وبناء الفريق

كل خطوة تبني على الرؤى السابقة، مما يخلق خطة عمل شاملة.`
          : `The accelerator follows a structured methodology:

**Foundation (Steps 1-10):** Problem validation and user research
**Market Analysis (Steps 11-20):** Competitive landscape and market sizing
**Business Model (Steps 21-30):** Revenue streams and financial planning
**Strategy & Funding (Steps 31-40):** Go-to-market and fundraising
**Operations & Team (Steps 41-51):** Execution planning and team building

Each step builds upon previous insights, creating a comprehensive business plan.`
      },
      {
        title: t().resourceManagement,
        icon: "cpu",
        content: currentLang() === 'ar'
          ? `**إدارة الاعتمادات:** كل تفاعل ذكاء اصطناعي يستهلك اعتمادات. خطط للجلسات المعقدة خلال فترات النطاق الترددي العالي.

**تتبع الوقت:** راقب الوقت المستغل في كل مشروع لفهم سرعة التطوير.

**المعالجة الدفعية:** جمع الأسئلة المشابهة معاً لاستخدام أكثر كفاءة للذكاء الاصطناعي.

**حفظ التقدم:** يقوم النظام بالحفظ التلقائي بشكل متكرر. استخدم الإيقاف المؤقت والاستئناف للاستراحات الطويلة.`
          : `**Credit Management:** Each AI interaction consumes credits. Plan complex sessions during high-bandwidth periods.

**Time Tracking:** Monitor time spent per project to understand development velocity.

**Batch Processing:** Group similar questions together for more efficient AI usage.

**Progress Saving:** The system auto-saves frequently. Use pause/resume for long breaks.`
      },
      {
        title: t().portfolioStrategies,
        icon: "grid",
        content: currentLang() === 'ar'
          ? `**حسب المرحلة:** التفكير المبكر، التحقق، تطوير المنتج الأدنى القابل للتطبيق، النمو
**حسب الصناعة:** FinTech، HealthTech، EdTech، إلخ.
**حسب الأولوية:** أولوية عالية، أولوية متوسطة، معلق

استخدم اصطلاحات التسمية المتسقة والترميز اللوني للتنقل السهل.`
          : `**By Stage:** Early Ideation, Validation, MVP Development, Growth
**By Industry:** FinTech, HealthTech, EdTech, etc.
**By Priority:** High Priority, Medium Priority, On Hold
**By Type:** B2B, B2C, Marketplace, Platform

Use consistent naming conventions and color coding for easy navigation.`
      }
    ];

  const videoTutorials = () => [
     {
       title: t().gettingStarted5Min,
       duration: "5:12",
       thumbnail: "/api/placeholder/320/180",
       description: t().gettingStartedDesc
     },
     {
       title: t().understanding51Step,
       duration: "12:34",
       thumbnail: "/api/placeholder/320/180",
       description: t().understandingDesc
     },
     {
       title: t().portfolioMasterclass,
       duration: "8:45",
       thumbnail: "/api/placeholder/320/180",
       description: t().portfolioMasterDesc
     }
   ];

  const features = () => [
     {
       title: t().aiPoweredAnalysis,
       description: t().aiAnalysisDesc,
       icon: "brain"
     },
     {
       title: t().structuredMethodology,
       description: t().structuredDesc,
       icon: "layers"
     },
     {
       title: t().progressTracking,
       description: t().progressDesc,
       icon: "target"
     },
     {
       title: t().portfolioOrganization,
       description: t().portfolioOrgDesc,
       icon: "grid"
     },
     {
       title: t().dataPersistence,
       description: t().dataDesc,
       icon: "database"
     },
     {
       title: t().exportCapabilities,
        description: t().exportDesc,
       icon: "download"
     }
   ];

  const filteredFaqs = () => {
    if (!searchQuery()) return faqs;
    const query = searchQuery().toLowerCase();
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query) ||
      faq.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

   const markStepCompleted = (stepId) => {
     const newCompleted = new Set(completedSteps());
     newCompleted.add(stepId);
     setCompletedSteps(newCompleted);
     setTutorialProgress(newCompleted.size);
     loc
  logger.trace('resetTutorial: Starting');alStorage.setItem('tutorial-progress', JSON.stringify([...newCompleted]));
     if (window.lucide) window.lucide.createIcons();
   };

   const resetTutorial = () => {
     setCompletedSteps(new Set());
     setTutorialProgress(0);
     localStorage.removeItem('tutorial-progress');
     if (window.lucide) window.lucide.createIcons();
   };

  const submitContactForm = async () => {
    // Simulate form submission
    logger.debug('Submitting contact form:', contactForm());
    // In a real app, this would send to an API
     setShowContactForm(false);
     setContactForm({ name: '', email: '', subject: '', message: '' });
     toastManager.success(t().thankYouFeedback);
  };

   const quickActions = [
     {
       titleKey: "createFirstProject",
       icon: "plus",
       action: () => navigate('/'),
       descriptionKey: "createProjectDesc"
     },
     {
       titleKey: "monitorProgress",
       icon: "bar-chart",
       action: () => navigate('/dashboard'),
       descriptionKey: "monitorProgressDesc"
     },
     {
       titleKey: "exploreManage",
       icon: "compass",
       action: () => navigate('/explore'),
       descriptionKey: "exploreManageDesc"
     },
     {
       titleKey: "organizePortfolio",
       icon: "folder",
       action: () => navigate('/portfolio'),
       descriptionKey: "organizePortfolioDesc"
     }
   ];

  return (
       <div class="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 py-6 sm:py-8 overflow-visible">
          {/* Header with Search */}
          <div class="py-6">
            {/* Back Button */}
            <div class="flex justify-start mb-4">
              <button
                onClick={() => window.history.back()}
                class="btn btn-ghost btn-sm gap-2"
              >
                <svg class="w-4 h-4 rtl:transform rtl:scale-x-[-1]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
                <span class="hidden sm:inline">Back</span>
              </button>
            </div>

            <div class="text-center">
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-3">{t().helpDocumentation}</h1>
              <p class="text-sm sm:text-base text-base-content/70 max-w-2xl mx-auto mb-6">
                {t().everythingYouNeed}
              </p>

             {/* Global Search */}
             <div class="max-w-md mx-auto">
               <div class="relative">
                 <i data-lucide="search" class="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50"></i>
                 <input
                   id="help-search"
                   type="text"
                   placeholder={`${t().searchHelp} (${t().ctrlK})`}
                   class="input input-bordered w-full ps-10 pe-10 text-sm"
                   value={searchQuery()}
                   onInput={(e) => setSearchQuery(e.target.value)}
                 />
                 <kbd class="absolute end-2 top-1/2 transform -translate-y-1/2 hidden sm:block text-xs text-base-content/50 bg-base-200 px-1.5 py-0.5 rounded">
                   {t().ctrlK}
                 </kbd>
               </div>
             </div>
            </div>
        </div>

        {/* Quick Actions */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <For each={quickActions}>
            {(action) => (
              <button
                class="card bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 hover:border-primary/30 transition-all duration-200"
                onClick={action.action}
              >
                <div class="card-body p-3 sm:p-4 text-center">
                  <i data-lucide={action.icon} class="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-primary"></i>
                  <h3 class="font-semibold text-xs sm:text-sm">{t()[action.titleKey]}</h3>
                </div>
              </button>
            )}
          </For>
        </div>

        {/* Navigation */}
        <div class="tabs tabs-boxed bg-base-100 p-1 overflow-x-auto">
          <button
            class={`tab flex-shrink-0 ${activeSection() === 'getting-started' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('getting-started')}
          >
            <i data-lucide="play" class="w-4 h-4 me-1.5"></i>
            <span class="hidden xs:inline">{t().gettingStarted}</span>
            <span class="xs:hidden">{t().start}</span>
          </button>
          <button
            class={`tab flex-shrink-0 ${activeSection() === 'tutorials' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('tutorials')}
          >
            <i data-lucide="book-open" class="w-4 h-4 me-1.5"></i>
            <span class="hidden sm:inline">{t().advancedGuides}</span>
            <span class="sm:hidden">{t().guides}</span>
          </button>
          <button
            class={`tab flex-shrink-0 ${activeSection() === 'features' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('features')}
          >
            <i data-lucide="zap" class="w-4 h-4 me-1.5"></i>
            <span class="hidden sm:inline">{t().features}</span>
            <span class="sm:hidden">{t().feat}</span>
          </button>
          <button
            class={`tab flex-shrink-0 ${activeSection() === 'faq' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('faq')}
          >
            <i data-lucide="help-circle" class="w-4 h-4 me-1.5"></i>
            <span>{t().faq}</span>
          </button>
          <button
            class={`tab flex-shrink-0 ${activeSection() === 'videos' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('videos')}
          >
            <i data-lucide="video" class="w-4 h-4 mr-1.5"></i>
            <span class="hidden sm:inline">{t().videos}</span>
          </button>
          <button
            class={`tab flex-shrink-0 ${activeSection() === 'contact' ? 'tab-active' : ''}`}
            onClick={() => setActiveSection('contact')}
          >
            <i data-lucide="message-circle" class="w-4 h-4 me-1.5"></i>
            <span class="hidden sm:inline">{t().contact}</span>
          </button>
        </div>

      {/* Content */}
      <div class="bg-base-100 rounded-box p-4 sm:p-6 md:p-8 shadow-sm border border-base-200">
        <Show when={activeSection() === 'getting-started'}>
           <div>
             <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 class="text-xl sm:text-2xl md:text-3xl font-bold">{t().gettingStarted}</h2>
                  <p class="text-sm text-base-content/70 mt-1">
                    {t().followProcessDesc}
                  </p>
                </div>
                <div class="text-left sm:text-right w-full sm:w-auto">
                  <div class="text-xs sm:text-sm text-base-content/60">{t().progress}</div>
                  <div class="text-sm sm:text-lg font-semibold">{tutorialProgress()}/5 {t().stepsCompleted}</div>
                 <progress
                   class="progress progress-primary w-full sm:w-32 mt-1"
                   value={tutorialProgress()}
                   max="5"
                 ></progress>
               </div>
             </div>

             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
               <For each={gettingStartedSteps()}>
                 {(step, index) => (
                  <div class={`card shadow-sm transition-all duration-200 ${step.completed ? 'bg-success/10 border-success/20' : 'bg-base-200'}`}>
                    <div class="card-body p-4">
                       <div class="flex items-center gap-3 mb-3">
                         <div class={`p-2 rounded-lg ${step.completed ? 'bg-success/20' : 'bg-primary/10'}`}>
                           <i data-lucide={step.icon} class={`w-5 h-5 sm:w-6 sm:h-6 ${step.completed ? 'text-success' : 'text-primary'}`}></i>
                         </div>
                         <div class="flex-1 min-w-0">
                           <h3 class="card-title text-base sm:text-lg">{step.title}</h3>
                           {step.completed && (
                             <div class="badge badge-success badge-xs sm:badge-sm mt-1">{t().completed}</div>
                           )}
                         </div>
                       </div>
                       <p class="text-sm text-base-content/70 mb-3 line-clamp-2">{step.description}</p>
                       <details class="text-xs">
                         <summary class="cursor-pointer text-primary hover:text-primary-focus">{t().learnMore}</summary>
                        <p class="mt-2 text-base-content/60">{step.details}</p>
                       </details>
                       {!step.completed && (
                          <button
                            class="btn btn-primary btn-sm mt-3 w-full"
                            onClick={() => markStepCompleted(step.id)}
                          >
                            {t().markAsCompleted}
                          </button>
                       )}
                    </div>
                  </div>
                )}
              </For>
             </div>

             <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                   class="btn btn-outline btn-sm"
                   onClick={resetTutorial}
                 >
                    <i data-lucide="rotate-ccw" class="w-4 h-4 me-2"></i>
                   {t().resetProgress}
                 </button>
                 <div class="alert alert-info flex-1 text-sm">
                   <i data-lucide="info" class="w-5 h-5 flex-shrink-0"></i>
                   <div>
                     <h3 class="font-bold">{t().proTip}</h3>
                     <p class="text-xs sm:text-sm">{t().proTipDesc}</p>
                   </div>
                 </div>
             </div>
           </div>
        </Show>

        <Show when={activeSection() === 'tutorials'}>
           <div>
             <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t().advancedGuides}</h2>
             <p class="text-sm text-base-content/70 mb-6 sm:mb-8">
               {t().understandingProcess}
             </p>

             <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
               <For each={advancedGuides()}>
                 {(guide) => (
                  <div class="card bg-base-200 shadow-sm">
                    <div class="card-body p-4 sm:p-6">
                      <div class="flex items-center gap-3 mb-3 sm:mb-4">
                        <div class="p-2 bg-primary/10 rounded-lg">
                          <i data-lucide={guide.icon} class="w-5 h-5 sm:w-6 sm:h-6 text-primary"></i>
                        </div>
                        <h3 class="card-title text-base sm:text-lg">{guide.title}</h3>
                      </div>
                      <div class="prose prose-sm max-w-none text-sm">
                        <div innerHTML={guide.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}></div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
             </div>
           </div>
        </Show>

        <Show when={activeSection() === 'features'}>
            <div>
              <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t().featuresOverview}</h2>
              <p class="text-sm text-base-content/70 mb-6 sm:mb-8">
                {t().featuresDesc}
              </p>

             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               <For each={features()}>
                 {(feature) => (
                  <div class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div class="card-body p-4">
                      <div class="flex items-center gap-3 mb-3">
                        <div class="p-2 bg-primary/10 rounded-lg">
                          <i data-lucide={feature.icon} class="w-5 h-5 sm:w-6 sm:h-6 text-primary"></i>
                        </div>
                        <h3 class="card-title text-base sm:text-lg">{feature.title}</h3>
                      </div>
                      <p class="text-sm text-base-content/70">{feature.description}</p>
                      <div class="card-actions justify-end mt-3">
                        <button class="btn btn-primary btn-sm btn-outline">
                          {t().learnMore}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
             </div>

             <div class="alert alert-success mt-6 sm:mt-8 text-sm">
               <i data-lucide="check-circle" class="w-5 h-5 flex-shrink-0"></i>
               <div>
                 <h3 class="font-bold">{t().allFeaturesActive}</h3>
                 <p>{t().featuresActiveDesc}</p>
               </div>
             </div>
           </div>
        </Show>

        <Show when={activeSection() === 'videos'}>
            <div>
              <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t().videoTutorials}</h2>
              <p class="text-sm text-base-content/70 mb-6 sm:mb-8">
                {t().videosDesc}
              </p>

             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               <For each={videoTutorials()}>
                 {(video) => (
                    <div class="card bg-base-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                         onClick={() => toastManager.info(`Playing: ${video.title}`)}>
                     <figure class="px-4 pt-4">
                       <div class="bg-base-300 rounded-lg h-28 sm:h-32 flex items-center justify-center">
                         <i data-lucide="play-circle" class="w-10 h-10 sm:w-12 sm:h-12 text-primary"></i>
                       </div>
                     </figure>
                     <div class="card-body p-4">
                       <h3 class="card-title text-base sm:text-lg">{video.title}</h3>
                       <p class="text-sm text-base-content/70 line-clamp-2">{video.description}</p>
                       <div class="flex justify-between items-center mt-2 sm:mt-3">
                         <div class="badge badge-neutral text-xs">{video.duration}</div>
                          <button class="btn btn-primary btn-sm">
                            <i data-lucide="play" class="w-4 h-4 me-1"></i>
                            {t().watch}
                          </button>
                       </div>
                     </div>
                   </div>
                )}
              </For>
             </div>

             <div class="alert alert-info mt-6 sm:mt-8 text-sm">
               <i data-lucide="video" class="w-5 h-5 flex-shrink-0"></i>
               <div>
                 <h3 class="font-bold">{t().moreVideosSoon}</h3>
                 <p>{t().moreVideosDesc}</p>
               </div>
             </div>
           </div>
        </Show>

        <Show when={activeSection() === 'faq'}>
           <div>
             <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t().faq}</h2>

            {/* Search and Filters */}
            <div class="mb-4 sm:mb-6 space-y-3">
               <div class="flex flex-col sm:flex-row gap-3">
                  <div class="flex-1 relative">
                    <i data-lucide="search" class="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50"></i>
                    <input
                      type="text"
                      placeholder={t().searchFAQ}
                      class="input input-bordered w-full ps-10 text-sm"
                      value={searchQuery()}
                      onInput={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                 <select class="select select-bordered w-full sm:w-48 text-sm">
                   <option value="">{t().allCategories}</option>
                   <option value="Getting Started">{t().gettingStartedCat}</option>
                   <option value="Projects">{t().projects}</option>
                   <option value="Organization">{t().organization}</option>
                   <option value="Resources">{t().resources}</option>
                   <option value="Data Management">{t().dataManagement}</option>
                   <option value="Workflow">{t().workflow}</option>
                   <option value="Troubleshooting">{t().troubleshooting}</option>
                   <option value="Interface">{t().interface}</option>
                   <option value="Technical">{t().technical}</option>
                   <option value="Privacy">{t().privacy}</option>
                 </select>
               </div>

               <Show when={searchQuery()}>
                 <div class="text-sm text-base-content/60">
                   {t().foundResults.replace('{count}', filteredFaqs().length).replace('{plural}', filteredFaqs().length !== 1 ? 's' : '').replace('{query}', searchQuery())}
                 </div>
               </Show>
             </div>

             <div class="space-y-3 sm:space-y-4">
               <For each={filteredFaqs()}>
                 {(faq, index) => (
                   <div class="collapse collapse-arrow bg-base-200 hover:bg-base-300 transition-colors duration-200">
                     <input
                       type="checkbox"
                       id={`faq-${faq.id}`}
                       checked={expandedFaq().has(faq.id)}
                       onChange={(e) => {
                         const newExpanded = new Set(expandedFaq());
                         if (e.target.checked) {
                           newExpanded.add(faq.id);
                         } else {
                           newExpanded.delete(faq.id);
                         }
                         setExpandedFaq(newExpanded);
                       }}
                     />
                     <div class="collapse-title text-base font-medium flex items-center gap-2 flex-wrap">
                       <span class="badge badge-primary badge-xs sm:badge-sm">{faq.category}</span>
                       <span class="break-words">{faq.question}</span>
                     </div>
                     <div class="collapse-content">
                       <div class="prose prose-sm max-w-none text-sm">
                         <div innerHTML={faq.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}></div>
                       </div>
                       <div class="flex flex-wrap gap-1 mt-3">
                         <For each={faq.tags}>
                           {(tag) => (
                             <span class="badge badge-outline badge-xs">#{tag}</span>
                           )}
                         </For>
                       </div>
                     </div>
                   </div>
                )}
              </For>
             </div>

             <Show when={filteredFaqs().length === 0}>
               <div class="text-center py-8 text-base-content/50">
                 <i data-lucide="search-x" class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2"></i>
                 <p>{t().noMatches}</p>
                 <button
                   class="btn btn-primary mt-4"
                   onClick={() => setSearchQuery('')}
                 >
                   {t().clearSearch}
                 </button>
               </div>
             </Show>

             <div class="alert alert-warning mt-6 sm:mt-8 text-sm">
               <i data-lucide="message-circle" class="w-5 h-5 flex-shrink-0"></i>
               <div>
                 <h3 class="font-bold">{t().cantFind}</h3>
                 <div class="text-xs sm:text-sm">
                   {t().checkTutorialsText} <a href="#videos" class="link link-primary" onClick={() => setActiveSection('videos')}>{t().videoTutorials}</a> {t().orText} <a href="#contact" class="link link-primary" onClick={() => setActiveSection('contact')}>{t().contactSupport}</a>.
                 </div>
               </div>
             </div>
           </div>
        </Show>

        <Show when={activeSection() === 'contact'}>
           <div>
             <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t().contactUs}</h2>
             <p class="text-sm text-base-content/70 mb-6 sm:mb-8">
               {t().contactDesc}
             </p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Contact Form */}
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4 sm:p-6">
                   <h3 class="card-title text-lg sm:text-xl mb-4">{t().sendMessage}</h3>
                   <form onSubmit={(e) => { e.preventDefault(); submitContactForm(); }}>
                     <div class="space-y-3 sm:space-y-4">
                       <div>
                         <label class="label py-1">
                           <span class="label-text text-sm">{t().name}</span>
                         </label>
                         <input
                           type="text"
                           placeholder="Your name"
                           class="input input-bordered w-full text-sm"
                           value={contactForm().name}
                           onInput={(e) => setContactForm({...contactForm(), name: e.target.value})}
                           required
                         />
                       </div>

                       <div>
                         <label class="label py-1">
                           <span class="label-text text-sm">{t().email}</span>
                         </label>
                         <input
                           type="email"
                           placeholder="your.email@example.com"
                           class="input input-bordered w-full text-sm"
                           value={contactForm().email}
                           onInput={(e) => setContactForm({...contactForm(), email: e.target.value})}
                           required
                         />
                       </div>

                       <div>
                         <label class="label py-1">
                           <span class="label-text text-sm">{t().subject}</span>
                         </label>
                          <select
                            class="select select-bordered w-full text-sm"
                            value={contactForm().subject}
                            onChange={(e) => setContactForm({...contactForm(), subject: e.target.value})}
                            required
                          >
                            <option value="">{t().selectSubject}</option>
                            <option value="technical-issue">{t().technicalIssue}</option>
                            <option value="feature-request">{t().featureRequest}</option>
                            <option value="bug-report">{t().bugReport}</option>
                            <option value="account-help">{t().accountHelp}</option>
                            <option value="billing">{t().billingQuestion}</option>
                            <option value="other">{t().other}</option>
                          </select>
                       </div>

                       <div>
                         <label class="label py-1">
                           <span class="label-text text-sm">{t().message}</span>
                         </label>
                          <textarea
                            placeholder={t().describeIssue}
                            class="textarea textarea-bordered w-full text-sm"
                            rows="3"
                            value={contactForm().message}
                            onInput={(e) => setContactForm({...contactForm(), message: e.target.value})}
                            required
                          ></textarea>
                       </div>

                         <button type="submit" class="btn btn-primary w-full">
                           <i data-lucide="send" class="w-4 h-4 me-2"></i>
                           {t().send}
                         </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Contact Info & Quick Help */}
               <div class="space-y-4 sm:space-y-6">
                 <div class="card bg-base-200 shadow-sm">
                   <div class="card-body p-4 sm:p-6">
                     <h3 class="card-title text-base sm:text-lg mb-3 sm:mb-4">{t().quickSupport}</h3>
                     <div class="space-y-3">
                       <div class="flex items-start gap-3">
                         <i data-lucide="mail" class="w-5 h-5 text-primary mt-0.5"></i>
                         <div>
                           <div class="font-semibold text-sm sm:text-base">{t().emailSupport}</div>
                           <div class="text-xs sm:text-sm text-base-content/60">{t().supportEmail}</div>
                         </div>
                       </div>
                       <div class="flex items-start gap-3">
                         <i data-lucide="message-circle" class="w-5 h-5 text-primary mt-0.5"></i>
                         <div>
                           <div class="font-semibold text-sm sm:text-base">{t().liveChat}</div>
                           <div class="text-xs sm:text-sm text-base-content/60">{t().liveChatHours}</div>
                         </div>
                       </div>
                       <div class="flex items-start gap-3">
                         <i data-lucide="book" class="w-5 h-5 text-primary mt-0.5"></i>
                         <div>
                           <div class="font-semibold text-sm sm:text-base">{t().documentation}</div>
                           <div class="text-xs sm:text-sm text-base-content/60">{t().docsDesc}</div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div class="card bg-base-200 shadow-sm">
                   <div class="card-body p-4 sm:p-6">
                     <h3 class="card-title text-base sm:text-lg mb-3 sm:mb-4">{t().communityResources}</h3>
                     <div class="space-y-2">
                       <button class="btn btn-outline btn-sm w-full justify-start gap-2">
                         <i data-lucide="users" class="w-4 h-4"></i>
                         <span class="truncate">{t().communityForum}</span>
                       </button>
                       <button class="btn btn-outline btn-sm w-full justify-start gap-2">
                         <i data-lucide="github" class="w-4 h-4"></i>
                         <span class="truncate">{t().githubIssues}</span>
                       </button>
                       <button class="btn btn-outline btn-sm w-full justify-start gap-2">
                         <i data-lucide="twitter" class="w-4 h-4"></i>
                         <span class="truncate">{t().followTwitter}</span>
                       </button>
                     </div>
                   </div>
                 </div>

                 <div class="alert alert-info text-sm">
                   <i data-lucide="clock" class="w-5 h-5 flex-shrink-0"></i>
                   <div>
                     <h3 class="font-bold">{t().responseTime}</h3>
                     <p class="text-xs sm:text-sm">{t().responseTimeDesc}</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="text-center py-6 sm:py-8 border-t border-base-200">
        <div class="stats stats-vertical sm:stats-horizontal shadow bg-base-100 rounded-box max-w-full">
          <div class="stat py-3">
            <div class="stat-figure text-primary">
              <i data-lucide="help-circle" class="w-6 h-6 sm:w-8 sm:h-8"></i>
            </div>
            <div class="stat-title text-xs sm:text-sm">{t().helpArticles}</div>
            <div class="stat-value text-primary text-lg sm:text-2xl">50+</div>
            <div class="stat-desc text-xs">{t().comprehensive}</div>
          </div>

          <div class="stat py-3">
            <div class="stat-figure text-secondary">
              <i data-lucide="users" class="w-6 h-6 sm:w-8 sm:h-8"></i>
            </div>
             <div class="stat-title text-xs sm:text-sm">{t().community}</div>
            <div class="stat-value text-secondary text-lg sm:text-2xl">1000+</div>
            <div class="stat-desc text-xs">{t().activeUsers}</div>
          </div>

          <div class="stat py-3">
            <div class="stat-figure text-accent">
              <i data-lucide="clock" class="w-6 h-6 sm:w-8 sm:h-8"></i>
            </div>
            <div class="stat-title text-xs sm:text-sm">{t().avgResponse}</div>
            <div class="stat-value text-accent text-lg sm:text-2xl">2h</div>
            <div class="stat-desc text-xs">{t().responseTime}</div>
          </div>
        </div>

        <div class="mt-6 sm:mt-8">
           <p class="text-base-content/60 mb-4 text-sm">
             {t().stillNeedHelp} {t().contactSupportTeam} {t().orCheckOutOur} {t().communityForums}.
           </p>
          <div class="flex flex-wrap justify-center gap-2 sm:gap-4">
            <button
              class="btn btn-outline btn-sm gap-2"
              onClick={() => setActiveSection('contact')}
            >
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span class="hidden sm:inline">{t().contact}</span>
            </button>
            <button class="btn btn-outline btn-sm gap-2">
              <i data-lucide="external-link" class="w-4 h-4"></i>
              <span class="hidden sm:inline">{t().communityForums}</span>
            </button>
            <button class="btn btn-outline btn-sm gap-2">
              <i data-lucide="github" class="w-4 h-4"></i>
              <span class="hidden sm:inline">{t().githubIssues}</span>
            </button>
          </div>
        </div>

        <div class="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-base-200">
           <div class="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-base-content/50">
             <A href="/privacy-policy" class="link link-hover">{t().privacyPolicy}</A>
             <A href="/terms-of-service" class="link link-hover">{t().termsService}</A>
              <A href="/status" class="link link-hover">{t().statusPage}</A>
              <A href="/changelog" class="link link-hover">{t().changelog}</A>
           </div>
           <p class="text-xs text-base-content/40 mt-4">
             © {new Date().getFullYear()} iGate. <em>"One Gate, Endless Possibilities."</em>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Help;