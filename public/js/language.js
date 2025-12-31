// language.js - Language functionality

const translations = {
  en: {
    title: "Hi <span class='text-primary'>Demo</span>, what's your next big idea?",
    placeholder: "Enter prompt...",
    home: "Home",
    dashboard: "Dashboard",
    explore: "Explore",
    portfolio: "Portfolio",
    help: "Help"
  },
  ar: {
    title: "مرحباً <span class='text-primary'>ديمو</span>، ما هي فكرتك الكبيرة التالية؟",
    placeholder: "أدخل الطلب...",
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    explore: "استكشف",
    portfolio: "المحفظة",
    help: "المساعدة"
  }
};

function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translations[lang][key];
    } else {
      el.innerHTML = translations[lang][key];
    }
  });
  // Adjust sidebar position
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    if (lang === 'ar') {
      sidebar.classList.remove('left-0', 'border-r');
      sidebar.classList.add('right-0', 'border-l');
    } else {
      sidebar.classList.remove('right-0', 'border-l');
      sidebar.classList.add('left-0', 'border-r');
    }
  }
  // Adjust content margin
  const contentDiv = document.querySelector('div.ml-\\[400px\\]');
  if (contentDiv) {
    if (lang === 'ar') {
      contentDiv.classList.remove('ml-[400px]');
      contentDiv.classList.add('mr-[400px]');
    } else {
      contentDiv.classList.remove('mr-[400px]');
      contentDiv.classList.add('ml-[400px]');
    }
  }
}

// Language toggle
const langSwap = document.querySelector('.swap input[type="checkbox"]');
console.log('langSwap element:', langSwap);
if (langSwap) {
  console.log('Adding language change listener');
  langSwap.addEventListener('change', (e) => {
    const lang = e.target.checked ? 'ar' : 'en';
    console.log('Language change detected, new lang:', lang);
    // Immediately update UI for instant reactivity
    setLanguage(lang);
    console.log('Called setLanguage with:', lang);
    // Persist to localStorage
    localStorage.setItem('lang', lang);
    console.log('Language saved to localStorage');
  });
} else {
  console.warn('langSwap not found, cannot add listener');
}

// Load initial language from localStorage
const initialLang = localStorage.getItem('lang') || 'en';
console.log('Initial language from localStorage:', initialLang);
setLanguage(initialLang);
if (langSwap) {
  langSwap.checked = initialLang === 'ar';
}

// Storage event listener for cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === 'lang') {
    const lang = e.newValue;
    console.log('Applying language from storage:', lang);
    setLanguage(lang);
    if (langSwap) {
      langSwap.checked = lang === 'ar';
      console.log('Updated langSwap checked');
    }
  }
});