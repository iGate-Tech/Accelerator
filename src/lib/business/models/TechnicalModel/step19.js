import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step19 = {
  id: "step19",
  name: {
    en: "Infrastructure & Hosting",
    ar: "البنية التحتية والاستضافة"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "scalability"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan infrastructure and hosting for {{solution}} considering {{scalability}}. Recommend cloud provider, hosting strategy, and CDN approach.

Provide:
- {{cloudProvider: "Recommended cloud provider (e.g., AWS, GCP, Azure) with justification based on {{scalability}} requirements"}}
- {{hostingStrategy: "Hosting approach including compute, storage, and networking architecture"}}
- {{cdnApproach: "CDN strategy for content delivery and performance optimization"}}
- {{infrastructureCost: "Estimated monthly infrastructure cost range for initial deployment"}}

Structure in professional Markdown with clear sections, diagrams descriptions, and practical recommendations.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

خطط للبنية التحتية والاستضافة لـ {{solution}} مع الأخذ في الاعتبار {{scalability}}. أوصي بموفر السحابة، استراتيجية الاستضافة، ونهج CDN.

قدم:
- {{cloudProvider: "موفر السحابة الموصى به (مثلاً، AWS، GCP، Azure) مع التبرير بناءً على متطلبات {{scalability}}"}}
- {{hostingStrategy: "نهج الاستضافة بما في ذلك الحوسبة، التخزين، وبنية الشبكة"}}
- {{cdnApproach: "استراتيجية CDN لتسليم المحتوى وتحسين الأداء"}}
- {{infrastructureCost: "نطاق التكلفة التقديرية للبنية التحتية شهريًا للنشر الأولي"}}

هيكلة في Markdown احترافي مع أقسام واضحة، أوصاف المخططات، و التوصيات العملية.
  `
  },
  validate: (context) => ({ valid: true, issues: [] }),
};