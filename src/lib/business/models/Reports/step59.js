import { generationPromptTemplate } from '../../templates.js';

export const step59 = {
  id: "step59",
  name: "Valuation Report Generation",
  model: "Valuation Report",
  promptTemplate: generationPromptTemplate,
  variables: ["tam", "sam", "som", "traction", "team", "marketSize", "risk", "burnRate", "runway", "breakeven"],
  instructions: "Generate a comprehensive and extremely professional Valuation Report for {{solution}} in markdown format. Include executive summary, methodology overview (Scorecard, Berkus, VC, DCF-light), detailed calculations with assumptions, sensitivity analysis, and conclusion. Use all relevant data such as {{tam}}, {{sam}}, {{som}}, {{traction}}, {{team}}, {{marketSize}}, {{risk}}, {{burnRate}}, {{runway}}, {{breakeven}}, etc. Ensure the report is investor-ready with proper formatting, tables, and charts descriptions.",
  validate: (context) => ({ valid: true, issues: [] }),
};