import logger from '../../lib/logger.js';

// Auth translations
export const authTranslations = {
  en: {
    // Login
    welcomeBack: 'Welcome Back',
    signInToAccount: 'Sign in to your account',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'john.doe@example.com',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign In',
    createNewAccount: 'Create New Account',
    forgotPassword: 'Forgot your password?',

    // Signup
    createAccount: 'Create Account',
    joinJourney: 'Join us to start your journey',
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullNamePlaceholder: 'John Doe',
    emailPlaceholder: 'john.doe@example.com',
    createPasswordPlaceholder: 'Create a password',
    confirmPasswordPlaceholder: 'Confirm your password',
    createAccountBtn: 'Create Account',
    alreadyHaveAccount: 'Already have an account? Sign In',
    termsAgreement: 'By creating an account, you agree to our Terms of Service and Privacy Policy.',

    // Forgot Password
    resetPassword: 'Reset Password',
    enterEmailReset: 'Enter your email to receive a reset link',
    email: 'Email',
    emailPlaceholder: 'john.doe@example.com',
    sendResetLink: 'Send Reset Link',
    backToLogin: 'Back to Login',

    // Footer
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    statusPage: 'Status Page',
    changelog: 'Changelog',
    help: 'Help',
    motto: 'One Gate, Endless Possibilities.',
    copyright: '© {year} iGate. {motto}',

    // Toast messages
    passwordMismatch: 'Passwords do not match. Please ensure both password fields are identical.',
    invalidEmail: 'Invalid email format. Please enter a valid email address.',
    registrationFailed: 'Registration failed for {email}.',
    emailAlreadyExists: 'An account with this email already exists. Please try logging in or use a different email.',
    accountCreated: 'Account created successfully for {email}! Please check your email and click the confirmation link to activate your account.',
    accountCreatedLoggedIn: 'Account created successfully for {email} and logged in!',
    accountCreatedManualLogin: 'Account created for {email} but automatic login failed. Please try logging in manually on the login page.',
  },
  ar: {
    // Login
    welcomeBack: 'مرحباً بعودتك',
    signInToAccount: 'سجل الدخول إلى حسابك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    emailPlaceholder: 'john.doe@example.com',
    passwordPlaceholder: 'أدخل كلمة المرور',
    signIn: 'تسجيل الدخول',
    createNewAccount: 'إنشاء حساب جديد',
    forgotPassword: 'نسيت كلمة المرور؟',

    // Signup
    createAccount: 'إنشاء حساب',
    joinJourney: 'انضم إلينا لبدء رحلتك',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullNamePlaceholder: 'جون دو',
    emailPlaceholder: 'john.doe@example.com',
    createPasswordPlaceholder: 'إنشاء كلمة مرور',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    createAccountBtn: 'إنشاء حساب',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
    termsAgreement: 'بإنشاء حساب، أنت توافق على شروط الخدمة وسياسة الخصوصية.',

    // Forgot Password
    resetPassword: 'إعادة تعيين كلمة المرور',
    enterEmailReset: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'john.doe@example.com',
    sendResetLink: 'إرسال رابط إعادة التعيين',
    backToLogin: 'العودة إلى تسجيل الدخول',

    // Footer
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    statusPage: 'صفحة الحالة',
    changelog: 'سجل التغييرات',
    help: 'المساعدة',
    motto: 'بوابة واحدة، إمكانيات لا حصر لها.',
    copyright: '© {year} iGate. {motto}',

    // Toast messages
    passwordMismatch: 'كلمتا المرور غير متطابقتين. يرجى التأكد من أن كلا الحقلين متطابقان.',
    invalidEmail: 'تنسيق البريد الإلكتروني غير صالح. يرجى إدخال عنوان بريد إلكتروني صحيح.',
    registrationFailed: 'فشل التسجيل لـ {email}.',
    emailAlreadyExists: 'يوجد حساب بالفعل مع هذا البريد الإلكتروني. يرجى محاولة تسجيل الدخول أو استخدام بريد إلكتروني مختلف.',
    accountCreated: 'تم إنشاء الحساب بنجاح لـ {email}! يرجى التحقق من بريدك الإلكتروني والنقر على رابط التفعيل.',
    accountCreatedLoggedIn: 'تم إنشاء الحساب بنجاح لـ {email} وتسجيل الدخول!',
    accountCreatedManualLogin: 'تم إنشاء الحساب لـ {email} لكن فشل تسجيل الدخول التلقائي. يرجى محاولة تسجيل الدخول يدوياً.',
  }
};