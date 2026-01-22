import { validationPromptTemplateWithProblem } from '../../templates.js';

export const validate_tam_sam_som = {
  id: "validate_tam_sam_som",
  name: "Market Validation",
  model: "Marketing Model",
  promptTemplate: validationPromptTemplateWithProblem,
  variables: ["tam", "sam", "som"],
  detailedPrompt: `
Validate the market sizes: Check if Total Addressable Market {{tam}} >= Serviceable Available Market {{sam}} >= Serviceable Obtainable Market {{som}}.
Provide {{valid: true/false}} and {{message: "reasoning for validation result"}}.
`,
  validate: (context) => {
    const tam = parseFloat(context.tam) || 0;
    const sam = parseFloat(context.sam) || 0;
    const som = parseFloat(context.som) || 0;
    const valid = tam >= sam && sam >= som;
    const issues = valid ? [] : ["Market sizes must satisfy TAM >= SAM >= SOM"];
    return { valid, issues };
  },
};