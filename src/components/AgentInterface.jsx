 import { Show, For, createMemo, createEffect } from "solid-js";
import { machineStore, stepOrder, modelCumul } from "../lib/machine";

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
    pause: 'pause-circle',
    completed: 'check'
  };
  return icons[machineStore.state] || 'help-circle';
};

  const AgentInterface = (props) => {

    createEffect(() => {
      props.prompt(); // trigger on value change
      if (props.textareaRef) {
        setTimeout(() => {
          props.textareaRef.style.height = 'auto';
          props.textareaRef.style.height = props.textareaRef.scrollHeight + 'px';
        }, 10);
      }
    });

   return (
    <div id="agentBox" class={props.agentBoxClass()}>
      <div id="agentContent" class={props.agentContentClass()}>
        <div class="flex flex-col gap-4 p-6">
          <div id="greetingDiv" class={props.greetingClass()}>
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-sans font-light text-base-content mb-2 sm:mb-2">
              Hi <span class='text-primary'>Ahmed</span>, what's your next big idea?
            </h1>
          </div>
          <div ref={props.cardRef} class="card-q gap-0 card bg-base-100 border border-base-200 shadow-2xl shadow-primary drop-shadow-md rounded-box">
            <div class="card-body relative p-4 !gap-0">
              <div class="collapse collapse-arrow bg-base-100 py-0">
                <input
                  type="checkbox"
                  class="p-0"
                  name="ai-tasks-accordion"
                  checked={props.isAccordionOpen()}
                  onChange={() => props.setIsAccordionOpen(!props.isAccordionOpen())}
                />
                <div class="collapse-title font-semibold text-primary flex items-center gap-4 !p-0">
                  <Show when={props.isLoading()}>
                    <span class="loading loading-spinner loading-primary loading-sm"></span>
                  </Show>
                  <span id="stepDisplay">
                    {props.machineStore.state === 'idle' ? 'System - Initialization' : `${props.machineStore.context.currentModel} - ${props.machineStore.context.currentSection} - ${props.machineStore.context.stepName}`}
                  </span>
                  <span id="agent-status-badge" class={`badge ${getBadgeClass()} badge-sm flex items-center gap-1`}>
                    <i data-lucide={getStateIcon()} class="w-3 h-3"></i>
                    {props.machineStore.context.uiStatus}
                  </span>
                </div>
                <div class="collapse-content p-0">
                  {/* Task Stats */}
                  <div class="flex flex-wrap gap-2 mt-4 items-center justify-between">
                    <div class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                      <i data-lucide="clock" class="w-3 h-3"></i>
                      Est. Time: {Math.round(((stepOrder.length - 1 - props.machineStore.context.completedSteps) * 15 / 60) * 10) / 10} min
                    </div>
                    <div class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                      <i data-lucide="dollar-sign" class="w-3 h-3"></i>
                      Credits: {props.machineStore.context.completedSteps * 10} / {(stepOrder.length - 1) * 10}
                    </div>
                  </div>
                  <div class="space-y-4">
                    {/* Database Setup */}
                    <div class="card">
                      <div class="card-body p-1">
                        <fieldset class="fieldset bg-base-100  border border-base-300 rounded-box p-4 mt-0">
                          <legend class="fieldset-legend text-primary">Task Steps</legend>
                          <div class="grid grid-cols-2 gap-4 text-base-content/30">
                            {(() => {
                              const modelsWithChecked = createMemo(() => [
                                { name: 'Idea Model', icon: 'lightbulb', color: 'warning' },
                                { name: 'Business Model', icon: 'briefcase', color: 'primary' },
                                { name: 'Financial Model', icon: 'dollar-sign', color: 'success' },
                                { name: 'Funding Model', icon: 'trending-up', color: 'secondary' },
                                { name: 'Marketing Model', icon: 'megaphone', color: 'accent' },
                                { name: 'Team Model', icon: 'users', color: 'info' },
                                { name: 'Legal Model', icon: 'scale', color: 'error' }
                              ].map(model => ({ ...model, checked: props.machineStore.context.completedSteps >= (modelCumul[model.name] || 0) })));
                              return (
                                <For each={modelsWithChecked()}>
                                  {(model) => (
                                    <label class="label cursor-pointer ">
                                      <span class="w-4 h-4 flex items-center justify-center">
                                        {model.checked ? <i data-lucide="circle-check" class="w-4 h-4 text-base-content/30"></i> :
                                         model.name === props.machineStore.context.currentModel ? <i data-lucide="circle-dot-dashed" class="w-4 h-4 text-base-content/30"></i> :
                                         <i data-lucide="circle-minus" class="w-4 h-4 text-base-content/30"></i>}
                                      </span>
                                      <span class={`label-text flex items-center gap-1 text-base-content/30`}>
                                        {model.name === props.machineStore.context.currentModel}
                                        {model.name}
                                      </span>
                                    </label>
                                  )}
                                </For>
                              );
                            })()}
                          </div>
                        </fieldset>
                        <div class="mt-1 flex items-center gap-2">
                          <progress
                            id="agent-progress"
                            class="progress progress-primary flex-1 h-2"
                            value={props.machineStore.context.uiProgress}
                            max="100"
                          ></progress>
                          <span class="badge badge-primary badge-xs">{props.machineStore.context.completedSteps} / {stepOrder.length - 1} Complete</span>
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
                   ref={props.textareaRef}
                   name="prompt"
                   id="promptTextarea"
                   class={`custom-textarea text-base-content text-lg sm:text-xl md:text-2xl placeholder:text-base-content placeholder:text-lg sm:placeholder:text-xl md:placeholder:text-2xl focus:ring-0 active:ring-0 ${props.machineStore.state !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                   style="resize: none; overflow: hidden; min-height: 3rem; box-sizing: border-box;"
                   placeholder="Enter your problem statement here..."
                   value={props.prompt()}
                    onInput={(e) => {
                      props.setPrompt(e.target.value);
                      if (props.textareaRef) {
                        setTimeout(() => {
                          props.textareaRef.style.height = 'auto';
                          props.textareaRef.style.height = props.textareaRef.scrollHeight + 'px';
                        }, 10);
                      }
                    }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (props.machineStore.state === 'idle') props.handleStart();
                    }
                  }}
                  disabled={props.machineStore.state !== 'idle'}
                ></textarea>
                <Show when={props.machineStore.state === 'pause'}>
                  <div class="text-warning text-sm mt-2">Agent is paused. Click Resume to continue.</div>
                </Show>
                <div class="flex justify-between items-center mt-2">
                  <div class="flex gap-2">
                    <Show when={props.machineStore.state === 'idle'}>
                      <button type="button" onClick={props.handleImprove} class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                        <i data-lucide="sparkles" class="w-3 h-3"></i>
                        Improve with AI
                      </button>
                      <button type="button" onClick={props.handleSuggest} class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer">
                        <i data-lucide="lightbulb" class="w-3 h-3"></i>
                        AI Suggestion
                      </button>
                      <button type="button" onClick={props.handleReset} class="bg-error/10 text-error px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-error/20 transition cursor-pointer">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                        Reset
                      </button>
                    </Show>
                    <Show when={props.machineStore.state === 'processing'}>
                      <button type="button" onClick={props.handleSaveProgress} class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-info/20 transition cursor-pointer">
                        <i data-lucide="save" class="w-3 h-3"></i>
                        Save Progress
                      </button>
                    </Show>
                  </div>
                  <Show when={props.machineStore.state === 'idle'}>
                    <button
                      type="button"
                      class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer"
                      onClick={props.handleStart}
                    >
                      <i data-lucide="play" class="w-3 h-3"></i>
                      Start
                    </button>
                  </Show>
                  <Show when={props.machineStore.state === 'processing'}>
                    <button
                      type="button"
                      class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-warning/20 transition cursor-pointer"
                      onClick={props.handlePause}
                    >
                      <i data-lucide="pause" class="w-3 h-3"></i>
                      Pause
                    </button>
                  </Show>
                  <Show when={props.machineStore.state === 'pause'}>
                    <button
                      type="button"
                      class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer"
                      onClick={props.handleResume}
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
  );
};

export default AgentInterface;