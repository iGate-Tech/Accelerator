import { createSignal, createEffect, onMount, useContext } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

const PrivacyPolicy = () => {
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = () => translations[currentLang()];

  createEffect(() => {
    setCurrentLang(lang());
  });

  return (
    <div class={`max-w-4xl mx-auto space-y-8  py-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().privacyPolicy}</h1>
        <p class="text-lg text-base-content/70">
          {t().lastUpdated}
        </p>
      </div>

      <div class="prose prose-lg max-w-none">
        <section>
          <h2>{t().infoWeCollect}</h2>
          <p>
            {t().infoWeCollectDesc}
          </p>
          <ul>
            <li>{t().infoWeCollectList1}</li>
            <li>{t().infoWeCollectList2}</li>
            <li>{t().infoWeCollectList3}</li>
          </ul>
        </section>

        <section>
          <h2>{t().howWeUseInfo}</h2>
          <p>
            {t().howWeUseInfoDesc}
          </p>
          <ul>
            <li>{t().howWeUseInfoList1}</li>
            <li>{t().howWeUseInfoList2}</li>
            <li>{t().howWeUseInfoList3}</li>
            <li>{t().howWeUseInfoList4}</li>
          </ul>
        </section>

        <section>
          <h2>{t().dataStorageSecurity}</h2>
          <p>
            {t().dataStorageSecurityDesc}
          </p>
        </section>

        <section>
          <h2>{t().thirdPartyServices}</h2>
          <p>
            {t().thirdPartyServicesDesc}
          </p>
        </section>

        <section>
          <h2>{t().dataSharing}</h2>
          <p>
            {t().dataSharingDesc}
          </p>
        </section>

        <section>
          <h2>{t().yourRights}</h2>
          <p>
            {t().yourRightsDesc}
          </p>
          <ul>
            <li>{t().yourRightsList1}</li>
            <li>{t().yourRightsList2}</li>
            <li>{t().yourRightsList3}</li>
          </ul>
        </section>

        <section>
          <h2>{t().changesToPolicy}</h2>
          <p>
            {t().changesToPolicyDesc}
          </p>
        </section>

        <section>
          <h2>{t().contactUs}</h2>
          <p>
            {t().contactUsDesc}
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;