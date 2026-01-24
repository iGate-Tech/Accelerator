import { validationPromptTemplateWithProblem } from '../../templates.js';

export const validate_pre_money = {
  id: "validate_pre_money",
  name: "Valuation Check",
  model: "Funding Model",
  promptTemplate: validationPromptTemplateWithProblem,
  variables: ["preMoney", "ask"],
  instructions: "Validate if {{preMoney}} < {{ask}}.",
  validate: (context) => {
    const preMoney = parseFloat(context.preMoney) || 0;
    const ask = parseFloat(context.ask) || 0;

    // Validation logic: pre-money must be less than funding ask
    // This is a mathematical requirement for any funding round
    const valid = preMoney < ask;

    const issues = valid
      ? []
      : ["Pre-money valuation must be less than funding ask (post-money = pre-money + ask)"];

    return { valid, issues };
  },
};