import { Show, For, createMemo, onMount } from "solid-js";
import { stepOrder, modelCumul } from "../../lib/machine";
import logger from '../../lib/logger.js';



const getBadgeClass = (state) => {
  logger.trace('getBadgeClass: Starting');
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

  logger.trace('getStateIcon: Starting');
  return icons[state] || 'help-circle';
};


const ProgressAccordion = (props) => {
  logger.debug('ProgressAccordion props.project:', props.project);
  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  return (
    <div class="flex items-center w-full py-0">
      <div class="collapse collapse-arrow bg-base-100 flex-1">
        <input
          type="checkbox"
          class="p-0"
          name="ai-tasks-accordion"
          checked={false}
          onChange={() => props.setIsAccordionOpen(!props.isAccordionOpen())}
        />
        <div class="collapse-title font-semibold text-primary !p-0">
          <span>Accelerator Agent</span>
        </div>
        <div class="collapse-content p-0">
         <div class="space-y-4">
          {/* Database Setup */}
          <div class="card">
            <div class="card-body p-1">
               <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-0">
                 <legend class="fieldset-legend text-primary">Models</legend>
                 <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-base-content/30">
                   {(() => {
                     const modelsWithChecked = createMemo(() => [
                       { name: 'Idea Model', icon: 'lightbulb', color: 'warning' },
                       { name: 'Business Model', icon: 'briefcase', color: 'primary' },
                       { name: 'Financial Model', icon: 'dollar-sign', color: 'success' },
                       { name: 'Funding Model', icon: 'trending-up', color: 'secondary' },
                       { name: 'Marketing Model', icon: 'megaphone', color: 'accent' },
                       { name: 'Team Model', icon: 'users', color: 'info' },
                       { name: 'Legal Model', icon: 'scale', color: 'error' },
                       { name: 'Technical Model', icon: 'cpu', color: 'neutral' }
                     ].map(model => ({ ...model, checked: props.machineStore.context.completedSteps >= (modelCumul[model.name] || 0) })));
                     return (
                       <For each={modelsWithChecked()}>
                         {(model) => (
                           <label class="label cursor-pointer">
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
               <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-4">
                 <legend class="fieldset-legend text-primary">Reports</legend>
                 <div class="grid grid-cols-3 gap-4 text-base-content/30">
                   {(() => {
                     const reportsWithChecked = createMemo(() => [
                       { name: 'Pitch Deck Report', icon: 'file-text', color: 'base' },
                       { name: 'Business Plan Report', icon: 'file-text', color: 'ghost' },
                       { name: 'Valuation Report', icon: 'file-text', color: 'warning' }
                     ].map(model => ({ ...model, checked: props.machineStore.context.completedSteps >= (modelCumul[model.name] || 0) })));
                     return (
                       <For each={reportsWithChecked()}>
                         {(model) => (
                           <label class="label cursor-pointer">
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
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-4">
         <progress
           id="agent-progress"
           class="progress progress-primary w-32 h-2"
           value={isFinite(props.machineStore.context.uiProgress) ? props.machineStore.context.uiProgress : 0}
           max="100"
         ></progress>
        <span class="badge badge-primary badge-xs">{props.machineStore.context.completedSteps || 0} / 51 Complete</span>
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
  );
};

export default ProgressAccordion;