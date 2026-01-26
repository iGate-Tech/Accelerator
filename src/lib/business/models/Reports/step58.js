import { generationPromptTemplateWithProblem } from '../../templates.js';

export const step58 = {
  id: "step58",
  name: {
    en: "Business Plan Generation",
    ar: "توليد خطة العمل"
  },
  model: {
    en: "Business Plan Report",
    ar: "تقرير خطة العمل"
  },
  promptTemplate: generationPromptTemplateWithProblem,
  variables: ["solution", "market", "tam", "sam", "som", "trends", "coreFeatures", "modelType", "revenue", "pricing", "competitors", "differentiation", "year1", "year2", "year3", "ask", "team"],
  detailedPrompt: {
    en: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Create a comprehensive, professional BUSINESS PLAN in markdown format suitable for investors, partners, and internal use. Structure with the following sections:

# EXECUTIVE SUMMARY
Write a 1-page overview covering:
- Company mission and vision
- Problem being solved: ${'{{solution}}'}
- Business model: ${'{{modelType}}'}
- Market opportunity: ${'{{tam}}'} TAM, ${'{{sam}}'} SAM, ${'{{som}}'} SOM
- Competitive advantage: ${'{{differentiation}}'}
- Traction and key metrics
- Funding request and use of proceeds
- Key milestones and timeline

# COMPANY DESCRIPTION
## Business Concept
Describe your startup and what makes it unique.

## Mission Statement
Company mission and core values.

## Vision
Long-term vision for the company.

## Legal Structure
Current or planned legal entity structure.

# MARKET ANALYSIS
## Industry Overview
${'{{market}}'} market context and industry dynamics.

## Market Size and Growth
- Total Addressable Market (TAM): ${'{{tam}}'}
- Serviceable Available Market (SAM): ${'{{sam}}'}
- Serviceable Obtainable Market (SOM): ${'{{som}}'}

## Market Trends
${'{{trends}}'} - Key trends shaping the market.

## Target Customer Segments
Define your ideal customers and their characteristics.

## Market Entry Strategy
How you will enter and capture market share.

# PRODUCTS AND SERVICES
## Solution Overview
${'{{solution}}'} - Detailed description of your offering.

## Core Product/Service Features
${'{{coreFeatures}}'}

## Technology and Innovation
Proprietary technology, algorithms, or methods.

## Product Roadmap
Future product development plans.

## Competitive Advantages
${'{{differentiation}}'}

# MARKETING AND SALES STRATEGY
## Marketing Strategy
How you will reach and acquire customers.

## Sales Strategy
Sales process and methodology.

## Pricing Strategy
${'{{pricing}}'} - Pricing model and rationale.

## Revenue Model
${'{{revenue}}'} - How the business makes money.

## Customer Acquisition Strategy
Channels and tactics for customer acquisition.

## Customer Retention Strategy
How you will keep customers and increase lifetime value.

# COMPETITIVE ANALYSIS
## Competitive Landscape
${'{{competitors}}'}

## Competitive Positioning
Where you fit in the competitive landscape.

## Competitive Advantages
${'{{differentiation}}'}

## Barriers to Entry
What protects your business from competition.

# OPERATIONS
## Business Model
${'{{modelType}}'}

## Key Partnerships
Strategic partnerships and alliances.

## Supply Chain
If applicable, your supply chain strategy.

## Technology Infrastructure
Systems and technology supporting operations.

## Quality Assurance
How you ensure quality.

# MANAGEMENT AND ORGANIZATION
## Organizational Structure
Current and planned organization structure.

## Management Team
${'{{team}}'}

## Key Personnel
Critical hires and roles needed.

## Board of Advisors
Advisory board composition.

## Human Resources Strategy
Talent acquisition and retention strategy.

# FINANCIAL PLAN
## Financial Projections Summary
Overview of 3-year financial outlook.

## Year 1 Projections
${'{{year1}}'}

## Year 2 Projections
${'{{year2}}'}

## Year 3 Projections
${'{{year3}}'}

## Revenue Projections
Breakdown by revenue stream.

## Expense Projections
Operating expenses breakdown.

## Cash Flow Analysis
Cash flow projections and management.

## Break-even Analysis
When the business will become profitable.

## Key Assumptions
Financial assumptions underlying projections.

# FUNDING REQUEST
## Funding Requirements
${'{{ask}}'}

## Use of Funds
${'{{allocation}}'}

## Financial Projections with Funding
How funding accelerates growth.

## Exit Strategy
Potential exit scenarios (acquisition, IPO, etc.).

# RISK ANALYSIS
## Key Business Risks
Identify major risks facing the business.

## Risk Mitigation Strategies
How you will address each risk.

## Contingency Plans
Backup plans if things don't go as expected.

# IMPLEMENTATION TIMELINE
## Milestones
Key milestones for next 12-24 months.

## Critical Success Factors
What needs to go right for success.

## Metrics for Success
Key performance indicators.

---
Format with professional H1/H2/H3 headings, tables for financial data, bullet points for readability, and comprehensive detail. The business plan should be comprehensive (15-25 pages equivalent) and investor-ready.

Return plain markdown without wrapping the entire response in code fences or triple backticks.

`,
    ar: `
المشكلة التي يتم حلها هي: {{problem}}

يجب أن يكون ردك متعلقًا بـ {{problem}}. لا تناقش مواضيع غير مرتبطة.

أنشئ خطة عمل شاملة واحترافية BUSINESS PLAN بتنسيق markdown مناسبة للمستثمرين والشركاء والاستخدام الداخلي. هيكلها مع الأقسام التالية:

# ملخص تنفيذي
اكتب نظرة عامة بصفحة واحدة تغطي:
- مهمة الشركة ورؤيتها
- المشكلة التي تُحل: ${'{{solution}}'}
- نموذج العمل: ${'{{modelType}}'}
- فرصة السوق: ${'{{tam}}'} TAM، ${'{{sam}}'} SAM، ${'{{som}}'} SOM
- الميزة التنافسية: ${'{{differentiation}}'}
- التقدم والمقاييس الأساسية
- طلب التمويل واستخدام العائدات
- الإنجازات الأساسية والجدول الزمني

# وصف الشركة
## مفهوم العمل
صِف شركتك الناشئة وما يجعلها فريدة.

## بيان المهمة
مهمة الشركة وقيمها الأساسية.

## الرؤية
الرؤية طويلة المدى للشركة.

## البنية القانونية
الكيان القانوني الحالي أو المخطط له.

# تحليل السوق
## نظرة عامة على الصناعة
${'{{market}}'} سياق السوق وديناميكيات الصناعة.

## حجم السوق والنمو
- السوق الكلي القابل للعنونة (TAM): ${'{{tam}}'}
- السوق المتاح القابل للخدمة (SAM): ${'{{sam}}'}
- السوق القابل للحصول (SOM): ${'{{som}}'}

## اتجاهات السوق
${'{{trends}}'} - الاتجاهات الأساسية التي تشكّل السوق.

## شرائح العملاء المستهدفة
عرّف عملاءك المثاليين وخصائصهم.

## استراتيجية دخول السوق
كيف ستقوم بدخول السوق واحتلال حصة.

# المنتجات والخدمات
## نظرة عامة على الحل
${'{{solution}}'} - وصف مفصل لعرضك.

## ميزات المنتج/الخدمة الأساسية
${'{{coreFeatures}}'}

## التكنولوجيا والابتكار
التكنولوجيا، الخوارزميات، أو الطرق الحصرية.

## خارطة طريق المنتج
خطط تطوير المنتج المستقبلية.

## المزايا التنافسية
${'{{differentiation}}'}

# استراتيجية التسويق والمبيعات
## استراتيجية التسويق
كيف ستصل إلى العملاء وتحصل عليهم.

## استراتيجية المبيعات
عملية المبيعات و منهجية العمل.

## استراتيجية التسعير
${'{{pricing}}'} - نموذج التسعير والسبب.

## نموذج الإيرادات
${'{{revenue}}'} - كيف تربح الشركة المال.

## استراتيجية اقتناء العملاء
القنوات والتكتيكات لاقتناء العملاء.

## استراتيجية احتفاظ العملاء
كيف ستحتفظ بالعملاء وترفع قيمة العمر.

# تحليل المنافسة
## مشهد المنافسة
${'{{competitors}}'}

## وضعية المنافسة
أين تندرج في مشهد المنافسة.

## المزايا التنافسية
${'{{differentiation}}'}

## حواجز الدخول
ما الذي يحمي عملك من المنافسة.

# العمليات
## نموذج العمل
${'{{modelType}}'}

## الشراكات الأساسية
الشراكات الاستراتيجية والتحالفات.

## سلسلة التوريد
إن أمكن، استراتيجية سلسلة التوريد.

## بنية التكنولوجيا
الأنظمة والتكنولوجيا التي تدعم العمليات.

## ضمان الجودة
كيف تضمن الجودة.

# الإدارة والتنظيم
## هيكل التنظيم
الهيكل التنظيمي الحالي والمخطط له.

## فريق الإدارة
${'{{team}}'}

## الموظفون الأساسيون
التعيينات الأساسية والأدوار المطلوبة.

## مجلس المستشارين
تكوين مجلس المستشارين.

## استراتيجية الموارد البشرية
استراتيجية اقتناء واحتفاظ المواهب.

# الخطة المالية
## ملخص التوقعات المالية
نظرة عامة على توقعات 3 سنوات.

## توقعات السنة 1
${'{{year1}}'}

## توقعات السنة 2
${'{{year2}}'}

## توقعات السنة 3
${'{{year3}}'}

## توقعات الإيرادات
تفصيل حسب مصدر الدخل.

## توقعات المصروفات
تفصيل المصروفات التشغيلية.

## تحليل التدفق النقدي
توقعات التدفق النقدي وإدارته.

## تحليل نقطة التعادل
متى تصبح الشركة رابحة.

## الافتراضات الأساسية
الافتراضات المالية التي ترتكز عليها التوقعات.

# طلب التمويل
## متطلبات التمويل
${'{{ask}}'}

## استخدام الأموال
${'{{allocation}}'}

## التوقعات المالية مع التمويل
كيف يسرع التمويل من النمو.

## استراتيجية الخروج
سيناريوهات الخروج المحتملة (الاستحواذ، الطرح الأولي، إلخ.).

# تحليل المخاطر
## مخاطر العمل الأساسية
حدد المخاطر الكبرى التي تواجه العمل.

## استراتيجيات تخفيف المخاطر
كيف ستتعامل مع كل مخاطرة.

## خطط الطوارئ
خطط بديلة إذا لم تسر الأمور كما هو متوقع.

# الجدول الزمني للتنفيذ
## الإنجازات
الإنجازات الأساسية لـ 12-24 شهر القادمة.

## عوامل النجاح الأساسية
ما يجب أن يسير بشكل صحيح للنجاح.

## مقاييس النجاح
مؤشرات الأداء الأساسية.

---
التنسيق مع عناوين H1/H2/H3 الاحترافية، الجداول لبيانات المالية، النقاط لسهولة القراءة، والتفاصيل الشاملة. يجب أن تكون خطة العمل شاملة (15-25 صفحة معادلة) وجاهزة للمستثمر.

أعد markdown العادي دون لف الرد بالكامل في أطر أو علامات triple backticks.
`
  },
  validate: (context) => ({ valid: true, issues: [] }),
};
