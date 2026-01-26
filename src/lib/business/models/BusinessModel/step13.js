import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step13 = {
  id: "step13",
  name: {
    en: "Revenue Streams",
    ar: "مصادر الدخل"
  },
  model: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design revenue streams for the solution using the business model {{modelType}}.
Identify:
- {{revenue: "Primary and secondary revenue streams, with descriptions and examples"}}
- {{pricingTiers: "Pricing tiers or structures, including entry-level and premium options"}}
- {{monetizationPotential: "Estimated monetization potential for each stream, with market size considerations"}}
- {{customerWTP: "Customer willingness to pay analysis, including price sensitivity and value perception"}}
Use professional Markdown with tables for pricing and financial estimates.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

صمم مصادر الدخل للحل باستخدام نموذج العمل {{modelType}}.
حدد:
- {{revenue: "مصدر الدخل الأساسي والفرعي، مع الأوصاف والأمثلة"}}
- {{pricingTiers: "مستويات أو هياكل التسعير، بما في ذلك الخيارات الأساسية والراقية"}}
- {{monetizationPotential: "إمكانيات تحقيق الدخل المقدرة لكل مصدر، مع مراعاة حجم السوق"}}
- {{customerWTP: "تحليل استعداد العميل للدفع، بما في ذلك حساسية السعر وإدراك القيمة"}}
استخدم Markdown احترافي مع جداول للتسعير والتقديرات المالية.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};