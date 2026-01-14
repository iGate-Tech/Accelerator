import logger from '../../lib/logger.js';

// Help page translations
export const helpTranslations = {
  en: {
    helpDocumentation: 'Help & Documentation',
    everythingYouNeed: 'Everything you need to know about using the Startup Accelerator effectively',
    searchHelp: 'Search help & documentation...',
    searchFAQ: 'Search FAQ...',
    gettingStarted: 'Getting Started',
    tutorials: 'Tutorials',
    features: 'Features',
    faq: 'FAQ',
    videos: 'Videos',
    contact: 'Contact',
    quickSupport: 'Quick Support',
    liveChat: 'Live Chat',
    videoTutorials: 'Video Tutorials',
    advancedGuides: 'Advanced Tutorials',
    contactForm: 'Send us a message',
    needHelp: 'Need help?',
    supportTeam: 'support team',
    communityForums: 'community forums',
    ctrlK: 'Ctrl+K',

    // Getting Started Steps
    createFirstProject: 'Create Your First Task',
    createProjectDesc: 'Go to the home page and describe your startup idea. Be specific about the problem you\'re solving and your target market.',
    followProcess: 'Follow the Accelerator Process',
    followProcessDesc: 'The AI will guide you through 51 structured steps covering problem validation, market analysis, business modeling, and funding strategy.',
    monitorProgress: 'Monitor Progress',
    monitorProgressDesc: 'Use the Dashboard to track your overall progress, view completed projects, and monitor resource usage.',
    organizePortfolio: 'Organize Your Portfolio',
    organizePortfolioDesc: 'Create groups in the Portfolio section to organize your projects by theme, industry, or development stage.',
    exploreManage: 'Explore and Manage',
    exploreManageDesc: 'Use the Explore page to view all projects with filtering and search capabilities. Edit, export, or continue working on any project.',

    // Advanced Guides
    effectiveDescriptions: 'Writing Effective Startup Descriptions',
    understandingProcess: 'Understanding the 51-Step Process',
    resourceManagement: 'Resource Management Best Practices',
    portfolioStrategies: 'Portfolio Organization Strategies',

    // Features
    aiPoweredAnalysis: 'AI-Powered Analysis',
    aiAnalysisDesc: 'Leverage advanced AI to analyze your startup idea from multiple angles, providing comprehensive insights and recommendations.',
    structuredMethodology: 'Structured Methodology',
    structuredDesc: 'Follow a proven 51-step framework that covers all aspects of startup development, from ideation to funding.',
    progressTracking: 'Progress Tracking',
    progressDesc: 'Monitor your advancement through detailed progress indicators, completion percentages, and resource usage metrics.',
    portfolioOrganization: 'Portfolio Organization',
    portfolioOrgDesc: 'Keep your projects organized with custom groups, drag-and-drop functionality, and comprehensive project management tools.',
    dataPersistence: 'Data Persistence',
    dataDesc: 'All your work is automatically saved locally, ensuring you never lose progress on your startup ideas.',
    exportCapabilities: 'Export Capabilities',
    exportDesc: 'Export individual projects or your entire portfolio for backup, sharing, or further analysis.',

    // FAQ Categories and Questions
    general: 'General',
    gettingStartedCat: 'Getting Started',
    projects: 'Projects',
    organization: 'Organization',
    resources: 'Resources',
    dataManagement: 'Data Management',
    workflow: 'Workflow',
    troubleshooting: 'Troubleshooting',
    interface: 'Interface',
    technical: 'Technical',
    privacy: 'Privacy',

    whatIsAccelerator: "What is the Startup Accelerator?",
    acceleratorDesc: "The Startup Accelerator is an AI-powered tool that guides entrepreneurs through a comprehensive 51-step process to validate and develop their startup ideas. It covers everything from problem analysis to funding strategy.",
    createProject: "How do I create a new project?",
    createProjectDesc: "Navigate to the home page and enter your startup idea in the text area. Click 'Start' to begin the accelerator process. Your project will be automatically saved and appear in your project list.",
    projectStatuses: "What are the different project statuses?",
    projectStatusesDesc: "Projects can be in several states: Idle (not started), Processing (actively being worked on), Completed (all 51 steps finished), or Paused (temporarily stopped).",
    portfolioFeature: "How does the portfolio feature work?",
    portfolioFeatureDesc: "The Portfolio page allows you to organize your projects into custom groups. You can drag and drop projects between groups, create new groups, and manage your project organization visually.",

    // Video Tutorials
    gettingStarted5Min: 'Getting Started in 5 Minutes',
    gettingStartedDesc: 'Quick overview of creating your first project',
    understanding51Step: 'Understanding the 51-Step Process',
    understandingDesc: 'Deep dive into the accelerator methodology',
    portfolioMasterclass: 'Portfolio Management Masterclass',
    portfolioMasterDesc: 'Advanced organization and grouping techniques',

    // Contact Form
    contactUs: 'Contact Us',
    contactDesc: 'Need help? Get in touch with our support team. We\'re here to help you succeed with your startup ideas.',
    sendMessage: 'Send us a message',
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    send: 'Send',

     // Footer
     helpArticles: 'Help Articles',
     comprehensive: 'Comprehensive guides',
      activeUsers: 'Active users',
      community: 'Community',
      avgResponse: 'Avg Response',
     responseTime: 'Support response time',
      copyright: '© {year} iGate. بوابة واحدة، إمكانيات لا حصر لها.',
     privacyPolicy: 'Privacy Policy',
     termsService: 'Terms of Service',
     statusPage: 'Status Page',
     changelog: 'Changelog',

     // UI Elements
     completed: 'Completed',
     markAsCompleted: 'Mark as Completed',
     resetProgress: 'Reset Progress',
     learnMore: 'Learn more',
     proTip: 'Pro Tip',
     allFeaturesActive: 'All Features Active',
     featuresActiveDesc: 'Every feature mentioned above is fully functional and ready to use. Explore the app to discover them all!',

      // Footer Links
      stillNeedHelp: 'Still need help?',
      contactSupportTeam: 'Contact our support team',
      orCheckOutOur: 'or check out our',
      communityForums: 'Community Forums',
      githubIssues: 'GitHub Issues',

      // Additional FAQ Questions and Answers
      resourcesTracked: "What resources are tracked?",
      resourcesTrackedDesc: "The system tracks **credits** (representing AI processing costs) and **time** spent on each project. These metrics help you understand the investment required for each startup idea. View resource usage in the Dashboard.",
      exportProjects: "هل يمكنني تصدير مشاريعي؟",
      exportProjectsDesc: "نعم، يمكنك تصدير مشاريع فردية أو جميع المشاريع مرة واحدة من قائمة الشريط الجانبي. يتم تصدير المشاريع كملفات JSON للنسخ الاحتياطي أو المشاركة. يمكنك أيضاً استيراد المشاريع والوصول إلى ميزات تصدير البيانات.",
      pauseResume: "كيف أوقف وأستأنف المشاريع؟",
      pauseResumeDesc: "أثناء العمل على مشروع، يمكنك استخدام أزرار الإيقاف المؤقت والاستئناف في واجهة الوكيل. هذا يسمح لك بأخذ فترات راحة ومتابعة من حيث توقفت. تحتفظ المشاريع المتوقفة بكل التقدم ويمكن استئنافها فوراً.",
      aiResponseFails: "ماذا يحدث إذا فشل رد الذكاء الاصطناعي؟",
      aiResponseFailsDesc: "إذا فشل رد الذكاء الاصطناعي، سيقوم النظام بإعادة المحاولة تلقائياً مع تأخير أسي (60ث، 120ث، 240ث). إذا فشلت جميع المحاولات، سينتقل إلى الخطوة التالية أو يسمح لك بالمتابعة يدوياً. تحقق من اتصال الإنترنت ومؤشر حالة الخادم.",
      editCompleted: "Can I edit completed projects?",
      editCompletedDesc: "Yes, you can open any project from the Explore page and continue working on it. The system will resume from where you left off or allow you to restart if needed. Completed projects can be revisited for updates or refinements.",
      deleteProjects: "How do I delete projects?",
      deleteProjectsDesc: "Projects can be deleted individually from the sidebar menu or in bulk using the 'Delete All Projects' option. Be careful as this action cannot be undone. Consider exporting projects before deletion for backup purposes.",
      keyboardShortcuts: "Are there keyboard shortcuts?",
      keyboardShortcutsDesc: "Yes! Press **Ctrl+K** to focus the search bar. Use **Enter** to submit forms and **Escape** to close modals. Arrow keys navigate through lists and selections. These shortcuts work across all pages.",
      darkMode: "كيف أبدل إلى الوضع المظلم؟",
      darkModeDesc: "انقر على أيقونة الشمس/القمر في شريط التنقل العلوي الأيمن للتبديل بين المظهر الفاتح والمظلم. يتم حفظ تفضيلك تلقائياً ويستمر عبر الجلسات.",
      multiLanguage: "Does the app support multiple languages?",
      multiLanguageDesc: "Currently, the app supports English and Arabic. Use the language toggle in the navbar to switch between languages. More languages may be added in future updates.",
      offlineCapability: "Can I use the app offline?",
      offlineCapabilityDesc: "The app works primarily online for AI processing, but your project data is stored locally. You can view and organize existing projects offline, but creating new projects or continuing the accelerator process requires internet connectivity.",
      dataPrivacy: "How is my data protected?",
      dataPrivacyDesc: "All project data is stored locally in your browser using IndexedDB. No personal data is sent to external servers except for AI processing requests. Your startup ideas remain private and secure.",

      // Features section
      featuresOverview: "Features Overview",
      featuresDesc: "Discover the powerful features that make the Startup Accelerator your ultimate startup development companion.",

      // Videos section
      videosDesc: "Watch our comprehensive video guides to master the Startup Accelerator.",
      moreVideosSoon: "More Videos Coming Soon",
      moreVideosDesc: "We're constantly adding new video tutorials. Subscribe to our newsletter for updates!",

      // FAQ section
      foundResults: "Found {count} result{plural} for \"{query}\"",
      noMatches: "No FAQ matches your search. Try different keywords or browse all categories.",
      clearSearch: "Clear Search",
       cantFind: "Can't find what you're looking for?",
       checkTutorialsText: "Check our",
       orText: "or",
       contactSupport: "contact support",

      // Contact section
      thankYouFeedback: "Thank you for your feedback! We'll get back to you soon.",
      selectSubject: "Select a subject",
      technicalIssue: "Technical Issue",
      featureRequest: "Feature Request",
      bugReport: "Bug Report",
      accountHelp: "Account Help",
      billingQuestion: "Billing Question",
      other: "Other",
      describeIssue: "Describe your issue or question...",

      // Quick Support
      quickSupport: "Quick Support",
      emailSupport: "Email Support",
      supportEmail: "support@accelerator.com",
      liveChat: "Live Chat",
      liveChatHours: "Available 9 AM - 6 PM EST",
      documentation: "Documentation",
      docsDesc: "Comprehensive guides & API docs",

      // Community Resources
      communityResources: "Community Resources",
      communityForum: "Community Forum",
      githubIssues: "GitHub Issues",
      followTwitter: "Follow on Twitter",

      // Response Time
      responseTime: "Response Time",
      responseTimeDesc: "We typically respond to support requests within 24 hours during business days.",

      // Pro Tip
      proTipDesc: "Start with a clear, specific description of your startup idea. The more detailed your input, the better the AI can guide you through the process.",
      states: "States"
  },
  ar: {
    helpDocumentation: 'المساعدة والتوثيق',
    everythingYouNeed: 'كل ما تحتاجه لمعرفة كيفية استخدام مسرع بدء الأعمال بفعالية',
    searchHelp: 'البحث في المساعدة والتوثيق...',
    searchFAQ: 'البحث في الأسئلة الشائعة...',
    gettingStarted: 'البدء',
    tutorials: 'الدروس التعليمية',
    features: 'الميزات',
    faq: 'الأسئلة الشائعة',
    videos: 'الفيديوهات',
    contact: 'التواصل',
    quickSupport: 'الدعم السريع',
    liveChat: 'الدردشة الحية',
    videoTutorials: 'دروس الفيديو',
    advancedGuides: 'الدروس المتقدمة',
    contactForm: 'أرسل لنا رسالة',
    needHelp: 'تحتاج مساعدة؟',
    supportTeam: 'فريق الدعم',
    communityForums: 'منتديات المجتمع',
    ctrlK: 'Ctrl+K',

    // Getting Started Steps
    createFirstProject: 'أنشئ مهمتك الأولى',
    createProjectDesc: 'اذهب إلى الصفحة الرئيسية وصف فكرة عملك. كن محدداً حول المشكلة التي تحلها وسوقك المستهدف.',
    followProcess: 'اتبع عملية المسرع',
    followProcessDesc: 'سيرشدك الذكاء الاصطناعي من خلال 51 خطوة منظمة تغطي التحقق من المشكلة وتحليل السوق ونمذجة الأعمال واستراتيجية التمويل.',
    monitorProgress: 'راقب التقدم',
    monitorProgressDesc: 'استخدم لوحة التحكم لتتبع تقدمك العام وعرض المشاريع المكتملة ومراقبة استخدام الموارد.',
    organizePortfolio: 'نظم محفظتك',
    organizePortfolioDesc: 'أنشئ مجموعات في قسم المحفظة لتنظيم مشاريعك حسب الموضوع أو الصناعة أو مرحلة التطوير.',
    exploreManage: 'استكشف وأدر',
    exploreManageDesc: 'استخدم صفحة الاستكشاف لعرض جميع المشاريع مع إمكانيات التصفية والبحث. عدل أو صدّر أو استمر في العمل على أي مشروع.',

    // Advanced Guides
    effectiveDescriptions: 'كتابة وصف فعال للشركات الناشئة',
    understandingProcess: 'فهم عملية الـ51 خطوة',
    resourceManagement: 'أفضل الممارسات في إدارة الموارد',
    portfolioStrategies: 'استراتيجيات تنظيم المحفظة',

    // Features
    aiPoweredAnalysis: 'تحليل مدعوم بالذكاء الاصطناعي',
    aiAnalysisDesc: 'استفد من الذكاء الاصطناعي المتقدم لتحليل فكرة عملك من زوايا متعددة، مع تقديم رؤى شاملة وتوصيات.',
    structuredMethodology: 'منهجية منظمة',
    structuredDesc: 'اتبع إطار عمل مثبت من 51 خطوة يغطي جميع جوانب تطوير الشركات الناشئة، من التفكير إلى التمويل.',
    progressTracking: 'تتبع التقدم',
    progressDesc: 'راقب تقدمك من خلال مؤشرات تقدم مفصلة ونسب الإنجاز ومقاييس استخدام الموارد.',
    portfolioOrganization: 'تنظيم المحفظة',
    portfolioOrgDesc: 'احتفظ بمشاريعك منظمة مع مجموعات مخصصة ووظيفة السحب والإفلات وأدوات إدارة المشاريع الشاملة.',
    dataPersistence: 'استمرارية البيانات',
    dataDesc: 'يتم حفظ جميع أعمالك تلقائياً محلياً، مما يضمن عدم فقدان أي تقدم في أفكار عملك.',
    exportCapabilities: 'إمكانيات التصدير',
    exportDesc: 'صدّر مشاريع فردية أو محفظتك بأكملها للنسخ الاحتياطي أو المشاركة أو التحليل الإضافي.',

    // FAQ Categories and Questions
    general: 'عام',
    gettingStartedCat: 'البدء',
    projects: 'المشاريع',
    organization: 'التنظيم',
    resources: 'الموارد',
    dataManagement: 'إدارة البيانات',
    workflow: 'سير العمل',
    troubleshooting: 'استكشاف الأخطاء',
    interface: 'الواجهة',
    technical: 'تقني',
    privacy: 'الخصوصية',

    whatIsAccelerator: "ما هو مسرع بدء الأعمال؟",
    acceleratorDesc: "مسرع بدء الأعمال هو أداة مدعومة بالذكاء الاصطناعي ترشد رواد الأعمال من خلال عملية شاملة من 51 خطوة للتحقق من تطوير أفكار الشركات الناشئة. يغطي كل شيء من تحليل المشكلة إلى استراتيجية التمويل.",
    createProject: "كيف أنشئ مشروعاً جديداً؟",
    createProjectDesc: "انتقل إلى الصفحة الرئيسية وأدخل فكرة عملك في منطقة النص. انقر 'ابدأ' لبدء عملية المسرع. سيتم حفظ مشروعك تلقائياً وسيظهر في قائمة مشاريعك.",
    projectStatuses: "ما هي حالات المشاريع المختلفة؟",
    projectStatusesDesc: "يمكن أن تكون المشاريع في عدة حالات: خامل (لم يبدأ)، قيد المعالجة (يتم العمل عليه بنشاط)، مكتمل (انتهت جميع الخطوات الـ51)، أو متوقف مؤقتاً (متوقف مؤقتاً).",
    portfolioFeature: "كيف تعمل ميزة المحفظة؟",
    portfolioFeatureDesc: "تسمح صفحة المحفظة بتنظيم مشاريعك في مجموعات مخصصة. يمكنك سحب وإفلات المشاريع بين المجموعات وإنشاء مجموعات جديدة وإدارة تنظيم مشاريعك بشكل مرئي.",

    // Video Tutorials
    gettingStarted5Min: 'البدء في 5 دقائق',
    gettingStartedDesc: 'نظرة سريعة على إنشاء مشروعك الأول',
    understanding51Step: 'فهم عملية الـ51 خطوة',
    understandingDesc: 'غوص عميق في منهجية المسرع',
    portfolioMasterclass: 'ورشة عمل إدارة المحفظة',
    portfolioMasterDesc: 'تقنيات التنظيم والتجميع المتقدمة',

    // Contact Form
    contactUs: 'تواصل معنا',
    contactDesc: 'تحتاج مساعدة؟ تواصل مع فريق الدعم لدينا. نحن هنا لمساعدتك على النجاح في أفكار عملك.',
    sendMessage: 'أرسل لنا رسالة',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    subject: 'الموضوع',
    message: 'الرسالة',
    send: 'إرسال',

     // Footer
     helpArticles: 'مقالات المساعدة',
     comprehensive: 'دليل شامل',
      activeUsers: 'مستخدم نشط',
      community: 'المجتمع',
       avgResponse: 'متوسط الرد',
      responseTime: 'وقت الرد على الدعم',
      copyright: '© {year} iGate. بوابة واحدة، إمكانيات لا حصر لها.',
     privacyPolicy: 'سياسة الخصوصية',
     termsService: 'شروط الخدمة',
     statusPage: 'صفحة الحالة',
     changelog: 'سجل التغييرات',

     // UI Elements
     completed: 'مكتمل',
     markAsCompleted: 'وضع علامة مكتمل',
     resetProgress: 'إعادة تعيين التقدم',
     learnMore: 'تعلم المزيد',
     proTip: 'نصيحة احترافية',
     allFeaturesActive: 'جميع الميزات نشطة',
     featuresActiveDesc: 'كل ميزة مذكورة أعلاه تعمل بالكامل وجاهزة للاستخدام. استكشف التطبيق لاكتشافها جميعاً!',

      // Footer Links
      stillNeedHelp: 'لا تزال بحاجة إلى مساعدة؟',
      contactSupportTeam: 'تواصل مع فريق الدعم',
      orCheckOutOur: 'أو تحقق من',
      communityForums: 'منتديات المجتمع',
      githubIssues: 'مشاكل GitHub',

      // Additional FAQ Questions and Answers
      resourcesTracked: "ما هي الموارد التي يتم تتبعها؟",
      resourcesTrackedDesc: "يقوم النظام بتتبع **الاعتمادات** (التي تمثل تكاليف معالجة الذكاء الاصطناعي) و**الوقت** المستغل في كل مشروع. تساعد هذه المقاييس في فهم الاستثمار المطلوب لكل فكرة عمل. عرض استخدام الموارد في لوحة التحكم.",
      exportProjects: "هل يمكنني تصدير مشاريعي؟",
      exportProjectsDesc: "نعم، يمكنك تصدير مشاريع فردية أو جميع المشاريع مرة واحدة من قائمة الشريط الجانبي. يتم تصدير المشاريع كملفات JSON للنسخ الاحتياطي أو المشاركة. يمكنك أيضاً استيراد المشاريع والوصول إلى ميزات تصدير البيانات.",
      pauseResume: "كيف أوقف وأستأنف المشاريع؟",
      pauseResumeDesc: "أثناء العمل على مشروع، يمكنك استخدام أزرار الإيقاف المؤقت والاستئناف في واجهة الوكيل. هذا يسمح لك بأخذ فترات راحة ومتابعة من حيث توقفت. تحتفظ المشاريع المتوقفة بكل التقدم ويمكن استئنافها فوراً.",
      aiResponseFails: "ماذا يحدث إذا فشل رد الذكاء الاصطناعي؟",
      aiResponseFailsDesc: "إذا فشل رد الذكاء الاصطناعي، سيقوم النظام بإعادة المحاولة تلقائياً مع تأخير أسي (60ث، 120ث، 240ث). إذا فشلت جميع المحاولات، سينتقل إلى الخطوة التالية أو يسمح لك بالمتابعة يدوياً. تحقق من اتصال الإنترنت ومؤشر حالة الخادم.",
      editCompleted: "هل يمكنني تعديل المشاريع المكتملة؟",
      editCompletedDesc: "نعم، يمكنك فتح أي مشروع من صفحة الاستكشاف والاستمرار في العمل عليه. سيقوم النظام باستئناف من حيث توقفت أو يسمح لك بإعادة البدء إذا لزم الأمر. يمكن إعادة زيارة المشاريع المكتملة للتحديثات أو التحسينات.",
      deleteProjects: "كيف أحذف المشاريع؟",
      deleteProjectsDesc: "يمكن حذف المشاريع بشكل فردي من قائمة الشريط الجانبي أو بشكل جماعي باستخدام خيار 'حذف جميع المشاريع'. كن حذراً حيث لا يمكن التراجع عن هذا الإجراء. فكر في تصدير المشاريع قبل الحذف للنسخ الاحتياطي.",
      keyboardShortcuts: "هل هناك اختصارات لوحة المفاتيح؟",
      keyboardShortcutsDesc: "نعم! اضغط **Ctrl+K** للتركيز على شريط البحث. استخدم **Enter** لإرسال النماذج و**Escape** لإغلاق النوافذ المنبثقة. تتنقل مفاتيح الأسهم في القوائم والتحديدات. تعمل هذه الاختصارات في جميع الصفحات.",
      darkMode: "كيف أبدل إلى الوضع المظلم؟",
      darkModeDesc: "انقر على أيقونة الشمس/القمر في شريط التنقل العلوي الأيمن للتبديل بين المظهر الفاتح والمظلم. يتم حفظ تفضيلك تلقائياً ويستمر عبر الجلسات.",
      multiLanguage: "هل يدعم التطبيق لغات متعددة؟",
      multiLanguageDesc: "حالياً، يدعم التطبيق الإنجليزية والعربية. استخدم تبديل اللغة في شريط التنقل للتبديل بين اللغات. قد تُضاف لغات إضافية في التحديثات المستقبلية.",
      offlineCapability: "هل يمكنني استخدام التطبيق دون اتصال؟",
      offlineCapabilityDesc: "يعمل التطبيق بشكل أساسي عبر الإنترنت لمعالجة الذكاء الاصطناعي، لكن بيانات مشروعك مخزنة محلياً. يمكنك عرض وتنظيم المشاريع الموجودة دون اتصال، لكن إنشاء مشاريع جديدة أو متابعة عملية المسرع يتطلب اتصالاً بالإنترنت.",
      dataPrivacy: "كيف يتم حماية بياناتي؟",
      dataPrivacyDesc: "يتم تخزين جميع بيانات المشروع محلياً في متصفحك باستخدام IndexedDB. لا يتم إرسال أي بيانات شخصية إلى خوادم خارجية باستثناء طلبات معالجة الذكاء الاصطناعي. تبقى أفكار عملك خاصة وآمنة.",

      // Features section
      featuresOverview: "نظرة على الميزات",
      featuresDesc: "اكتشف الميزات القوية التي تجعل مسرع بدء الأعمال رفيقك المثالي في تطوير الشركات الناشئة.",

      // Videos section
      videosDesc: "شاهد دليلنا المرئي الشامل لإتقان مسرع بدء الأعمال.",
      moreVideosSoon: "المزيد من الفيديوهات قريباً",
      moreVideosDesc: "نحن نضيف باستمرار دروس فيديو جديدة. اشترك في نشرتنا الإخبارية للحصول على التحديثات!",

      // FAQ section
      foundResults: "تم العثور على {count} نتيجة{plural} لـ \"{query}\"",
      noMatches: "لا توجد أسئلة شائعة تطابق بحثك. جرب كلمات مفتاحية مختلفة أو تصفح جميع الفئات.",
      clearSearch: "مسح البحث",
       cantFind: "لا يمكنك العثور على ما تبحث عنه؟",
       checkTutorialsText: "تحقق من",
       orText: "أو",
       contactSupport: "اتصل بالدعم",

      // Contact section
      thankYouFeedback: "شكراً لك على تعليقاتك! سنعود إليك قريباً.",
      selectSubject: "اختر موضوعاً",
      technicalIssue: "مشكلة تقنية",
      featureRequest: "طلب ميزة",
      bugReport: "تقرير خطأ",
      accountHelp: "مساعدة الحساب",
      billingQuestion: "سؤال الفوترة",
      other: "أخرى",
      describeIssue: "صف مشكلتك أو سؤالك...",

      // Quick Support
      quickSupport: "الدعم السريع",
      emailSupport: "دعم البريد الإلكتروني",
      supportEmail: "support@accelerator.com",
      liveChat: "الدردشة الحية",
      liveChatHours: "متاح من 9 صباحاً - 6 مساءً بتوقيت الشرق الأمريكي",
      documentation: "التوثيق",
      docsDesc: "دليل شامل ووثائق API",

      // Community Resources
      communityResources: "موارد المجتمع",
      communityForum: "منتدى المجتمع",
      githubIssues: "مشاكل GitHub",
      followTwitter: "تابعنا على تويتر",

      // Response Time
      responseTime: "وقت الرد",
      responseTimeDesc: "نرد عادةً على طلبات الدعم خلال 24 ساعة خلال أيام العمل.",

      // Pro Tip
      proTipDesc: "ابدأ بوصف واضح ومحدد لفكرة عملك. كلما كان إدخالك أكثر تفصيلاً، كان الذكاء الاصطناعي أفضل في إرشادك خلال العملية.",
      states: "الحالات"
  }
};