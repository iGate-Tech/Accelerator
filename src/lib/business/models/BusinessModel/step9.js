import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step9 = {
  id: "step9",
  name: {
    en: "Solution Design",
    ar: "تصميم الحل"
  },
  model: {
    en: "Business Model",
    ar: "نموذج العمل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["gaps", "persona"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

The gaps identified are: {{gaps}}

You MUST design a solution that directly addresses {{problem}}.
Your solution MUST:
- Be directly related to {{problem}}
- Address the specific gaps mentioned above
- Be suitable for the persona: {{persona}}

If the gaps {{gaps}} seem unrelated to {{problem}}, IGNORE the gaps and design a solution that directly addresses {{problem}} instead.

Provide:
- {{solution: "High-level solution description directly related to {{problem}}"}}
- {{coreFeatures: "List of 3-5 core features that solve {{problem}}, with brief descriptions"}}
- {{addressedGaps: "How each feature addresses {{problem}} and the identified gaps"}}
- {{differentiation: "Key differentiators from existing solutions for {{problem}}"}}
- {{modelType: "Business model type such as SaaS, Marketplace, B2B, B2C, or Hybrid"}}

IMPORTANT: Your solution MUST be about {{problem}}. Do not generate solutions for unrelated topics.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

الفجوات المعرفة هي: {{gaps}}

يجب أن تصمم حلاً يعالج {{problem}} مباشرة.
يجب أن:
- يكون الحل مرتبطًا مباشرة بـ {{problem}}
- يعالج الفجوات المحددة أعلاه
- يكون مناسبًا للشخصية: {{persona}}

إذا بدت الفجوات {{gaps}} غير مرتبطة بـ {{problem}}، تجاهل الفجوات وصمم حلاً يعالج {{problem}} مباشرة بدلاً من ذلك.

قدم:
- {{solution: "وصف الحل على مستوى عالٍ مرتبط مباشرة بـ {{problem}}"}}
- {{coreFeatures: "قائمة من 3-5 ميزات أساسية تحل {{problem}}، مع أوصاف موجزة"}}
- {{addressedGaps: "كيف تعالج كل ميزة {{problem}} والفجوات المحددة"}}
- {{differentiation: "مميزات رئيسية تميزها عن الحلول الحالية لـ {{problem}}"}}
- {{modelType: "نوع نموذج العمل مثل SaaS أو سوق أو B2B أو B2C أو مختلط"}}

مهم: يجب أن يكون الحل متعلقًا بـ {{problem}}. لا تولّد حلولًا لموضوعات غير مرتبطة.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};
