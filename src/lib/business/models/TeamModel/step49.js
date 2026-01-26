import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step49 = {
  id: "step49",
  name: {
    en: "Founding Team",
    ar: "الفريق المؤسس"
  },
  model: {
    en: "Team Model",
    ar: "نموذج الفريق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "team", "teamMembers", "foundingTeam"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List founding team members for {{solution}} and their roles.

Provide:
- {{team: "Complete founding team with names, roles, and relevant experience"}}
- {{teamMembers: "Team composition breakdown by function"}}

Structure in professional Markdown with team table and relevant backgrounds.

Embed {{team: "Full team information for use in reports"}}.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

سرد أعضاء الفريق المؤسس لـ {{solution}} وأدوارهم.

قدم:
- {{team: "الفريق المؤسس الكامل مع الأسماء، الأدوار، والخبرة ذات الصلة"}}
- {{teamMembers: "تفكيك تكوين الفريق حسب الوظيفة"}}

هيكلة في Markdown احترافي مع جدول الفريق والخلفيات ذات الصلة.

ضمّن {{team: "معلومات الفريق الكاملة للاستخدام في التقارير"}}.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.team && !context.teamMembers) issues.push('Missing founding team');
    return { valid: issues.length === 0, issues };
  },
};
