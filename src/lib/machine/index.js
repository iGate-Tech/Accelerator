import logger from '../logger.js';

// Re-exports from modules for backward compatibility
export { stepOrder, initialContext, getNextStep } from "./constants.js";
export { stepPrompts } from "./prompts.js";
export { stepNames, modelMap, sectionMap, modelCumul } from "./mappings.js";
export {
  machineStore,
  setMachineStore,
  startProcess,
  receiveResponse,
  pause,
  resume,
  reset,
  resetToPreviousStep,
  enterChatMode,
  exitChatMode,
  addChatMessage,
  clearChatMessages,
  fillPrompt,
  getPromptForStep,
  extractDataFromTasks,
} from "./state.js";

// Utility functions
import { extractTemplateData } from "../llm-template.js";

export const extractFromResponse = extractTemplateData;
