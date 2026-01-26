import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step33 = {
  id: "step33",
  name: {
    en: "Sales Strategy",
    ar: "استراتيجية المبيعات"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["industry", "solution", "salesMotion", "salesStrategy"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Describe the sales motion for {{industry}} targeting {{solution}}: self-serve, inside sales, or enterprise.

Provide:
- {{salesMotion: "Sales approach type (self-serve, inside sales, field sales, enterprise) with justification"}}
- {{salesStrategy: "Detailed sales strategy including process, cycle length, and key activities"}}

Structure in professional Markdown with sales model analysis, cycle timeline, and resource requirements.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

وصف حركة المبيعات لـ {{industry}} تستهدف {{solution}}: بيع ذاتي، مبيعات داخلية، أو مبيعات مؤسسية.

قدم:
- {{salesMotion: "نوع نهج المبيعات (بيع ذاتي، مبيعات داخلية، مبيعات ميدانية، مؤسسي) مع التبرير"}}
- {{salesStrategy: "استراتيجية المبيعات التفصيلية بما في ذلك العملية، مدة الدورة، والأنشطة الأساسية"}}

هيكلة في Markdown احترافي مع تحليل نموذج المبيعات، جدول الدورة، ومتطلبات الموارد.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.salesMotion) issues.push('Missing sales motion definition');
    return { valid: issues.length === 0, issues };
  },
};
