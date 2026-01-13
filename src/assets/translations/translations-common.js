import logger from '../../lib/logger.js';

// Navigation translations
export const navigationTranslations = {
  en: {
    home: 'Home',
    dashboard: 'Dashboard',
    explore: 'Explore',
    portfolio: 'Portfolio',
    help: 'Help',
    tasks: 'Tasks',
    settings: 'Settings',
    packages: 'Packages',
    credits: 'Credits',
    billing: 'Billing',
  },
  ar: {
    home: 'الرئيسية',
    dashboard: 'لوحة التحكم',
    explore: 'استكشف',
    portfolio: 'المحفظة',
    help: 'مساعدة',
    tasks: 'المهام',
    settings: 'الإعدادات',
    packages: 'الباقات',
    credits: 'الاعتمادات',
    billing: 'الفواتير',
  }
};

// General/common translations
 export const commonTranslations = {
   en: {
     // Home page
     title: "Hi <span class='text-primary'>Demo</span>, what's your next big idea?",
     placeholder: 'Enter prompt...',

     // Actions
     save: 'Save',
     cancel: 'Cancel',
     delete: 'Delete',
     edit: 'Edit',
     add: 'Add',
     remove: 'Remove',
     confirm: 'Confirm',
     close: 'Close',

     // States
     loading: 'Loading...',

     // Navbar
     notifications: 'Notifications',
     newMessage: 'New Message',
     systemUpdate: 'System Update',
     reminder: 'Reminder',
     userAccount: 'User Account',
     manageAccount: 'Manage your account settings',
     upgradePlan: 'Upgrade your plan',
     viewUsage: 'View your usage and credits',
     manageBilling: 'Manage billing and payments',
     logout: 'Logout',
     signOut: 'Sign out of your account',

     // Quick Access
     acceleratorDesc: 'Comprehensive main dashboard with key metrics and insights',
     studioDesc: 'Creative workspace for project ideation and design',
     servicesDesc: 'Professional services and support offerings',
     ventureDesc: 'Venture capital and investment opportunities',

     // Home component
     initializationComplete: 'Initialization complete. Starting step 1...',
      improvePrompt: 'Improve this startup idea for better clarity, specificity, and market potential. Start with the improved idea name followed by \': \' and then provide a concise description in simple English, in only 3 lines. Do not generate in markdown:',
      suggestPrompt: 'Suggest a compelling startup idea in the legal tech space. Start with the idea name followed by \': \' and then provide a brief description, target market, and unique value proposition in simple English, in only 3 lines. Do not generate in markdown.',
      uiMessage: 'Ready to start the 48-step accelerator process',

      // Navbar
      notifications: 'Notifications',
      newMessage: 'New Message',
      newMessageText: 'You have a new message from John Doe',
      systemUpdate: 'System Update',
      systemUpdateText: 'Your account has been updated successfully',
      reminder: 'Reminder',
      reminderText: 'Don\'t forget your meeting at 3 PM',
      quickAccess: 'Quick Access',
      acceleratorDesc: 'Comprehensive main dashboard with key metrics and insights',
      studioDesc: 'Advanced portfolio management tools for tracking investments',
      servicesDesc: 'Access to professional services and expert consultations',
      ventureDesc: 'Explore innovative business models and strategies',
      userAccount: 'User Account',
      manageAccount: 'Manage your account settings',
      upgradePlan: 'Upgrade your plan',
      viewUsage: 'View usage and credits',
      manageBilling: 'Manage billing and payments',
      signOut: 'Sign out of your account',
      logout: 'Logout',
   },
   ar: {
     // Home page
     title: 'مرحبا <span class="text-primary">Demo</span>، ما فكرتك التالية الكبيرة؟',
     placeholder: 'أدخل الطلب...',

     // Actions
     save: 'حفظ',
     cancel: 'إلغاء',
     delete: 'حذف',
     edit: 'تعديل',
     add: 'إضافة',
     remove: 'إزالة',
     confirm: 'تأكيد',
     close: 'إغلاق',

      // States
      loading: 'جارٍ التحميل...',

      // Home component
      initializationComplete: 'اكتملت التهيئة. بدء الخطوة 1...',
      improvePrompt: 'حسّن فكرة العمل هذه لتحسين الوضوح والتحديد وإمكانية السوق. ابدأ باسم الفكرة المحسنة متبوعاً بـ \': \' ثم قدم وصفاً موجزاً بالإنجليزية البسيطة، في 3 أسطر فقط. لا تنشئ بتنسيق markdown:',
      suggestPrompt: 'اقترح فكرة عمل جذابة في مجال التكنولوجيا القانونية. ابدأ باسم الفكرة متبوعاً بـ \': \' ثم قدم وصفاً موجزاً، السوق المستهدف، والقيمة الفريدة بالإنجليزية البسيطة، في 3 أسطر فقط. لا تنشئ بتنسيق markdown.',
      uiMessage: 'جاهز لبدء عملية المسرع المكونة من 48 خطوة',

      // Navbar
      notifications: 'الإشعارات',
      newMessage: 'رسالة جديدة',
      newMessageText: 'لديك رسالة جديدة من جون دو',
      systemUpdate: 'تحديث النظام',
      systemUpdateText: 'تم تحديث حسابك بنجاح',
      reminder: 'تذكير',
      reminderText: 'لا تنس اجتماعك في الساعة 3 مساءً',
      quickAccess: 'وصول سريع',
      acceleratorDesc: 'لوحة تحكم رئيسية شاملة مع المقاييس والرؤى الرئيسية',
      studioDesc: 'أدوات إدارة محفظة متقدمة لتتبع الاستثمارات',
      servicesDesc: 'الوصول إلى الخدمات المهنية والاستشارات الخبيرة',
      ventureDesc: 'استكشف نماذج الأعمال والاستراتيجيات المبتكرة',
      userAccount: 'حساب المستخدم',
      manageAccount: 'إدارة إعدادات حسابك',
      upgradePlan: 'ترقية خطتك',
      viewUsage: 'عرض الاستخدام والاعتمادات',
      manageBilling: 'إدارة الفواتير والمدفوعات',
      signOut: 'تسجيل الخروج من حسابك',
      logout: 'تسجيل الخروج',
   }
};