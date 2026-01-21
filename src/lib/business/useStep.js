import { createSignal } from 'solid-js';
import { steps, stepNames } from './steps.js';
import { _updateProject } from '../database/projects.js';

export function createStepHook(projectId, onStepChange) {
  const [stepIndex, setStepIndex] = createSignal(0);
  const [uiState, setUiState] = createSignal('idle');
  const [currentResponse, setCurrentResponse] = createSignal(null);
  
  const currentStep = () => steps[stepIndex()];
  const isFirst = () => stepIndex() === 0;
  const isLast = () => stepIndex() >= steps.length - 1;
  const isComplete = () => uiState() === 'completed';
  const progress = () => Math.round((stepIndex() / steps.length) * 100);
  const stepName = () => stepNames[currentStep()?.id] || currentStep()?.name || 'Unknown';

  const persist = async (state = uiState()) => {
    if (!projectId) return;
    
    // Ensure projectId is a string
    const projectIdString = typeof projectId === 'string' ? projectId : String(projectId);
    
    if (!projectIdString) return;
    
    // Ensure all values are plain JavaScript values, not signals or derived values
    const currentStepValue = currentStep();
    const stepIndexValue = Number(stepIndex()) || 0;
    const progressValue = Number(progress()) || 0;
    const stepNameValue = String(stepName()) || 'Unknown Step';
    const uiStateValue = typeof state === 'function' ? String(state()) : String(state);
    
    const completeValue = Boolean(isComplete());
    const lastValue = Boolean(isLast());
    
    const uiMessageValue = completeValue 
      ? 'Completed' 
      : lastValue 
        ? 'Final Step' 
        : `Step ${stepIndexValue + 1} of ${steps.length}`;

    const updates = {
      currentStep: String(currentStepValue?.id || 'system'),
      completedSteps: stepIndexValue,
      stepName: stepNameValue,
      uiProgress: progressValue,
      uiStatus: uiStateValue,
      uiMessage: uiMessageValue
    };

    await _updateProject({
      id: projectIdString,
      updates
    });
  };

  const resetStep = async () => {
    setUiState('idle');
    setCurrentResponse(null);
    await persist('idle');
  };

  const resetProject = async () => {
    setStepIndex(0);
    setUiState('idle');
    setCurrentResponse(null);
    await persist('idle');
  };

  const setInstructions = async (instructions) => {
    await persist('idle');
    return instructions;
  };

  const regenerate = async (callLLM, instructions) => {
    setUiState('processing');
    const prompt = buildPrompt(currentStep(), {}, instructions);
    const response = await callLLM(prompt);
    setCurrentResponse(response);
    setUiState('confirm');
    await persist('confirm');
    return response;
  };

  const confirm = async (output = currentResponse()) => {
    setUiState('idle');
    setCurrentResponse(null);

    if (!isLast()) {
      setStepIndex(s => s + 1);
      await persist('idle');
      if (onStepChange) onStepChange();
    } else {
      setUiState('completed');
      await persist('completed');
    }
  };

  const goToStep = async (index) => {
    if (index >= 0 && index < steps.length) {
      setStepIndex(index);
      setUiState('idle');
      setCurrentResponse(null);
      await persist('idle');
    }
  };

  const loadFromProject = (project) => {
    if (project?.current_step) {
      const idx = steps.findIndex(s => s.id === project.current_step);
      if (idx >= 0) setStepIndex(idx);
    }
    if (project?.ui_status) {
      setUiState(project.ui_status);
    }
  };

  return {
    stepIndex,
    uiState,
    currentResponse,
    setCurrentResponse,
    currentStep,
    isFirst,
    isLast,
    isComplete,
    progress,
    stepName,
    steps,
    stepNames,
    resetStep,
    resetProject,
    setInstructions,
    regenerate,
    confirm,
    goToStep,
    loadFromProject,
    persist
  };
}

function buildPrompt(step, context, instructions) {
  if (!step) return '';
  const template = step.promptTemplate(step.instructions, step.variables, step.outputKeys);
  return injectTemplateData(template, { ...context, ...instructions });
}

function injectTemplateData(template, data) {
  if (!template || !data) return template || '';
  return template.replace(/\{\{(\w+)(?::([^}]*))?\}\}/g, (match, key, defaultValue) => {
    const value = data[key];
    if (value === undefined || value === null) return defaultValue || '';
    return value;
  });
}
