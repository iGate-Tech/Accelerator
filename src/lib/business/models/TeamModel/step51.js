import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step51 = {
  id: "step51",
  name: {
    en: "Hiring Plan",
    ar: "خطة التوظيف"
  },
  model: {
    en: "Team Model",
    ar: "نموذج الفريق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "missingSkills", "hiringPlan", "hiringTimeline"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a hiring plan for {{solution}} for the next 12-24 months.

Provide:
- {{hiringPlan: "12-24 month hiring plan with roles, timing, and priorities"}}
- {{hiringTimeline: "Quarter-by-quarter hiring schedule"}}

Structure in professional Markdown with hiring roadmap and cost projections.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

طور خطة توظيف لـ {{solution}} لـ 12-24 شهر القادمة.

قدم:
- {{hiringPlan: "خطة التوظيف لـ 12-24 شهر مع الأدوار، التوقيت، والأولويات"}}
- {{hiringTimeline: "جدول التوظيف ربع سنوي"}}

هيكلة في Markdown احترافي مع خارطة طريق التوظيف وتقديرات التكلفة.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.hiringPlan) issues.push('Missing hiring plan');
    return { valid: issues.length === 0, issues };
  },
};
