import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step3 = {
  id: "step3",
  name: {
    en: "Severity Assessment",
    ar: "تقييم الحدة"
  },
  model: {
    en: "Idea Model",
    ar: "نموذج الفكرة"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Evaluate the severity and frequency of the problem: {{problem}}.
Provide a detailed assessment with:
- {{severity: "Severity level (e.g., high, medium, low) with justification based on impact and urgency"}}
- {{frequency: "How often the problem occurs, including patterns, triggers, and affected scenarios"}}
- {{consequences: "Detailed consequences for affected parties, including short-term and long-term effects"}}
- {{comparison: "Industry or market comparison showing how this problem compares to similar issues in other sectors"}}
Use professional Markdown formatting with sections, metrics where possible, and practical examples tied to {{problem}}.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قيّم شدة وتكرار المشكلة: {{problem}}.
قدم تقييمًا مفصلًا مع:
- {{severity: "مستوى الشدة (مثلاً، عالية، متوسطة، منخفضة) مع التبرير بناءً على الأثر والurgence"}}
- {{frequency: "ما مدى تكرار حدوث المشكلة، بما في ذلك الأنماط والمسببات وسيناريوهات التأثير"}}
- {{consequences: "النتائج المفصلة للأطراف المتأثرة، بما في ذلك التأثيرات قصيرة وطويلة المدى"}}
- {{comparison: "مقارنة بالصناعة أو السوق توضح كيف تقارن هذه المشكلة مع قضايا مشابهة في قطاعات أخرى"}}
استخدم تنسيق Markdown احترافي مع أقسام ومétriques إن أمكن وأمثلة عملية مرتبطة بـ {{problem}}.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};