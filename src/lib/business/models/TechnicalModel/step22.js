import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step22 = {
  id: "step22",
  name: {
    en: "API & Integrations",
    ar: "API والتكاملات"
  },
  model: {
    en: "Technical Model",
    ar: "النموذج الفني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "integrations"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Design API strategy for {{solution}}. Plan REST/GraphQL design, third-party {{integrations}}, webhooks, and partnership opportunities.

Provide:
- {{apiDesign: "API architecture choice (REST, GraphQL, gRPC) with justification"}}
- {{integrations: "Third-party integrations strategy including essential and optional services"}}
- {{webhooks: "Webhook design for event-driven architecture and partner integrations"}}
- {{partnerships: "Partnership opportunities through API exposure and integration marketplace"}}

Structure in professional Markdown with clear sections, endpoint designs, and integration priorities.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

صمم استراتيجية API لـ {{solution}}. خطط لتصميم REST/GraphQL، {{integrations}} من الأطراف الثالثة، webhooks، وفرص الشراكات.

قدم:
- {{apiDesign: "اختيار بنية API (REST، GraphQL، gRPC) مع التبرير"}}
- {{integrations: "استراتيجية التكامل مع الأطراف الثالثة بما في ذلك الخدمات الأساسية والاختيارية"}}
- {{webhooks: "تصميم Webhook لبناءة المعمارية القائمة على الأحداث والتكاملات الشريكة"}}
- {{partnerships: "فرص الشراكات من خلال كشف API وسوق التكامل"}}

هيكلة في Markdown احترافي مع أقسام واضحة، تصاميم النقطة النهائية، وأولويات التكامل.
  `
  },
  validate: (context) => ({ valid: true, issues: [] }),
};