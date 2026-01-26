import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step40 = {
  id: "step40",
  name: {
    en: "Break-even Analysis",
    ar: "تحليل نقطة التعادل"
  },
  model: {
    en: "Financial Model",
    ar: "النموذج المالي"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["fixedCosts", "variableCosts", "revenue", "breakevenPoint", "breakevenTimeline"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine when {{solution}} will break even.

Provide:
- {{breakevenPoint: "Break-even point in units or revenue"}}
- {{breakevenTimeline: "Timeline to break-even (months/years from launch)"}}

Structure in professional Markdown with break-even chart and sensitivity analysis.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد متى سيصل {{solution}} إلى نقطة التعادل.

قدم:
- {{breakevenPoint: "نقطة التعادل بالوحدات أو الإيرادات"}}
- {{breakevenTimeline: "الجدول الزمني للتعادل (أشهر/سنوات من الإطلاق)"}}

هيكلة في Markdown احترافي مع مخطط التعادل وتحليل الحساسية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.breakevenPoint) issues.push('Missing break-even point');
    if (!context.breakevenTimeline) issues.push('Missing break-even timeline');
    return { valid: issues.length === 0, issues };
  },
};
