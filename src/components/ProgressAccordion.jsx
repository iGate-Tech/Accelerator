import { Show, For, createMemo, onMount } from "solid-js";
import { stepOrder, modelCumul } from "../lib/machine";

const getBadgeClass = (state) => {
  const classes = {
    idle: 'badge-neutral',
    processing: 'badge-primary',
    pause: 'badge-warning',
    completed: 'badge-success'
  };
  return classes[state] || 'badge-neutral';
};

const getStateIcon = (state) => {
  const icons = {
    idle: 'clock',
    processing: 'cog',
    pause: 'pause-circle',
    completed: 'check'
  };
  return icons[state] || 'help-circle';
};

const ProgressAccordion = (props) => {
  console.log('ProgressAccordion props.project:', props.project);
  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  return (
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
        <span id="agent-status-badge" class={`badge ${getBadgeClass(props.machineStore.state)} badge-sm flex items-center gap-1`}>
          <i data-lucide={getStateIcon(props.machineStore.state)} class="w-3 h-3"></i>
          {props.machineStore.context.uiStatus}
        </span>
      </div>
      <div class="collapse-content p-0">
        {/* Task Stats */}
         <div class="flex flex-wrap gap-2 mt-4 items-center justify-between">
           <div class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs">
             <i data-lucide="clock" class="w-3 h-3"></i>
             Time: {props.project && props.project.consumedTime !== undefined ? Math.round(props.project.consumedTime / 60 * 10) / 10 : 0} / {props.project && props.project.totalTime ? Math.round(props.project.totalTime / 60 * 10) / 10 : 0} min
           </div>
           <div class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs">
             <i data-lucide="dollar-sign" class="w-3 h-3"></i>
             Credits: {props.project && props.project.consumedCredits !== undefined ? props.project.consumedCredits : 0} / {props.project && props.project.totalCredits ? props.project.totalCredits : 0}
           </div>
         </div>
        <div class="space-y-4">
          {/* Database Setup */}
          <div class="card">
            <div class="card-body p-1">
              <fieldset class="fieldset bg-base-100  border border-base-300 rounded-box p-4 mt-0">
                <legend class="fieldset-legend text-primary">Task Steps</legend>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-base-content/30">
                    {(() => {
                      const modelsWithChecked = createMemo(() => [
                        { name: 'Idea Model', icon: 'lightbulb', color: 'warning' },
                        { name: 'Business Model', icon: 'briefcase', color: 'primary' },
                        { name: 'Financial Model', icon: 'dollar-sign', color: 'success' },
                        { name: 'Funding Model', icon: 'trending-up', color: 'secondary' },
                        { name: 'Marketing Model', icon: 'megaphone', color: 'accent' },
                        { name: 'Team Model', icon: 'users', color: 'info' },
                        { name: 'Legal Model', icon: 'scale', color: 'error' },
                        { name: 'Technical Model', icon: 'cpu', color: 'neutral' },
                        { name: 'Pitch Deck Report', icon: 'file-text', color: 'base' },
                        { name: 'Business Plan Report', icon: 'file-text', color: 'ghost' },
                        { name: 'Valuation Report', icon: 'file-text', color: 'warning' }
                      ].map(model => ({ ...model, checked: props.machineStore.context.completedSteps >= (modelCumul[model.name] || 0) })));
                      return (
                        <For each={modelsWithChecked()}>
                          {(model) => (
                            <label class="label cursor-pointer ">
                              <span class="w-4 h-4 flex items-center justify-center">
                                {model.checked ? <i data-lucide="circle-check" class={`w-4 h-4 text-success`}></i> :
                                 model.name === props.machineStore.context.currentModel ? <i data-lucide="circle-dot-dashed" class={`w-4 h-4 text-primary`}></i> :
                                 <i data-lucide="circle-minus" class={`w-4 h-4 text-base-content/30`}></i>}
                              </span>
                              <span class={`label-text flex items-center gap-1 ${model.checked ? 'text-success' : model.name === props.machineStore.context.currentModel ? 'text-primary' : 'text-base-content/30'}`}>
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

               <div class="flex justify-between items-center mt-2 gap-2">
                 <div class="flex gap-2">
                   <Show when={props.machineStore.state === 'processing'}>
                     <button type="button" onClick={props.handlePause} class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-warning/20 transition cursor-pointer">
                       <i data-lucide="pause" class="w-3 h-3"></i>
                       <span class="hidden sm:inline">Pause</span>
                     </button>
                   </Show>
                   <Show when={props.machineStore.state === 'pause'}>
                     <button type="button" onClick={props.handleResume} class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer">
                       <i data-lucide="play" class="w-3 h-3"></i>
                       <span class="hidden sm:inline">Resume</span>
                     </button>
                   </Show>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressAccordion;