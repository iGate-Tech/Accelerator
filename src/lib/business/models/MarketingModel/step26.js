import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step26 = {
  id: "step26",
  name: {
    en: "Total Addressable Market",
    ar: "السوق الكلي القابل للعنونة"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "tam", "calculationMethod", "dataSources", "tamRationale"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Estimate the Total Addressable Market (TAM) for {{industry}}. Explain the calculation method.

Provide:
- {{tam: "Total Addressable Market value in dollars with clear calculation methodology"}}
- {{calculationMethod: "TAM calculation approach (top-down, bottom-up, or hybrid) with assumptions"}}
- {{dataSources: "Data sources and references supporting the market size estimate"}}
- {{tamRationale: "Rationale for why {{industry}} represents the full market opportunity"}}

Structure in professional Markdown with calculation breakdowns, assumptions, and source citations.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قدّر السوق الكلي القابل للعنونة (TAM) لـ {{industry}}. اشرح طريقة الحساب.

قدم:
- {{tam: "قيمة السوق الكلي القابل للعنونة بالدولار مع منهجية الحساب الواضحة"}}
- {{calculationMethod: "نهج حساب TAM (من الأعلى إلى الأسفل، من الأسفل إلى الأعلى، أو مختلط) مع الافتراضات"}}
- {{dataSources: "مصادر البيانات والمراجع التي تدعم تقدير حجم السوق"}}
- {{tamRationale: "السبب في أن {{industry}} يمثل فرصة السوق الكاملة"}}

هيكلة في Markdown احترافي مع تفكيك الحسابات، الافتراضات، واقتباسات المصدر.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.tam) issues.push('Missing TAM value');
    if (!context.calculationMethod) issues.push('Missing calculation method');
    return { valid: issues.length === 0, issues };
  },
};