import { createMachine, assign } from 'xstate';
import { extractTemplateData, injectTemplateData, mergeTemplateData } from './llm-template';

export const stepOrder = [
  'system', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10',
  'step11', 'step12', 'step13', 'step14', 'step15', 'step16', 'step17', 'step18', 'step19', 'step20',
  'validate_tam_sam_som', 'step21', 'step22', 'step23', 'step24', 'step25', 'step26', 'step27', 'step28', 'step29', 'step30',
  'step31', 'step32', 'step33', 'step34', 'step35', 'step36', 'validate_deck_ask', 'step37', 'step38', 'validate_pre_money',
  'step39', 'step40', 'step41', 'step42', 'step43', 'step44', 'step45', 'step46', 'step47', 'step48', 'done'
];

const stepPrompts = {
  step2: `Analyze the problem {{problem}} in detail. Who suffers from this problem the most? Identify the primary affected groups, including specific roles, industries, company sizes, and demographics. Provide evidence or reasoning for why these groups are impacted. Also, estimate the scale of impact (number of people/companies affected). Respond with {{strugglers: "detailed list of affected groups"}, {impactScale: "estimated scale"}, {evidence: "supporting reasoning"}}`,
  step3: `Evaluate the severity and frequency of the problem {{problem}}. On a scale of 1-10, rate the severity (how much it disrupts operations or causes pain) and frequency (how often it occurs daily/weekly/monthly). Provide specific examples of consequences when the problem arises. Explain how this compares to similar problems in the industry. Respond with {{severity: "level 1-10 with explanation"}, {frequency: "rate with timeframe"}, {consequences: "examples of impact"}, {comparison: "industry comparison"}}`,
  step4: `Research and list all current solutions people use to address {{problem}}. Categorize them into manual processes, software tools, outsourced services, and any emerging technologies. For each category, provide 2-3 specific examples with pros and cons. Estimate adoption rates and market share if possible. Respond with {{alternatives: "categorized list with examples"}, {adoptionRates: "estimates"}, {prosCons: "summary"}}`,
  step5: `Analyze why current {{alternatives}} fail or underperform in solving {{problem}}. Identify specific gaps in cost-effectiveness, speed, user adoption, accuracy, scalability, compliance, or user experience. Provide data or examples from user feedback, industry reports, or case studies. Quantify the impact of these gaps where possible. Respond with {{gaps: "detailed analysis"}, {quantifiedImpact: "metrics or examples"}, {userFeedback: "key insights"}}`,
  step6: `Develop a detailed user persona for someone suffering from {{problem}}. Include demographics (age, gender, education), professional details (role, industry, company size, seniority), psychographics (goals, challenges, motivations), and geographic location. Describe their daily workflow, pain points, and decision-making process for solutions. Use data from industry reports or typical profiles. Respond with {{persona: "comprehensive persona description"}, {workflow: "daily routine"}, {decisionProcess: "how they choose solutions"}}`,
  step7: `Assess the urgency of solving {{problem}} for the target user persona. Is it a must-have (critical blocker) or nice-to-have (enhancement)? Describe the consequences of not solving it, including operational impacts, financial costs, opportunity losses, and user satisfaction. Provide examples from similar problems. Respond with {{urgency: "must-have or nice-to-have with rating"}, {consequences: "detailed impacts"}, {examples: "comparable scenarios"}}`,
  step8: `Gather evidence validating {{problem}} exists and affects users significantly. Include quantitative data (surveys, metrics, market reports) and qualitative insights (interviews, user stories, expert opinions). Source from reliable publications, case studies, or direct research. Explain how this evidence supports the problem statement. Respond with {{evidence: "comprehensive validation data"}, {sources: "list of references"}, {supportAnalysis: "how evidence confirms the problem"}}`,
  step9: `Design a comprehensive solution for {{problem}}. Describe what the solution does in 1-2 sentences, focusing on user benefits rather than technical implementation. Explain how it directly addresses the key gaps in current solutions. Include core features, target outcomes, and how it differs from alternatives. Ensure it aligns with the user persona and urgency. Respond with {{solution: "clear description"}, {coreFeatures: "list of key features"}, {addressedGaps: "how it solves gaps"}, {differentiation: "unique advantages"}}`,
  step10: `Craft a compelling value proposition for {{solution}} addressing {{problem}}. Clearly articulate why customers will choose it over existing {{alternatives}}. Focus on unique benefits, cost savings, efficiency gains, and competitive advantages. Use data from problem analysis and user validation. Respond with {{valueProp: "concise value statement"}, {uniqueBenefits: "key differentiators"}, {quantifiedValue: "metrics like cost savings"}, {targetCustomers: "who it appeals to"}}`,
  step11: `List key features of {{solution}} and map each feature to a customer benefit. Respond with {{features: "your list"}}`,
  step12: `Determine the optimal business model for {{solution}} based on {{persona}}, {{market}}, and {{solution}} characteristics. Choose from SaaS, Marketplace, License, Usage-based, or other models. Justify your choice with pros/cons, scalability factors, and alignment with user needs. Consider regulatory and operational feasibility. Respond with {{modelType: "chosen model with justification"}, {prosCons: "advantages and disadvantages"}, {scalability: "growth potential"}, {feasibility: "implementation considerations"}}`,
  step13: `Design revenue streams for {{solution}} using the {{modelType}} model. Identify primary, secondary, and potential future streams. Include pricing tiers, add-ons, partnerships, or data monetization. Estimate revenue potential and customer willingness to pay. Respond with {{revenue: "list of streams with descriptions"}, {pricingTiers: "suggested tiers"}, {monetizationPotential: "estimated revenue"}, {customerWTP: "willingness to pay analysis"}}`,
  step14: `Develop a pricing strategy for {{solution}} in the {{modelType}} model. Consider cost-plus, value-based, competition-based, or freemium approaches. Factor in {{persona}} budget constraints, {{market}} size, and {{features}}. Explain pricing logic and why customers will pay. Respond with {{pricing: "strategy with model"}, {tiers: "detailed pricing structure"}, {logic: "rationale and assumptions"}, {customerAcceptance: "expected adoption"}}`,
  step15: `Build competitive moats for {{solution}} to prevent copying. Analyze technology barriers, data advantages, cost efficiencies, network effects, brand strength, and IP protection. Prioritize 2-3 strongest moats. Provide examples of how they'll be implemented. Respond with {{moat: "prioritized list of moats"}, {implementation: "how to build them"}, {examples: "comparable company moats"}, {sustainability: "long-term defensibility"}}`,
  step16: `What assumptions must be true for {{solution}} to succeed? List biggest risks. Respond with {{risks: "your list"}}`,
  step17: `Define your target market for {{solution}} clearly by industry, size, and customer type. Respond with {{market: "your definition"}}`,
  step18: `Estimate Total Addressable Market (TAM) for {{market}}. Explain your calculation method. Respond with {{tam: "your number"}}`,
  step19: `Estimate your Serviceable Available Market (SAM) for {{market}}. Who can you realistically reach? Respond with {{sam: "your number"}}`,
  step20: `Estimate Serviceable Obtainable Market (SOM) for {{market}}. What share can you capture initially? Respond with {{som: "your number"}}`,
  validate_tam_sam_som: `Check if {{tam}} >= {{sam}} >= {{som}}. Respond with {{valid: true/false, message: "details"}}`,
  step21: `What trends or tailwinds support {{market}} growth? Include growth rates if known. Respond with {{growth: "your rate"}}`,
  step22: `List direct and indirect competitors in {{market}}. Explain how {{solution}} differs. Respond with {{landscape: "your description"}}`,
  step23: `How will you enter {{market}} and acquire your first customers? Respond with {{gtm: "your strategy"}}`,
  step24: `What channels will you use to acquire customers in {{market}}? Rank by priority. Respond with {{channels: "your list"}}`,
  step25: `Describe your sales motion for {{market}}: self-serve, inside sales, or enterprise sales. Respond with {{sales: "your strategy"}}`,
  step26: `How will you retain customers and grow revenue in {{market}} over time? Respond with {{retention: "your strategy"}}`,
  step27: `Explain how revenue is generated per customer for {{modelType}} over time. Respond with {{revenueLogic: "your flow"}}`,
  step28: `Provide CAC, LTV, and gross margin assumptions for {{modelType}}. Respond with {{economics: "your details"}}`,
  step29: `List major fixed and variable costs for {{solution}}. Respond with {{costs: "your structure"}}`,
  step30: `Provide 3-year revenue and expense projections for {{solution}}. Respond with {{projections: "your summary"}}`,
  step31: `What is your monthly burn rate and runway for {{solution}}? Respond with {{burn: "your amount"}}`,
  step32: `When does {{solution}} become profitable? Respond with {{breakeven: "your point"}}`,
  step33: `Provide traction, team strength, market size ({{tam}}), and risk level for {{solution}}. Respond with {{inputs: "your details"}}`,
  step34: `Using {{inputs}}, calculate valuation for {{solution}} using blended Scorecard/Berkus/VC/DCF-light. Respond with {{valuation: "your number"}}`,
  step35: `What funding stage are you raising for {{solution}}? (Pre-seed, Seed, Series A, etc.). Respond with {{stage: "your level"}}`,
  step36: `How much capital are you raising for {{solution}} and why? Respond with {{ask: "your number"}}`,
  validate_deck_ask: `Ensure {{valuation}} aligns with {{ask}}. Respond with {{valid: true/false, message: "details"}}`,
  step37: `How will the raised funds for {{solution}} be allocated? Respond with {{use: "your plan"}}`,
  step38: `What is your expected pre-money valuation for {{solution}}? Must align with {{valuation}}. Respond with {{preMoney: "your number"}}`,
  validate_pre_money: `Check {{preMoney}} < {{ask}}. Respond with {{valid: true/false, message: "details"}}`,
  step39: `What type of investors are you targeting for {{solution}}? Respond with {{investors: "your profile"}}`,
  step40: `What milestones will this funding round for {{solution}} unlock? Respond with {{milestones: "your list"}}`,
  step41: `List founding team members and their roles for {{solution}}. Respond with {{team: "your roles"}}`,
  step42: `What key skills are missing in the team for {{solution}} today? Respond with {{gaps: "your skills"}}`,
  step43: `Describe your hiring plan for {{solution}} for the next 12–24 months. Respond with {{hiring: "your plan"}}`,
  step44: `List advisors, board members, or governance structure for {{solution}}. Respond with {{advisors: "your list"}}`,
  step45: `What is the legal structure of the company for {{solution}}? Respond with {{entity: "your type"}}`,
  step46: `How is intellectual property for {{solution}} owned and protected? Respond with {{ip: "your details"}}`,
  step47: `What key contracts and compliance requirements exist for {{solution}}? Respond with {{contracts: "your list"}}`,
  step48: `What legal or regulatory risks could impact an AI-powered legal document review platform? Respond with {{legalRisks: "your list"}}`
};

function fillPrompt(template, ctx) {
  return injectTemplateData(template, ctx);
}

function getPromptForStep(step) {
  return stepPrompts[step] || `Please provide input for ${step}`;
}

const extractFromResponse = extractTemplateData;

const stepNames = {
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
  step48: 'Legal Risks'
};




const modelMap = {
  'system': 'System',
  'step2': 'Idea Model', 'step3': 'Idea Model', 'step4': 'Idea Model', 'step5': 'Idea Model', 'step6': 'Idea Model', 'step7': 'Idea Model', 'step8': 'Idea Model',
  'step9': 'Business Model', 'step10': 'Business Model', 'step11': 'Business Model', 'step12': 'Business Model', 'step13': 'Business Model', 'step14': 'Business Model', 'step15': 'Business Model', 'step16': 'Business Model',
  'step17': 'Marketing Model', 'step18': 'Marketing Model', 'step19': 'Marketing Model', 'step20': 'Marketing Model', 'validate_tam_sam_som': 'Marketing Model', 'step21': 'Marketing Model', 'step22': 'Marketing Model', 'step23': 'Marketing Model', 'step24': 'Marketing Model', 'step25': 'Marketing Model', 'step26': 'Marketing Model',
  'step27': 'Financial Model', 'step28': 'Financial Model', 'step29': 'Financial Model', 'step30': 'Financial Model', 'step31': 'Financial Model', 'step32': 'Financial Model', 'step33': 'Financial Model', 'step34': 'Financial Model', 'step35': 'Financial Model', 'step36': 'Financial Model',
  'validate_deck_ask': 'Financial Model', 'step37': 'Funding Model', 'step38': 'Funding Model', 'validate_pre_money': 'Funding Model', 'step39': 'Funding Model', 'step40': 'Funding Model',
  'step41': 'Team Model', 'step42': 'Team Model', 'step43': 'Team Model', 'step44': 'Team Model',
  'step45': 'Legal Model', 'step46': 'Legal Model', 'step47': 'Legal Model', 'step48': 'Legal Model'
};

const sectionMap = {
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
  'step45': 'Legal Foundations', 'step46': 'Legal Foundations', 'step47': 'Legal Foundations', 'step48': 'Legal Foundations'
};

export const modelCumul = {
  'Idea Model': 7,
  'Business Model': 15,
  'Marketing Model': 26,
  'Financial Model': 37,
  'Funding Model': 42,
  'Team Model': 46,
  'Legal Model': 50
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

export const startupMachine = createMachine({
  id: 'startup',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        START_PROCESS: {
          target: 'processing',
          actions: assign((context, event) => ({
            problem: event.problem || context.problem,
            currentStep: 'step2',
            stepName: 'Problem Analysis',
            currentModel: 'Idea Model',
            currentSection: 'Problem Identification',
            uiStatus: 'processing',
            uiMessage: 'Starting Problem Analysis...',
            completedSteps: 1,
            currentPrompt: fillPrompt(getPromptForStep('step2'), { ...context, problem: event.problem || context.problem })
          }))
        },
        RESET: {
          actions: assign(initialContext)
        }
      }
    },
    processing: {
      on: {
        PAUSE: 'pause',
        RESET: {
          target: 'idle',
          actions: assign(initialContext)
        },
        RECEIVE_RESPONSE: [
          {
            target: 'completed',
            guard: (context, event) => getNextStep(context.currentStep) === 'done',
            actions: assign((context, event) => {
              const extracted = extractFromResponse(event.response || '');
              const updatedContext = mergeTemplateData(context, extracted);
              return {
                ...updatedContext,
                llmResponse: event.response || '',
                currentStep: 'done',
                completedSteps: context.completedSteps + 1,
                uiProgress: 100,
                uiStatus: 'completed',
                uiMessage: '🎉 All 48 steps completed successfully!'
              };
            })
          },
          {
            actions: assign((context, event) => {
              const extracted = extractFromResponse(event.response || '');
              const updatedContext = mergeTemplateData(context, extracted);
              const nextStep = getNextStep(context.currentStep);
              return {
                ...updatedContext,
                llmResponse: event.response || '',
                currentStep: nextStep,
                stepName: stepNames[nextStep] || 'Next Step',
                currentModel: modelMap[nextStep] || 'System',
                currentSection: sectionMap[nextStep] || 'Initialization',
                completedSteps: context.completedSteps + 1,
                uiProgress: Math.min((context.completedSteps + 1) / 48 * 100, 100),
                uiMessage: `Step ${context.completedSteps + 1} complete. Moving to ${stepNames[nextStep] || 'next step'}...`,
                currentPrompt: fillPrompt(getPromptForStep(nextStep), updatedContext)
              };
            })
          }
        ]
      }
    },
    pause: {
      on: {
        RESUME: 'processing',
        RESET: {
          target: 'idle',
          actions: assign(initialContext)
        }
      }
    },
    completed: {
      type: 'final'
    }
  }
});