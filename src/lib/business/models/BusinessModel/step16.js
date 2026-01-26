import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step16 = {
  id: "step16",
  name: {
    en: "Risk Analysis",
    ar: "تحليل المخاطر"
  },
  model: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Conduct a thorough risk analysis for the solution {{solution}}.
Identify:
- {{assumptions: "Key assumptions that must hold true for success, with validation methods"}}
- {{risks: "Major risks, including market, technical, financial, and operational, with mitigation strategies"}}
Categorize and prioritize risks in professional Markdown with tables for clarity and investor-ready insights.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

 conducting تحليل شامل للمخاطر للحل {{solution}}.
حدد:
- {{assumptions: "الافتراضات الأساسية التي يجب أن تكون صحيحة للنجاح، مع طرق التحقق"}}
- {{risks: "المخاطر الرئيسية، بما في ذلك السوق، التقنية، المالية، والتشغيلية، مع استراتيجيات التخفيف"}}
صنّف وprioritize المخاطر في Markdown احترافي مع جداول للوضوح ورؤى جاهزة للمستثمر.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};