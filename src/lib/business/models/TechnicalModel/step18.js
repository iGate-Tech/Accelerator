import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step18 = {
  id: "step18",
  name: {
    en: "MVP Definition",
    ar: "تعريف MVP"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "coreFeatures"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Define the Minimum Viable Product (MVP) for the solution {{solution}}.
Identify {{mvpFeatures: "core features from {{coreFeatures}} to include in MVP, with rationale"}}.
Explain {{scope: "MVP scope, including what's in/out and timeline"}} and {{prioritization: "prioritization rationale based on user needs and impact"}}.
Provide practical, technical details in professional Markdown.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

عرّف المنتج الأدنى القابل للتطبيق (MVP) للحل {{solution}}.
حدد {{mvpFeatures: "الميزات الأساسية من {{coreFeatures}} لتضمينها في MVP، مع التبرير"}}.
اشرح {{scope: "نطاق MVP، بما في ذلك ما هو متضمن/غير متضمن والجدول الزمني"}} و{{prioritization: "تبرير الأولوية بناءً على احتياجات المستخدم والتأثير"}}.
قدم تفاصيل عملية وتقنية في Markdown احترافي.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};