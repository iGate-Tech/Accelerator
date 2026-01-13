
// Re-exports from modules for backward compatibility
export { stepOrder, initialContext, getNextStep, persistableFields } from './machine/constants.js';
export { stepPrompts } from './machine/prompts.js';
export { stepNames, modelMap, sectionMap, modelCumul } from './machine/mappings.js';
export { machineStore, setMachineStore, startProcess, receiveResponse, pause, resume, reset, fillPrompt, getPromptForStep, extractDataFromTasks } from './machine/state.js';

// Utility functions
import { extractTemplateData } from './llm-template.js';

export const extractFromResponse = extractTemplateData;