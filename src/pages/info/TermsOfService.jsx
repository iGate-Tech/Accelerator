import {
  createSignal,
  createMemo,
  createEffect,
  onMount,
  useContext,
} from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { LangContext } from '@context/LangContext';
import { translations } from '@assets/translations/translations-index.js';
import { logger } from '@lib/core';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

const TermsOfService = () => {
  logger.trace('TermsOfService: Starting');
  const { lang } = useContext(LangContext);

  // Set document title
  useDocumentTitle('Terms of Service');
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = createMemo(() => translations[currentLang()]);

  createEffect(() => {
    setCurrentLang(lang());
  });

  return (
    <div class="h-full overflow-auto">
      <div class="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        {/* Back Button */}
        <div class="mb-6">
          <button
            onClick={() => window.history.back()}
            class="btn btn-ghost btn-sm"
          >
            <svg
              class="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>

        <div class="text-center">
          <h1 class="text-base-content mb-4 text-3xl font-bold sm:text-4xl">
            {t().termsService}
          </h1>
          <p class="text-base-content/70 text-base sm:text-lg">
            {t().lastUpdated}
          </p>
        </div>

        <div class="prose prose-lg max-w-none">
          <section>
            <h2>{t().acceptanceOfTerms}</h2>
            <p>{t().acceptanceOfTermsDesc}</p>
          </section>

          <section>
            <h2>{t().descriptionOfService}</h2>
            <p>{t().descriptionOfServiceDesc}</p>
          </section>

          <section>
            <h2>{t().userAccounts}</h2>
            <p>{t().userAccountsDesc}</p>
          </section>

          <section>
            <h2>{t().acceptableUse}</h2>
            <p>{t().acceptableUseDesc}</p>
            <ul>
              <li>{t().acceptableUseList1}</li>
              <li>{t().acceptableUseList2}</li>
              <li>{t().acceptableUseList3}</li>
              <li>{t().acceptableUseList4}</li>
            </ul>
          </section>

          <section>
            <h2>{t().intellectualProperty}</h2>
            <p>{t().intellectualPropertyDesc}</p>
          </section>

          <section>
            <h2>{t().aiGeneratedContent}</h2>
            <p>{t().aiGeneratedContentDesc}</p>
          </section>

          <section>
            <h2>{t().limitationOfLiability}</h2>
            <p>{t().limitationOfLiabilityDesc}</p>
          </section>

          <section>
            <h2>{t().termination}</h2>
            <p>{t().terminationDesc}</p>
          </section>

          <section>
            <h2>{t().governingLaw}</h2>
            <p>{t().governingLawDesc}</p>
          </section>

          <section>
            <h2>{t().changesToTerms}</h2>
            <p>{t().changesToTermsDesc}</p>
          </section>

          <section>
            <h2>{t().contactInformation}</h2>
            <p>{t().contactInformationDesc}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
