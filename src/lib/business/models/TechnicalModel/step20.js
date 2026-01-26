import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step20 = {
  id: "step20",
  name: {
    en: "Security Architecture",
    ar: "هندسة الأمان"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "persona"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design security architecture for {{solution}} serving {{persona}}. Include authentication, encryption, compliance requirements, and security measures.

Provide:
- {{authentication: "Authentication strategy including auth method, user management, and access controls"}}
- {{encryption: "Data encryption approach for data at rest and in transit"}}
- {{compliance: "Compliance requirements (GDPR, HIPAA, SOC2, etc.) based on {{persona}} industry"}}
- {{securityMeasures: "Security measures including monitoring, threat detection, and incident response"}}

Structure in professional Markdown with clear sections, architecture descriptions, and implementation priorities.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

صمم بنية الأمان لـ {{solution}} التي تخدم {{persona}}. تتضمن المصادقة، التشفير، متطلبات الامتثال، وتدابير الأمان.

قدم:
- {{authentication: "استراتيجية المصادقة بما في ذلك طريقة المصادقة، إدارة المستخدمين، وضوابط الوصول"}}
- {{encryption: "نهج تشفير البيانات للبيانات الثابتة والمتحركة"}}
- {{compliance: "متطلبات الامتثال (GDPR، HIPAA، SOC2، إلخ) بناءً على صناعة {{persona}}"}}
- {{securityMeasures: "تدابير الأمان بما في ذلك المراقبة، اكتشاف التهديدات، والاستجابة للحوادث"}}

هيكلة في Markdown احترافي مع أقسام واضحة، أوصاف البنية، وأولويات التنفيذ.
  `
  },
  validate: (context) => ({ valid: true, issues: [] }),
};