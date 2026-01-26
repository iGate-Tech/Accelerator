import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step39 = {
  id: "step39",
  name: {
    en: "Burn Rate Analysis",
    ar: "تحليل معدل الاحتراق"
  },
  model: {
    en: "Financial Model",
    ar: "النموذج المالي"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["fixedCosts", "variableCosts", "monthlyBurn", "runway"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Calculate the monthly burn rate and runway for your startup.

Provide:
- {{monthlyBurn: "Monthly burn rate combining all expenses minus revenue"}}
- {{runway: "Months of runway based on current cash and burn rate"}}

Also embed {{burnRate: "Complete burn rate analysis with breakdown"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

احسب معدل الاحتراق الشهري ومدة التشغيل لشركتك الناشئة.

قدم:
- {{monthlyBurn: "معدل الاحتراق الشهري يجمع جميع المصروفات ناقص الإيرادات"}}
- {{runway: "أشهر التشغيل بناءً على النقد الحالي ومعدل الاحتراق"}}

ضمّن أيضًا {{burnRate: "تحليل كامل لمعدل الاحتراق مع التفكيك"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.monthlyBurn) issues.push('Missing monthly burn rate');
    if (!context.runway) issues.push('Missing runway calculation');
    return { valid: issues.length === 0, issues };
  },
};
