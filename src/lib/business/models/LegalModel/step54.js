import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step54 = {
  id: "step54",
  name: {
    en: "IP Protection",
    ar: "حماية الملكية الفكرية"
  },
  model: {
    en: "Legal Model",
    ar: "النموذج القانوني"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "ipOwnership", "ipStrategy", "patents"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Plan intellectual property ownership and protection for {{solution}}.

Provide:
- {{ipOwnership: "IP ownership structure and assignment agreements"}}
- {{ipStrategy: "Strategy for patents, trademarks, copyrights, and trade secrets"}}
- {{patents: "Patent strategy and key IP assets to protect"}}

Structure in professional Markdown with IP protection plan.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

خطط لملكية وحماية الملكية الفكرية لـ {{solution}}.

قدم:
- {{ipOwnership: "هيكل ملكية الملكية الفكرية واتفاقيات التنازل"}}
- {{ipStrategy: "الاستراتيجية للبراءات، العلامات التجارية، حقوق الملكية، والأسرار التجارية"}}
- {{patents: "استراتيجية البراءات وأصول الملكية الفكرية الأساسية لحمايتها"}}

هيكلة في Markdown احترافي مع خطة حماية الملكية الفكرية.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.ipOwnership) issues.push('Missing IP ownership plan');
    return { valid: issues.length === 0, issues };
  },
};
