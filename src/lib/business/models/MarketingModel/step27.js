import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step27 = {
  id: "step27",
  name: {
    en: "Serviceable Available Market",
    ar: "السوق المتاح القابل للخدمة"
  },
  model: {
    en: "Marketing Model",
    ar: "نموذج التسويق"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["tam", "sam", "reachRationale", "segmentation", "geographicScope"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Estimate the Serviceable Available Market (SAM) for your target market ({{tam}}). Describe realistic reach.

Provide:
- {{sam: "Serviceable Available Market value in dollars representing realistic market reach"}}
- {{reachRationale: "Rationale for market reach percentage based on product-market fit factors"}}
- {{segmentation: "Market segmentation showing which parts of the market are serviceable"}}
- {{geographicScope: "Geographic reach and expansion potential over time"}}

Structure in professional Markdown with market segmentation, reach assumptions, and expansion timeline.
  `,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

قدّر السوق المتاح القابل للخدمة (SAM) لسوقك المستهدف ({{tam}}). وصف مدى الوصول الواقعي.

قدم:
- {{sam: "قيمة السوق المتاح القابل للخدمة بالدولار تمثل مدى الوصول الواقعي للسوق"}}
- {{reachRationale: "السبب لنسبة الوصول إلى السوق بناءً على عوامل ملاءمة المنتج للسوق"}}
- {{segmentation: "تقسيم السوق يظهر أي أجزاء من السوق قابلة للخدمة"}}
- {{geographicScope: "الوصول الجغرافي وإمكانية التوسعة بمرور الوقت"}}

هيكلة في Markdown احترافي مع تقسيم السوق، افتراضات الوصول، وجدول التوسعة.
  `
  },
  validate: (context) => {
    const issues = [];
    if (!context.sam) issues.push('Missing SAM value');
    if (parseFloat(context.sam) > parseFloat(context.tam)) {
      issues.push('SAM cannot be larger than TAM');
    }
    return { valid: issues.length === 0, issues };
  },
};