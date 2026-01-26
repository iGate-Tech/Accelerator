import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step50 = {
  id: "step50",
  name: {
    en: "Team Gaps",
    ar: "فجوات الفريق"
  },
  model: {
    en: "Team Model",
    ar: "نموذج الفريق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["persona", "solution", "team", "missingSkills", "criticalGaps"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify key skills missing in the team for {{solution}} to serve {{persona}}.

Provide:
- {{missingSkills: "Critical skills and roles currently missing from the team"}}
- {{criticalGaps: "Most important gaps to fill prioritized by impact"}}

Structure in professional Markdown with skills gap analysis and priority matrix.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد المهارات الأساسية المفقودة في الفريق لـ {{solution}} لخدمة {{persona}}.

قدم:
- {{missingSkills: "المهارات والأدوار الحرجة المفقودة حاليًا من الفريق"}}
- {{criticalGaps: "أكبر الفجوات أهمية لملئها مصنفة حسب التأثير"}}

هيكلة في Markdown احترافي مع تحليل فجوة المهارات ومصفوفة الأولوية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.missingSkills) issues.push('Missing skills gap analysis');
    return { valid: issues.length === 0, issues };
  },
};
