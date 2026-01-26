import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step55 = {
  id: "step55",
  name: {
    en: "Compliance Requirements",
    ar: "متطلبات الامتثال"
  },
  model: {
    en: "Legal Model",
    ar: "النموذج القانوني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "compliance", "contracts", "regulatory"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify key contracts and compliance requirements for {{solution}}.

Provide:
- {{compliance: "Regulatory compliance requirements (GDPR, HIPAA, etc.)"}}
- {{contracts: "Key contracts needed (terms, privacy, NDAs)"}}
- {{regulatory: "Industry-specific regulatory requirements"}}

Structure in professional Markdown with compliance checklist.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد العقود الأساسية ومتطلبات الامتثال لـ {{solution}}.

قدم:
- {{compliance: "متطلبات الامتثال التنظيمي (GDPR، HIPAA، إلخ.)"}}
- {{contracts: "العقود الأساسية المطلوبة (الشروط، الخصوصية، اتفاقيات عدم الإفشاء)"}}
- {{regulatory: "متطلبات التنظيم المحددة للصناعة"}}

هيكلة في Markdown احترافي مع قائمة تحقق الامتثال.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.compliance) issues.push('Missing compliance requirements');
    return { valid: issues.length === 0, issues };
  },
};
