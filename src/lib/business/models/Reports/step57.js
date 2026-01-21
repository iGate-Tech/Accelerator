import { generationPromptTemplate } from '../../templates.js';

export const step57 = {
  id: "step57",
  name: "Pitch Deck Generation",
  model: "Pitch Deck Report",
  promptTemplate: generationPromptTemplate,
  variables: ["problem", "solution", "tam", "sam", "som", "coreFeatures", "traction", "modelType", "competitors", "year1", "year2", "year3", "team", "ask", "allocation"],
  detailedPrompt: `
Create a comprehensive and extremely professional Pitch Deck for the solution {{solution}} in markdown format.
Include slides for:
- Problem: {{problem}}
- Solution: {{solution}}
- Market Opportunity: TAM {{tam}}, SAM {{sam}}, SOM {{som}}
- Product Demo: {{coreFeatures}}
- Traction: {{traction}}
- Business Model: {{modelType}}
- Competition: {{competitors}}
- Financials: Year 1 {{year1}}, Year 2 {{year2}}, Year 3 {{year3}}
- Team: {{team}}
- Ask: {{ask}}
- Use of Funds: {{allocation}}
Ensure the deck is concise, visually described with slide structures, bullet points, and compelling content.
Embed the full content as {{pitchDeck: "complete markdown pitch deck"}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};