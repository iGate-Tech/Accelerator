import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step56 = {
  id: "step56",
  name: {
    en: "Risk Assessment",
    ar: "تقييم المخاطر"
  },
  model: {
    en: "Legal Model",
    ar: "النموذج القانوني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "legalRisks", "regulatoryRisks", "mitigation"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Identify legal and regulatory risks for {{solution}}.

Provide:
- {{legalRisks: "Legal risks including liability, IP disputes, and contractual risks"}}
- {{regulatoryRisks: "Regulatory risks and compliance exposure"}}
- {{mitigation: "Risk mitigation strategies and contingency plans"}}

Structure in professional Markdown with risk matrix and mitigation plan.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حدد المخاطر القانونية والتنظيمية لـ {{solution}}.

قدم:
- {{legalRisks: "المخاطر القانونية بما في ذلك المسؤولية، نزاعات الملكية الفكرية، ومخاطر العقود"}}
- {{regulatoryRisks: "المخاطر التنظيمية وعرض الامتثال"}}
- {{mitigation: "استراتيجيات التخفيف من المخاطر والخطط الاحتياطية"}}

هيكلة في Markdown احترافي مع مصفوفة المخاطر و خطة التخفيف.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.legalRisks) issues.push('Missing legal risk assessment');
    return { valid: issues.length === 0, issues };
  },
};
