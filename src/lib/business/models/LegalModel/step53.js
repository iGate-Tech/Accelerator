import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step53 = {
  id: "step53",
  name: {
    en: "Legal Structure",
    ar: "الهيكل القانوني"
  },
  model: {
    en: "Legal Model",
    ar: "النموذج القانوني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "legalEntity", "entityType", "jurisdiction"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine the legal structure for the {{solution}} company.

Provide:
- {{legalEntity: "Recommended legal entity type (C-Corp, LLC, etc.)"}}
- {{entityType: "Entity structure details and ownership"}}
- {{jurisdiction: "Recommended jurisdiction for incorporation"}}

Structure in professional Markdown with entity comparison and recommendation.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد البنية القانونية لشركة {{solution}}.

قدم:
- {{legalEntity: "نوع الكيان القانوني الموصى به (C-Corp، LLC، إلخ.)"}}
- {{entityType: "تفاصيل هيكل الكيان والملكية"}}
- {{jurisdiction: "الولاية القضائية الموصى بها للتسجيل"}}

هيكلة في Markdown احترافي مع مقارنة الكيان والتوصية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.legalEntity) issues.push('Missing legal entity recommendation');
    return { valid: issues.length === 0, issues };
  },
};
