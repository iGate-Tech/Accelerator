import { createSignal, createEffect, onMount } from 'solid-js';
import { consentManager } from '@lib/auth/security.js';
import { logger } from '@lib/core';

const ConsentBanner = () => {
  const [showBanner, setShowBanner] = createSignal(false);
  const [consents, setConsents] = createSignal({});

  onMount(async () => {
    try {
      const hasGivenConsents = await consentManager.hasGivenConsents();
      if (!hasGivenConsents) {
        setShowBanner(true);
      }

      const currentConsents = await consentManager.getConsents();
      setConsents(currentConsents);
    } catch (error) {
      logger.error('Failed to check consents:', error);
    }
  });

  const handleAcceptAll = async () => {
    try {
      await consentManager.updateConsents({
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
      });
      setShowBanner(false);
      logger.info('User accepted all consents');
    } catch (error) {
      logger.error('Failed to accept consents:', error);
    }
  };

  const handleAcceptNecessary = async () => {
    try {
      await consentManager.updateConsents({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      });
      setShowBanner(false);
      logger.info('User accepted necessary consents only');
    } catch (error) {
      logger.error('Failed to accept necessary consents:', error);
    }
  };

  const handleCustomize = () => {
    // Could open a detailed consent modal
    // For now, just accept necessary
    handleAcceptNecessary();
  };

  return (
    <div
      class={`bg-base-100 border-base-300 fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg transition-transform duration-300 ${
        showBanner() ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div class="flex-1">
            <h3 class="text-base-content mb-2 font-semibold">
              🍪 Cookie & Privacy Preferences
            </h3>
            <p class="text-base-content/70 mb-2 text-sm">
              We use cookies and local storage to enhance your experience and
              provide our services. By continuing to use our site, you agree to
              our use of cookies in accordance with our
              <a
                href="/privacy-policy"
                class="link link-primary"
                target="_blank"
              >
                {' '}
                Privacy Policy
              </a>
              .
            </p>
            <div class="text-base-content/50 text-xs">
              <strong>GDPR Compliance:</strong> We only process your data with
              your consent and provide full transparency about data usage.
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <button onClick={handleAcceptAll} class="btn btn-primary btn-sm">
              Accept All
            </button>
            <button
              onClick={handleAcceptNecessary}
              class="btn btn-outline btn-sm"
            >
              Necessary Only
            </button>
            <button onClick={handleCustomize} class="btn btn-ghost btn-sm">
              Customize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
