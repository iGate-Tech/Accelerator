const { createMachine, assign } = require('xstate');
const { injectTemplateData, extractTemplateData } = require('./public/js/llm-template.js');

const updateDataTree = (data, context) => {
  const templatableKeys = [
    'problem', 'strugglers', 'alternatives', 'gaps', 'persona', 'urgency', 'evidence', 'solution',
    'valueProp', 'features', 'modelType', 'revenue', 'pricing', 'moat', 'risks', 'economics',
    'revenueLogic', 'costs', 'projections', 'burn', 'breakeven', 'inputs', 'valuation', 'preMoney',
    'investors', 'milestones', 'team', 'hiring', 'advisors', 'entity', 'ip', 'contracts', 'legalRisks',
    'market', 'tam', 'sam', 'som', 'growth', 'channels', 'sales', 'retention', 'gtm', 'landscape', 'valid', 'message'
  ];
  if (!data) return context;
  const updatedContext = { ...context };
  for (const key of Object.keys(data)) {
    if (templatableKeys.includes(key)) {
      updatedContext[key] = data[key];
    }
  }
  return updatedContext;
};

function fillPrompt(template, ctx) {
   console.log('ctx keys:', Object.keys(ctx));
   console.log('ctx.problem:', ctx.problem);
   const fullPrompt = prompts.system + '\n\n' + injectTemplateData(template, ctx);
   return fullPrompt;
}

function extractFromResponse(response) {
  return extractTemplateData(response);
}

// Static prompts
const prompts = {
  system: `You are the iGate Accelerator Agent — an expert AI assistant guiding entrepreneurs through a rigorous 48-step startup validation and acceleration process.

Your mission is to deliver clear, complete, and actionable guidance for each step. Every response must be practical, data-driven, and aligned with real-world startup best practices. Think like a startup advisor, venture analyst, and product strategist combined.

OUTPUT FORMAT (MANDATORY)

You MUST use the LLMTemplate placeholder format for all structured outputs.

Unfilled placeholder:
{{key}}

Filled placeholder:
{{key: JSON}}

Rules:
- The placeholder key MUST match the expected output variable name (for example: solution, analysis, assumptions, next_steps)
- The placeholder value MUST be valid JSON (string, object, or array)
- Do NOT include explanations outside placeholders unless explicitly requested

Examples:
{{solution: "A detailed explanation of the proposed startup solution"}}

Multiple outputs:
{{analysis: "Market and user analysis"}}
{{recommendation: "Clear next-step recommendation"}}

CONTENT REQUIREMENTS

For every response:
- Fully answer the question
- No shallow or partial responses
- Break complex ideas into clear steps
- Use structured reasoning
- Reference real-world examples when relevant
- Clearly state assumptions when making recommendations
- Prioritize clarity, precision, and usefulness

Your responses should help founders:
- Validate ideas
- Reduce uncertainty
- Make confident decisions
- Progress to the next validation step

STYLE AND TONE

- Professional
- Encouraging
- Objective
- Evidence-based
- Practical
- No hype, no fluff

STRICT RULES

- Always respect the LLMTemplate grammar
- Never output invalid JSON inside placeholders
- Never invent placeholder keys
- Never omit required placeholders
- Never mix markdown formatting inside placeholders

You are not a chatbot.
You are a structured reasoning engine embedded in a bidirectional template system.`,
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
  step39: `What type of investors are you targeting for {{solution}}? Respond with {{investors: "your profile"}}`,
  step40: `What milestones will this funding round for {{solution}} unlock? Respond with {{milestones: "your list"}}`,
  step37: `How will the raised funds for {{solution}} be allocated? Respond with {{use: "your plan"}}`,
  step38: `What is your expected pre-money valuation for {{solution}}? Must align with {{valuation}}. Respond with {{preMoney: "your number"}}`,
  validate_pre_money: `Check {{preMoney}} < {{ask}}. Respond with {{valid: true/false, message: "details"}}`,
  step41: `List founding team members and their roles for {{solution}}. Respond with {{team: "your roles"}}`,
  step42: `What key skills are missing in the team for {{solution}} today? Respond with {{gaps: "your skills"}}`,
  step43: `Describe your hiring plan for {{solution}} for the next 12–24 months. Respond with {{hiring: "your plan"}}`,
  step44: `List advisors, board members, or governance structure for {{solution}}. Respond with {{advisors: "your list"}}`,
  step45: `What is the legal structure of the company for {{solution}}? Respond with {{entity: "your type"}}`,
  step46: `How is intellectual property for {{solution}} owned and protected? Respond with {{ip: "your details"}}`,
  step47: `What key contracts and compliance requirements exist for {{solution}}? Respond with {{contracts: "your list"}}`,
  step48: `What legal or regulatory risks could impact an AI-powered legal document review platform? Respond with {{legalRisks: "your list"}}`
};

// Initial context - minimal dynamic data
const initialContext = {
  systemPrompt: '',
  problem: 'Time-consuming and error-prone legal document review processes in law firms',
  solution: "an AI-powered legal document review platform",
  vote: 0,
  lastStepTime: 0, // For rate limiting
  currentPrompt: '',
  llmResponse: '',
  pendingResponse: ''
};

// XState Machine with flat states to avoid nesting issues
const startupMachine = createMachine({
  id: 'startup',
  initial: 'system',
  context: {},
  guards: {
    rateLimit: (ctx, event) => Date.now() - ctx.lastStepTime >= 15000
  },
  states: {
    system: {
      entry: assign(({ context }) => ({ ...context, ...initialContext, currentPrompt: prompts.system })),
      on: { NEXT: { target: 'step2', actions: assign({ lastStepTime: Date.now() }) } }
    },
     step2: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step2, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step3' }
       }
     },
     step3: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step3, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step4' }
       }
     },
     step4: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step4, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step5' }
       }
     },
     step5: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step5, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step6' }
       }
     },
     step6: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step6, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step7' }
       }
     },
     step7: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step7, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step8' }
       }
     },
     step8: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step8, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step9' }
       }
     },
     step9: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step9, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step10' }
       }
     },
     step10: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step10, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step11' }
       }
     },
     step11: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step11, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step12' }
       }
     },
     step12: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step12, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step13' }
       }
     },
     step13: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step13, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step14' }
       }
     },
     step14: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step14, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step15' }
       }
     },
     step15: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step15, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step16' }
       }
     },
     step16: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step16, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step17' }
       }
     },
     step17: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step17, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step18' }
       }
     },
     step18: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step18, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step19' }
       }
     },
     step19: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step19, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step20' }
       }
     },
     step20: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step20, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'validate_tam_sam_som' }
       }
     },
     validate_tam_sam_som: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.validate_tam_sam_som, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step21' }
       }
     },
     step21: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step21, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step22' }
       }
     },
     step22: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step22, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step23' }
       }
     },
     step23: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step23, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step24' }
       }
     },
     step24: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step24, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step25' }
       }
     },
     step25: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step25, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step26' }
       }
     },
     step26: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step26, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step27' }
       }
     },
     step27: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step27, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step28' }
       }
     },
     step28: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step28, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step29' }
       }
     },
     step29: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step29, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step30' }
       }
     },
     step30: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step30, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step31' }
       }
     },
     step31: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step31, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step32' }
       }
     },
     step32: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step32, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step33' }
       }
     },
     step33: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step33, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step34' }
       }
     },
     step34: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step34, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step35' }
       }
     },
     step35: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step35, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step36' }
       }
     },
     step36: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step36, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'validate_deck_ask' }
       }
     },
     validate_deck_ask: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.validate_deck_ask, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step37' }
       }
     },
     step37: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step37, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step38' }
       }
     },
     step38: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step38, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'validate_pre_money' }
       }
     },
     validate_pre_money: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.validate_pre_money, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step39' }
       }
     },
     step39: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step39, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step40' }
       }
     },
     step40: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step40, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step41' }
       }
     },
     step41: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step41, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step42' }
       }
     },
     step42: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step42, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step43' }
       }
     },
     step43: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step43, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step44' }
       }
     },
     step44: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step44, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step45' }
       }
     },
     step45: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step45, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step46' }
       }
     },
     step46: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step46, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step47' }
       }
     },
     step47: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step47, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'step48' }
       }
     },
     step48: {
       entry: assign({
         currentPrompt: ({ context }) => fillPrompt(prompts.step48, context)
       }),
       on: {
         NEXT: { actions: assign({ lastStepTime: () => Date.now() }) },
         SET_PENDING_RESPONSE: { actions: assign(({ context }) => ({ ...context, pendingResponse: global.response })) },
         RECEIVE_RESPONSE: { actions: assign(({ context }) => updateDataTree(extractFromResponse(context.pendingResponse), { ...context, llmResponse: context.pendingResponse })), target: 'done' }
       }
     },
    done: {
      type: 'final',
      entry: assign({
        reports: ({ context }) => ({
          pitchDeck: generatePitchDeck(context),
          businessPlan: generateBusinessPlan(context),
          valuation: generateValuation(context)
        })
      })
    }
  }
});

// Report generation functions
function generatePitchDeck(ctx) {
  return `# Pitch Deck
## Problem
${ctx.problem}

## Solution
${ctx.solution}

## Value Proposition
${ctx.valueProp || 'AI-powered automation'}

## Market
${ctx.market || 'Legal tech'}

## Team
${ctx.team || 'Experienced founders'}

## Ask
${ctx.ask || '$2M'}
`;
}

function generateBusinessPlan(ctx) {
  return `# Business Plan
## Executive Summary
${ctx.solution}

## Problem
${ctx.problem}

## Solution
${ctx.solution}

## Market Analysis
TAM: ${ctx.tam}, SAM: ${ctx.sam}, SOM: ${ctx.som}

## Financial Projections
${ctx.projections}

## Funding
${ctx.ask} at ${ctx.preMoney}
`;
}

function generateValuation(ctx) {
  return `# Valuation Report
## Inputs
${ctx.inputs}

## Valuation
${ctx.valuation}

## Pre-Money
${ctx.preMoney}
`;
}

module.exports = { startupMachine };