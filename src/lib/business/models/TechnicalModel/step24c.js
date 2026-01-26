import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step24c = {
  id: "step24c",
  name: {
    en: "Integrations Definition",
    ar: "تعريف التكاملات"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "architecture", "apiDesign"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define the integrations strategy for {{solution}} based on architecture {{architecture}} and API design {{apiDesign}}.

Provide:
- {{integrations: "Comprehensive integrations strategy covering essential and optional integrations"}}
- {{integrationPlan: "Detailed integration implementation plan with priorities and timelines"}}
- {{partnershipOpportunities: "Partnership opportunities through API exposure and integration marketplace"}}

Structure in professional Markdown with integration matrix, priority matrix, and partnership strategy.

Also embed {{integrations: "Full integrations list for use in subsequent steps"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

عرّف استراتيجية التكامل لـ {{solution}} بناءً على البنية {{architecture}} وتصميم API {{apiDesign}}.

قدم:
- {{integrations: "استراتيجية التكامل الشاملة تغطي التكاملات الأساسية والاختيارية"}}
- {{integrationPlan: "خطة تنفيذ التكامل التفصيلية مع الأولويات والجداول الزمنية"}}
- {{partnershipOpportunities: "فرص الشراكات من خلال كشف API وسوق التكامل"}}

هيكلة في Markdown احترافي مع مصفوفة التكامل، مصفوفة الأولويات، واستراتيجية الشراكة.

ضمّن أيضًا {{integrations: "قائمة التكامل الكاملة للاستخدام في الخطوات اللاحقة"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.integrations) issues.push('Missing integrations strategy');
    if (!context.integrationPlan) issues.push('Missing integration plan');
    return { valid: issues.length === 0, issues };
  },
};
