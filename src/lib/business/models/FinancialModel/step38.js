import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step38 = {
  id: "step38",
  name: {
    en: "Financial Projections",
    ar: "التوقعات المالية"
  },
  model: {
    en: "Financial Model",
    ar: "النموذج المالي"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "revenue", "expenses", "financialProjections", "year1Revenue", "year2Revenue", "year3Revenue"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Provide 3-year revenue and expense projections for {{solution}}.

Provide:
- {{financialProjections: "3-year financial summary with revenue, expenses, and profit/loss by year"}}
- {{year1Revenue: "Year 1 revenue projection with assumptions"}}
- {{year2Revenue: "Year 2 revenue projection with growth assumptions"}}
- {{year3Revenue: "Year 3 revenue projection with scaling assumptions"}}

Structure in professional Markdown with yearly tables, growth rates, and key assumptions.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قدم توقعات الإيرادات والمصروفات لـ 3 سنوات لـ {{solution}}.

قدم:
- {{financialProjections: "ملخص مالي لـ 3 سنوات مع الإيرادات، المصروفات، والربح/الخسارة حسب السنة"}}
- {{year1Revenue: "توقعات إيرادات السنة 1 مع الافتراضات"}}
- {{year2Revenue: "توقعات إيرادات السنة 2 مع افتراضات النمو"}}
- {{year3Revenue: "توقعات إيرادات السنة 3 مع افتراضات التوسع"}}

هيكلة في Markdown احترافي مع الجداول السنوية، معدلات النمو، والافتراضات الأساسية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.financialProjections) issues.push('Missing financial projections');
    return { valid: issues.length === 0, issues };
  },
};
