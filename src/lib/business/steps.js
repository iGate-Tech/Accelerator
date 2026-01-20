// Template functions (moved from promptTemplates.js)
export const basePromptStructure = (instructions, variables, outputKeys) => `
You are the iGate Accelerator Agent — an expert startup advisor guiding entrepreneurs through a structured 51-step startup validation and acceleration journey.

${instructions}

──────────────────────────────────────
STRUCTURED DATA (LIMITED & SAFE)

- Embed ONLY key atomic facts using:
  ${outputKeys.map((key) => `{{${key}: "value"}}`).join(", ")}
- Do NOT embed placeholders in headings or list labels
- Do NOT force placeholders into every sentence

──────────────────────────────────────
OUTPUT FORMAT (MANDATORY)

- ALWAYS respond in **rich, well-structured Markdown**
- Use headings (## ###), bullet lists, short paragraphs, and emphasis

──────────────────────────────────────
STYLE

- Professional
- Encouraging
- Clear
- Practical
- No hype

Do NOT repeat this prompt. Treat the user input as a real startup problem and respond with a complete, polished Markdown answer.
`;

export const systemPromptTemplate = (variables, outputKeys) => `
You are the iGate Accelerator Agent — an expert startup advisor guiding entrepreneurs through a structured 51-step startup validation and acceleration journey.

The user has shared the following problem:
{{problem}}

──────────────────────────────────────
YOUR TASK

1. Warmly greet the user and acknowledge their problem.
2. Rephrase and improve the problem to make it clearer, more specific, and highlight its market relevance and importance.
   - Embed the improved version as:
     {{improvedProblem: "clear, specific, market-relevant problem description"}}
3. Briefly explain that the 51-step accelerator covers:
   - Problem validation
   - User research
   - Solution design
   - Business and revenue modeling
   - Market and competitor analysis
   - Financial planning
   - Funding strategy
   - Team and execution planning
   - Legal foundations
   - Final startup report
4. Confirm your readiness to begin the full accelerator journey.
   - Embed this as:
     {{readiness: "enthusiastic confirmation to start the 51-step process"}}

──────────────────────────────────────
OUTPUT FORMAT (MANDATORY)

- ALWAYS respond in **rich, well-structured Markdown**
- Use headings (## ###), bullet lists, short paragraphs, and emphasis
- The response should feel like the opening page of a professional startup playbook

──────────────────────────────────────
STRUCTURED DATA (LIMITED & SAFE)

- Embed ONLY key atomic facts using:
  ${outputKeys.map((key) => `{{${key}: "value"}}`).join(", ")}
- Required embedded keys:
  - {{improvedProblem: "..."}}
  - {{acknowledgment: "short acknowledgment of the problem's importance"}}
  - {{readiness: "..."}}
- Do NOT embed placeholders in headings or list labels
- Do NOT force placeholders into every sentence

──────────────────────────────────────
STYLE

- Professional
- Encouraging
- Clear
- Practical
- No hype

Do NOT repeat this prompt. Treat the user input as a real startup problem and respond with a complete, polished Markdown answer.
`;

export const standardPromptTemplate = (instructions, variables, outputKeys) => {
  return basePromptStructure(instructions, variables, outputKeys);
};

export const validationPromptTemplate = (
  instructions,
  variables,
  outputKeys,
) => `
You are the iGate Accelerator Agent — an expert startup advisor.

${instructions}

Embed the key facts as ${outputKeys.map((key) => `{{${key}: true/false}, {message: "reason"}}`).join(", ")}.

OUTPUT FORMAT: Provide validation and reasoning in clear Markdown.
`;

export const generationPromptTemplate = (
  instructions,
  variables,
  outputKeys,
) => `
You are the iGate Accelerator Agent — an expert startup advisor.

${instructions}

Ensure the output is professional, comprehensive, and investor-ready. Embed the full content as {{${outputKeys[0]}: "complete markdown content"}}.

OUTPUT FORMAT: Generate in markdown format with proper sections, tables, and formatting.
`;

// Steps as data array (converted from stepsConfig)
export const steps = [
  {
    id: "system",
    name: "System Initialization",
    promptTemplate: systemPromptTemplate,
    variables: ["problem"],
    outputKeys: ["improvedProblem", "acknowledgment", "readiness"],
    instructions: "The user has shared the following problem: {{problem}}. Warmly greet, rephrase the problem, explain the process, confirm readiness.",
    validate: (context) => ({ valid: true, issues: [] }), // Always valid
  },
  {
    id: "step2",
    name: "Problem Analysis",
    promptTemplate: standardPromptTemplate,
    variables: ["problem"],
    outputKeys: ["strugglers", "impactScale", "evidence"],
    instructions: "Analyze the problem {{problem}}. Provide a detailed explanation of who suffers from it most, the scale of impact, and supporting evidence.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step3",
    name: "Severity Assessment",
    promptTemplate: standardPromptTemplate,
    variables: ["problem"],
    outputKeys: ["severity", "frequency", "consequences", "comparison"],
    instructions: "Evaluate the severity and frequency of {{problem}}. Provide a detailed assessment including consequences and industry comparison.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step4",
    name: "Current Solutions",
    promptTemplate: standardPromptTemplate,
    variables: ["problem"],
    outputKeys: ["alternatives", "adoptionRates", "prosCons"],
    instructions: "List and categorize current solutions for {{problem}}, including examples with pros/cons and adoption estimates.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step5",
    name: "Solution Gaps",
    promptTemplate: standardPromptTemplate,
    variables: ["alternatives"],
    outputKeys: ["gaps", "quantifiedImpact", "userFeedback"],
    instructions: "Analyze why current {{alternatives}} fail for {{problem}}. Identify gaps in cost, speed, etc., with quantified impacts and user feedback.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step6",
    name: "User Persona",
    promptTemplate: standardPromptTemplate,
    variables: ["problem"],
    outputKeys: ["persona", "workflow", "decisionProcess"],
    instructions: "Develop a detailed user persona for someone suffering from {{problem}}. Include demographics, professional details, psychographics, location, workflow, and decision process.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step7",
    name: "Urgency Assessment",
    promptTemplate: standardPromptTemplate,
    variables: ["persona"],
    outputKeys: ["urgency", "consequences", "examples"],
    instructions: "Assess the urgency for {{persona}} to solve {{problem}}. Determine if must-have or nice-to-have, with consequences and examples.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step8",
    name: "Problem Validation",
    promptTemplate: standardPromptTemplate,
    variables: ["problem"],
    outputKeys: ["evidence", "sources", "supportAnalysis"],
    instructions: "Gather and validate evidence for {{problem}}. Include quantitative and qualitative data, sources, and how it supports the problem.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step9",
    name: "Solution Design",
    promptTemplate: standardPromptTemplate,
    variables: ["gaps", "persona"],
    outputKeys: ["solution", "coreFeatures", "addressedGaps", "differentiation"],
    instructions: "Design a comprehensive solution for {{problem}}. Describe benefits, core features, how it addresses {{gaps}}, outcomes, and differentiation. Ensure alignment with {{persona}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step10",
    name: "Value Proposition",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "alternatives", "evidence"],
    outputKeys: ["valueProp", "uniqueBenefits", "quantifiedValue", "targetCustomers"],
    instructions: "Craft a compelling value proposition for {{solution}} compared to {{alternatives}}. Highlight benefits, savings, and advantages using {{evidence}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step11",
    name: "Key Features",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["features"],
    instructions: "List key features of {{solution}} and map each to a customer benefit.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step12",
    name: "Business Model",
    promptTemplate: standardPromptTemplate,
    variables: ["persona"],
    outputKeys: ["modelType", "prosCons", "scalability", "feasibility"],
    instructions: "Determine the optimal business model for {{solution}} based on {{persona}}. Choose from options and justify with pros/cons, scalability, and feasibility.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step13",
    name: "Revenue Streams",
    promptTemplate: standardPromptTemplate,
    variables: ["modelType"],
    outputKeys: ["revenue", "pricingTiers", "monetizationPotential", "customerWTP"],
    instructions: "Design revenue streams for {{solution}} using {{modelType}}. Identify primary, secondary, future streams with pricing and estimates.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step14",
    name: "Pricing Strategy",
    promptTemplate: standardPromptTemplate,
    variables: ["modelType", "persona", "market"],
    outputKeys: ["pricing", "tiers", "logic", "customerAcceptance"],
    instructions: "Develop a pricing strategy for {{solution}} in {{modelType}}. Consider approaches, factor {{persona}} and {{market}}, explain logic and acceptance.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step15",
    name: "Competitive Moats",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["moat", "implementation", "examples", "sustainability"],
    instructions: "Build competitive moats for {{solution}}. Analyze barriers like tech, data, etc., prioritize, provide implementation and examples.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step16",
    name: "Risk Analysis",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["assumptions", "risks"],
    instructions: "List key assumptions that must be true and major risks for {{solution}} success.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step17",
    name: "Technical Architecture",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "modelType"],
    outputKeys: ["techStack", "architecture", "patterns", "scalability"],
    instructions: "Design the technical architecture for {{solution}}. Recommend tech stack ({{techStack}}), architecture patterns ({{patterns}}), and scalability approach ({{scalability}}).",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step18",
    name: "MVP Definition",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "coreFeatures"],
    outputKeys: ["mvpFeatures", "scope", "prioritization"],
    instructions: "Define the MVP for {{solution}} by identifying {{mvpFeatures}} from {{coreFeatures}}. Explain scope and prioritization rationale.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step19",
    name: "Infrastructure & Hosting",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "scalability"],
    outputKeys: ["cloudProvider", "hosting", "cdn", "costs"],
    instructions: "Plan infrastructure and hosting for {{solution}} considering {{scalability}}. Recommend cloud provider, hosting strategy, and CDN approach.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step20",
    name: "Security Architecture",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "persona"],
    outputKeys: ["auth", "encryption", "compliance", "securityMeasures"],
    instructions: "Design security architecture for {{solution}} serving {{persona}}. Include authentication, encryption, compliance requirements, and security measures.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step21",
    name: "Data Architecture",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "market"],
    outputKeys: ["databases", "dataFlow", "analytics", "storage"],
    instructions: "Plan data architecture for {{solution}} targeting {{market}}. Design databases, data flow, analytics pipeline, and storage strategy.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step22",
    name: "API & Integrations",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["apiDesign", "integrations", "webhooks", "partnerships"],
    instructions: "Design API strategy for {{solution}}. Plan REST/GraphQL design, third-party {{integrations}}, webhooks, and partnership opportunities.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step23",
    name: "Development Workflow",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "timeline"],
    outputKeys: ["ciCd", "testing", "deployment", "monitoring"],
    instructions: "Establish development workflow for {{solution}} within {{timeline}}. Define CI/CD pipeline, testing strategy, deployment process, and monitoring.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step24",
    name: "Technical Roadmap",
    promptTemplate: standardPromptTemplate,
    variables: ["solution", "mvpFeatures", "timeline"],
    outputKeys: ["milestones", "resources", "risks", "timelinePhases"],
    instructions: "Create technical roadmap for {{solution}} with {{mvpFeatures}} in {{timeline}}. Define milestones, resources needed, technical risks, and timeline phases.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step25",
    name: "Target Market",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["market"],
    instructions: "Clearly define the target market for {{solution}} by industry, size, and customer type.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step26",
    name: "Total Addressable Market",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["tam", "calculation"],
    instructions: "Estimate the Total Addressable Market (TAM) for {{market}}. Explain the calculation method.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step27",
    name: "Serviceable Available Market",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["sam", "reach"],
    instructions: "Estimate the Serviceable Available Market (SAM) for {{market}}. Describe realistic reach.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step28",
    name: "Serviceable Obtainable Market",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["som", "capture"],
    instructions: "Estimate the Serviceable Obtainable Market (SOM) for {{market}}. Explain initial capture share rationale.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "validate_tam_sam_som",
    name: "Market Validation",
    promptTemplate: validationPromptTemplate,
    variables: ["tam", "sam", "som"],
    outputKeys: ["valid", "message"],
    instructions: "Check if {{tam}} >= {{sam}} >= {{som}}.",
    validate: (context) => {
      const tam = parseFloat(context.tam) || 0;
      const sam = parseFloat(context.sam) || 0;
      const som = parseFloat(context.som) || 0;
      const valid = tam >= sam && sam >= som;
      const issues = valid ? [] : ["Market sizes must satisfy TAM >= SAM >= SOM"];
      return { valid, issues };
    },
  },
  {
    id: "step29",
    name: "Market Trends",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["trends", "growthRate"],
    instructions: "Identify trends or tailwinds supporting {{market}} growth. Include rates if known.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step30",
    name: "Competitive Landscape",
    promptTemplate: standardPromptTemplate,
    variables: ["market", "solution"],
    outputKeys: ["competitors", "differentiation"],
    instructions: "List direct and indirect competitors in {{market}}. Explain how {{solution}} differs.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step31",
    name: "Market Entry",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["entryStrategy", "acquisition"],
    instructions: "Develop a strategy to enter {{market}} and acquire first customers.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step32",
    name: "Customer Acquisition",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["channels"],
    instructions: "Identify channels to acquire customers in {{market}}. Rank by priority.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step33",
    name: "Sales Strategy",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["salesMotion"],
    instructions: "Describe the sales motion for {{market}}: self-serve, inside sales, or enterprise.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step34",
    name: "Customer Retention",
    promptTemplate: standardPromptTemplate,
    variables: ["market"],
    outputKeys: ["retention", "growth"],
    instructions: "Develop strategies to retain customers and grow revenue in {{market}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step35",
    name: "Revenue Logic",
    promptTemplate: standardPromptTemplate,
    variables: ["modelType"],
    outputKeys: ["revenueLogic"],
    instructions: "Explain how revenue is generated per customer in {{modelType}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step36",
    name: "Unit Economics",
    promptTemplate: standardPromptTemplate,
    variables: ["modelType"],
    outputKeys: ["cac", "ltv", "margin"],
    instructions: "Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step37",
    name: "Cost Structure",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["fixedCosts", "variableCosts"],
    instructions: "List major fixed and variable costs for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step38",
    name: "Financial Projections",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["year1", "year2", "year3"],
    instructions: "Provide 3-year revenue and expense projections for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step39",
    name: "Monthly Burn Rate",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["burnRate", "runway"],
    instructions: "Calculate the monthly burn rate and runway for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step40",
    name: "Profitability Timeline",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["breakeven"],
    instructions: "Determine when {{solution}} will break even.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step41",
    name: "Valuation Inputs",
    promptTemplate: standardPromptTemplate,
    variables: ["tam", "team"],
    outputKeys: ["traction", "team", "marketSize", "risk"],
    instructions: "Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step42",
    name: "Company Valuation",
    promptTemplate: standardPromptTemplate,
    variables: ["inputs"],
    outputKeys: ["valuation", "method"],
    instructions: "Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods with {{inputs}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step43",
    name: "Funding Stage",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["stage"],
    instructions: "Determine the appropriate funding stage for {{solution}}: Pre-seed, Seed, Series A, etc.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step44",
    name: "Funding Amount",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["ask", "rationale"],
    instructions: "Determine how much capital to raise for {{solution}} and provide the rationale.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "validate_deck_ask",
    name: "Funding Validation",
    promptTemplate: validationPromptTemplate,
    variables: ["valuation", "ask"],
    outputKeys: ["valid", "message"],
    instructions: "Check if {{valuation}} aligns with {{ask}}.",
    validate: (context) => {
      const valuation = parseFloat(context.valuation) || 0;
      const ask = parseFloat(context.ask) || 0;
      const valid = valuation > 0 && ask > 0 && ask <= valuation * 1.5; // Rough alignment
      const issues = valid ? [] : ["Funding ask should align with valuation"];
      return { valid, issues };
    },
  },
  {
    id: "step45",
    name: "Fund Allocation",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["allocation"],
    instructions: "Plan the allocation of raised funds for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step46",
    name: "Pre-Money Valuation",
    promptTemplate: standardPromptTemplate,
    variables: ["valuation"],
    outputKeys: ["preMoney"],
    instructions: "Calculate the expected pre-money valuation for {{solution}}, ensuring alignment with {{valuation}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "validate_pre_money",
    name: "Valuation Check",
    promptTemplate: validationPromptTemplate,
    variables: ["preMoney", "ask"],
    outputKeys: ["valid", "message"],
    instructions: "Validate if {{preMoney}} < {{ask}}.",
    validate: (context) => {
      const preMoney = parseFloat(context.preMoney) || 0;
      const ask = parseFloat(context.ask) || 0;
      const valid = preMoney < ask;
      const issues = valid ? [] : ["Pre-money valuation must be less than funding ask"];
      return { valid, issues };
    },
  },
  {
    id: "step47",
    name: "Target Investors",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["investors"],
    instructions: "Identify target investor types for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step48",
    name: "Funding Milestones",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["milestones"],
    instructions: "List milestones unlocked by this funding round for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step49",
    name: "Founding Team",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["team"],
    instructions: "List founding team members for {{solution}} and their roles.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step50",
    name: "Team Gaps",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["gaps"],
    instructions: "Identify key skills missing in the team for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step51",
    name: "Hiring Plan",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["hiring"],
    instructions: "Develop a hiring plan for {{solution}} for the next 12-24 months.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step52",
    name: "Advisors & Board",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["advisors"],
    instructions: "List advisors, board members, and governance structure for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step53",
    name: "Legal Structure",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["entity"],
    instructions: "Determine the legal structure for the {{solution}} company.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step54",
    name: "IP Protection",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["ip"],
    instructions: "Plan intellectual property ownership and protection for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step55",
    name: "Contracts & Compliance",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["contracts", "compliance"],
    instructions: "Identify key contracts and compliance requirements for {{solution}}.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step56",
    name: "Legal Risks",
    promptTemplate: standardPromptTemplate,
    variables: ["solution"],
    outputKeys: ["risks"],
    instructions: "Identify legal and regulatory risks for AI-powered legal document review.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step57",
    name: "Pitch Deck Generation",
    promptTemplate: generationPromptTemplate,
    variables: ["problem", "solution", "tam", "sam", "som", "coreFeatures", "traction", "modelType", "competitors", "year1", "year2", "year3", "team", "ask", "allocation"],
    outputKeys: ["pitchDeck"],
    instructions: "Create a comprehensive and extremely professional Pitch Deck for {{solution}} in markdown format. Include slides for problem ({{problem}}), solution ({{solution}}), market opportunity ({{tam}}, {{sam}}, {{som}}), product demo ({{coreFeatures}}), traction ({{traction}}), business model ({{modelType}}), competition ({{competitors}}), financials ({{year1}}, {{year2}}, {{year3}}), team ({{team}}), ask ({{ask}}), and use of funds ({{allocation}}). Ensure the deck is concise, visually described, and compelling with proper slide structure, bullet points, and embedded variables.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step58",
    name: "Business Plan Generation",
    promptTemplate: generationPromptTemplate,
    variables: ["solution", "market", "tam", "sam", "som", "trends", "coreFeatures", "modelType", "revenue", "pricing", "competitors", "differentiation", "year1", "year2", "year3", "ask", "team"],
    outputKeys: ["businessPlan"],
    instructions: "Develop a detailed and professional Business Plan for {{solution}} in markdown format. Include executive summary, company description, market analysis ({{market}}, {{tam}}, {{sam}}, {{som}}, {{trends}}), product/service description ({{solution}}, {{coreFeatures}}), business model ({{modelType}}), revenue streams ({{revenue}}), pricing ({{pricing}}), competitive analysis ({{competitors}}, {{differentiation}}), financial projections ({{year1}}, {{year2}}, {{year3}}), funding requirements ({{ask}}), and team overview ({{team}}). Use all extracted variables and ensure the plan is comprehensive and investor-ready with proper sections, tables, and formatting.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
  {
    id: "step59",
    name: "Valuation Report Generation",
    promptTemplate: generationPromptTemplate,
    variables: ["tam", "sam", "som", "traction", "team", "marketSize", "risk", "burnRate", "runway", "breakeven"],
    outputKeys: ["valuationReport"],
    instructions: "Generate a comprehensive and extremely professional Valuation Report for {{solution}} in markdown format. Include executive summary, methodology overview (Scorecard, Berkus, VC, DCF-light), detailed calculations with assumptions, sensitivity analysis, and conclusion. Use all relevant data such as {{tam}}, {{sam}}, {{som}}, {{traction}}, {{team}}, {{marketSize}}, {{risk}}, {{burnRate}}, {{runway}}, {{breakeven}}, etc. Ensure the report is investor-ready with proper formatting, tables, and charts descriptions.",
    validate: (context) => ({ valid: true, issues: [] }),
  },
];

// Mappings derived from steps
export const stepNames = Object.fromEntries(
  steps.map((step) => [step.id, step.name]),
);

export const modelMap = Object.fromEntries(
  steps.map((step) => [step.id, step.model || "Unknown"]),
);

export const sectionMap = Object.fromEntries(
  steps.map((step) => [step.id, step.section || "Unknown"]),
);

// Calculate cumulative step counts per model
export const modelCumul = (() => {
  const modelOrder = [
    'System',
    'Idea Model',
    'Business Model',
    'Technical Model',
    'Marketing Model',
    'Financial Model',
    'Funding Model',
    'Team Model',
    'Legal Model',
    'Pitch Deck Report',
    'Business Plan Report',
    'Valuation Report'
  ];

  const cumul = {};
  let total = 0;

  for (const model of modelOrder) {
    const stepsInModel = steps.filter(s => s.model === model).length;
    total += stepsInModel;
    cumul[model] = total;
  }

  return cumul;
})();

