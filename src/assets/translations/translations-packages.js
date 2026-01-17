import logger from '../../lib/logger.js';

// Packages page translations
export const packagesTranslations = {
  en: {
    subscriptionPlans: 'Subscription Packages',
    currentPlan: 'Current Plan',
    choosePlan: 'Choose the perfect plan for your needs',
    currentPlanBanner: 'Current Plan: {plan}',
    creditsRemaining: 'Credits remaining: {remaining} / {max}',
    perMonth: '/month',
    creditsIncluded: '{credits} credits included',
    currentPlanButton: 'Current Plan',
    getStarted: 'Get Started',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    mostPopular: 'Most Popular',
    
    // Feature comparison table
    featureComparison: 'Feature Comparison',
    feature: 'Feature',
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
    
    // Feature comparison rows
    aiAssistance: 'AI Assistance',
    aiAssistanceFree: 'Basic',
    aiAssistancePro: 'Advanced',
    aiAssistanceEnterprise: 'Advanced',
    
    projectsPerMonth: 'Projects per Month',
    projectsFree: '3',
    projectsPro: 'Unlimited',
    projectsEnterprise: 'Unlimited',
    
    creditsRow: 'Credits',
    creditsFree: '50',
    creditsPro: '500',
    creditsEnterprise: '2000',
    
    supportRow: 'Support',
    supportFree: 'Community',
    supportPro: 'Priority',
    supportEnterprise: 'Dedicated',
    
    templatesRow: 'Templates',
    templatesFree: 'Basic',
    templatesPro: 'Premium',
    templatesEnterprise: 'Premium',
    
    collaborationRow: 'Collaboration',
    collaborationFree: '-',
    collaborationPro: '✓',
    collaborationEnterprise: '✓',
    
    apiAccessRow: 'API Access',
    apiAccessFree: '-',
    apiAccessPro: '✓',
    apiAccessEnterprise: '✓',
    
    customIntegrations: 'Custom Integrations',
    customIntegrationsFree: '-',
    customIntegrationsPro: '-',
    customIntegrationsEnterprise: '✓',

    // Package features - Free
    freePlan: 'Free',
    freePrice: 0,
    aiBusinessPlan: 'AI-powered business plan generation',
    basicMarket: 'Basic market analysis',
    financialProjections: 'Financial projections',
    projectsMaximum: '3 projects maximum',
    communitySupport: 'Community support',
    basicExport: 'Basic export options',
    
    // Package features - Pro
    proPlan: 'Pro',
    proPrice: 29,
    everythingInFree: 'Everything in Free plan',
    unlimitedProjects: 'Unlimited projects',
    advancedMarket: 'Advanced market research',
    competitiveAnalysis: 'Competitive analysis',
    pitchDeck: 'Pitch deck generation',
    financialModeling: 'Financial modeling',
    prioritySupport: 'Priority customer support',
    advancedExport: 'Advanced export formats',
    apiAccess: 'API access',
    customTemplates: 'Custom templates',
    
    // Package features - Enterprise
    enterprisePlan: 'Enterprise',
    enterprisePrice: 99,
    everythingInPro: 'Everything in Pro plan',
    teamCollaboration: 'Team collaboration tools',
    advancedAnalytics: 'Advanced analytics dashboard',
    customIntegrationsFeature: 'Custom integrations',
    whiteLabel: 'White-label options',
    dedicatedManager: 'Dedicated success manager',
    priorityRequests: 'Priority feature requests',
    advancedSecurity: 'Advanced security features',
    customAITraining: 'Custom AI model training',
    premiumSupport: '24/7 premium support',

    // Toast messages
    alreadySubscribed: 'You already have the {plan} plan!',
    subscriptionSuccess: 'Successfully subscribed to {plan} plan',
    failedToSubscribe: 'Failed to subscribe. Please try again.',
  },
  ar: {
    subscriptionPlans: 'خطط الاشتراك',
    currentPlan: 'الخطة الحالية',
    choosePlan: 'اختر الخطة الأنسب لاحتياجاتك',
    currentPlanBanner: 'الخطة الحالية: {plan}',
    creditsRemaining: 'الاعتمادات المتبقية: {remaining} / {max}',
    perMonth: '/شهر',
    creditsIncluded: '{credits} اعتماداً مشمولاً',
    currentPlanButton: 'الخطة الحالية',
    getStarted: 'ابدأ الآن',
    upgrade: 'ترقية',
    downgrade: 'تخفيض',
    mostPopular: 'الأكثر شهرة',
    
    // Feature comparison table
    featureComparison: 'مقارنة الميزات',
    feature: 'الميزة',
    free: 'مجاني',
    pro: 'احترافي',
    enterprise: 'مؤسسي',
    
    // Feature comparison rows
    aiAssistance: 'مساعدة الذكاء الاصطناعي',
    aiAssistanceFree: 'أساسي',
    aiAssistancePro: 'متقدم',
    aiAssistanceEnterprise: 'متقدم',
    
    projectsPerMonth: 'المشاريع شهرياً',
    projectsFree: '3',
    projectsPro: 'غير محدود',
    projectsEnterprise: 'غير محدود',
    
    creditsRow: 'الاعتمادات',
    creditsFree: '50',
    creditsPro: '500',
    creditsEnterprise: '2000',
    
    supportRow: 'الدعم',
    supportFree: 'مجتمع',
    supportPro: 'أولوية',
    supportEnterprise: 'مخصص',
    
    templatesRow: 'القوالب',
    templatesFree: 'أساسية',
    templatesPro: 'مميزة',
    templatesEnterprise: 'مميزة',
    
    collaborationRow: 'التعاون',
    collaborationFree: '-',
    collaborationPro: '✓',
    collaborationEnterprise: '✓',
    
    apiAccessRow: 'وصول API',
    apiAccessFree: '-',
    apiAccessPro: '✓',
    apiAccessEnterprise: '✓',
    
    customIntegrations: 'التكاملات المخصصة',
    customIntegrationsFree: '-',
    customIntegrationsPro: '-',
    customIntegrationsEnterprise: '✓',

    // Package features - Free
    freePlan: 'مجاني',
    freePrice: 0,
    aiBusinessPlan: 'إنشاء خطط أعمال بالذكاء الاصطناعي',
    basicMarket: 'تحليل السوق الأساسي',
    financialProjections: 'التوقعات المالية',
    projectsMaximum: '3 مشاريع كحد أقصى',
    communitySupport: 'دعم المجتمع',
    basicExport: 'خيارات التصدير الأساسية',
    
    // Package features - Pro
    proPlan: 'احترافي',
    proPrice: 29,
    everythingInFree: 'كل ما في الخطة المجانية',
    unlimitedProjects: 'مشاريع غير محدودة',
    advancedMarket: 'بحث سوق متقدم',
    competitiveAnalysis: 'تحليل تنافسي',
    pitchDeck: 'إنشاء عروض التمويل',
    financialModeling: 'النمذجة المالية',
    prioritySupport: 'دعم العملاء ذو الأولوية',
    advancedExport: 'خيارات تصدير متقدمة',
    apiAccess: 'وصول API',
    customTemplates: 'قوالب مخصصة',
    
    // Package features - Enterprise
    enterprisePlan: 'مؤسسي',
    enterprisePrice: 99,
    everythingInPro: 'كل ما في الخطة الاحترافية',
    teamCollaboration: 'أدوات التعاون الجماعي',
    advancedAnalytics: 'لوحة تحليلات متقدمة',
    customIntegrationsFeature: 'تكاملات مخصصة',
    whiteLabel: 'خيارات white-label',
    dedicatedManager: 'مدير نجاح مخصص',
    priorityRequests: 'طلبات الميزات ذات الأولوية',
    advancedSecurity: 'ميزات أمان متقدمة',
    customAITraining: 'تدريب نموذج AI مخصص',
    premiumSupport: 'دعم مميز على مدار الساعة',

    // Toast messages
    alreadySubscribed: 'لديك بالفعل خطة {plan}!',
    subscriptionSuccess: 'تم الاشتراك بنجاح في خطة {plan}',
    failedToSubscribe: 'فشل في الاشتراك. يرجى المحاولة مرة أخرى.',
  }
};