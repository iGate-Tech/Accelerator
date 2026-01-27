// Ultra-simplified business layer - Single File Solution

// Ultra-simplified template function for context dashboard
export const standardPromptTemplateWithProblem = (detailedPrompt, problemStatement, context = '', lang = 'en') => {
  // Handle bilingual prompts
  let promptContent = detailedPrompt;
  if (detailedPrompt && typeof detailedPrompt === 'object') {
    promptContent = detailedPrompt[lang] || detailedPrompt['en'] || '';
  }

  // Define templates for both languages
  const templates = {
    en: {
      contextDashboard: 'CONTEXT DASHBOARD:',
      problemStatement: 'PROBLEM STATEMENT:',
      task: 'TASK:',
      outputGuidelines: 'OUTPUT GUIDELINES:',
      noContext: 'No project context available',
      noProblem: 'No problem statement defined',
      highlightInfo: 'Highlight important information using ==double equals== syntax (e.g., ==important info==)',
      respondDirectly: 'Respond directly to the task based on the context provided'
    },
    ar: {
      contextDashboard: 'لوحة معلومات السياق:',
      problemStatement: 'بيان المشكلة:',
      task: 'المهمة:',
      outputGuidelines: 'إرشادات الإخراج:',
      noContext: 'لا يوجد سياق مشروع متاح',
      noProblem: 'لم يتم تعريف بيان المشكلة',
      highlightInfo: 'قم بتظليل المعلومات المهمة باستخدام صيغة ==مساوٍ مزدوج== (مثلاً، ==معلومات مهمة==)',
      respondDirectly: 'أجب مباشرة على المهمة بناءً على السياق المتوفر'
    }
  };

  const template = templates[lang] || templates.en;

  return `
${template.contextDashboard}
${context || template.noContext}

${template.problemStatement}
${problemStatement || template.noProblem}

${template.task}
${promptContent}

${template.outputGuidelines}
- ${template.highlightInfo}
- ${template.respondDirectly}
`;
};

// Consolidated steps array - ALL steps in one place
export const steps = [
  // System Steps (1 step)
  { id: "system", model: "System", modelAr: "النظام", name: "System Initialization", nameAr: "تهيئة النظام", en: "Welcome to iGate Accelerator! Acknowledge the user's problem and guide them to the next step.", ar: "مرحبًا بك في مسرع iGate! اعترف بمشكلة المستخدم ووجههم إلى الخطوة التالية." },

  // Idea Model Steps (9 steps)
  { id: "step2", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Problem Analysis", nameAr: "تحليل المشكلة", en: "Analyze the problem: Who suffers from it, what is the impact scale, and what evidence validates it?", ar: "حلل المشكلة: من يعاني منها، ما هو مقياس تأثيرها، وما هي الأدلة التي تؤكدها؟" },
  { id: "step3", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Severity Assessment", nameAr: "تقييم الحدة", en: "Evaluate the severity and frequency of the problem: What is the severity level, how often does it occur, what are the consequences, and how does it compare to similar problems?", ar: "قيّم شدة وتكرار المشكلة: ما هو مستوى الشدة، ما مدى تكرار حدوثها، ما النتائج، وكيف تقارن بمشاكل مشابهة؟" },
  { id: "step4", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Current Solutions", nameAr: "الحلول الحالية", en: "Identify and analyze current solutions: What are the alternatives, adoption rates, and pros/cons of each solution?", ar: "حدد وحلل الحلول الحالية: ما هي البدائل، ومعدلات التبني، والإيجابيات والسلبيات لكل حل؟" },
  { id: "step5", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Solution Gaps", nameAr: "فجوات الحل", en: "Analyze why current solutions fail to adequately address the problem: What are the specific gaps, quantified impact, and user feedback?", ar: "حلل لماذا تfails الحلول الحالية في معالجة المشكلة بشكل كافٍ: ما هي الفجوات المحددة، الأثر الكمي، وملاحظات المستخدمين؟" },
  { id: "step6", model: "Idea Model", modelAr: "نموذج الفكرة", name: "User Persona", nameAr: "شخصية المستخدم", en: "Develop a detailed user persona for someone suffering from the problem: What are their demographics, workflow, and decision process?", ar: "طور شخصية مستخدم مفصلة لشخص يعاني من المشكلة: ما هي خصائصهم الديموغرافية، سير العمل، وعملية اتخاذ القرار؟" },
  { id: "step7", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Urgency Assessment", nameAr: "تقييم الحاحية", en: "Assess the urgency to solve the problem: Is it a must-have or nice-to-have, what are the consequences, and provide real-world examples?", ar: "قيّم الضرورة الملحة لحل المشكلة: هل هي ضرورية أم اختيارية، ما هي النتائج، وأعط أمثلة واقعية؟" },
  { id: "step8", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Problem Validation", nameAr: "التحقق من صحة المشكلة", en: "Gather and validate comprehensive evidence for the problem: What is the quantitative and qualitative evidence, reliable sources, and support analysis?", ar: "اجمع وحقق من الأدلة الشاملة للمشكلة: ما هي الأدلة الكمية والنوعية، المصادر الموثوقة، وتحليل الدعم؟" },
  { id: "step8b", model: "Idea Model", modelAr: "نموذج الفكرة", name: "Traction Definition", nameAr: "تعريف الزخم", en: "Define traction for the problem: What metrics would indicate early traction?", ar: "عرّف الزخم للمشكلة: ما هي المعايير التي تشير إلى زخم مبكر؟" },

  // Business Model Steps (8 steps)
  { id: "step9", model: "Business Model", modelAr: "نموذج العمل", name: "Solution Design", nameAr: "تصميم الحل", en: "Design a solution for the problem: What is the solution, core features, addressed gaps, differentiation, and business model type?", ar: "صمم حلاً للمشكلة: ما هو الحل، الميزات الأساسية، الفجوات المعالجة، التمايز، ونوع نموذج العمل؟" },
  { id: "step10", model: "Business Model", modelAr: "نموذج العمل", name: "Value Proposition", nameAr: "قيمة الاقتراح", en: "Craft a compelling value proposition: What is the value proposition, unique benefits, quantified value, and target customers?", ar: "صيغ اقتراح قيمة مقنع: ما هو اقتراح القيمة، الفوائد الفريدة، القيمة الكمية، وعملاء الهدف؟" },
  { id: "step11", model: "Business Model", modelAr: "نموذج العمل", name: "Key Features", nameAr: "الميزات الأساسية", en: "List and detail key features of the solution: What are the features, customer benefits, and functionality?", ar: "سرد وتفصيل الميزات الأساسية للحل: ما هي الميزات، فوائد العملاء، والوظائف؟" },
  { id: "step12", model: "Business Model", modelAr: "نموذج العمل", name: "Business Model", nameAr: "نموذج العمل", en: "Determine the optimal business model: What is the model type, pros/cons, scalability, and feasibility?", ar: "حدد نموذج العمل الأمثل: ما هو نوع النموذج، الإيجابيات/السلبيات، قابلية التوسع، والجدوى؟" },
  { id: "step13", model: "Business Model", modelAr: "نموذج العمل", name: "Revenue Streams", nameAr: "مصاريف الإيرادات", en: "Design revenue streams for the solution: What are the revenue streams, pricing tiers, monetization potential, and customer willingness to pay?", ar: "صمم مصاريف الإيرادات للحل: ما هي مصادر الدخل، مستويات التسعير، إمكانية تحقيق الدخل، واستعداد العميل للدفع؟" },
  { id: "step14", model: "Business Model", modelAr: "نموذج العمل", name: "Pricing Strategy", nameAr: "استراتيجية التسعير", en: "Develop a comprehensive pricing strategy: What is the pricing approach, tiers, logic, and customer acceptance?", ar: "طور استراتيجية تسعير شاملة: ما هو نهج التسعير، المستويات، المنطق، وقبول العميل؟" },
  { id: "step15", model: "Business Model", modelAr: "نموذج العمل", name: "Competitive Moats", nameAr: "الحواجز التنافسية", en: "Build and analyze competitive moats for the solution: What are the key moats, implementation strategies, examples, and sustainability?", ar: "بناء وتحليل الحواجز التنافسية للحل: ما هي الحواجز الأساسية، استراتيجيات التنفيذ، الأمثلة، والاستدامة؟" },
  { id: "step16", model: "Business Model", modelAr: "نموذج العمل", name: "Risk Analysis", nameAr: "تحليل المخاطر", en: "Conduct a thorough risk analysis for the solution: What are the key assumptions and major risks with mitigation strategies?", ar: "conducting تحليل شامل للمخاطر للحل: ما هي الافتراضات الأساسية والمخاطر الرئيسية مع استراتيجيات التخفيف؟" },

  // Marketing Model Steps (10 steps)
  { id: "step25", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Target Market", nameAr: "السوق المستهدف", en: "Define the target market: What is the target industry, customer segments, market size, and ideal customer profile?", ar: "عرّف السوق المستهدف: ما هي الصناعة المستهدفة، شرائح العملاء، حجم السوق، وملف العميل المثالي؟" },
  { id: "step26", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Total Addressable Market", nameAr: "إجمالي السوق القابل للتحقيق", en: "Calculate the Total Addressable Market: What is the market size, segmentation, and growth projections?", ar: "احسب إجمالي السوق القابل للتحقيق: ما هو حجم السوق، تجزئة السوق، و projections النمو؟" },
  { id: "step27", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Serviceable Addressable Market", nameAr: "السوق القابل للخدمة القابل للتحقيق", en: "Calculate the Serviceable Addressable Market: What is the addressable portion, geographic focus, and service capabilities?", ar: "احسب السوق القابل للخدمة القابل للتحقيق: ما هو الجزء القابل للتحقيق، التركيز الجغرافي، وقدرات الخدمة؟" },
  { id: "step28", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Serviceable Obtainable Market", nameAr: "السوق القابل للخدمة القابل للتحصيل", en: "Calculate the Serviceable Obtainable Market: What is the realistic market share, competitive positioning, and capture strategy?", ar: "احسب السوق القابل للخدمة القابل للتحصيل: ما هو حصة السوق الواقعية، وضع المنافسة، واستراتيجية الالتقاط؟" },
  { id: "step29", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Market Trends", nameAr: "اتجاهات السوق", en: "Analyze market trends: What are the key trends, drivers, and implications for the business?", ar: "حلل اتجاهات السوق: ما هي الاتجاهات الأساسية، المحركات، والآثار على العمل؟" },
  { id: "step30", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Competitive Landscape", nameAr: "المنافسة في السوق", en: "Analyze the competitive landscape: Who are the main competitors, their strengths/weaknesses, and positioning?", ar: "حلل منافسة السوق: من هم المنافسون الرئيسيون، نقاط القوة/الضعف، والوضع؟" },
  { id: "step31", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Market Entry", nameAr: "دخول السوق", en: "Plan market entry: What is the entry strategy, timing, and initial positioning?", ar: "خطط لدخول السوق: ما هي استراتيجية الدخول، التوقيت، والوضع الأولي؟" },
  { id: "step32", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Customer Acquisition", nameAr: "اكتساب العملاء", en: "Plan customer acquisition: What are the channels, costs, and strategies for acquiring customers?", ar: "خطط لاختصاص العملاء: ما هي القنوات، التكاليف، واستراتيجيات اقتناء العملاء؟" },
  { id: "step33", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Sales Strategy", nameAr: "استراتيجية المبيعات", en: "Define sales strategy: What is the sales model, process, and channel strategy?", ar: "عرّف استراتيجية المبيعات: ما هو نموذج المبيعات، العملية، و استراتيجية القناة؟" },
  { id: "step34", model: "Marketing Model", modelAr: "نموذج التسويق", name: "Retention Strategy", nameAr: "استراتيجية الاحتفاظ", en: "Plan retention strategy: What are the tactics, metrics, and approaches to retain customers?", ar: "خطط لاستراتيجية الاحتفاظ: ما هي الأساليب، المقاييس، والمقاربات للاحتفاظ بالعملاء؟" },

  // Technical Model Steps (10 steps)
  { id: "step17", model: "Technical Model", modelAr: "النموذج الفني", name: "Technical Architecture", nameAr: "الهندسة التقنية", en: "Design the technical architecture for the solution: What is the tech stack, architecture, design patterns, and scalability approach?", ar: "صمم البنية التقنية للحل: ما هو تكد التكنولوجيا، البنية، أنماط التصميم، ونهج القابلية للتوسع؟" },
  { id: "step18", model: "Technical Model", modelAr: "النموذج الفني", name: "MVP Definition", nameAr: "تعريف MVP", en: "Define the Minimum Viable Product: What are the core features, scope, and prioritization?", ar: "عرّف المنتج الأدنى القابل للتطبيق: ما هي الميزات الأساسية، النطاق، والأولوية؟" },
  { id: "step19", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Infrastructure & Hosting", nameAr: "البنية التحتية والاستضافة", en: "Plan infrastructure and hosting: What is the cloud provider, hosting strategy, CDN approach, and estimated cost?", ar: "خطط للبنية التحتية والاستضافة: ما هو موفر السحابة، استراتيجية الاستضافة، نهج CDN، والتكلفة المقدرة؟" },
  { id: "step20", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Security Architecture", nameAr: "هندسة الأمان", en: "Design security architecture: What is the authentication strategy, encryption approach, compliance requirements, and security measures?", ar: "صمم بنية الأمان: ما هي استراتيجية المصادقة، نهج التشفير، متطلبات الامتثال، وتدابير الأمان؟" },
  { id: "step21", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Data Architecture", nameAr: "هندسة البيانات", en: "Plan data architecture: What is the database design, data flow, analytics pipeline, and storage strategy?", ar: "خطط لبنية البيانات: ما هو تصميم قاعدة البيانات، تدفق البيانات، خط أنابيب التحليلات، واستراتيجية التخزين؟" },
  { id: "step22", model: "Technical Model", modelAr: "نموذج الفكرة", name: "API & Integrations", nameAr: "API والتكاملات", en: "Design API strategy: What is the API architecture, integrations strategy, webhook design, and partnership opportunities?", ar: "صمم استراتيجية API: ما هي بنية API، استراتيجية التكامل، تصميم webhook، وفرص الشراكات؟" },
  { id: "step23", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Development Workflow", nameAr: "سير عمل التطوير", en: "Establish development workflow: What is the CI/CD pipeline, testing strategy, deployment process, and monitoring approach?", ar: "أنشئ سير العمل للتطوير: ما هو خط أنابيب CI/CD، استراتيجية الاختبار، عملية النشر، ونهج المراقبة؟" },
  { id: "step24", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Technical Roadmap", nameAr: "خارطة الطريق التقنية", en: "Create technical roadmap: What are the key milestones, resources needed, technical risks, and timeline phases?", ar: "أنشئ خارطة الطريق التقنية: ما هي الإنجازات الأساسية، الموارد المطلوبة، المخاطر التقنية، ومراحل الجدول الزمني؟" },
  { id: "step24b", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Timeline Definition", nameAr: "تعريف الجدول الزمني", en: "Define the project timeline: What is the comprehensive timeline, project plan, and development phases breakdown?", ar: "عرّف الجدول الزمني للمشروع: ما هو الجدول الزمني الشامل، خطة المشروع، وتقسيم مراحل التطوير؟" },
  { id: "step24c", model: "Technical Model", modelAr: "نموذج الفكرة", name: "Integrations Definition", nameAr: "تعريف التكاملات", en: "Define the integrations strategy: What is the comprehensive integrations strategy, implementation plan, and partnership opportunities?", ar: "عرّف استراتيجية التكامل: ما هي استراتيجية التكامل الشاملة، خطة التنفيذ، وفرص الشراكات؟" },

  // Financial Model Steps (6 steps)
  { id: "step35", model: "Financial Model", modelAr: "النموذج المالي", name: "Revenue Streams", nameAr: "مصاريف الإيرادات", en: "Define revenue streams: What are the primary and secondary revenue sources?", ar: "عرّف مصاريف الإيرادات: ما هي مصادر الإيرادات الأساسية والثانوية؟" },
  { id: "step36", model: "Financial Model", modelAr: "النموذج المالي", name: "Unit Economics", nameAr: "الاقتصاد وحدة", en: "Analyze unit economics: What are the key metrics like LTV, CAC, gross margins, and payback period?", ar: "حلل اقتصاد الوحدة: ما هي المقاييس الأساسية مثل LTV، CAC، الهوامش الإجمالية، وفترة الاسترداد؟" },
  { id: "step37", model: "Financial Model", modelAr: "النموذج المالي", name: "Cost Structure", nameAr: "هيكل التكلفة", en: "Define cost structure: What are the fixed and variable costs, and cost drivers?", ar: "عرّف هيكل التكلفة: ما هي التكاليف الثابتة والمتغيرة، ومحركات التكلفة؟" },
  { id: "step38", model: "Financial Model", modelAr: "النموذج المالي", name: "Financial Projections", nameAr: "ال projections المالية", en: "Create financial projections: What are the revenue, expense, and profit forecasts for the next 3-5 years?", ar: "أنشئ projections مالية: ما هي توقعات الإيرادات، المصاريف، والأرباح للسنوات 3-5 القادمة؟" },
  { id: "step39", model: "Financial Model", modelAr: "النموذج المالي", name: "Burn Rate Analysis", nameAr: "تحليل معدل الاحتراق", en: "Analyze burn rate: What is the monthly burn rate, runway, and cash flow projections?", ar: "حلل معدل الاحتراق: ما هو معدل الاحتراق الشهري، مدة الجري، و projections التدفق النقدي؟" },
  { id: "step40", model: "Financial Model", modelAr: "النموذج المالي", name: "Break-even Analysis", nameAr: "تحليل نقطة التعادل", en: "Perform break-even analysis: What is the break-even point, volume needed, and key assumptions?", ar: "نفّذ تحليل نقطة التعادل: ما هي نقطة التعادل، الحجم المطلوب، والافتراضات الأساسية؟" },

  // Team Model Steps (3 steps)
  { id: "step49", model: "Team Model", modelAr: "نموذج الفريق", name: "Founding Team", nameAr: "فريق المؤسسين", en: "Define founding team: What are the key roles, skills, and responsibilities needed?", ar: "عرّف فريق المؤسسين: ما هي الأدوار الأساسية، المهارات، والمسؤوليات المطلوبة؟" },
  { id: "step50", model: "Team Model", modelAr: "نموذج الفريق", name: "Team Gaps", nameAr: "الفجوات في الفريق", en: "Identify team gaps: What are the critical skill gaps and hiring priorities?", ar: "حدد الفجوات في الفريق: ما هي الفجوات الحرجة في المهارات وأولويات التوظيف؟" },
  { id: "step51", model: "Team Model", modelAr: "نموذج الفريق", name: "Hiring Plan", nameAr: "خطة التوظيف", en: "Create hiring plan: What is the hiring timeline, roles, and recruitment strategy?", ar: "أنشئ خطة التوظيف: ما هو الجدول الزمني للتوظيف، الأدوار، واستراتيجية الاستقطاب؟" },

  // Legal Model Steps (5 steps)
  { id: "step52", model: "Legal Model", modelAr: "النموذج القانوني", name: "Governance Structure", nameAr: "هيكل الحوكمة", en: "Define governance structure: What is the corporate structure, board composition, and decision-making process?", ar: "عرّف هيكل الحوكمة: ما هو هيكل الشركة، تكوين المجلس، وعملية اتخاذ القرار؟" },
  { id: "step53", model: "Legal Model", modelAr: "النموذج القانوني", name: "Legal Structure", nameAr: "الهيكل القانوني", en: "Define legal structure: What is the business entity type, jurisdiction, and legal setup?", ar: "عرّف الهيكل القانوني: ما هو نوع كيان العمل، الولاية القضائية، وإعدادات القانون؟" },
  { id: "step54", model: "Legal Model", modelAr: "النموذج القانوني", name: "IP Protection", nameAr: "حماية الملكية الفكرية", en: "Plan IP protection: What are the patents, trademarks, copyrights, and trade secrets to protect?", ar: "خطط لحماية الملكية الفكرية: ما هي براءات الاختراع، العلامات التجارية، حقوق الملكية، والأسرار التجارية لحمايتها؟" },
  { id: "step55", model: "Legal Model", modelAr: "النموذج القانوني", name: "Compliance Requirements", nameAr: "متطلبات الامتثال", en: "Identify compliance requirements: What are the regulatory, tax, and industry compliance needs?", ar: "حدد متطلبات الامتثال: ما هي احتياجات الامتثال التنظيمي، الضريبي، والصناعي؟" },
  { id: "step56", model: "Legal Model", modelAr: "النموذج القانوني", name: "Risk Assessment", nameAr: "تقييم المخاطر", en: "Conduct legal risk assessment: What are the key legal risks and mitigation strategies?", ar: "نفّذ تقييم مخاطر قانوني: ما هي المخاطر القانونية الأساسية واستراتيجيات التخفيف؟" },

  // Funding Model Steps (8 steps)
  { id: "step41", model: "Funding Model", modelAr: "نموذج التمويل", name: "Funding Readiness", nameAr: "جاهزية التمويل", en: "Assess funding readiness: What are the key factors indicating readiness for fundraising?", ar: "قيّم جاهزية التمويل: ما هي العوامل الأساسية التي تشير إلى الجاهزية لجمع التمويل؟" },
  { id: "step42", model: "Funding Model", modelAr: "نموذج التمويل", name: "Valuation Analysis", nameAr: "تحليل التقييم", en: "Analyze valuation: What is the company valuation, methodology, and comparable analysis?", ar: "حلل التقييم: ما هو تقييم الشركة، منهجية التقييم، وتحليل المقارنة؟" },
  { id: "step43", model: "Funding Model", modelAr: "نموذج التمويل", name: "Funding Stage", nameAr: "مرحلة التمويل", en: "Determine funding stage: What is the appropriate funding stage and investment amount needed?", ar: "حدد مرحلة التمويل: ما هي مرحلة التمويل المناسبة ومبلغ الاستثمار المطلوب؟" },
  { id: "step44", model: "Funding Model", modelAr: "نموذج التمويل", name: "Funding Amount", nameAr: "مبلغ التمويل", en: "Determine funding amount: What is the optimal funding amount and use of funds allocation?", ar: "حدد مبلغ التمويل: ما هو مبلغ التمويل الأمثل وتخصيص استخدام الأموال؟" },
  { id: "step45", model: "Funding Model", modelAr: "نموذج التمويل", name: "Use of Funds", nameAr: "استخدام الأموال", en: "Plan use of funds: How should the raised capital be allocated across different business areas?", ar: "خطط لاستخدام الأموال: كيف يجب تخصيص رأس المال المُجمع عبر مختلف مجالات العمل؟" },
  { id: "step46", model: "Funding Model", modelAr: "نموذج التمويل", name: "Pre-money Valuation", nameAr: "التقييم قبل الاستثمار", en: "Determine pre-money valuation: What is the pre-money valuation and supporting rationale?", ar: "حدد التقييم قبل الاستثمار: ما هو التقييم قبل الاستثمار والسبب الداعم؟" },
  { id: "step47", model: "Funding Model", modelAr: "نموذج التمويل", name: "Target Investors", nameAr: "المستثمرون المستهدفون", en: "Identify target investors: Who are the ideal investors and what are their investment criteria?", ar: "حدد المستثمرين المستهدفين: من هم المستثمرون المثاليون وما هي معايير استثمارهم؟" },
  { id: "step48", model: "Funding Model", modelAr: "نموذج التمويل", name: "Funding Milestones", nameAr: "إنجازات التمويل", en: "Define funding milestones: What are the key milestones and metrics to achieve for next funding round?", ar: "عرّف إنجازات التمويل: ما هي الإنجازات الأساسية والمقاييس لتحقيقها لجولة التمويل التالية؟" },

  // Pitch Deck Model Steps (1 step)
  { id: "step57", model: "Pitch Deck Model", modelAr: "نموذج العرض التقديمي", name: "Pitch Deck Generation", nameAr: "توليد العرض التقديمي", en: "Generate a comprehensive investor pitch deck with detailed slides covering: cover slide with company name, logo, tagline and contact info; problem slide with clear pain points and market size; solution slide with product overview and key benefits; business model slide with revenue streams and pricing; market opportunity slide with TAM, SAM, SOM analysis; competitive analysis slide with positioning matrix; traction slide with key metrics and milestones; team slide with founder backgrounds and key hires; financial projections slide with 5-year forecast; funding requirements slide with use of funds breakdown. Include specific slide templates, speaker notes, and design recommendations. Format as structured markdown with ==key highlights==.", ar: "ولّد عرض تقديمي شامل للمستثمرين يتضمن شرائح مفصلة تغطي: شريحة الغلاف تحتوي اسم الشركة والشعار وشعار الترويج ومعلومات الاتصال؛ شريحة المشكلة توضح نقاط الألم بوضوح وحجم السوق؛ شريحة الحل تقدم نظرة عامة على المنتج والفوائد الأساسية؛ شريحة نموذج العمل توضح مصادر الدخل والتسعير؛ شريحة فرصة السوق تتضمن تحليل TAM وSAM وSOM؛ شريحة تحليل المنافسة مع مصفوفة التموقع؛ شريحة الزخم توضح المقاييس الأساسية والإنجازات المحققة؛ شريحة الفريق تشمل خلفيات المؤسسين والتوظيفات الأساسية؛ شريحة التوقعات المالية تتضمن توقعات خمسية للدخل والمصروفات والأرباح؛ شريحة متطلبات التمويل توضح توزيع استخدام الأموال. يتضمن قوالب الشرائح الجاهزة وملاحظات المتحدث وrecommendations التصميم. يُنسق كـ markdown منظم مع ==النقاط الأساسية==." },

  // Business Plan Model Steps (1 step)
  { id: "step58", model: "Business Plan Model", modelAr: "نموذج خطة العمل", name: "Business Plan Generation", nameAr: "توليد خطة العمل", en: "Generate a comprehensive business plan document with detailed sections covering: executive summary with mission, vision, objectives and key highlights; company description with history, ownership and legal structure; market analysis with industry overview, target segments, size, trends and growth projections; organization and management structure with roles, responsibilities and ownership; products and services with features, lifecycle, R&D and future offerings; marketing and sales strategy with positioning, pricing, promotion and distribution; funding request with amounts, terms, use of funds and exit strategy; financial projections with income statements, balance sheets, cash flow for 5 years; appendix with supporting documents, charts, licenses and permits. Format as structured markdown with ==key highlights==.", ar: "ولّد وثيقة خطة عمل شاملة ومفصلة تغطي: ملخص تنفيذي يتضمن البعثة والرؤية والأهداف والملاحظات الأساسية؛ وصف مفصل عن الشركة يتضمن التاريخ والملكية والهيكل القانوني؛ تحليل شامل للسوق يتضمن نظرة عامة على الصناعة وشرائح العملاء المستهدفة وحجم السوق والاتجاهات و projections النمو؛ هيكل تنظيمي وإداري مفصل يتضمن الأدوار والمسؤوليات وحقوق الملكية؛ قسم المنتجات والخدمات يتضمن الميزات ودورة حياة المنتج والبحث والتطوير والعروض المستقبلية؛ استراتيجية تسويق ومبيعات متكاملة تتضمن التموقع والأسعار والترويج والتوزيع؛ طلب تمويل مفصل يتضمن المبالغ والشروط وتفصيل استخدام الأموال واستراتيجية الخروج؛ توقعات مالية مفصلة تتضمن بيانات الأرباح والخسائر وقوائم المركز المالي وبيانات التدفق النقدي لخمس سنوات قادمة؛ مرفقات تتضمن الوثائق الداعمة والمخططات البيانية والتصاريح والlicenses. يُنسق كـ markdown منظم مع ==النقاط الأساسية==" },

  // Valuation Report Model Steps (1 step)
  { id: "step59", model: "Valuation Report Model", modelAr: "نموذج تقرير التقييم", name: "Valuation Report Generation", nameAr: "توليد تقرير التقييم", en: "Generate a comprehensive valuation report with detailed analysis covering: executive summary with company overview and key valuation conclusions; valuation overview with methodologies used, assumptions and limitations; business overview with operations, products, markets and competitive position; financial analysis with historical performance, ratios, trends and quality assessment; market approach with comparable company analysis, precedent transactions and market multiples; income approach with discounted cash flow analysis, terminal value calculations and sensitivity analysis; asset-based approach with book value, adjusted book value and liquidation value; valuation conclusion with range of values, key drivers and confidence levels; risk factors with market, credit, operational and regulatory risks; appendices with financial statements, calculations and market data. Format as structured markdown with ==key highlights==.", ar: "ولّد تقرير تقييم شامل بتحليل مفصل يغطي: ملخص تنفيذي مع نظرة عامة على الشركة واستنتاجات التقييم الأساسية؛ نظرة عامة على التقييم مع منهجيات المستخدمة، الافتراضات والقيود؛ نظرة عامة على الأعمال مع العمليات، المنتجات، الأسواق والموقف التنافسي؛ تحليل مالي مع الأداء التاريخي، النسب، الاتجاهات و تقييم الجودة؛ نهج السوق مع تحليل الشركات المماثلة، المعاملات السابقة و مضاعفات السوق؛ نهج الدخل مع تحليل التدفق النقدي المخصوم، حسابات القيمة الطرفية وتحليل الحساسية؛ نهج الأصول مع القيمة الدفترية، القيمة الدفترية المعدلة والقيمة التصفوية؛ استنتاج التقييم مع نطاق القيم، العوامل الأساسية ومستويات الثقة؛ عوامل المخاطرة مع مخاطر السوق، الائتمان، التشغيلية والتنظيمية؛ مرفقات ببيانات مالية، حسابات وبيانات السوق. يُنسق كـ markdown منظم مع ==ملاحظات هامة==" }
];

// Export step names as a function for localization
export const stepNames = (lang = 'en') => {
  const result = {};
  steps.forEach(step => {
    const key = step.id;
    let name;
    switch(lang) {
      case 'ar':
        name = step[`nameAr`] || step.name;
        break;
      default:
        name = step.name;
    }
    result[key] = name;
  });
  return result;
};

// Function to build prompts based on step data
export const buildPrompt = (stepId, contextData = {}) => {
  const step = steps.find(s => s.id === stepId);
  if (!step) {
    throw new Error(`Step with id ${stepId} not found`);
  }

  // Return the prompt in the appropriate language
  const lang = contextData.lang || 'en';
  const promptText = step[lang] || step.en || step.ar || '';

  // Apply context if problem statement is provided
  if (contextData.problem) {
    return standardPromptTemplateWithProblem(promptText, contextData.problem, contextData.context || '', lang);
  }

  return promptText;
};

// Function to get localized model name
export const getLocalizedModelName = (modelName, lang = 'en') => {
  // Special case for 'Welcome to iGate' which corresponds to the system model
  if (modelName === 'Welcome to iGate' || modelName === 'System') {
    return lang === 'ar' ? 'مرحبًا بك في iGate' : modelName;
  }

  // Find a step that matches the model name to get its localized version
  const step = steps.find(s =>
    (lang === 'ar' ? s.modelAr : s.model) === modelName ||
    s.model === modelName
  );

  if (step) {
    return lang === 'ar' && step.modelAr ? step.modelAr : step.model;
  }

  // If no matching step is found, return the original model name
  return modelName;
};

// Hook for creating step-specific functionality
export const createStepHook = (projectId, onStepChange) => {
  let currentStepIndex = 0;

  return {
    projectId,
    stepIndex: () => currentStepIndex,
    setStepIndex: (index) => {
      currentStepIndex = Math.max(0, Math.min(index, steps.length - 1));
      if (onStepChange) onStepChange(currentStepIndex);
    },
    currentStep: () => steps[currentStepIndex],
    stepName: (lang = 'en') => {
      const step = steps[currentStepIndex];
      return step[`name${lang === 'ar' ? 'Ar' : ''}`] || step.name || `Step ${currentStepIndex + 1}`;
    },
    stepModel: (lang = 'en') => {
      const step = steps[currentStepIndex];
      return step[`model${lang === 'ar' ? 'Ar' : ''}`] || step.model || 'General Model';
    },
    next: () => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        if (onStepChange) onStepChange(currentStepIndex);
      }
    },
    prev: () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        if (onStepChange) onStepChange(currentStepIndex);
      }
    },
    goToStep: (stepId) => {
      const index = steps.findIndex(step => step.id === stepId);
      if (index !== -1) {
        currentStepIndex = index;
        if (onStepChange) onStepChange(currentStepIndex);
      }
    },
    isLast: () => currentStepIndex === steps.length - 1,
    isFirst: () => currentStepIndex === 0,
    execute: async (data) => {
      console.log(`Executing step: ${steps[currentStepIndex].id}`, data);
      return data;
    },
    confirm: () => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        if (onStepChange) onStepChange(currentStepIndex);
      }
    },
    isComplete: () => currentStepIndex >= steps.length - 1,
    totalSteps: () => steps.length,
    persist: async (reason = 'manual') => {
      // In a real implementation, this would save the current step index to storage
      console.log(`Persisting step state: ${currentStepIndex} for project ${projectId} - ${reason}`);
    },
    refreshStepData: () => {
      // Placeholder for refreshing step data - implement as needed
      console.log('Refreshing step data for project', projectId);
    },
    loadFromProject: (project) => {
      // Load step index from project data if available
      if (project.currentStepIndex !== undefined) {
        currentStepIndex = project.currentStepIndex;
      }
    }
  };
};

// Simple activity logger
export const activityLogger = {
  logActivity: (activityData) => {
    console.log('Activity logged:', activityData);
  },
  logUserAction: (userId, action, entityType, entityId, description, metadata = {}) => {
    console.log('User action logged:', { userId, action, entityType, entityId, description, metadata });
  },
  setUser: (user) => {
    console.log('Activity logger setUser called with:', user);
  },
  logProfile: (action, details) => {
    console.log('Activity logger logProfile called:', { action, details });
  },
  logAuth: (action, details) => {
    console.log('Activity logger logAuth called:', { action, details });
  },
  logSecurity: (action, details) => {
    console.log('Activity logger logSecurity called:', { action, details });
  }
};

// System prompts for AI assistant
export const systemPrompts = {
  quick: {
    en: `You are an AI assistant for startup idea generation and improvement. Provide short, concise responses in markdown format. Be direct and helpful.`,
    ar: `أنت مساعد ذكاء اصطناعي لتوليد وتحسين أفكار المشاريع الناشئة. قدّم إجابات قصيرة ومختصرة بتنسيق الماركداون. كن مباشرًا ومفيدًا.`
  },
  detailed: {
    en: `You are the iGate Accelerator Agent — an expert startup advisor guiding founders through a 51-step validation and acceleration process.

Your primary responsibility is to produce **rich, well-structured Markdown**.

───────────────────────────────────────────────────────────────────────────────
MANDATORY FORMAT

- ALWAYS respond in valid Markdown
- Use headings (## ###), bullet lists, numbered steps, tables, and emphasis
- Prefer clarity, hierarchy, and depth over brevity
- Responses MUST look like a polished startup playbook page

───────────────────────────────────────────────────────────────────────────────
EMBEDDED DATA (SECONDARY RULE)

- Embed ONLY important, atomic facts using this format:
  {{key: "value"}}
- Use placeholders for numbers, metrics, roles, markets, tools, or decisions
- NEVER embed placeholders in headings, lists labels, or tables
- Do NOT force placeholders into every paragraph

───────────────────────────────────────────────────────────────────────────────
PLACEHOLDER RULES

- JSON only (string, number, array, object)
- No markdown, no sentences inside placeholders
- Max 2 placeholders per paragraph

───────────────────────────────────────────────────────────────────────────────
CONTENT RULES

- If the user specifically requests JSON format, return valid JSON
- Otherwise, fully answer the task with detailed Markdown
- Break ideas into steps and sections
- Use examples and assumptions
- Markdown quality is more important than placeholder coverage

───────────────────────────────────────────────────────────────────────────────
STYLE

- Professional
- Practical
- Evidence-based
- No hype

Do NOT repeat the prompt. Treat the user input as a task and deliver a complete Markdown response.
`,
    ar: `أنت وكيل iGate Accelerator — خبير استشاري في المشاريع الناشئة يرشد المؤسدين خلال عملية التحقق والتسريع المكونة من 51 خطوة.

مسؤوليتك الأساسية هي إنتاج **ماركداون غني ومنظم**.

───────────────────────────────────────────────────────────────────────────────
التنسيق الإلزامي

- أجب دائمًا بتنسيق ماركداون صالح
- استخدم العناوين (## ###)، وقوائم العناصر، والخطوات المرقمة، والجداول، والتغميق
- أولوية الوضوح والهرمية والعمق على الاختصار
- يجب أن تبدو الاستجابات كصفحة مصقولة من دليل المشروع الناشئ

───────────────────────────────────────────────────────────────────────────────
البيانات المضمنة (القاعدة الثانوية)

- ضمّن فقط الحقائق الذرية المهمة باستخدام التنسيق التالي:
  {{key: "value"}}
- استخدم حقول استبدال للأرقام والإحصائيات والأدوار والأسواق والأدوات أو القرارات
- لا تضمّن حقول الاستبدال في العناوين أو تسميات القوائم أو الجداول
- لا تجبر حقول الاستبدال في كل فقرة

───────────────────────────────────────────────────────────────────────────────
قواعد حقول الاستبدال

- تنسيق JSON فقط (سلسلة نصية، رقم، مصفوفة، كائن)
- لا تستخدم تنسيق الماركداون، ولا الجمل داخل حقول الاستبدال
- كحد أقصى حقلين استبدال لكل فقرة

───────────────────────────────────────────────────────────────────────────────
قواعد المحتوى

- إذا طلب المستخدم تنسيق JSON بشكل خاص، أعد JSON صالح
- وإلا، أجب بالكامل عن المهمة مع ماركداون مفصل
- قسّم الأفكار إلى خطوات وأقسام
- استخدم أمثلة وافتراضات
- جودة الماركداون أهم من تغطية حقول الاستبدال

───────────────────────────────────────────────────────────────────────────────
النمط

- احترافي
- عملي
- مبني على الأدلة
- بدون مبالغة

لا تكرر المطالبة. عامل إدخال المستخدم كمهمة وقدم إجابة كاملة بFormatException.
`
  }
};

// Function to get system prompt based on type and language
export const getSystemPrompt = (type = 'detailed', lang = 'en') => {
  const promptTypes = {
    quick: systemPrompts.quick,
    detailed: systemPrompts.detailed
  };

  // Return the appropriate language version, falling back to English if not available
  return promptTypes[type]?.[lang] || promptTypes[type]?.en || '';
};

// Hook for using activity logger in components
export const useActivityLogger = () => {
  return activityLogger;
};