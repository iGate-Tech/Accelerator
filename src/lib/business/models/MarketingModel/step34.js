import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step34 = {
  id: "step34",
  name: {
    en: "Retention Strategy",
    ar: "استراتيجية الاحتفاظ"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "retentionStrategy", "revenueGrowth"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop strategies to retain customers and grow revenue for {{solution}}.

Provide:
- {{retentionStrategy: "Customer retention approach including churn prevention, engagement tactics, and loyalty programs"}}
- {{revenueGrowth: "Revenue expansion strategies including upselling, cross-selling, and pricing optimization"}}

Structure in professional Markdown with retention metrics, growth levers, and LTV improvement tactics.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

طور استراتيجيات للحفاظ على العملاء ونمو الإيرادات لـ {{solution}}.

قدم:
- {{retentionStrategy: "نهج الاحتفاظ بالعملاء بما في ذلك منع التخلي، تكتيكات الانخراط، وبرامج الولاء"}}
- {{revenueGrowth: "استراتيجيات توسيع الإيرادات بما في ذلك البيع التصاعدي، البيع العرضي، وتحسين التسعير"}}

هيكلة في Markdown احترافي مع مقاييس الاحتفاظ، أجهزة النمو، وتقنيات تحسين قيمة العميل مدى الحياة.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.retentionStrategy) issues.push('Missing retention strategy');
    return { valid: issues.length === 0, issues };
  },
};
