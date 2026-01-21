import { generationPromptTemplate } from '../../templates.js';

export const step58 = {
  id: "step58",
  name: "Business Plan Generation",
  model: "Business Plan Report",
  promptTemplate: generationPromptTemplate,
  variables: ["solution", "market", "tam", "sam", "som", "trends", "coreFeatures", "modelType", "revenue", "pricing", "competitors", "differentiation", "year1", "year2", "year3", "ask", "team"],
  instructions: "Develop a detailed and professional Business Plan for {{solution}} in markdown format. Include executive summary, company description, market analysis ({{market}}, {{tam}}, {{sam}}, {{som}}, {{trends}}), product/service description ({{solution}}, {{coreFeatures}}), business model ({{modelType}}), revenue streams ({{revenue}}), pricing ({{pricing}}), competitive analysis ({{competitors}}, {{differentiation}}), financial projections ({{year1}}, {{year2}}, {{year3}}), funding requirements ({{ask}}), and team overview ({{team}}). Use all extracted variables and ensure the plan is comprehensive and investor-ready with proper sections, tables, and formatting.",
  validate: (context) => ({ valid: true, issues: [] }),
};