import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step47 = {
  id: "step47",
  name: {
    en: "Target Investors",
    ar: "المستثمرون المستهدفون"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "stage", "targetInvestors", "investorTypes"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify target investor types for {{solution}} at your funding stage.

Provide:
- {{targetInvestors: "Specific investor types and categories to target"}}
- {{investorTypes: " angel investors, VCs, corporate VCs, etc. with examples"}}

Structure in professional Markdown with investor targeting matrix.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد أنواع المستثمرين المستهدفين لـ {{solution}} في مرحلة التمويل الخاصة بك.

قدم:
- {{targetInvestors: "أنواع المستثمرين المحددين وفئات المستهدفين"}}
- {{investorTypes: " المستثمرون الملائكون، المستثمرون المخاطرون، المستثمرون المخاطرون للشركات، إلخ. مع أمثلة"}}

هيكلة في Markdown احترافي مع مصفوفة استهداف المستثمر.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.targetInvestors) issues.push('Missing target investors');
    return { valid: issues.length === 0, issues };
  },
};
