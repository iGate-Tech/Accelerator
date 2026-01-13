import { stepsConfig } from "./stepsConfig.js";
import logger from '../logger.js';


// Auto-generated prompts from stepsConfig using template functions
export const stepPrompts = Object.fromEntries(
  stepsConfig
    .filter((step) => step.prompt) // Skip steps without prompts (like "done")
    .map((step) => [
      step.id,
      step.prompt.template(
        step.prompt.instructions,
        step.prompt.variables,
        step.prompt.outputKeys,
      ),
    ]),
);
