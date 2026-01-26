import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step52 = {
  id: "step52",
  name: {
    en: "Governance Structure",
    ar: "هيكل الحوكمة"
  },
  model: {
    en: "Legal Model",
    ar: "النموذج القانوني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "advisors", "boardStructure", "governance"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List advisors, board members, and governance structure for {{solution}}.

Provide:
- {{advisors: "Key advisors with expertise and value they bring"}}
- {{boardStructure: "Planned board composition and governance approach"}}
- {{governance: "Corporate governance framework and decision-making processes"}}

Structure in professional Markdown with advisor table and governance model.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

سرد المستشارين، أعضاء مجلس الإدارة، وبنية الحوكمة لـ {{solution}}.

قدم:
- {{advisors: "المستشارون الرئيسيون مع خبرتهم وقيمتهم المقدمة"}}
- {{boardStructure: "مخطط تكوين المجلس ونهج الحوكمة"}}
- {{governance: "إطار الحوكمة المؤسسية وعمليات اتخاذ القرار"}}

هيكلة في Markdown احترافي مع جدول المستشارين ونموذج الحوكمة.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.advisors) issues.push('Missing advisors');
    return { valid: issues.length === 0, issues };
  },
};
