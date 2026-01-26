import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step45 = {
  id: "step45",
  name: {
    en: "Use of Funds",
    ar: "استخدام الأموال"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "askAmount", "useOfFunds", "allocation"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan the allocation of raised funds ({{askAmount}}) for {{solution}}.

Provide:
- {{useOfFunds: "Detailed breakdown of how funds will be allocated across categories (product, marketing, team, ops)"}}
- {{allocation: "Percentage allocation for each category"}}

Structure in professional Markdown with funding allocation table and priorities.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

خطط لتقسيم الأموال المجمعة ({{askAmount}}) لـ {{solution}}.

قدم:
- {{useOfFunds: "تفصيل لكيفية تخصيص الأموال عبر الفئات (المنتج، التسويق، الفريق، العمليات")}}
- {{allocation: "نسبة التخصيص لكل فئة"}}

هيكلة في Markdown احترافي مع جدول تخصيص الأموال والأولويات.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.useOfFunds) issues.push('Missing use of funds breakdown');
    return { valid: issues.length === 0, issues };
  },
};
