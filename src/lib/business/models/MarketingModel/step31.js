import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step31 = {
  id: "step31",
  name: {
    en: "Market Entry",
    ar: "دخول السوق"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "marketEntryStrategy"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Develop a strategy to enter {{industry}} and acquire first customers for {{solution}}.

Provide:
- {{marketEntryStrategy: "Comprehensive market entry approach including timing, channels, and initial target segments"}}

Structure in professional Markdown with entry timeline, channel strategy, and customer acquisition plan.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

طور استراتيجية للدخول إلى {{industry}} وتحقيق أول عملاء لـ {{solution}}.

قدم:
- {{marketEntryStrategy: "نهج شامل للدخول إلى السوق يتضمن التوقيت، القنوات، وشرائح الهدف الأولية"}}

هيكلة في Markdown احترافي مع جدول الدخول، استراتيجية القناة، و خطة اقتناء العملاء.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.marketEntryStrategy) issues.push('Missing market entry strategy');
    return { valid: issues.length === 0, issues };
  },
};
