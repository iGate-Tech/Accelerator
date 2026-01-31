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

const PrivacyPolicy = () => {
  logger.trace('PrivacyPolicy: Starting');
  const navigate = useNavigate();

  // Set document title
  useDocumentTitle('Privacy Policy');

  const { lang } = useContext(LangContext);
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
            {t().privacyPolicy}
          </h1>
          <p class="text-base-content/70 text-base sm:text-lg">
            {t().lastUpdated}
          </p>
        </div>

        <div class="prose prose-lg max-w-none">
          <section>
            <h2>{t().infoWeCollect}</h2>
            <p>{t().infoWeCollectDesc}</p>
            <ul>
              <li>{t().infoWeCollectList1}</li>
              <li>{t().infoWeCollectList2}</li>
              <li>{t().infoWeCollectList3}</li>
            </ul>
          </section>

          <section>
            <h2>{t().howWeUseInfo}</h2>
            <p>{t().howWeUseInfoDesc}</p>
            <ul>
              <li>{t().howWeUseInfoList1}</li>
              <li>{t().howWeUseInfoList2}</li>
              <li>{t().howWeUseInfoList3}</li>
              <li>{t().howWeUseInfoList4}</li>
            </ul>
          </section>

          <section>
            <h2>{t().dataStorageSecurity}</h2>
            <p>{t().dataStorageSecurityDesc}</p>
          </section>

          <section>
            <h2>{t().thirdPartyServices}</h2>
            <p>{t().thirdPartyServicesDesc}</p>
          </section>

          <section>
            <h2>{t().dataSharing}</h2>
            <p>{t().dataSharingDesc}</p>
          </section>

          <section>
            <h2>{t().yourRights}</h2>
            <p>{t().yourRightsDesc}</p>
            <ul>
              <li>{t().yourRightsList1}</li>
              <li>{t().yourRightsList2}</li>
              <li>{t().yourRightsList3}</li>
            </ul>
          </section>

          <section>
            <h2>{t().changesToPolicy}</h2>
            <p>{t().changesToPolicyDesc}</p>
          </section>

          <section>
            <h2>{t().contactUs}</h2>
            <p>{t().contactUsDesc}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
