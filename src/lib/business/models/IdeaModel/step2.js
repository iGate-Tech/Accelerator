import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step2 = {
  id: "step2",
  name: {
    en: "Problem Analysis",
    ar: "تحليل المشكلة"
  },
  model: {
    en: "Idea Model",
    ar: "نموذج الفكرة"
  },
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.

Analyze the specific problem: {{problem}}.

Provide:
- {{strugglers: "Who suffers from {{problem}}, including demographics, industries, and specific examples"}}
- {{impactScale: "Quantitative scale of {{problem}}'s impact - affected population, economic losses, market disruption"}}
- {{evidence: "Data sources, studies, or real-world examples validating {{problem}}"}}
Structure in professional Markdown with clear sections and bullet points.
All content must relate to {{problem}}.
`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

حلل المشكلة المحددة: {{problem}}.

قدم:
- {{strugglers: "من يعاني من {{problem}}، بما في ذلك التركيبة السكانية والصناعات وأمثلة محددة"}}
- {{impactScale: "مقياس كمي لتأثير {{problem}} - عدد السكان المتأثرين، الخسائر الاقتصادية، اضطراب السوق"}}
- {{evidence: "مصادر البيانات أو الدراسات أو الأمثلة الواقعية التي تؤكد صحة {{problem}}"}}
هيكلة في Markdown احترافي بأقسام واضحة ونقاط محددة.
يجب أن يرتبط كل المحتوى بـ {{problem}}.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};
