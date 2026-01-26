import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step44 = {
  id: "step44",
  name: {
    en: "Funding Amount",
    ar: "مبلغ التمويل"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "monthlyBurn", "runway", "askAmount"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine how much capital to raise for {{solution}} and provide the rationale.

Provide:
- {{askAmount: "Recommended funding amount with justification based on {{monthlyBurn}} burn and desired {{runway}} months"}}

Structure in professional Markdown with funding calculation and runway analysis.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد كم رأس المال الذي يجب جمعه لـ {{solution}} وقدم التبرير.

قدم:
- {{askAmount: "مبلغ التمويل الموصى به مع التبرير بناءً على {{monthlyBurn}} الاحتراق وال{{runway}} الأشهر المطلوبة"}}

هيكلة في Markdown احترافي مع حساب التمويل وتحليل مدة التشغيل.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.askAmount) issues.push('Missing funding ask amount');
    return { valid: issues.length === 0, issues };
  },
};
