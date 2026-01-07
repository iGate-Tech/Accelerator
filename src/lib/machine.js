import { createStore } from 'solid-js/store';
import { extractTemplateData, injectTemplateData, mergeTemplateData } from './llm-template';

export const stepOrder = [
  'system', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10',
  'step11', 'step12', 'step13', 'step14', 'step15', 'step16', 'step17', 'step18', 'step19', 'step20',
  'validate_tam_sam_som', 'step21', 'step22', 'step23', 'step24', 'step25', 'step26', 'step27', 'step28', 'step29', 'step30',
  'step31', 'step32', 'step33', 'step34', 'step35', 'step36', 'validate_deck_ask', 'step37', 'step38', 'validate_pre_money',
  'step39', 'step40',    'step41', 'step42', 'step43', 'step44', 'step45', 'step46', 'step47', 'step48', 'step49', 'step50', 'step51', 'done'
];

const stepPrompts = {
   system: `You are the iGate Accelerator Agent — an expert startup advisor guiding entrepreneurs through a structured 51-step startup validation and acceleration journey.

The user has shared the following problem:
{{problem}}

────────────────────────────────────────
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

────────────────────────────────────────
OUTPUT FORMAT (MANDATORY)

- ALWAYS respond in **rich, well-structured Markdown**
- Use headings (## ###), bullet lists, short paragraphs, and emphasis
- The response should feel like the opening page of a professional startup playbook

────────────────────────────────────────
STRUCTURED DATA (LIMITED & SAFE)

- Embed ONLY key atomic facts using:
  {{key: "value"}}
- Required embedded keys:
  - {{improvedProblem: "..."}}
  - {{acknowledgment: "short acknowledgment of the problem’s importance"}}
  - {{readiness: "..."}}
- Do NOT embed placeholders in headings or list labels
- Do NOT force placeholders into every sentence

────────────────────────────────────────
STYLE

- Professional
- Encouraging
- Clear
- Practical
- No hype

Do NOT repeat this prompt. Treat the user input as a real startup problem and respond with a complete, polished Markdown answer.
`,
  step2: "Analyze the problem {{problem}}. Provide a detailed explanation of who suffers from it most, the scale of impact, and supporting evidence. Embed the key facts as {{strugglers: \"list of affected groups\"}}, {{impactScale: \"estimated scale\"}}, {{evidence: \"brief reasoning\"}}.",
  step3: "Evaluate the severity and frequency of {{problem}}. Provide a detailed assessment including consequences and industry comparison. Embed the key facts as {{severity: \"level and reason\"}}, {{frequency: \"rate\"}}, {{consequences: \"examples\"}}, {{comparison: \"industry context\"}}.",
  step4: "List and categorize current solutions for {{problem}}, including examples with pros/cons and adoption estimates. Embed the key facts as {{alternatives: \"categorized list with examples\"}, {adoptionRates: \"estimates\"}, {prosCons: \"summary\"}}.",
  step5: "Analyze why current {{alternatives}} fail for {{problem}}. Identify gaps in cost, speed, etc., with quantified impacts and user feedback. Embed the key facts as {{gaps: \"gaps list\"}, {quantifiedImpact: \"metrics\"}, {userFeedback: \"insights\"}}.",
  step6: "Develop a detailed user persona for someone suffering from {{problem}}. Include demographics, professional details, psychographics, location, workflow, and decision process. Embed the key facts as {{persona: \"profile\"}, {workflow: \"routines\"}, {decisionProcess: \"how they choose\"}}.",
  step7: "Assess the urgency for {{persona}} to solve {{problem}}. Determine if must-have or nice-to-have, with consequences and examples. Embed the key facts as {{urgency: \"level\"}, {consequences: \"impacts\"}, {examples: \"scenarios\"}}.",
  step8: "Gather and validate evidence for {{problem}}. Include quantitative and qualitative data, sources, and how it supports the problem. Embed the key facts as {{evidence: \"data points\"}, {sources: \"references\"}, {supportAnalysis: \"confirmation\"}}.",
  step9: "Design a comprehensive solution for {{problem}}. Describe benefits, core features, how it addresses {{gaps}}, outcomes, and differentiation. Ensure alignment with {{persona}}. Embed the key facts as {{solution: \"description\"}, {coreFeatures: \"list\"}, {addressedGaps: \"how\"}, {differentiation: \"advantages\"}}.",
   step10: "Craft a compelling value proposition for {{solution}} compared to {{alternatives}}. Highlight benefits, savings, and advantages using {{evidence}}. Embed the key facts as {{valueProp: \"statement\"}, {uniqueBenefits: \"list\"}, {quantifiedValue: \"metrics\"}, {targetCustomers: \"who\"}}.",
  step11: "List key features of {{solution}} and map each to a customer benefit. Embed the key facts as {{features: \"feature: benefit; ...\"}}.",
   step12: "Determine the optimal business model for {{solution}} based on {{persona}}. Choose from options and justify with pros/cons, scalability, and feasibility. Embed the key facts as {{modelType: \"chosen model\"}, {prosCons: \"list\"}, {scalability: \"potential\"}, {feasibility: \"considerations\"}}.",
  step13: "Design revenue streams for {{solution}} using {{modelType}}. Identify primary, secondary, future streams with pricing and estimates. Embed the key facts as {{revenue: \"streams list\"}, {pricingTiers: \"tiers\"}, {monetizationPotential: \"estimate\"}, {customerWTP: \"analysis\"}}.",
  step14: "Develop a pricing strategy for {{solution}} in {{modelType}}. Consider approaches, factor {{persona}} and {{market}}, explain logic and acceptance. Embed the key facts as {{pricing: \"strategy\"}, {tiers: \"structure\"}, {logic: \"rationale\"}, {customerAcceptance: \"adoption\"}}.",
  step15: "Build competitive moats for {{solution}}. Analyze barriers like tech, data, etc., prioritize, provide implementation and examples. Embed the key facts as {{moat: \"list\"}, {implementation: \"how\"}, {examples: \"companies\"}, {sustainability: \"defensibility\"}}.",
  step16: "List key assumptions that must be true and major risks for {{solution}} success. Embed the key facts as {{assumptions: \"list\"}, {risks: \"list\"}}.",
  step17: "Clearly define the target market for {{solution}} by industry, size, and customer type. Embed the key facts as {{market: \"definition\"}}.",
  step18: "Estimate the Total Addressable Market (TAM) for {{market}}. Explain the calculation method. Embed the key facts as {{tam: \"number\"}, {calculation: \"method\"}}.",
  step19: "Estimate the Serviceable Available Market (SAM) for {{market}}. Describe realistic reach. Embed the key facts as {{sam: \"number\"}, {reach: \"description\"}}.",
  step20: "Estimate the Serviceable Obtainable Market (SOM) for {{market}}. Explain initial capture share rationale. Embed the key facts as {{som: \"number\"}, {capture: \"rationale\"}}.",
  validate_tam_sam_som: "Check if {{tam}} >= {{sam}} >= {{som}}. Provide validation and reason. Embed the key facts as {{valid: true/false}, {message: \"reason\"}}.",
  step21: "Identify trends or tailwinds supporting {{market}} growth. Include rates if known. Embed the key facts as {{trends: \"list\"}, {growthRate: \"rate\"}}.",
  step22: "List direct and indirect competitors in {{market}}. Explain how {{solution}} differs. Embed the key facts as {{competitors: \"list\"}, {differentiation: \"how\"}}.",
  step23: "Develop a strategy to enter {{market}} and acquire first customers. Embed the key facts as {{entryStrategy: \"plan\"}, {acquisition: \"methods\"}}.",
  step24: "Identify channels to acquire customers in {{market}}. Rank by priority. Embed the key facts as {{channels: \"ranked list\"}}.",
  step25: "Describe the sales motion for {{market}}: self-serve, inside sales, or enterprise. Embed the key facts as {{salesMotion: \"type and strategy\"}}.",
  step26: "Develop strategies to retain customers and grow revenue in {{market}}. Embed the key facts as {{retention: \"plan\"}, {growth: \"methods\"}}.",
  step27: "Explain how revenue is generated per customer in {{modelType}}. Embed the key facts as {{revenueLogic: \"flow\"}}.",
  step28: "Provide Customer Acquisition Cost (CAC), Lifetime Value (LTV), and gross margin assumptions for {{modelType}}. Embed the key facts as {{cac: \"cost\"}, {ltv: \"value\"}, {margin: \"percentage\"}}.",
  step29: "List major fixed and variable costs for {{solution}}. Embed the key facts as {{fixedCosts: \"list\"}, {variableCosts: \"list\"}}.",
  step30: "Provide 3-year revenue and expense projections for {{solution}}. Embed the key facts as {{year1: \"rev/exp\"}, {year2: \"rev/exp\"}, {year3: \"rev/exp\"}}.",
  step31: "Calculate the monthly burn rate and runway for {{solution}}. Embed the key facts as {{burnRate: \"amount\"}, {runway: \"months\"}}.",
  step32: "Determine when {{solution}} will break even. Embed the key facts as {{breakeven: \"timeframe\"}}.",
  step33: "Provide current traction, team strength, market size ({{tam}}), and risk level for {{solution}}. Embed the key facts as {{traction: \"level\"}, {team: \"strength\"}, {marketSize: \"tam\"}, {risk: \"level\"}}.",
   step34: "Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods with {{inputs}}. Embed the key facts as {{valuation: \"number\"}, {method: \"blend details\"}}.",
  step35: "Determine the appropriate funding stage for {{solution}}: Pre-seed, Seed, Series A, etc. Embed the key facts as {{stage: \"level\"}}.",
  step36: "Determine how much capital to raise for {{solution}} and provide the rationale. Embed the key facts as {{ask: \"amount\"}, {rationale: \"why\"}}.",
  validate_deck_ask: "Check if {{valuation}} aligns with {{ask}}. Provide validation and message. Embed the key facts as {{valid: true/false}, {message: \"reason\"}}.",
  step37: "Plan the allocation of raised funds for {{solution}}. Embed the key facts as {{allocation: \"breakdown\"}}.",
  step38: "Calculate the expected pre-money valuation for {{solution}}, ensuring alignment with {{valuation}}. Embed the key facts as {{preMoney: \"number\"}}.",
  validate_pre_money: "Validate if {{preMoney}} < {{ask}}. Provide result and message. Embed the key facts as {{valid: true/false}, {message: \"reason\"}}.",
  step39: "Identify target investor types for {{solution}}. Embed the key facts as {{investors: \"types\"}}.",
  step40: "List milestones unlocked by this funding round for {{solution}}. Embed the key facts as {{milestones: \"list\"}}.",
  step41: "List founding team members for {{solution}} and their roles. Embed the key facts as {{team: \"member: role; ...\"}}.",
  step42: "Identify key skills missing in the team for {{solution}}. Embed the key facts as {{gaps: \"skills list\"}}.",
  step43: "Develop a hiring plan for {{solution}} for the next 12-24 months. Embed the key facts as {{hiring: \"plan\"}}.",
  step44: "List advisors, board members, and governance structure for {{solution}}. Embed the key facts as {{advisors: \"list\"}}.",
  step45: "Determine the legal structure for the {{solution}} company. Embed the key facts as {{entity: \"type\"}}.",
  step46: "Plan intellectual property ownership and protection for {{solution}}. Embed the key facts as {{ip: \"details\"}}.",
  step47: "Identify key contracts and compliance requirements for {{solution}}. Embed the key facts as {{contracts: \"list\"}, {compliance: \"requirements\"}}.",
   step48: "Identify legal and regulatory risks for AI-powered legal document review. Embed the key facts as {{risks: \"list\"}}.",
   step49: "Create a comprehensive and extremely professional Pitch Deck for {{solution}} in markdown format. Include slides for problem ({{problem}}), solution ({{solution}}), market opportunity ({{tam}}, {{sam}}, {{som}}), product demo ({{coreFeatures}}), traction ({{traction}}), business model ({{modelType}}), competition ({{competitors}}), financials ({{year1}}, {{year2}}, {{year3}}), team ({{team}}), ask ({{ask}}), and use of funds ({{allocation}}). Ensure the deck is concise, visually described, and compelling with proper slide structure, bullet points, and embedded variables. Embed the full pitch deck as {{pitchDeck: \"complete markdown content\"}}.",
   step50: "Develop a detailed and professional Business Plan for {{solution}} in markdown format. Include executive summary, company description, market analysis ({{market}}, {{tam}}, {{sam}}, {{som}}, {{trends}}), product/service description ({{solution}}, {{coreFeatures}}), business model ({{modelType}}), revenue streams ({{revenue}}), pricing ({{pricing}}), competitive analysis ({{competitors}}, {{differentiation}}), financial projections ({{year1}}, {{year2}}, {{year3}}), funding requirements ({{ask}}), and team overview ({{team}}). Use all extracted variables and ensure the plan is comprehensive and investor-ready with proper sections, tables, and formatting. Embed the full business plan as {{businessPlan: \"complete markdown content\"}}.",
   step51: "Generate a comprehensive and extremely professional Valuation Report for {{solution}} in markdown format. Include executive summary, methodology overview (Scorecard, Berkus, VC, DCF-light), detailed calculations with assumptions, sensitivity analysis, and conclusion. Use all relevant data such as {{tam}}, {{sam}}, {{som}}, {{traction}}, {{team}}, {{marketSize}}, {{risk}}, {{burnRate}}, {{runway}}, {{breakeven}}, etc. Ensure the report is investor-ready with proper formatting, tables, and charts descriptions. Embed the full report as {{valuationReport: \"complete markdown content\"}}."
};

export function fillPrompt(template, ctx) {
  return injectTemplateData(template, ctx);
}

function getPromptForStep(step) {
  return stepPrompts[step] || `Please provide input for ${step}`;
}

const extractFromResponse = extractTemplateData;

export const stepNames = {
  step2: 'Problem Analysis',
  step3: 'Severity Assessment',
  step4: 'Current Solutions',
  step5: 'Solution Gaps',
  step6: 'User Persona',
  step7: 'Urgency Assessment',
  step8: 'Problem Validation',
  step9: 'Solution Design',
  step10: 'Value Proposition',
  step11: 'Key Features',
  step12: 'Business Model',
  step13: 'Revenue Streams',
  step14: 'Pricing Strategy',
  step15: 'Competitive Moats',
  step16: 'Risk Analysis',
  step17: 'Target Market',
  step18: 'Total Addressable Market',
  step19: 'Serviceable Available Market',
  step20: 'Serviceable Obtainable Market',
  validate_tam_sam_som: 'Market Validation',
  step21: 'Market Trends',
  step22: 'Competitive Landscape',
  step23: 'Market Entry',
  step24: 'Customer Acquisition',
  step25: 'Sales Strategy',
  step26: 'Customer Retention',
  step27: 'Revenue Logic',
  step28: 'Unit Economics',
  step29: 'Cost Structure',
  step30: 'Financial Projections',
  step31: 'Monthly Burn Rate',
  step32: 'Profitability Timeline',
  step33: 'Valuation Inputs',
  step34: 'Company Valuation',
  step35: 'Funding Stage',
  step36: 'Funding Amount',
  validate_deck_ask: 'Funding Validation',
  step37: 'Fund Allocation',
  step38: 'Pre-Money Valuation',
  validate_pre_money: 'Valuation Check',
  step39: 'Target Investors',
  step40: 'Funding Milestones',
  step41: 'Founding Team',
  step42: 'Team Gaps',
  step43: 'Hiring Plan',
  step44: 'Advisors & Board',
  step45: 'Legal Structure',
  step46: 'IP Protection',
  step47: 'Contracts & Compliance',
   step48: 'Legal Risks',
   step49: 'Pitch Deck Generation',
   step50: 'Business Plan Generation',
   step51: 'Valuation Report Generation'
};




export const modelMap = {
  'system': 'System',
  'step2': 'Idea Model', 'step3': 'Idea Model', 'step4': 'Idea Model', 'step5': 'Idea Model', 'step6': 'Idea Model', 'step7': 'Idea Model', 'step8': 'Idea Model',
  'step9': 'Business Model', 'step10': 'Business Model', 'step11': 'Business Model', 'step12': 'Business Model', 'step13': 'Business Model', 'step14': 'Business Model', 'step15': 'Business Model', 'step16': 'Business Model',
  'step17': 'Marketing Model', 'step18': 'Marketing Model', 'step19': 'Marketing Model', 'step20': 'Marketing Model', 'validate_tam_sam_som': 'Marketing Model', 'step21': 'Marketing Model', 'step22': 'Marketing Model', 'step23': 'Marketing Model', 'step24': 'Marketing Model', 'step25': 'Marketing Model', 'step26': 'Marketing Model',
  'step27': 'Financial Model', 'step28': 'Financial Model', 'step29': 'Financial Model', 'step30': 'Financial Model', 'step31': 'Financial Model', 'step32': 'Financial Model', 'step33': 'Financial Model', 'step34': 'Financial Model', 'step35': 'Financial Model', 'step36': 'Financial Model',
  'validate_deck_ask': 'Financial Model', 'step37': 'Funding Model', 'step38': 'Funding Model', 'validate_pre_money': 'Funding Model', 'step39': 'Funding Model', 'step40': 'Funding Model',
  'step41': 'Team Model', 'step42': 'Team Model', 'step43': 'Team Model', 'step44': 'Team Model',
   'step45': 'Legal Model', 'step46': 'Legal Model', 'step47': 'Legal Model', 'step48': 'Legal Model', 'step49': 'Pitch Deck Report', 'step50': 'Business Plan Report', 'step51': 'Valuation Report'
};

export const sectionMap = {
  'system': 'Initialization',
  'step2': 'Problem Identification',
  'step3': 'Problem Assessment', 'step4': 'Problem Assessment', 'step5': 'Problem Assessment',
  'step6': 'User Validation', 'step7': 'User Validation', 'step8': 'User Validation',
  'step9': 'Solution Development', 'step10': 'Solution Development', 'step11': 'Solution Development',
  'step12': 'Business Strategy', 'step13': 'Business Strategy', 'step14': 'Business Strategy', 'step15': 'Business Strategy', 'step16': 'Business Strategy',
  'step17': 'Market Analysis', 'step18': 'Market Analysis', 'step19': 'Market Analysis', 'step20': 'Market Analysis', 'validate_tam_sam_som': 'Market Analysis',
  'step21': 'Market Strategy', 'step22': 'Market Strategy', 'step23': 'Market Strategy', 'step24': 'Market Strategy', 'step25': 'Market Strategy', 'step26': 'Market Strategy',
  'step27': 'Financial Planning', 'step28': 'Financial Planning', 'step29': 'Financial Planning', 'step30': 'Financial Planning', 'step31': 'Financial Planning', 'step32': 'Financial Planning',
  'step33': 'Valuation & Funding Prep', 'step34': 'Valuation & Funding Prep', 'step35': 'Valuation & Funding Prep', 'step36': 'Valuation & Funding Prep', 'validate_deck_ask': 'Valuation & Funding Prep',
  'step37': 'Funding Strategy', 'step38': 'Funding Strategy', 'validate_pre_money': 'Funding Strategy', 'step39': 'Funding Strategy', 'step40': 'Funding Strategy',
  'step41': 'Team Building', 'step42': 'Team Building', 'step43': 'Team Building', 'step44': 'Team Building',
   'step45': 'Legal Foundations', 'step46': 'Legal Foundations', 'step47': 'Legal Foundations', 'step48': 'Legal Foundations', 'step49': 'Final Reports', 'step50': 'Final Reports', 'step51': 'Final Reports'
};

export const modelCumul = {
  'Idea Model': 7,
  'Business Model': 15,
  'Marketing Model': 26,
  'Financial Model': 37,
  'Funding Model': 42,
  'Team Model': 46,
   'Legal Model': 50,
   'Technical Model': 47,
   'Pitch Deck Report': 49,
   'Business Plan Report': 50,
   'Valuation Report': 51
};

const initialContext = {
  problem: '',
  solution: '',
  currentStep: 'system',
  completedSteps: 0,
  stepName: 'System Initialization',
  currentModel: 'System',
  currentSection: 'Initialization',
  uiProgress: 0,
  uiMessage: 'Ready to start the 48-step accelerator process',
  uiStatus: 'idle',
  currentPrompt: '',
  llmResponse: '',
  strugglers: '', alternatives: '', gaps: '', persona: '', urgency: '', evidence: '',
  valueProp: '', features: '', modelType: '', revenue: '', pricing: '', moat: '', risks: ''
};

export const getNextStep = (currentStep) => {
  const index = stepOrder.indexOf(currentStep);
  return stepOrder[index + 1] || 'done';
};

export const [machineStore, setMachineStore] = createStore({
  state: 'idle',
  context: initialContext
});

export const startProcess = (problem) => {
  setMachineStore('state', 'processing');
  setMachineStore('context', (prev) => ({
    ...prev,
    problem: problem || prev.problem,
    currentStep: 'system',
    stepName: 'Initialization',
    currentModel: 'System',
    currentSection: 'Initialization',
    uiStatus: 'processing',
    uiMessage: 'Starting initialization...',
    completedSteps: 0,
    currentPrompt: fillPrompt(getPromptForStep('system'), { ...prev, problem: problem || prev.problem })
  }));
};

export const receiveResponse = async (response, setAutoProgress, setTasksList, tasksList, addTask) => {
  if (typeof response === 'undefined') {
    console.error('receiveResponse called with undefined response');
    return;
  }
  // Add the response as a task
  const newTask = { content: response, model: 'Llama-3.2-3B-Free', step: machineStore.context.currentStep, prompt: machineStore.context.currentPrompt || '', timestamp: new Date().toISOString() };
   setTasksList([...(tasksList() || []), newTask]);
  if (addTask) await addTask(newTask);
  const nextStep = getNextStep(machineStore.context.currentStep);
  if (nextStep === 'done') {
    setMachineStore('context', (prev) => {
      const extracted = extractFromResponse(response || '');
      let dataToMerge = extracted;
      if (extracted.response && typeof extracted.response === 'object') {
        dataToMerge = extracted.response;
      }
      const updatedCtx = mergeTemplateData(prev, dataToMerge);
      return {
        ...updatedCtx,
        llmResponse: response || '',
        currentStep: 'done',
        completedSteps: prev.completedSteps + 1,
        uiProgress: 100,
        uiStatus: 'completed',
         uiMessage: '🎉 All 51 steps completed successfully!'
      };
    });
  } else {
    setMachineStore('context', (prev) => {
      const extracted = extractFromResponse(response || '');
      let dataToMerge = extracted;
      if (extracted.response && typeof extracted.response === 'object') {
        dataToMerge = extracted.response;
      }
      const updatedContextElse = mergeTemplateData(prev, dataToMerge);
      console.log('Extracted data:', dataToMerge);
      const isSys = prev.currentStep === 'system';
      if (isSys) {
        updatedContextElse.greeting = response;
        updatedContextElse.acknowledgment = 'Problem acknowledged and ready to proceed.';
      }
      const newCompletedSteps = isSys ? 1 : prev.completedSteps + 1;
       const progress = (newCompletedSteps / 51) * 100;
      const message = isSys ? 'Initialization complete. Starting step 1...' : `Step ${newCompletedSteps} complete. Moving to ${stepNames[nextStep] || 'next step'}...`;
      return {
        ...updatedContextElse,
        llmResponse: response || '',
        currentStep: nextStep,
        stepName: stepNames[nextStep] || 'Next Step',
        currentModel: modelMap[nextStep] || 'System',
        currentSection: sectionMap[nextStep] || 'Initialization',
        completedSteps: newCompletedSteps,
        uiProgress: Math.min(progress, 100),
        uiMessage: message,
        currentPrompt: fillPrompt(getPromptForStep(nextStep), updatedContextElse)
      };
    });
    if (setAutoProgress) setAutoProgress(true);
  }
};


export const pause = () => {
  setMachineStore('state', 'pause');
};

export const resume = () => {
  setMachineStore('state', 'processing');
};

export const reset = () => {
  setMachineStore('state', 'idle');
  setMachineStore('context', initialContext);
};