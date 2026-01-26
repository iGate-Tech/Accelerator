import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step46 = {
  id: "step46",
  name: {
    en: "Pre-money Valuation",
    ar: "التقييم قبل المال"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["valuation", "askAmount", "preMoney"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Calculate the expected pre-money valuation for your startup, ensuring alignment with {{valuation}} post-money.

Provide:
- {{preMoney: "Pre-money valuation with calculation"}}

Structure in professional Markdown with valuation breakdown and terms analysis.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

احسب التقييم المتوقع قبل المال لشركتك الناشئة، مع التأكد من التوافق مع {{valuation}} بعد المال.

قدم:
- {{preMoney: "تقييم قبل المال مع الحساب"}}

هيكلة في Markdown احترافي مع تفكيك التقييم وتحليل الشروط.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.preMoney) issues.push('Missing pre-money valuation');
    if (parseFloat(context.preMoney) >= parseFloat(context.askAmount)) {
      issues.push('Pre-money should be less than funding ask');
    }
    return { valid: issues.length === 0, issues };
  },
};
