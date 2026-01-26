import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step8b = {
  id: "step8b",
  name: {
    en: "Traction Definition",
    ar: "تعريف التقدم"
  },
  model: {
    en: "Idea Model",
    ar: "نموذج الفكرة"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem", "evidence", "persona"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define traction metrics and validation evidence for the problem affecting {{persona}}.

Provide:
- {{traction: "Current traction metrics, validation evidence, and key performance indicators"}}
- {{validationMetrics: "Quantitative and qualitative metrics proving problem validation"}}
- {{keyMilestones: "Key milestones achieved in problem validation and customer discovery"}}

Structure in professional Markdown with traction scorecard, validation metrics, and milestone tracker.

Also embed {{traction: "Full traction data for use in Funding Model steps"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

عرّف مقاييس التقدم والأدلة على التحقق من المشكلة التي تؤثر على {{persona}}.

قدم:
- {{traction: "مقاييس التقدم الحالية، الأدلة على التحقق، ومؤشرات الأداء الأساسية"}}
- {{validationMetrics: "المقاييس الكمية والنوعية التي تثبت صحة التحقق من المشكلة"}}
- {{keyMilestones: "الإنجازات الأساسية التي تحققت في التحقق من المشكلة واكتشاف العملاء"}}

هيكلة في Markdown احترافي مع بطاقة تقييم التقدم، مقاييس التحقق، ومتتبع الإنجازات.

ضمّن أيضًا {{traction: "بيانات التقدم الكاملة للاستخدام في خطوات نموذج التمويل"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.traction) issues.push('Missing traction data');
    if (!context.validationMetrics) issues.push('Missing validation metrics');
    return { valid: issues.length === 0, issues };
  },
};
