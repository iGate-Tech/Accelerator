import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step37 = {
  id: "step37",
  name: {
    en: "Cost Structure",
    ar: "هيكل التكاليف"
  },
  model: {
    en: "Financial Model",
    ar: "النموذج المالي"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "fixedCosts", "variableCosts", "costBreakdown"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


List major fixed and variable costs for {{solution}}.

Provide:
- {{fixedCosts: "Monthly fixed costs (rent, salaries, infrastructure) with amounts"}}
- {{variableCosts: "Variable costs per unit or customer with amounts"}}
- {{costBreakdown: "Complete cost structure breakdown by category"}}

Structure in professional Markdown with cost table and percentage breakdown.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

سرد التكاليف الثابتة والمتغيرة الرئيسية لـ {{solution}}.

قدم:
- {{fixedCosts: "التكاليف الثابتة الشهرية (الإيجار، الرواتب، البنية التحتية) مع المبالغ"}}
- {{variableCosts: "التكاليف المتغيرة لكل وحدة أو عميل مع المبالغ"}}
- {{costBreakdown: "تفكيك هيكل التكلفة الكامل حسب الفئة"}}

هيكلة في Markdown احترافي مع جدول التكلفة وتفكيك النسبة المئوية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.fixedCosts) issues.push('Missing fixed costs');
    if (!context.variableCosts) issues.push('Missing variable costs');
    return { valid: issues.length === 0, issues };
  },
};
