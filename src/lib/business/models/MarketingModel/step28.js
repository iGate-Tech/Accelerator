import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step28 = {
  id: "step28",
  name: {
    en: "Serviceable Obtainable Market",
    ar: "السوق القابل للحصول"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["sam", "som", "captureShare", "captureRationale", "growthProjection"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Estimate the Serviceable Obtainable Market (SOM) for your target market ({{sam}}). Explain initial capture share rationale.

Provide:
- {{som: "Serviceable Obtainable Market value representing realistic 3-5 year capture"}}
- {{captureShare: "Initial market capture share percentage with detailed justification"}}
- {{captureRationale: "Rationale for market capture based on competitive advantages and resources"}}
- {{growthProjection: "Market capture growth trajectory over 5 years"}}

Structure in professional Markdown with market share calculations, growth projections, and competitive positioning.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قدّر السوق القابل للحصول (SOM) لسوقك المستهدف ({{sam}}). اشرح سبب حصة الالتقاط الأولية.

قدم:
- {{som: "قيمة السوق القابل للحصول تمثل التقاط واقعي على مدى 3-5 سنوات"}}
- {{captureShare: "نسبة حصة السوق المبدئية مع التبرير التفصيلي"}}
- {{captureRationale: "السبب لالتقاط السوق بناءً على المزايا التنافسية والموارد"}}
- {{growthProjection: "مسار نمو التقاط السوق على مدى 5 سنوات"}}

هيكلة في Markdown احترافي مع حسابات حصة السوق، توقعات النمو، وموضع التنافس.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.som) issues.push('Missing SOM value');
    if (parseFloat(context.som) > parseFloat(context.sam)) {
      issues.push('SOM cannot be larger than SAM');
    }
    return { valid: issues.length === 0, issues };
  },
};