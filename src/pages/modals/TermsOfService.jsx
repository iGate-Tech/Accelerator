import { createSignal, createEffect, onMount, useContext } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

const TermsOfService = () => {
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = () => translations[currentLang()];

  createEffect(() => {
    setCurrentLang(lang());
  });

  return (
    <div class={`max-w-4xl mx-auto space-y-8  py-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">{t().termsService}</h1>
        <p class="text-lg text-base-content/70">
          {t().lastUpdated}
        </p>
      </div>

      <div class="prose prose-lg max-w-none">
        <section>
          <h2>{t().acceptanceOfTerms}</h2>
          <p>
            {t().acceptanceOfTermsDesc}
          </p>
        </section>

        <section>
          <h2>{t().descriptionOfService}</h2>
          <p>
            {t().descriptionOfServiceDesc}
          </p>
        </section>

        <section>
          <h2>{t().userAccounts}</h2>
          <p>
            {t().userAccountsDesc}
          </p>
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
          <p>
            {t().intellectualPropertyDesc}
          </p>
        </section>

        <section>
          <h2>{t().aiGeneratedContent}</h2>
          <p>
            {t().aiGeneratedContentDesc}
          </p>
        </section>

        <section>
          <h2>{t().limitationOfLiability}</h2>
          <p>
            {t().limitationOfLiabilityDesc}
          </p>
        </section>

        <section>
          <h2>{t().termination}</h2>
          <p>
            {t().terminationDesc}
          </p>
        </section>

        <section>
          <h2>{t().governingLaw}</h2>
          <p>
            {t().governingLawDesc}
          </p>
        </section>

        <section>
          <h2>{t().changesToTerms}</h2>
          <p>
            {t().changesToTermsDesc}
          </p>
        </section>

        <section>
          <h2>{t().contactInformation}</h2>
          <p>
            {t().contactInformationDesc}
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;