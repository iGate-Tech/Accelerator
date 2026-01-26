import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step42 = {
  id: "step42",
  name: {
    en: "Valuation Analysis",
    ar: "تحليل التقييم"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "inputs", "valuation"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods.

Provide:
- {{valuation: "Recommended pre-money valuation range and final recommendation"}}

Structure in professional Markdown with valuation methodology breakdown and final range.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

احسب التقييم لـ {{solution}} باستخدام طرق Scorecard، Berkus، VC، و DCF-light.

قدم:
- {{valuation: "نطاق التقييم قبل المال الموصى به والتوصية النهائية"}}

هيكلة في Markdown احترافي مع تفكيك منهجية التقييم والنطاق النهائي.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.valuation) issues.push('Missing valuation');
    return { valid: issues.length === 0, issues };
  },
};
