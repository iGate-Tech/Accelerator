import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step12 = {
  id: "step12",
  name: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  model: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["persona"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine the optimal business model for the solution based on the persona {{persona}}.
Select and justify:
- {{modelType: "Chosen business model type (e.g., SaaS, marketplace, subscription), with rationale tied to {{persona}} needs"}}
- {{prosCons: "Pros and cons of the chosen model compared to alternatives"}}
- {{scalability: "How the model scales with user growth, including technical and operational aspects"}}
- {{feasibility: "Feasibility assessment, including market fit, implementation challenges, and resource requirements"}}
Present in professional Markdown with analysis and recommendations.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد نموذج العمل الأمثل للحل بناءً على الشخصية {{persona}}.
اختر وبرر:
- {{modelType: "نوع نموذج العمل المختار (مثلاً، SaaS، سوق، اشتراك)، مع التبرير المرتبط باحتياجات {{persona}}"}}
- {{prosCons: "الإيجابيات والسلبيات للنموذج المختار بالمقارنة مع البدائل"}}
- {{scalability: "كيف ي(scale) النموذج مع نمو المستخدم، بما في ذلك الجوانب التقنية والتشغيلية"}}
- {{feasibility: "تقييم الجدوى، بما في ذلك توافق السوق، تحديات التنفيذ، ومتطلبات الموارد"}}
قدّم في Markdown احترافي مع تحليل و توصيات.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};