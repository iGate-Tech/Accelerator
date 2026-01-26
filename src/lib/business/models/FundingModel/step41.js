import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step41 = {
  id: "step41",
  name: {
    en: "Funding Readiness",
    ar: "جاهزية التمويل"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["tam", "team", "solution", "traction", "riskLevel"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}.

Provide:
- {{traction: "Current traction metrics, milestones achieved, and validation evidence"}}
- {{team: "Team composition and relevant experience"}}
- {{riskLevel: "Overall risk level (low/medium/high) with justification"}}

Structure in professional Markdown with readiness scorecard.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قدم التقدم الحالي، قوة الفريق، حجم السوق ({{tam}})، ومستوى المخاطر لـ {{solution}}.

قدم:
- {{traction: "مقاييس التقدم الحالية، الإنجازات المحققة، والأدلة على التحقق"}}
- {{team: "تكوين الفريق والخبرة ذات الصلة"}}
- {{riskLevel: "مستوى المخاطر العام (منخفض/متوسط/مرتفع) مع التبرير"}}

هيكلة في Markdown احترافي مع بطاقة الاستعداد.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.traction) issues.push('Missing traction details');
    if (!context.riskLevel) issues.push('Missing risk assessment');
    return { valid: issues.length === 0, issues };
  },
};
