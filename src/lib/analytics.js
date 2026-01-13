// Analytics utility for Google Analytics
export function initAnalytics(trackingId) {
  // If no tracking ID provided, try to get from global window object
  if (!trackingId) {
    trackingId = window.GA_TRACKING_ID;
  }

  // If still no tracking ID, skip initialization
  if (!trackingId) {
    console.log('No GA tracking ID found, analytics disabled');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', trackingId);

  // Make gtag available globally
  window.gtag = gtag;

  console.log('Google Analytics initialized with tracking ID:', trackingId);
}

// Track page views
export function trackPageView(pagePath) {
  if (window.gtag) {
    window.gtag('config', window.GA_TRACKING_ID, {
      page_path: pagePath,
    });
  }
}

// Track events
export function trackEvent(action, category, label, value) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track user interactions
export function trackUserAction(action, details = {}) {
  trackEvent(action, 'user_interaction', JSON.stringify(details));
}