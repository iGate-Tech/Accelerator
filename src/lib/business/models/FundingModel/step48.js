import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step48 = {
  id: "step48",
  name: {
    en: "Funding Milestones",
    ar: "إنجازات التمويل"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "askAmount", "milestones"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List milestones unlocked by this funding round ({{askAmount}}) for {{solution}}.

Provide:
- {{milestones: "Key milestones to achieve with the funding across product, growth, and team"}}

Structure in professional Markdown with milestone timeline and success metrics.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

سرد الإنجازات المفتوحة بجولة التمويل هذه ({{askAmount}}) لـ {{solution}}.

قدم:
- {{milestones: "الإنجازات الأساسية لتحقيقها مع التمويل عبر المنتج، النمو، والفريق"}}

هيكلة في Markdown احترافي مع جدول الإنجازات ومقاييس النجاح.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.milestones) issues.push('Missing funding milestones');
    return { valid: issues.length === 0, issues };
  },
};
