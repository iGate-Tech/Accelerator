import {
  systemPromptTemplate,
  standardPromptTemplate,
  validationPromptTemplate,
  generationPromptTemplate,
} from "./promptTemplates.js";
import logger from '../logger.js';

// Log stepsConfig loading
logger.trace('stepsConfig: Loading steps configuration');

export const stepsConfig = [
  {
    id: "system",
    name: "System Initialization",
    model: "System",
    section: "Initialization",
    prompt: {
      template: systemPromptTemplate,
      variables: ["problem"],
      outputKeys: ["improvedProblem", "acknowledgment", "readiness"],
      instructions: "",
    },
    transitions: { next: "step2" },
  },
  {
    id: "step2",
    name: "Problem Analysis",
    model: "Idea Model",
    section: "Problem Identification",
    prompt: {
      template: standardPromptTemplate,
      variables: ["problem"],
      outputKeys: ["strugglers", "impactScale", "evidence"],
      instructions:
        "Analyze the problem {{problem}}. Provide a detailed explanation of who suffers from it most, the scale of impact, and supporting evidence.",
    },
    transitions: { next: "step3" },
  },
  {
    id: "step3",
    name: "Severity Assessment",
    model: "Idea Model",
    section: "Problem Assessment",
    prompt: {
      template: standardPromptTemplate,
      variables: ["problem"],
      outputKeys: ["severity", "frequency", "consequences", "comparison"],
      instructions:
        "Evaluate the severity and frequency of {{problem}}. Provide a detailed assessment including consequences and industry comparison.",
    },
    transitions: { next: "step4" },
  },
  {
    id: "step4",
    name: "Current Solutions",
    model: "Idea Model",
    section: "Problem Assessment",
    prompt: {
      template: standardPromptTemplate,
      variables: ["problem"],
      outputKeys: ["alternatives", "adoptionRates", "prosCons"],
      instructions:
        "List and categorize current solutions for {{problem}}, including examples with pros/cons and adoption estimates.",
    },
    transitions: { next: "step5" },
  },
  {
    id: "step5",
    name: "Solution Gaps",
    model: "Idea Model",
    section: "Problem Assessment",
    prompt: {
      template: standardPromptTemplate,
      variables: ["alternatives"],
      outputKeys: ["gaps", "quantifiedImpact", "userFeedback"],
      instructions:
        "Analyze why current {{alternatives}} fail for {{problem}}. Identify gaps in cost, speed, etc., with quantified impacts and user feedback.",
    },
    transitions: { next: "step6" },
  },
  {
    id: "step6",
    name: "User Persona",
    model: "Idea Model",
    section: "User Validation",
    prompt: {
      template: standardPromptTemplate,
      variables: ["problem"],
      outputKeys: ["persona", "workflow", "decisionProcess"],
      instructions:
        "Develop a detailed user persona for someone suffering from {{problem}}. Include demographics, professional details, psychographics, location, workflow, and decision process.",
    },
    transitions: { next: "step7" },
  },
  {
    id: "step7",
    name: "Urgency Assessment",
    model: "Idea Model",
    section: "User Validation",
    prompt: {
      template: standardPromptTemplate,
      variables: ["persona"],
      outputKeys: ["urgency", "consequences", "examples"],
      instructions:
        "Assess the urgency for {{persona}} to solve {{problem}}. Determine if must-have or nice-to-have, with consequences and examples.",
    },
    transitions: { next: "step8" },
  },
  {
    id: "step8",
    name: "Problem Validation",
    model: "Idea Model",
    section: "User Validation",
    prompt: {
      template: standardPromptTemplate,
      variables: ["problem"],
      outputKeys: ["evidence", "sources", "supportAnalysis"],
      instructions:
        "Gather and validate evidence for {{problem}}. Include quantitative and qualitative data, sources, and how it supports the problem.",
    },
    transitions: { next: "step9" },
  },
  {
    id: "step9",
    name: "Solution Design",
    model: "Business Model",
    section: "Solution Development",
    prompt: {
      template: standardPromptTemplate,
      variables: ["gaps", "persona"],
      outputKeys: [
        "solution",
        "coreFeatures",
        "addressedGaps",
        "differentiation",
      ],
      instructions:
        "Design a comprehensive solution for {{problem}}. Describe benefits, core features, how it addresses {{gaps}}, outcomes, and differentiation. Ensure alignment with {{persona}}.",
    },
    transitions: { next: "step10" },
  },
  {
    id: "step10",
    name: "Value Proposition",
    model: "Business Model",
    section: "Solution Development",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "alternatives", "evidence"],
      outputKeys: [
        "valueProp",
        "uniqueBenefits",
        "quantifiedValue",
        "targetCustomers",
      ],
      instructions:
        "Craft a compelling value proposition for {{solution}} compared to {{alternatives}}. Highlight benefits, savings, and advantages using {{evidence}}.",
    },
    transitions: { next: "step11" },
  },
  {
    id: "step11",
    name: "Key Features",
    model: "Business Model",
    section: "Solution Development",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["features"],
      instructions:
        "List key features of {{solution}} and map each to a customer benefit.",
    },
    transitions: { next: "step12" },
  },
  {
    id: "step12",
    name: "Business Model",
    model: "Business Model",
    section: "Business Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["persona"],
      outputKeys: ["modelType", "prosCons", "scalability", "feasibility"],
      instructions:
        "Determine the optimal business model for {{solution}} based on {{persona}}. Choose from options and justify with pros/cons, scalability, and feasibility.",
    },
    transitions: { next: "step13" },
  },
  {
    id: "step13",
    name: "Revenue Streams",
    model: "Business Model",
    section: "Business Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["modelType"],
      outputKeys: [
        "revenue",
        "pricingTiers",
        "monetizationPotential",
        "customerWTP",
      ],
      instructions:
        "Design revenue streams for {{solution}} using {{modelType}}. Identify primary, secondary, future streams with pricing and estimates.",
    },
    transitions: { next: "step14" },
  },
  {
    id: "step14",
    name: "Pricing Strategy",
    model: "Business Model",
    section: "Business Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["modelType", "persona", "market"],
      outputKeys: ["pricing", "tiers", "logic", "customerAcceptance"],
      instructions:
        "Develop a pricing strategy for {{solution}} in {{modelType}}. Consider approaches, factor {{persona}} and {{market}}, explain logic and acceptance.",
    },
    transitions: { next: "step15" },
  },
  {
    id: "step15",
    name: "Competitive Moats",
    model: "Business Model",
    section: "Business Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["moat", "implementation", "examples", "sustainability"],
      instructions:
        "Build competitive moats for {{solution}}. Analyze barriers like tech, data, etc., prioritize, provide implementation and examples.",
    },
    transitions: { next: "step16" },
  },
  {
    id: "step16",
    name: "Risk Analysis",
    model: "Business Model",
    section: "Business Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["assumptions", "risks"],
      instructions:
        "List key assumptions that must be true and major risks for {{solution}} success.",
    },
    transitions: { next: "step17" },
  },
  {
    id: "step17",
    name: "Target Market",
    model: "Marketing Model",
    section: "Market Analysis",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["market"],
      instructions:
        "Clearly define the target market for {{solution}} by industry, size, and customer type.",
    },
    transitions: { next: "step18" },
  },
  {
    id: "step18",
    name: "Total Addressable Market",
    model: "Marketing Model",
    section: "Market Analysis",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["tam", "calculation"],
      instructions:
        "Estimate the Total Addressable Market (TAM) for {{market}}. Explain the calculation method.",
    },
    transitions: { next: "step19" },
  },
  {
    id: "step19",
    name: "Serviceable Available Market",
    model: "Marketing Model",
    section: "Market Analysis",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["sam", "reach"],
      instructions:
        "Estimate the Serviceable Available Market (SAM) for {{market}}. Describe realistic reach.",
    },
    transitions: { next: "step20" },
  },
  {
    id: "step20",
    name: "Serviceable Obtainable Market",
    model: "Marketing Model",
    section: "Market Analysis",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["som", "capture"],
      instructions:
        "Estimate the Serviceable Obtainable Market (SOM) for {{market}}. Explain initial capture share rationale.",
    },
    transitions: { next: "validate_tam_sam_som" },
  },
  {
    id: "validate_tam_sam_som",
    name: "Market Validation",
    model: "Marketing Model",
    section: "Market Analysis",
    prompt: {
      template: validationPromptTemplate,
      variables: ["tam", "sam", "som"],
      outputKeys: ["valid", "message"],
      instructions: "Check if {{tam}} >= {{sam}} >= {{som}}.",
    },
    transitions: { next: "step21" },
  },
  {
    id: "step21",
    name: "Market Trends",
    model: "Marketing Model",
    section: "Market Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["trends", "growthRate"],
      instructions:
        "Identify trends or tailwinds supporting {{market}} growth. Include rates if known.",
    },
    transitions: { next: "step22" },
  },
  {
    id: "step22",
    name: "Competitive Landscape",
    model: "Marketing Model",
    section: "Market Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market", "solution"],
      outputKeys: ["competitors", "differentiation"],
      instructions:
        "List direct and indirect competitors in {{market}}. Explain how {{solution}} differs.",
    },
    transitions: { next: "step23" },
  },
  {
    id: "step23",
    name: "Market Entry",
    model: "Marketing Model",
    section: "Market Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["entryStrategy", "acquisition"],
      instructions:
        "Develop a strategy to enter {{market}} and acquire first customers.",
    },
    transitions: { next: "step24" },
  },
  {
    id: "step24",
    name: "Customer Acquisition",
    model: "Marketing Model",
    section: "Market Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["channels"],
      instructions:
        "Identify channels to acquire customers in {{market}}. Rank by priority.",
    },
    transitions: { next: "step25" },
  },
  {
    id: "step25",
    name: "Sales Strategy",
    model: "Marketing Model",
    section: "Market Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["salesMotion"],
      instructions:
        "Describe the sales motion for {{market}}: self-serve, inside sales, or enterprise.",
    },
    transitions: { next: "step26" },
  },
  {
    id: "step26",
    name: "Customer Retention",
    model: "Marketing Model",
    section: "Market Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["market"],
      outputKeys: ["retention", "growth"],
      instructions:
        "Develop strategies to retain customers and grow revenue in {{market}}.",
    },
    transitions: { next: "step27" },
  },
  {
    id: "step27",
    name: "Revenue Logic",
    model: "Financial Model",
    section: "Financial Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["modelType"],
      outputKeys: ["revenueLogic"],
      instructions:
        "Explain how revenue is generated per customer in {{modelType}}.",
    },
    transitions: { next: "step28" },
  },
  {
    id: "step28",
    name: "Unit Economics",
    model: "Financial Model",
    section: "Financial Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["modelType"],
      outputKeys: ["cac", "ltv", "margin"],
      instructions:
        "Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}.",
    },
    transitions: { next: "step29" },
  },
  {
    id: "step29",
    name: "Cost Structure",
    model: "Financial Model",
    section: "Financial Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["fixedCosts", "variableCosts"],
      instructions: "List major fixed and variable costs for {{solution}}.",
    },
    transitions: { next: "step30" },
  },
  {
    id: "step30",
    name: "Financial Projections",
    model: "Financial Model",
    section: "Financial Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["year1", "year2", "year3"],
      instructions:
        "Provide 3-year revenue and expense projections for {{solution}}.",
    },
    transitions: { next: "step31" },
  },
  {
    id: "step31",
    name: "Monthly Burn Rate",
    model: "Financial Model",
    section: "Financial Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["burnRate", "runway"],
      instructions:
        "Calculate the monthly burn rate and runway for {{solution}}.",
    },
    transitions: { next: "step32" },
  },
  {
    id: "step32",
    name: "Profitability Timeline",
    model: "Financial Model",
    section: "Financial Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["breakeven"],
      instructions: "Determine when {{solution}} will break even.",
    },
    transitions: { next: "step33" },
  },
  {
    id: "step33",
    name: "Valuation Inputs",
    model: "Financial Model",
    section: "Valuation & Funding Prep",
    prompt: {
      template: standardPromptTemplate,
      variables: ["tam", "team"],
      outputKeys: ["traction", "team", "marketSize", "risk"],
      instructions:
        "Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}.",
    },
    transitions: { next: "step34" },
  },
  {
    id: "step34",
    name: "Company Valuation",
    model: "Financial Model",
    section: "Valuation & Funding Prep",
    prompt: {
      template: standardPromptTemplate,
      variables: ["inputs"],
      outputKeys: ["valuation", "method"],
      instructions:
        "Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods with {{inputs}}.",
    },
    transitions: { next: "step35" },
  },
  {
    id: "step35",
    name: "Funding Stage",
    model: "Financial Model",
    section: "Valuation & Funding Prep",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["stage"],
      instructions:
        "Determine the appropriate funding stage for {{solution}}: Pre-seed, Seed, Series A, etc.",
    },
    transitions: { next: "step36" },
  },
  {
    id: "step36",
    name: "Funding Amount",
    model: "Financial Model",
    section: "Valuation & Funding Prep",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["ask", "rationale"],
      instructions:
        "Determine how much capital to raise for {{solution}} and provide the rationale.",
    },
    transitions: { next: "validate_deck_ask" },
  },
  {
    id: "validate_deck_ask",
    name: "Funding Validation",
    model: "Financial Model",
    section: "Valuation & Funding Prep",
    prompt: {
      template: validationPromptTemplate,
      variables: ["valuation", "ask"],
      outputKeys: ["valid", "message"],
      instructions: "Check if {{valuation}} aligns with {{ask}}.",
    },
    transitions: { next: "step37" },
  },
  {
    id: "step37",
    name: "Fund Allocation",
    model: "Funding Model",
    section: "Funding Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["allocation"],
      instructions: "Plan the allocation of raised funds for {{solution}}.",
    },
    transitions: { next: "step38" },
  },
  {
    id: "step38",
    name: "Pre-Money Valuation",
    model: "Funding Model",
    section: "Funding Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["valuation"],
      outputKeys: ["preMoney"],
      instructions:
        "Calculate the expected pre-money valuation for {{solution}}, ensuring alignment with {{valuation}}.",
    },
    transitions: { next: "validate_pre_money" },
  },
  {
    id: "validate_pre_money",
    name: "Valuation Check",
    model: "Funding Model",
    section: "Funding Strategy",
    prompt: {
      template: validationPromptTemplate,
      variables: ["preMoney", "ask"],
      outputKeys: ["valid", "message"],
      instructions: "Validate if {{preMoney}} < {{ask}}.",
    },
    transitions: { next: "step39" },
  },
  {
    id: "step39",
    name: "Target Investors",
    model: "Funding Model",
    section: "Funding Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["investors"],
      instructions: "Identify target investor types for {{solution}}.",
    },
    transitions: { next: "step40" },
  },
  {
    id: "step40",
    name: "Funding Milestones",
    model: "Funding Model",
    section: "Funding Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["milestones"],
      instructions:
        "List milestones unlocked by this funding round for {{solution}}.",
    },
    transitions: { next: "step41" },
  },
  {
    id: "step41",
    name: "Founding Team",
    model: "Team Model",
    section: "Team Building",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["team"],
      instructions:
        "List founding team members for {{solution}} and their roles.",
    },
    transitions: { next: "step42" },
  },
  {
    id: "step42",
    name: "Team Gaps",
    model: "Team Model",
    section: "Team Building",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["gaps"],
      instructions: "Identify key skills missing in the team for {{solution}}.",
    },
    transitions: { next: "step43" },
  },
  {
    id: "step43",
    name: "Hiring Plan",
    model: "Team Model",
    section: "Team Building",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["hiring"],
      instructions:
        "Develop a hiring plan for {{solution}} for the next 12-24 months.",
    },
    transitions: { next: "step44" },
  },
  {
    id: "step44",
    name: "Advisors & Board",
    model: "Team Model",
    section: "Team Building",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["advisors"],
      instructions:
        "List advisors, board members, and governance structure for {{solution}}.",
    },
    transitions: { next: "step45" },
  },
  {
    id: "step45",
    name: "Legal Structure",
    model: "Legal Model",
    section: "Legal Foundations",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["entity"],
      instructions:
        "Determine the legal structure for the {{solution}} company.",
    },
    transitions: { next: "step46" },
  },
  {
    id: "step46",
    name: "IP Protection",
    model: "Legal Model",
    section: "Legal Foundations",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["ip"],
      instructions:
        "Plan intellectual property ownership and protection for {{solution}}.",
    },
    transitions: { next: "step47" },
  },
  {
    id: "step47",
    name: "Contracts & Compliance",
    model: "Legal Model",
    section: "Legal Foundations",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["contracts", "compliance"],
      instructions:
        "Identify key contracts and compliance requirements for {{solution}}.",
    },
    transitions: { next: "step48" },
  },
  {
    id: "step48",
    name: "Legal Risks",
    model: "Legal Model",
    section: "Legal Foundations",
    prompt: {
      template: standardPromptTemplate,
      variables: [],
      outputKeys: ["risks"],
      instructions:
        "Identify legal and regulatory risks for AI-powered legal document review.",
    },
    transitions: { next: "step49" },
  },
  {
    id: "step49",
    name: "Pitch Deck Generation",
    model: "Pitch Deck Report",
    section: "Final Reports",
    prompt: {
      template: generationPromptTemplate,
      variables: [
        "problem",
        "solution",
        "tam",
        "sam",
        "som",
        "coreFeatures",
        "traction",
        "modelType",
        "competitors",
        "year1",
        "year2",
        "year3",
        "team",
        "ask",
        "allocation",
      ],
      outputKeys: ["pitchDeck"],
      instructions:
        "Create a comprehensive and extremely professional Pitch Deck for {{solution}} in markdown format. Include slides for problem ({{problem}}), solution ({{solution}}), market opportunity ({{tam}}, {{sam}}, {{som}}), product demo ({{coreFeatures}}), traction ({{traction}}), business model ({{modelType}}), competition ({{competitors}}), financials ({{year1}}, {{year2}}, {{year3}}), team ({{team}}), ask ({{ask}}), and use of funds ({{allocation}}). Ensure the deck is concise, visually described, and compelling with proper slide structure, bullet points, and embedded variables.",
    },
    transitions: { next: "step50" },
  },
  {
    id: "step50",
    name: "Business Plan Generation",
    model: "Business Plan Report",
    section: "Final Reports",
    prompt: {
      template: generationPromptTemplate,
      variables: [
        "solution",
        "market",
        "tam",
        "sam",
        "som",
        "trends",
        "coreFeatures",
        "modelType",
        "revenue",
        "pricing",
        "competitors",
        "differentiation",
        "year1",
        "year2",
        "year3",
        "ask",
        "team",
      ],
      outputKeys: ["businessPlan"],
      instructions:
        "Develop a detailed and professional Business Plan for {{solution}} in markdown format. Include executive summary, company description, market analysis ({{market}}, {{tam}}, {{sam}}, {{som}}, {{trends}}), product/service description ({{solution}}, {{coreFeatures}}), business model ({{modelType}}), revenue streams ({{revenue}}), pricing ({{pricing}}), competitive analysis ({{competitors}}, {{differentiation}}), financial projections ({{year1}}, {{year2}}, {{year3}}), funding requirements ({{ask}}), and team overview ({{team}}). Use all extracted variables and ensure the plan is comprehensive and investor-ready with proper sections, tables, and formatting.",
    },
    transitions: { next: "step51" },
  },
  {
    id: "step51",
    name: "Valuation Report Generation",
    model: "Valuation Report",
    section: "Final Reports",
    prompt: {
      template: generationPromptTemplate,
      variables: [
        "tam",
        "sam",
        "som",
        "traction",
        "team",
        "marketSize",
        "risk",
        "burnRate",
        "runway",
        "breakeven",
      ],
      outputKeys: ["valuationReport"],
      instructions:
        "Generate a comprehensive and extremely professional Valuation Report for {{solution}} in markdown format. Include executive summary, methodology overview (Scorecard, Berkus, VC, DCF-light), detailed calculations with assumptions, sensitivity analysis, and conclusion. Use all relevant data such as {{tam}}, {{sam}}, {{som}}, {{traction}}, {{team}}, {{marketSize}}, {{risk}}, {{burnRate}}, {{runway}}, {{breakeven}}, etc. Ensure the report is investor-ready with proper formatting, tables, and charts descriptions.",
    },
    transitions: { next: "done" },
  },
  {
    id: "done",
    name: "Completed",
    model: "System",
    section: "Finalization",
    prompt: null,
    transitions: {},
  },
];
