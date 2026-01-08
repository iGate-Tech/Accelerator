import { createSignal, createEffect, onMount, useContext } from "solid-js";
import { LangContext } from "../context/LangContext";
import { translations } from "../assets/translations/translations-index.js";

const PrivacyPolicy = () => {
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = () => translations[currentLang()];

  createEffect(() => {
    setCurrentLang(lang());
  });

  return (
    <div class={`max-w-4xl mx-auto space-y-8 mt-20 py-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().privacyPolicy}</h1>
        <p class="text-lg text-base-content/70">
          Last updated: January 2026
        </p>
      </div>

      <div class="prose prose-lg max-w-none">
        <section>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account,
            submit project descriptions, or contact us for support. This includes:
          </p>
          <ul>
            <li>Project data and business ideas you input for AI processing</li>
            <li>Account information (email, name)</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>
            Your information is used to:
          </p>
          <ul>
            <li>Provide AI-powered startup acceleration services</li>
            <li>Generate business plans and market analysis</li>
            <li>Improve our services and develop new features</li>
            <li>Communicate with you about your projects</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Storage and Security</h2>
          <p>
            Your data is stored locally on your device using IndexedDB and PGLite.
            We do not transmit your project data to external servers unless you explicitly
            export or share it. All AI processing happens locally or through secure,
            privacy-focused APIs.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Services</h2>
          <p>
            We may use third-party AI services (like OpenAI) for processing your business
            ideas. These services have their own privacy policies, and we encourage you
            to review them. We only send necessary data for processing and do not store
            your conversations with third-party services.
          </p>
        </section>

        <section>
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to
            third parties without your consent, except as described in this policy.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access and download your data</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you
            of any changes by posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy, please contact us
            through the help section or at support@igate-tech.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;