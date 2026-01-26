import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step15 = {
  id: "step15",
  name: {
    en: "Competitive Moats",
    ar: "الحواجز التنافسية"
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


Build and analyze competitive moats for the solution {{solution}}.
Focus on barriers to entry and provide:
- {{moat: "Key moats (e.g., technology, network effects, data), prioritized by strength"}}
- {{implementation: "How to implement each moat, including strategies and resources needed"}}
- {{examples: "Real-world examples of similar moats in successful companies"}}
- {{sustainability: "Long-term sustainability of each moat against competition"}}
Structure in professional Markdown with analysis and actionable recommendations.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

بناء وتحليل الحواجز التنافسية للحل {{solution}}.
ركّز على حواجز الدخول وقدم:
- {{moat: "الحواجز الأساسية (مثلاً، التكنولوجيا، تأثيرات الشبكة، البيانات)، مصنفة حسب القوة"}}
- {{implementation: "كيفية تنفيذ كل حائط، بما في ذلك الاستراتيجيات والموارد المطلوبة"}}
- {{examples: "أمثلة واقعية لحواجز مماثلة في شركات ناجحة"}}
- {{sustainability: "استدامة كل حائط على المدى الطويل ضد المنافسة"}}
هيكلة في Markdown احترافي مع تحليل و توصيات قابلة للتنفيذ.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};