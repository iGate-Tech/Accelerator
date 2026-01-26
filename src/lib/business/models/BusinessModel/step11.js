import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step11 = {
  id: "step11",
  name: {
    en: "Key Features",
    ar: "الميزات الأساسية"
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


List and detail key features of the solution {{solution}}.
Provide {{features: "List of features, each mapped to a specific customer benefit, with descriptions of functionality and value"}}.
Structure as a numbered or bulleted list in professional Markdown, ensuring each feature is practical and tied to solving the core problem.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

سرد وتفصيل ميزات الحل {{solution}}.
قدم {{features: "قائمة بالميزات، كل منها مربوطة بمنفعة عميل محددة، مع وصف لوظائف القيمة"}}.
هيكلة كقائمة مرقمة أو محددة في Markdown احترافي، مع التأكد من أن كل ميزة عملية ومرتبطة بحل المشكلة الأساسية.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};