import { createStore } from "solid-js/store";
import {
  extractTemplateData,
  injectTemplateData,
  mergeTemplateData,
} from "../llm-template.js";
import { stepOrder, initialContext } from "./constants.js";
import { stepPrompts } from "./prompts.js";
import { stepNames, modelMap, sectionMap } from "./mappings.js";
import { stepsConfig } from "./stepsConfig.js";

// Config-driven next step helper
const getNextStep = (currentStep) => {
  const currentStepConfig = stepsConfig.find((step) => step.id === currentStep);
  return currentStepConfig?.transitions?.next || "done";
};

export const fillPrompt = (template, ctx) => {
  return injectTemplateData(template, ctx);
};

export const getPromptForStep = (step) => {
  return stepPrompts[step] || `Please provide input for ${step}`;
};

export const [machineStore, setMachineStore] = createStore({
  state: "idle",
  context: initialContext,
});

export const startProcess = (problem) => {
  setMachineStore("state", "processing");
  setMachineStore("context", (prev) => ({
    ...prev,
    problem: problem || prev.problem,
    currentStep: "system",
    stepName: "Initialization",
    currentModel: "System",
    currentSection: "Initialization",
    uiStatus: "processing",
    uiMessage: "Starting initialization...",
    completedSteps: 0,
    currentPrompt: fillPrompt(getPromptForStep("system"), {
      ...prev,
      problem: problem || prev.problem,
    }),
  }));
};

export const receiveResponse = async (
  response,
  setAutoProgress,
  setTasksList,
  tasksList,
  addTask,
) => {
  if (typeof response === "undefined") {
    console.error("receiveResponse called with undefined response");
    throw new Error("Received undefined response from LLM");
  }

  // Add the response as a task
  const currentStep = machineStore.context.currentStep;
  const newTask = {
    content: response,
    model: modelMap[currentStep] || "Unknown",
    llm_model: "Llama-3.2-3B-Free",
    section: sectionMap[currentStep] || "Unknown",
    stepName: stepNames[currentStep] || "Unknown",
    step: currentStep,
    prompt: machineStore.context.currentPrompt || "",
    timestamp: new Date().toISOString(),
  };
  setTasksList([...(tasksList() || []), newTask]);
  if (addTask) await addTask(newTask);

  const nextStep = getNextStep(machineStore.context.currentStep);
  if (nextStep === "done") {
    setMachineStore("context", (prev) => {
      const extracted = extractTemplateData(response || "");
      let dataToMerge = extracted;
      if (extracted.response && typeof extracted.response === "object") {
        dataToMerge = extracted.response;
      }
      const updatedCtx = mergeTemplateData(prev, dataToMerge);
      return {
        ...updatedCtx,
        llmResponse: response || "",
        currentStep: "done",
        completedSteps: prev.completedSteps + 1,
        uiProgress: 100,
        uiStatus: "completed",
        uiMessage: "🎉 All 51 steps completed successfully!",
      };
    });
  } else {
    setMachineStore("context", (prev) => {
      const extracted = extractTemplateData(response || "");
      let dataToMerge = extracted;
      if (extracted.response && typeof extracted.response === "object") {
        dataToMerge = extracted.response;
      }
      const updatedContextElse = mergeTemplateData(prev, dataToMerge);
      console.log("Extracted data:", dataToMerge);
      const isSys = prev.currentStep === "system";
      if (isSys) {
        updatedContextElse.greeting = response;
        updatedContextElse.acknowledgment =
          "Problem acknowledged and ready to proceed.";
      }
      const newCompletedSteps = isSys ? 1 : prev.completedSteps + 1;
      const progress = Math.min((newCompletedSteps / 51) * 100, 100);
      const message = isSys
        ? "Initialization complete. Starting step 1..."
        : `Step ${newCompletedSteps} complete. Moving to ${stepNames[nextStep] || "next step"}...`;
      return {
        ...updatedContextElse,
        llmResponse: response || "",
        currentStep: nextStep,
        stepName: stepNames[nextStep] || "Next Step",
        currentModel: modelMap[nextStep] || "System",
        currentSection: sectionMap[nextStep] || "Initialization",
        completedSteps: newCompletedSteps,
        uiProgress: Math.floor(progress),
        uiMessage: message,
        currentPrompt: fillPrompt(
          getPromptForStep(nextStep),
          updatedContextElse,
        ),
      };
    });
    if (setAutoProgress) setAutoProgress(true);
  }
};

export const pause = () => {
  setMachineStore("state", "pause");
};

export const resume = () => {
  setMachineStore("state", "processing");
};

export const reset = () => {
  setMachineStore("state", "idle");
  setMachineStore("context", initialContext);
};
