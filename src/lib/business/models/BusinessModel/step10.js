import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step10 = {
  id: "step10",
  name: {
    en: "Value Proposition",
    ar: "قيمة الاقتراح"
  },
  model: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "alternatives", "evidence"],
  detailedPrompt: {
    en: `
The original problem is: {{problem}}

Based on the solution {{solution}} designed to solve this problem:

Craft a compelling value proposition that directly addresses {{problem}}.
Compare against alternatives {{alternatives}} and use evidence {{evidence}}.

Your response MUST be about {{problem}}. Do not generate content for unrelated topics.

Highlight:
- {{valueProp: "Clear, concise value proposition statement directly related to {{problem}}"}}
- {{uniqueBenefits: "Specific benefits that solve {{problem}}, tied to {{evidence}}"}}
- {{quantifiedValue: "Quantified value for solving {{problem}}, such as cost savings, time reductions, or ROI"}}
- {{targetCustomers: "Target customers who have {{problem}}"}}
Use professional Markdown with persuasive language tied to {{problem}}.
`,
    ar: `
المشكلة الأصلية هي: {{problem}}

بناءً على الحل {{solution}} المصمم لحل هذه المشكلة:

صيغ اقتراح قيمة مقنع يعالج {{problem}} مباشرة.
قارن مع البدائل {{alternatives}} واستخدم الأدلة {{evidence}}.

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تولّد محتوى لموضوعات غير مرتبطة.

برز:
- {{valueProp: "بيان اقتراح القيمة الواضح والمقتضب مباشرة مرتبط بـ {{problem}}"}}
- {{uniqueBenefits: "الفوائد المحددة التي تحل {{problem}}، مرتبطة بـ {{evidence}}"}}
- {{quantifiedValue: "القيمة الكمية لحل {{problem}}، مثل توفير التكاليف، تقليل الوقت، أو العائد على الاستثمار"}}
- {{targetCustomers: "عملاء الهدف الذين يعانون من {{problem}}"}}
استخدم Markdown احترافي مع لغة إقناعية مرتبطة بـ {{problem}}.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};