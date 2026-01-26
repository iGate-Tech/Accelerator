import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step14 = {
  id: "step14",
  name: {
    en: "Pricing Strategy",
    ar: "استراتيجية التسعير"
  },
  model: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType", "persona", "market"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a comprehensive pricing strategy for the solution in the business model {{modelType}}.
Factor in {{persona}} and {{market}} to provide:
- {{pricing: "Overall pricing approach (e.g., cost-plus, value-based), with justification"}}
- {{tiers: "Detailed pricing tiers, including features, prices, and target segments"}}
- {{logic: "Pricing logic explaining how prices reflect value, costs, and market positioning"}}
- {{customerAcceptance: "Expected customer acceptance levels, including objections and mitigation strategies"}}
Present in professional Markdown with tables, competitor comparisons, and data-driven insights.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

طور استراتيجية تسعير شاملة للحل في نموذج العمل {{modelType}}.
خُذ في الاعتبار {{persona}} و{{market}} لتقديم:
- {{pricing: "نهج التسعير العام (مثلاً، التكلفة زائد الربح، التسعير القائم على القيمة)، مع التبرير"}}
- {{tiers: "مستويات التسعير التفصيلية، بما في ذلك الميزات، الأسعار، وشرائح الهدف"}}
- {{logic: "منطق التسعير الذي يشرح كيف تعكس الأسعار القيمة، التكاليف، وموضع السوق"}}
- {{customerAcceptance: "مستويات قبول العملاء المتوقعة، بما في ذلك الاعتراضات واستراتيجيات التخفيف"}}
قدّم في Markdown احترافي مع جداول، مقارنات المنافسين، ورؤى مبنية على البيانات.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};