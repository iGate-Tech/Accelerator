
import { steps } from './models/index.js';

export { steps };

// Function to get localized name based on current language
export const getLocalizedName = (item, lang = 'en') => {
  if (typeof item === 'object' && item !== null) {
    return item[lang] || item['en'] || 'Unknown';
  }
  return item || 'Unknown';
};

export const stepNames = (lang = 'en') => Object.fromEntries(
  steps.map((step) => [step.id, getLocalizedName(step.name, lang)]),
);

export const modelMap = (lang = 'en') => Object.fromEntries(
  steps.map((step) => [step.id, getLocalizedName(step.model, lang) || "Unknown"]),
);

export const sectionMap = Object.fromEntries(
  steps.map((step) => [step.id, step.section || "Unknown"]),
);

// Calculate cumulative step counts per model for 100% Health Flow
// New order: System -> Idea -> Business Core -> Marketing -> Business Details -> Technical -> Financial -> Team -> Legal -> Funding -> Reports
export const modelCumul = (lang = 'en') => {
  const modelOrder = [
    { en: 'System', ar: 'النظام' },
    { en: 'Idea Model', ar: 'نموذج الفكرة' },
    { en: 'Business Core', ar: 'النواة التجارية' },
    { en: 'Marketing Model', ar: 'نموذج التسويق' },
    { en: 'Business Details', ar: 'تفاصيل العمل' },
    { en: 'Technical Model', ar: 'النموذج الفني' },
    { en: 'Financial Model', ar: 'النموذج المالي' },
    { en: 'Team Model', ar: 'نموذج الفريق' },
    { en: 'Legal Model', ar: 'النموذج القانوني' },
    { en: 'Funding Model', ar: 'نموذج التمويل' },
    { en: 'Pitch Deck Report', ar: 'تقرير عرض التقديم' },
    { en: 'Business Plan Report', ar: 'تقرير خطة العمل' },
    { en: 'Valuation Report', ar: 'تقرير التقييم' }
  ];

  const cumul = {};
  let total = 0;

  for (const modelObj of modelOrder) {
    const model = typeof modelObj === 'object' ? modelObj[lang] || modelObj['en'] : modelObj;
    const stepsInModel = steps.filter(s => getLocalizedName(s.model, lang) === model).length;
    total += stepsInModel;
    cumul[model] = total;
  }

  return cumul;
};

// Helper to get current phase based on step index
export const getPhaseInfo = (stepIndex, lang = 'en') => {
  const phases = [
    { name: { en: 'System', ar: 'النظام' }, start: 0, end: 1 },
    { name: { en: 'Idea Model', ar: 'نموذج الفكرة' }, start: 1, end: 9 },
    { name: { en: 'Business Core', ar: 'النواة التجارية' }, start: 9, end: 13 },
    { name: { en: 'Marketing Model', ar: 'نموذج التسويق' }, start: 13, end: 24 },
    { name: { en: 'Business Details', ar: 'تفاصيل العمل' }, start: 24, end: 28 },
    { name: { en: 'Technical Model', ar: 'النموذج الفني' }, start: 28, end: 38 },
    { name: { en: 'Financial Model', ar: 'النموذج المالي' }, start: 38, end: 44 },
    { name: { en: 'Team Model', ar: 'نموذج الفريق' }, start: 44, end: 47 },
    { name: { en: 'Legal Model', ar: 'النموذج القانوني' }, start: 47, end: 52 },
    { name: { en: 'Funding Model', ar: 'نموذج التمويل' }, start: 52, end: 62 },
    { name: { en: 'Reports', ar: 'التقارير' }, start: 62, end: 65 }
  ];

  for (const phase of phases) {
    if (stepIndex >= phase.start && stepIndex < phase.end) {
      return {
        ...phase,
        name: getLocalizedName(phase.name, lang)
      };
    }
  }
  return { name: 'Unknown', start: 0, end: steps.length };
};

// Helper to get progress percentage
export const getPhaseProgress = (stepIndex, lang = 'en') => {
  const phase = getPhaseInfo(stepIndex, lang);
  const phaseLength = phase.end - phase.start;
  const progressInPhase = stepIndex - phase.start;
  return Math.round((progressInPhase / phaseLength) * 100);
};
