import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step36 = {
  id: "step36",
  name: {
    en: "Unit Economics",
    ar: "اقتصاد الوحدة"
  },
  model: {
    en: "Financial Model",
    ar: "النموذج المالي"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType", "cac", "ltv", "grossMargin"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}.

Provide:
- {{cac: "Customer Acquisition Cost in dollars with breakdown (sales, marketing, tech)"}}
- {{ltv: "Lifetime Value calculation with revenue per customer and expected lifespan"}}
- {{grossMargin: "Gross margin percentage with cost of goods sold breakdown"}}

Structure in professional Markdown with unit economics table and LTV:CAC ratio analysis.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قدم تكلفة اقتناء العميل (CAC)، قيمة العميل مدى الحياة (LTV)، وافتراضات هامش الربح الإجمالي لـ {{modelType}}.

قدم:
- {{cac: "تكلفة اقتناء العميل بالدولار مع التفكيك (المبيعات، التسويق، التكنولوجيا")}}
- {{ltv: "حساب قيمة مدى الحياة مع إيرادات العميل والطول المتوقع"}}
- {{grossMargin: "نسبة هامش الربح الإجمالي مع تفكيك تكلفة البضائع المباعة"}}

هيكلة في Markdown احترافي مع جدول اقتصاد الوحدة وتحليل نسبة LTV:CAC.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.cac) issues.push('Missing CAC');
    if (!context.ltv) issues.push('Missing LTV');
    if (parseFloat(context.ltv) > 0 && parseFloat(context.cac) > 0) {
      const ratio = parseFloat(context.ltv) / parseFloat(context.cac);
      if (ratio < 1) issues.push('LTV:CAC ratio should be greater than 1');
    }
    return { valid: issues.length === 0, issues };
  },
};
