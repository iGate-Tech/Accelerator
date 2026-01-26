import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step7 = {
  id: "step7",
  name: {
    en: "Urgency Assessment",
    ar: "تقييم الحاحية"
  },
  model: {
    en: "Idea Model",
    ar: "نموذج الفكرة"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["persona"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Assess the urgency for the persona {{persona}} to solve the problem.
Determine:
- {{urgency: "Whether this is a must-have (immediate need) or nice-to-have (optional improvement), with justification based on impact and timing"}}
- {{consequences: "Detailed consequences of not solving the problem, including short-term pain and long-term risks for {{persona}}"}}
- {{examples: "Real-world examples or scenarios illustrating the urgency, such as time-sensitive situations or competitive pressures"}}
Use professional Markdown with clear reasoning and metrics to support investor interest.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قيّم الضرورة الملحة للشخصية {{persona}} لحل المشكلة.
حدد:
- {{urgency: "ما إذا كانت هذه ضرورة ملحة (احتياج فوري) أو تحسين اختياري (تحسين اختياري)، مع التبرير بناءً على الأثر والتوقيت"}}
- {{consequences: "النتائج التفصيلية لعدم حل المشكلة، بما في ذلك الألم قصير المدى والمخاطر طويلة المدى للشخصية {{persona}}"}}
- {{examples: "أمثلة واقعية أو سيناريوهات توضح الضرورة الملحة، مثل المواقف الحساسة للوقت أو الضغوط التنافسية"}}
استخدم Markdown احترافي مع تبرير واضح ومétriques لدعم اهتمام المستثمر.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};