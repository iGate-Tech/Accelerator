import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step43 = {
  id: "step43",
  name: {
    en: "Funding Stage",
    ar: "مرحلة التمويل"
  },
  model: {
    en: "Funding Model",
    ar: "نموذج التمويل"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "traction", "fundingStage"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Determine the appropriate funding stage for {{solution}} based on traction: Pre-seed, Seed, Series A, etc.

Provide:
- {{fundingStage: "Recommended funding stage with justification based on current traction"}}

Structure in professional Markdown with stage characteristics and matching analysis.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد مرحلة التمويل المناسبة لـ {{solution}} بناءً على التقدم: ما قبل البذور، البذور، سلسلة A، إلخ.

قدم:
- {{fundingStage: "مرحلة التمويل الموصى بها مع التبرير بناءً على التقدم الحالي"}}

هيكلة في Markdown احترافي مع خصائص المرحلة وتحليل المطابقة.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.fundingStage) issues.push('Missing funding stage recommendation');
    return { valid: issues.length === 0, issues };
  },
};
