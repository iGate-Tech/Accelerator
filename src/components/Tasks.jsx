import { createSignal, For, createResource, onMount, createEffect, Show } from "solid-js";
import { useMachine } from "@xstate/solid";
import { startupMachine, modelCumul, stepOrder } from "../lib/machine";
import { getTasks, addTask, addMessage } from "../lib/db";
import { marked } from 'marked';

const Tasks = () => {
  const [state, send] = useMachine(startupMachine);
  const [prompt, setPrompt] = createSignal("");
  const [tasks] = createResource(getTasks);
  const [streamingContent, setStreamingContent] = createSignal("");
  const [isAccordionOpen, setIsAccordionOpen] = createSignal(false);
   const [agentBoxClass, setAgentBoxClass] = createSignal("fixed inset-0 bg-base-200 transition-all duration-500 ease-in-out z-50");
   const [agentContentClass, setAgentContentClass] = createSignal("absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl");
   const [greetingClass, setGreetingClass] = createSignal("text-center py-4 transition-all duration-300");

  let cardRef;

  const callLLM = async (prompt) => {
    const response = await fetch('/api/llm/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
      setStreamingContent(result);
    }
    return result;
  };

  const handleStart = async () => {
    setGreetingClass("text-center py-0 h-0 overflow-hidden transition-all duration-300 opacity-0");
    setAgentBoxClass("fixed bottom-0 left-0 right-0 bg-transparent z-50 w-full h-auto flex justify-center items-start");
    setAgentContentClass("relative max-w-2xl");
    send({ type: 'START_PROCESS', problem: prompt() });
    const result = await callLLM(state.context.currentPrompt);
    await addMessage({ type: 'user', content: state.context.currentPrompt });
    await addMessage({ type: 'ai', content: result });
    send({ type: 'RECEIVE_RESPONSE', response: result });
    await addTask({ content: result, model: 'Llama-3.2-3B-Free', prompt: state.context.currentPrompt });
  };

  const handlePause = () => {
    send({ type: 'PAUSE' });
  };

  const handleResume = () => {
    send({ type: 'RESUME' });
  };

  const handleImprove = async () => {
    const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential: ${state.context.currentPrompt}`;
    const result = await callLLM(improvedPrompt);
    await addMessage({ type: 'user', content: improvedPrompt });
    await addMessage({ type: 'ai', content: result });
    send({ type: 'RECEIVE_RESPONSE', response: result });
    await addTask({ content: result, model: 'Llama-3.2-3B-Free', prompt: improvedPrompt });
  };

  const handleSuggest = async () => {
    const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Provide a brief description, target market, and unique value proposition.`;
    const result = await callLLM(suggestPrompt);
    await addMessage({ type: 'user', content: suggestPrompt });
    await addMessage({ type: 'ai', content: result });
    send({ type: 'RECEIVE_RESPONSE', response: result });
    await addTask({ content: result, model: 'Llama-3.2-3B-Free', prompt: suggestPrompt });
  };

  const handleReset = () => {
    send({ type: 'RESET' });
    setStreamingContent('');
  };

  const getBadgeClass = () => {
    const classes = {
      idle: 'badge-neutral',
      processing: 'badge-primary',
      pause: 'badge-warning',
      completed: 'badge-success'
    };
    return classes[state.value] || 'badge-neutral';
  };

  const getStateIcon = () => {
    const icons = {
      idle: 'clock',
      processing: 'cog',
      pause: 'pause',
      completed: 'check'
    };
    return icons[state.value] || 'help-circle';
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

  onMount(() => {
    // Create Lucide icons
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    if (cardRef) {
      let animationId;
      let startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = elapsed * 0.001; // time in seconds

        // Smooth oscillating values using sine waves
        const x = Math.sin(t * 0.2) * 10; // -10 to 10
        const y = Math.sin(t * 0.1) * 8; // -8 to 8
        const blur = 20 + Math.sin(t * 0.3) * 10; // 10 to 30
        const spread = Math.sin(t * 0.15) * 3; // -3 to 3

        // Smooth color transition
        const hue = (t * 10) % 360; // Cycle through hues
        const color = `hsla(${hue}, 30%, 60%, 0.3)`;

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
          {/* Current Task */}
          <Show when={streamingContent() || state.context.llmResponse}>
            <div class="card bg-base-100 shadow-md">
              <div class="card-body">
                <div class="prose" innerHTML={marked.parse(streamingContent() || state.context.llmResponse)}></div>
                <div class="text-sm text-gray-500">{new Date().toLocaleString()} - Llama-3.2-3B-Free</div>
              </div>
            </div>
          </Show>
          {/* All Tasks */}
          <For each={tasks()}>
            {(task) => (
              <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                  <div class="prose" innerHTML={marked.parse(task.content)}></div>
                  <div class="text-sm text-gray-500">{task.timestamp} - {task.model}</div>
                </div>
              </div>
            )}
          </For>
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
                     <Show when={state.value === 'processing'}>
                       <span class="loading loading-spinner loading-primary loading-sm"></span>
                     </Show>
                     <span id="stepDisplay">
                       {state.value === 'idle' ? 'System - Initialization' : `${state.context.currentModel} - ${state.context.currentSection} - ${state.context.stepName}`}
                     </span>
                     <span id="agent-status-badge" class={`badge ${getBadgeClass()} badge-sm flex items-center gap-1`}>
                       <i data-lucide={getStateIcon()} class="w-3 h-3"></i>
                       {state.context.uiStatus}
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
                         Completed: {state.context.completedSteps}
                       </div>
                       <div class="bg-accent/10 text-accent px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                         <i data-lucide="activity" class="w-3 h-3"></i>
                         In Progress: {state.value === 'processing' ? 1 : 0}
                       </div>
                       <div class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                         <i data-lucide="clock" class="w-3 h-3"></i>
                         Est. Time: {Math.round(((stepOrder.length - 1 - state.context.completedSteps) * 15 / 60) * 10) / 10} min
                       </div>
                       <div class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                         <i data-lucide="dollar-sign" class="w-3 h-3"></i>
                         Credits: {state.context.completedSteps * 10}
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
                                       checked={state.context.completedSteps >= modelCumul[model.name]}
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
                              value={state.context.uiProgress}
                              max="100"
                            ></progress>
                             <span class="badge badge-primary badge-xs">{state.context.completedSteps} / {stepOrder.length - 1} Complete</span>
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
                      class={`textarea textarea-ghost w-full resize-none font-['Electrolize'] text-base-content text-lg sm:text-xl md:text-2xl placeholder:text-base-content placeholder:text-lg sm:placeholder:text-xl md:placeholder:text-2xl focus:ring-0 active:ring-0 focus:outline-none ${state.value !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                     placeholder="Enter your problem statement here..."
                     value={prompt()}
                     onInput={(e) => setPrompt(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         if (state.value === 'idle') handleStart();
                       }
                     }}
                     disabled={state.value !== 'idle'}
                     disabled={state.value !== 'idle'}
                   ></textarea>
                   <Show when={state.value === 'pause'}>
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
                     </div>
                     <Show when={state.value === 'idle'}>
                       <button
                         type="button"
                         class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer"
                         onClick={handleStart}
                       >
                         <i data-lucide="play" class="w-3 h-3"></i>
                         Start
                       </button>
                     </Show>
                     <Show when={state.value === 'processing'}>
                       <button
                         type="button"
                         class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-warning/20 transition cursor-pointer"
                         onClick={handlePause}
                       >
                         <i data-lucide="pause" class="w-3 h-3"></i>
                         Pause
                       </button>
                     </Show>
                     <Show when={state.value === 'pause'}>
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