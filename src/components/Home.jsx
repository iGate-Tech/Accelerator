import { createSignal, For, createResource, onMount, createEffect, Show, createMemo } from "solid-js";
import { machineStore, startProcess, receiveResponse, pause, resume, reset, modelCumul, stepOrder } from "../lib/machine";
import { getTasks, addTask, addMessage, clearAllTasks, clearAllMessages, updateTask, saveProgress, loadProgress } from "../lib/db";
import { setMachineStore } from "../lib/machine";
import { marked } from 'marked';
import { renderFilledTemplate } from '../lib/llm-template';

const Tasks = () => {
  const [prompt, setPrompt] = createSignal("");
  const [tasks, { refetch }] = createResource(getTasks);
  const [streamingContent, setStreamingContent] = createSignal("");
  const [isAccordionOpen, setIsAccordionOpen] = createSignal(false);
  const [editingTaskId, setEditingTaskId] = createSignal(null);
  const [editContent, setEditContent] = createSignal("");
    const [agentBoxClass, setAgentBoxClass] = createSignal("fixed inset-0 bg-base-200 transition-all duration-500 ease-in-out z-50 flex justify-center items-center");
    const [agentContentClass, setAgentContentClass] = createSignal("relative max-w-2xl");
    const [greetingClass, setGreetingClass] = createSignal("text-center py-0 h-0 overflow-hidden transition-all duration-300 opacity-0");
    const [error, setError] = createSignal("");
    const [isLoading, setIsLoading] = createSignal(false);
    const [autoProgress, setAutoProgress] = createSignal(false);
    const [tasksList, setTasksList] = createSignal([]);

    const currentContent = createMemo(() => streamingContent() || machineStore.context.llmResponse);

    // Load initial tasks - removed for now

  let cardRef;

  const advanceToNextStep = () => {
    setMachineStore('context', (prev) => {
      const nextStep = getNextStep(prev.currentStep);
      if (nextStep === 'done') {
        setMachineStore('state', 'completed');
        return {
          ...prev,
          currentStep: 'done',
          uiProgress: 100,
          uiStatus: 'completed',
          uiMessage: '🎉 All 48 steps completed successfully!'
        };
      } else {
        const isSystem = prev.currentStep === 'system';
        const newCompletedSteps = isSystem ? 1 : prev.completedSteps + 1;
        const progress = (newCompletedSteps / 48) * 100;
        const message = isSystem ? 'Initialization complete. Starting step 1...' : `Step ${newCompletedSteps} complete. Moving to ${stepNames[nextStep] || 'next step'}...`;
        return {
          ...prev,
          currentStep: nextStep,
          stepName: stepNames[nextStep] || 'Next Step',
          currentModel: modelMap[nextStep] || 'System',
          currentSection: sectionMap[nextStep] || 'Initialization',
          completedSteps: newCompletedSteps,
          uiProgress: Math.min(progress, 100),
          uiMessage: message,
          currentPrompt: fillPrompt(getPromptForStep(nextStep), { ...prev, currentStep: nextStep })
        };
      }
    });
  };

  const handleLLMCall = async (prompt) => {
    // Rate limit: 4 requests per minute (15 seconds between calls after the first)
    if (machineStore.context.completedSteps > 0) {
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    try {
      const result = await callLLM(prompt);
      await addMessage({ type: 'user', content: prompt });
      await addMessage({ type: 'ai', content: result });
      receiveResponse(result, setAutoProgress, setTasksList, tasksList);
      setStreamingContent('');
      setTasksList([...tasksList(), newTask]);
    } catch (e) {
      console.log('LLM call failed, advancing to next step:', e.message);
      advanceToNextStep();
      setAutoProgress(true);
    }
  };

  const callLLM = async (prompt, retryCount = 0) => {
    try {
      if (retryCount === 0) setError("");
      setIsLoading(true);
      const response = await fetch('/api/llm/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) {
        if (response.status === 429) {
          const waitTime = 60000 * (2 ** retryCount); // Exponential backoff: 60s, 120s, 240s, etc.
          setError(`Rate limit hit. Retrying in ${waitTime / 1000} seconds... (Attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return callLLM(prompt, retryCount + 1);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value, { stream: true }));
        setStreamingContent(chunks.join(''));
        // Small delay to ensure UI updates are visible
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return chunks.join('');
    } catch (e) {
      setError(`Failed to get AI response: ${e.message}`);
      // Continue to next step on any error, only pause on button press
      setAutoProgress(true);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setGreetingClass("text-center py-0 h-0 overflow-hidden transition-all duration-300 opacity-0");
    setAgentBoxClass("fixed bottom-0 left-0 right-0 bg-transparent z-50 w-full h-auto flex justify-center items-start");
    setStreamingContent("");
    setIsAccordionOpen(true);
    startProcess(prompt());
    await handleLLMCall(machineStore.context.currentPrompt);
  };

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
    setAutoProgress(true);
    setIsAccordionOpen(true);
  };

  const handleImprove = async () => {
    const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential: ${machineStore.context.currentPrompt}`;
    setStreamingContent("");
    try {
      const result = await callLLM(improvedPrompt);
      await addMessage({ type: 'user', content: improvedPrompt });
      await addMessage({ type: 'ai', content: result });
      receiveResponse(result, setAutoProgress, setTasksList, tasksList);
      setStreamingContent('');
    } catch (e) {
      // Error handled
    }
  };

  const handleSuggest = async () => {
    const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Provide a brief description, target market, and unique value proposition.`;
    setStreamingContent("");
    try {
      const result = await callLLM(suggestPrompt);
      await addMessage({ type: 'user', content: suggestPrompt });
      await addMessage({ type: 'ai', content: result });
      receiveResponse(result, setAutoProgress, setTasksList, tasksList);
      setStreamingContent('');
    } catch (e) {
      // Error handled
    }
  };

  const handleReset = async () => {
    reset();
    setStreamingContent('');
    setError('');
    setAutoProgress(false);
    setTasksList([]);
    setIsAccordionOpen(false);
    await clearAllTasks();
    await clearAllMessages();
  };

  const handleSaveProgress = async () => {
    await saveProgress({state: machineStore.state, context: machineStore.context});
  };

  const getBadgeClass = () => {
    const classes = {
      idle: 'badge-neutral',
      processing: 'badge-primary',
      pause: 'badge-warning',
      completed: 'badge-success'
    };
    return classes[machineStore.state] || 'badge-neutral';
  };

  const getStateIcon = () => {
    const icons = {
      idle: 'clock',
      processing: 'cog',
      pause: 'pause',
      completed: 'check'
    };
    return icons[machineStore.state] || 'help-circle';
  };

  const getModelIcon = (model) => {
    const icons = {
      'Idea Model': 'lightbulb',
      'Business Model': 'briefcase',
      'Financial Model': 'dollar-sign',
      'Funding Model': 'trending-up',
      'Marketing Model': 'megaphone',
      'Team Model': 'users',
      'Legal Model': 'scale',
      'System': 'settings'
    };
    return icons[model] || 'help-circle';
  };

  onMount(async () => {
    // Create Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Load progress
    const progress = await loadProgress();
    if (progress) {
      setMachineStore(progress);
    }

    // Load tasks
    const loadedTasks = await getTasks();
    setTasksList(loadedTasks);
  });

  createEffect(() => {
    if (autoProgress() && !isLoading() && machineStore.state === 'processing') {
      setAutoProgress(false);
      handleLLMCall(machineStore.context.currentPrompt);
    }
  });

  createEffect(() => {
    if (cardRef) {
      let animationId;
      let startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = elapsed * 0.001; // time in seconds

        // Smooth oscillating values using sine waves
        const x = Math.sin(t * 0.2) * 15; // -15 to 15
        const y = Math.sin(t * 0.1) * 12; // -12 to 12
        const blur = 25 + Math.sin(t * 0.3) * 15; // 10 to 40
        const spread = Math.sin(t * 0.15) * 5; // -5 to 5

        // Smooth color transition
        const hue = (t * 20) % 360; // Cycle through hues faster
        const color = `hsla(${hue}, 40%, 60%, 0.4)`;

        cardRef.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;

        animationId = requestAnimationFrame(animate);
      };

      // Start animating after a short delay
      setTimeout(() => {
        animationId = requestAnimationFrame(animate);
      }, 1000);
    }
  });

  return (
    <div class="relative flex flex-col">
      {/* AI Agent Work Space Section */}
      <div class="flex-1 overflow-y-auto p-4">
         <div id="contentDiv" class="max-w-6xl mx-auto space-y-6 pb-48">

             {/* All Tasks */}
             <For each={tasksList()}>
               {(task) => (
                 <div class="card bg-base-100 shadow-md">
                   <div class="card-body">
                     <Show when={editingTaskId() === task.id} fallback={
                       <>
                         <div class="prose" innerHTML={marked.parse(renderFilledTemplate(task.content))}></div>
                         <div class="flex gap-2 mt-2">
                           <button onClick={() => { setEditingTaskId(task.id); setEditContent(task.content); }} class="btn btn-xs">Edit</button>
                         </div>
                       </>
                     }>
                       <textarea value={editContent()} onInput={(e) => setEditContent(e.target.value)} class="textarea textarea-bordered w-full"></textarea>
                       <div class="flex gap-2 mt-2">
                         <button onClick={async () => { await updateTask(task.id, editContent()); setTasksList(tasksList().map(t => t.id === task.id ? {...t, content: editContent()} : t)); setEditingTaskId(null); }} class="btn btn-xs btn-primary">Save</button>
                         <button onClick={() => setEditingTaskId(null)} class="btn btn-xs">Cancel</button>
                       </div>
                     </Show>
                     <div class="text-sm text-gray-500">{new Date(task.timestamp).toLocaleString()} - {task.model}</div>
                   </div>
                 </div>
               )}
             </For>

             {/* Streaming Response */}
             <Show when={isLoading() && currentContent()}>
               <div class="card bg-base-100 shadow-md">
                 <div class="card-body">
                   <div class="prose" innerHTML={marked.parse(currentContent())}></div>
                   <div class="text-sm text-gray-500">Streaming... - {machineStore.context.currentModel}</div>
                 </div>
               </div>
             </Show>
        </div>
      </div>

      <div id="agentBox" class={agentBoxClass()}>
         <div id="agentContent" class={agentContentClass()}>
          <div class="flex flex-col gap-4 p-6">
            <div id="greetingDiv" class={greetingClass()}>
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-sans font-light text-base-content mb-2 sm:mb-2">
                Hi <span class='text-primary'>Ahmed</span>, what's your next big idea?
              </h1>
            </div>
            <div ref={cardRef} class="card-q gap-0 card bg-base-100 border border-base-200 shadow-2xl shadow-primary drop-shadow-md rounded-box">
              <div class="card-body relative p-4 !gap-0">
                <div class="collapse collapse-arrow bg-base-100 py-0">
                  <input
                    type="checkbox"
                    class="p-0"
                    name="ai-tasks-accordion"
                    checked={isAccordionOpen()}
                    onChange={() => setIsAccordionOpen(!isAccordionOpen())}
                  />
                    <div class="collapse-title font-semibold text-primary flex items-center gap-4 !p-0">
                      <Show when={machineStore.state === 'processing' || isLoading()}>
                        <span class="loading loading-spinner loading-primary loading-sm"></span>
                      </Show>
                      <span id="stepDisplay">
                        {machineStore.state === 'idle' ? 'System - Initialization' : `${machineStore.context.currentModel} - ${machineStore.context.currentSection} - ${machineStore.context.stepName}`}
                      </span>
                      <span id="agent-status-badge" class={`badge ${getBadgeClass()} badge-sm flex items-center gap-1`}>
                        <i data-lucide={getStateIcon()} class="w-3 h-3"></i>
                        {machineStore.context.uiStatus}
                      </span>
                   </div>
                  <div class="collapse-content p-0">
                     {/* Task Stats */}
                     <div class="flex flex-wrap gap-2 mt-4">
                       <div class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                         <i data-lucide="list" class="w-3 h-3"></i>
                         Total Tasks: {stepOrder.length - 1}
                       </div>
                        <div class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                          <i data-lucide="check-circle" class="w-3 h-3"></i>
                          Completed: {machineStore.context.completedSteps}
                        </div>
                        <div class="bg-accent/10 text-accent px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                          <i data-lucide="activity" class="w-3 h-3"></i>
                          In Progress: {machineStore.state === 'processing' ? 1 : 0}
                        </div>
                        <div class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                          <i data-lucide="clock" class="w-3 h-3"></i>
                          Est. Time: {Math.round(((stepOrder.length - 1 - machineStore.context.completedSteps) * 15 / 60) * 10) / 10} min
                        </div>
                        <div class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                          <i data-lucide="dollar-sign" class="w-3 h-3"></i>
                          Credits: {machineStore.context.completedSteps * 10}
                        </div>
                       <div class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                         <i data-lucide="trending-up" class="w-3 h-3"></i>
                         Est. Credits: {(stepOrder.length - 1) * 10}
                       </div>
                     </div>
                    <div class="space-y-4">
                      {/* Database Setup */}
                      <div class="card">
                        <div class="card-body p-1">
                          <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-0">
                            <legend class="fieldset-legend text-primary">Task Steps</legend>
                             <div class="grid grid-cols-2 gap-4">
                               <For each={[
                                 { name: 'Idea Model', icon: 'lightbulb', color: 'warning' },
                                 { name: 'Business Model', icon: 'briefcase', color: 'primary' },
                                 { name: 'Financial Model', icon: 'dollar-sign', color: 'success' },
                                 { name: 'Funding Model', icon: 'trending-up', color: 'secondary' },
                                 { name: 'Marketing Model', icon: 'megaphone', color: 'accent' },
                                 { name: 'Team Model', icon: 'users', color: 'info' },
                                 { name: 'Legal Model', icon: 'scale', color: 'error' }
                               ]}>
                                 {(model) => (
                                   <label class="label cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={machineStore.context.completedSteps >= modelCumul[model.name]}
                                        class={`checkbox checkbox-xs checkbox-${model.color}`}
                                        disabled
                                      />
                                     <span class="label-text flex items-center gap-1">
                                       <i data-lucide={model.icon} class="w-3 h-3"></i>
                                       {model.name}
                                     </span>
                                   </label>
                                 )}
                               </For>
                             </div>
                          </fieldset>
                           <div class="mt-1 flex items-center gap-2">
                              <progress
                                id="agent-progress"
                                class="progress progress-primary flex-1 h-2"
                                value={machineStore.context.uiProgress}
                                max="100"
                              ></progress>
                               <span class="badge badge-primary badge-xs">{machineStore.context.completedSteps} / {stepOrder.length - 1} Complete</span>
                           </div>

                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                {/* Form */}
                <form id="taskForm">
                  <input type="hidden" name="action" id="action" value="send" />
                  <input type="hidden" name="taskContent" value="" />
                  <input type="hidden" name="taskTimestamp" value={new Date().toLocaleString()} />
                  <input type="hidden" name="taskModel" value="Llama-3.2-3B-Free" />
                    <textarea
                      name="prompt"
                      id="promptTextarea"
                       class={`custom-textarea text-base-content text-lg sm:text-xl md:text-2xl placeholder:text-base-content placeholder:text-lg sm:placeholder:text-xl md:placeholder:text-2xl focus:ring-0 active:ring-0 ${machineStore.state !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                       placeholder="Enter your problem statement here..."
                       value={prompt()}
                       onInput={(e) => setPrompt(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           if (machineStore.state === 'idle') handleStart();
                         }
                       }}
                       disabled={machineStore.state !== 'idle'}
                    ></textarea>
                    <Show when={machineStore.state === 'pause'}>
                      <div class="text-warning text-sm mt-2">Agent is paused. Click Resume to continue.</div>
                    </Show>
                  <div class="flex justify-between items-center mt-2">
                     <div class="flex gap-2">
                       <button type="button" onClick={handleImprove} class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                         <i data-lucide="sparkles" class="w-3 h-3"></i>
                         Improve with AI
                       </button>
                       <button type="button" onClick={handleSuggest} class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer">
                         <i data-lucide="lightbulb" class="w-3 h-3"></i>
                         AI Suggestion
                       </button>
                        <button type="button" onClick={handleReset} class="bg-error/10 text-error px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-error/20 transition cursor-pointer">
                          <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                          Reset
                        </button>
                        <button type="button" onClick={handleSaveProgress} class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-info/20 transition cursor-pointer">
                          <i data-lucide="save" class="w-3 h-3"></i>
                          Save Progress
                        </button>
                     </div>
                      <Show when={machineStore.state === 'idle'}>
                        <button
                          type="button"
                          class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer"
                          onClick={handleStart}
                        >
                          <i data-lucide="play" class="w-3 h-3"></i>
                          Start
                        </button>
                      </Show>
                      <Show when={machineStore.state === 'processing'}>
                        <button
                          type="button"
                          class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-warning/20 transition cursor-pointer"
                          onClick={handlePause}
                        >
                          <i data-lucide="pause" class="w-3 h-3"></i>
                          Pause
                        </button>
                      </Show>
                      <Show when={machineStore.state === 'pause'}>
                        <button
                          type="button"
                          class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer"
                          onClick={handleResume}
                        >
                          <i data-lucide="play" class="w-3 h-3"></i>
                          Resume
                        </button>
                      </Show>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step names from machine
const stepNames = {
  step2: 'Problem Analysis',
  step3: 'Severity Assessment',
  step4: 'Current Solutions',
  step5: 'Solution Gaps',
  step6: 'User Persona',
  step7: 'Urgency Assessment',
  step8: 'Problem Validation',
  step9: 'Solution Design',
  step10: 'Value Proposition',
  step11: 'Key Features',
  step12: 'Business Model',
  step13: 'Revenue Streams',
  step14: 'Pricing Strategy',
  step15: 'Competitive Moats',
  step16: 'Risk Analysis',
  step17: 'Target Market',
  step18: 'Total Addressable Market',
  step19: 'Serviceable Available Market',
  step20: 'Serviceable Obtainable Market',
  validate_tam_sam_som: 'Market Validation',
  step21: 'Market Trends',
  step22: 'Competitive Landscape',
  step23: 'Market Entry',
  step24: 'Customer Acquisition',
  step25: 'Sales Strategy',
  step26: 'Customer Retention',
  step27: 'Revenue Logic',
  step28: 'Unit Economics',
  step29: 'Cost Structure',
  step30: 'Financial Projections',
  step31: 'Monthly Burn Rate',
  step32: 'Profitability Timeline',
  step33: 'Valuation Inputs',
  step34: 'Company Valuation',
  step35: 'Funding Stage',
  step36: 'Funding Amount',
  validate_deck_ask: 'Funding Validation',
  step37: 'Fund Allocation',
  step38: 'Pre-Money Valuation',
  validate_pre_money: 'Valuation Check',
  step39: 'Target Investors',
  step40: 'Funding Milestones',
  step41: 'Founding Team',
  step42: 'Team Gaps',
  step43: 'Hiring Plan',
  step44: 'Advisors & Board',
  step45: 'Legal Structure',
  step46: 'IP Protection',
  step47: 'Contracts & Compliance',
  step48: 'Legal Risks'
};

export default Tasks;