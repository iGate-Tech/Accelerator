import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step35 = {
  id: "step35",
  name: {
    en: "Revenue Streams",
    ar: "مصادر الدخل"
  },
  model: {
    en: "Financial Model",
    ar: "النموذج المالي"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["modelType", "revenueStreams", "revenueModel"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Explain how revenue is generated per customer in {{modelType}}.

Provide:
- {{revenueStreams: "Primary and secondary revenue streams with descriptions and amounts"}}
- {{revenueModel: "How the business makes money - pricing units, frequency, and average revenue per user"}}

Structure in professional Markdown with revenue breakdown table and unit economics.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

اشرح كيف يتم توليد الإيرادات لكل عميل في {{modelType}}.

قدم:
- {{revenueStreams: "مصدر الدخل الأساسي والفرعي مع الأوصاف والمبالغ"}}
- {{revenueModel: "كيف يربح العمل - وحدات التسعير، التكرار، ومتوسط الإيرادات لكل مستخدم"}}

هيكلة في Markdown احترافي مع جدول تفكيك الإيرادات والاقتصاد وحدة.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.revenueStreams) issues.push('Missing revenue streams');
    return { valid: issues.length === 0, issues };
  },
};
