import { For, Show, onMount, createEffect } from "solid-js";
import { marked } from "marked";
import { renderFilledTemplate } from "../../lib/llm-template";
import { sectionMap, stepNames, modelMap } from "../../lib/machine";
import logger from "../../lib/logger.js";


/* ---------- Prompt Maps ---------- */

const promptToSection = {
  "You are an AI-powered startup accelerator": sectionMap.system,
  "Analyze the problem": sectionMap.step2,
  "Evaluate the severity": sectionMap.step3,
  "List and categorize current solutions": sectionMap.step4,
  "Analyze why current": sectionMap.step5,
  "Develop a detailed user persona": sectionMap.step6,
  "Assess the urgency": sectionMap.step7,
  "Gather and validate evidence": sectionMap.step8,
  "Design a comprehensive solution": sectionMap.step9,
  "Craft a compelling value proposition": sectionMap.step10,
  "List key features": sectionMap.step11,
  "Determine the optimal business model": sectionMap.step12,
  "Design revenue streams": sectionMap.step13,
  "Develop a pricing strategy": sectionMap.step14,
  "Build competitive moats": sectionMap.step15,
  "List key assumptions": sectionMap.step16,
  "Clearly define the target market": sectionMap.step17,
  "Estimate the Total Addressable Market": sectionMap.step18,
  "Estimate the Serviceable Available Market": sectionMap.step19,
  "Estimate the Serviceable Obtainable Market": sectionMap.step20,
  "Check if": sectionMap.validate_tam_sam_som,
  "Identify trends": sectionMap.step21,
  "List direct and indirect competitors": sectionMap.step22,
  "Develop a strategy to enter": sectionMap.step23,
  "Identify channels": sectionMap.step24,
  "Describe the sales motion": sectionMap.step25,
  "Develop strategies to retain": sectionMap.step26,
  "Explain how revenue is generated": sectionMap.step27,
  "Provide Customer Acquisition Cost": sectionMap.step28,
  "List major fixed and variable costs": sectionMap.step29,
  "Provide 3-year revenue": sectionMap.step30,
  "Calculate the monthly burn rate": sectionMap.step31,
  "Determine when": sectionMap.step32,
  "Provide current traction": sectionMap.step33,
  "Calculate the valuation": sectionMap.step34,
  "Determine the appropriate funding stage": sectionMap.step35,
  "Determine how much capital": sectionMap.step36,
  "Check if {{valuation}}": sectionMap.validate_deck_ask,
  "Plan the allocation": sectionMap.step37,
  "Calculate the expected pre-money": sectionMap.step38,
  "Validate if {{preMoney}}": sectionMap.validate_pre_money,
  "Identify target investor types": sectionMap.step39,
  "List milestones": sectionMap.step40,
  "List founding team members": sectionMap.step41,
  "Identify key skills": sectionMap.step42,
  "Develop a hiring plan": sectionMap.step43,
  "List advisors": sectionMap.step44,
  "Determine the legal structure": sectionMap.step45,
  "Plan intellectual property": sectionMap.step46,
  "Identify key contracts": sectionMap.step47,
  "Identify legal and regulatory risks": sectionMap.step48
};

const promptToStepName = Object.fromEntries(
  Object.entries(promptToSection).map(([k, v]) => [k, stepNames[v]])
);

/* ---------- Helpers ---------- */

const getSection = (task) =>
  task.section ||
  (Object.keys(promptToSection).find(k => task.prompt?.includes(k))
    ? promptToSection[Object.keys(promptToSection).find(k => task.prompt?.includes(k))]
    : "Unknown Section");

const getStepName = (task) =>
  task.stepName ||
  (Object.keys(promptToStepName).find(k => task.prompt?.includes(k))
    ? promptToStepName[Object.keys(promptToStepName).find(k => task.prompt?.includes(k))]
    : "Unknown Step");

/* ---------- Component ---------- */

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
  return icons[state] || 'help-circle';
};

const ResponseSection = (props) => {
  logger.debug('ResponseSection: component rendered, tasksList length:', props.tasksList()?.length, 'isLoading:', props.isLoading(), 'streamingContent length:', props.streamingContent()?.length);
  onMount(() => {
    logger.debug('ResponseSection: onMount');
    if (window.lucide) window.lucide.createIcons();
  });
  createEffect(() => {
    logger.debug('ResponseSection: createEffect triggered, tasksList changed');
    props.tasksList();
    if (window.lucide) window.lucide.createIcons();
  });
  return (
    <div class="flex-1 p-4">
      <Show when={props.tasksList().length > 0 || (props.isLoading() && props.streamingContent())}>
        <div class="mb-4 max-w-6xl mx-auto">
          <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
            <h2 class="text-xl font-bold text-primary">{props.project?.name || "Untitled Project"}</h2>
               <span id="stepDisplay" class="font-semibold text-base-content">
                {props.machineStore.state === 'idle' ? 'System - Initialization' : `${props.machineStore.context.currentModel} - ${props.machineStore.context.currentSection} - ${props.machineStore.context.stepName}`}
              </span>
              <span id="agent-status-badge" class={`badge ${getBadgeClass(props.machineStore.state)} badge-sm flex items-center gap-1`}>
                <i data-lucide={getStateIcon(props.machineStore.state)} class="w-3 h-3"></i>
                {props.machineStore.context.uiStatus}
              </span>
              </div>
            <div class="flex items-center gap-4">
           
               <div class="flex gap-2">
                 <div class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                   <i data-lucide="clock" class="w-3 h-3"></i>
                   Time: {props.machineStore.context.consumedTime ? Math.round(props.machineStore.context.consumedTime / 60 * 10) / 10 : 0} / {props.machineStore.context.totalTime ? Math.round(props.machineStore.context.totalTime / 60 * 10) / 10 : 0} min
                 </div>
                 <div class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                   <i data-lucide="dollar-sign" class="w-3 h-3"></i>
                   Credits: {props.machineStore.context.consumedCredits || 0} / {props.machineStore.context.totalCredits || 0}
                 </div>
               </div>
            </div>
          </div>
        </div>
        <div id="contentDiv" class="pb-20 max-w-6xl mx-auto space-y-6 h-[calc(100vh-14rem)] overflow-y-auto">

          {/* Past Tasks */}
           <For each={props.tasksList()}>
             {(task) => (
               <div class="collapse collapse-arrow bg-base-200 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                 <input type="checkbox" class="p-0" />
                 <div
                   class="collapse-title flex items-center gap-4 px-4 py-3 bg-base-300/40 cursor-pointer"
                   onClick={() => props.setActiveCardId(task.id)}
                 >
                   <span class="font-semibold text-sm">
                     {getSection(task)} – {getStepName(task)}
                   </span>
                   <div class="ml-auto flex items-center gap-2">
                     <span class="bg-info/10 text-info px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                       <i data-lucide="tag" class="w-3 h-3"></i>
                       <span class="hidden sm:inline">{task.model || modelMap[task.step] || "Manual"}</span>
                     </span>
                      <button type="button" onClick={() => props.handleImprove()} class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                        <i data-lucide="sparkles" class="w-3 h-3"></i>
                        <span class="hidden sm:inline">Improve with AI </span>
                      </button>
                      <button type="button" onClick={() => props.handleSuggest()} class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer">
                        <i data-lucide="lightbulb" class="w-3 h-3"></i>
                        <span class="hidden sm:inline">AI Suggestion</span>
                      </button>
                     <button type="button" class="mr-7 bg-neutral/10 text-neutral px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-neutral/20 transition cursor-pointer" onClick={(e) => {
                       e.stopPropagation();
                       navigator.clipboard.writeText(task.content);
                     }}>
                       <i data-lucide="copy" class="w-3 h-3"></i>
                       <span class="hidden sm:inline">Copy</span>
                     </button>
                   </div>
                 </div>
                 <div class="collapse-content p-0">
                   {/* Body */}
                   <div class="card-body px-5 py-4 bg-base-100">
                      <div
                        class="prose max-w-none"
                        innerHTML={marked.parse(renderFilledTemplate(task.content), { breaks: true, gfm: true })}
                      />
                   </div>

                   {/* Footer */}
                   <div class="px-4 py-3 bg-base-300/30">
                     <div class="flex items-center justify-between text-sm opacity-70 mb-2">
                       <span>{new Date(task.timestamp).toLocaleString()}</span>
                       <span class="text-xs">{task.model || "Manual"}</span>
                     </div>

                     {/* Additional Details */}
                     <details class="text-xs opacity-60">
                       <summary class="cursor-pointer hover:opacity-80">Task Details</summary>
                       <div class="mt-2 space-y-1">
                         <div><strong>Model:</strong> {task.model || "Manual"}</div>
                         <div><strong>LLM Model:</strong> {task.llm_model || "N/A"}</div>
                         <div><strong>Section:</strong> {task.section || "Planning"}</div>
                         <div><strong>Step:</strong> {task.stepName || "Project Setup"}</div>
                         {task.prompt && (
                           <div>
                             <strong>Prompt:</strong>
                             <div class="mt-1 p-2 bg-base-200 rounded text-xs max-h-20 overflow-y-auto">
                               {task.prompt.length > 100 ? `${task.prompt.substring(0, 100)}...` : task.prompt}
                             </div>
                           </div>
                         )}
                       </div>
                     </details>
                   </div>
                 </div>
               </div>
             )}
          </For>

          {/* Streaming Response */}
          <Show when={props.isLoading() && props.streamingContent()}>
            <div
              id="streaming"
              ref={props.streamingRef}
               class={`card shadow-lg rounded-xl border border-base-300 bg-base-200 overflow-hidden`}
               onClick={() => props.setActiveCardId("streaming")}
            >
              <div class="flex items-center justify-between px-4 py-3 bg-base-300/40">
                <div class="flex items-center gap-2">
                  <span class="badge badge-outline badge-sm">
                    {props.machineStore.context.currentModel}
                  </span>
                  <span class="font-semibold text-sm">
                    {props.machineStore.context.currentSection} –{" "}
                    {props.machineStore.context.stepName}
                  </span>
                </div>
                <i data-lucide="loader" class="w-4 h-4 animate-spin" />
               </div>

                <div class="card-body px-5 py-4 bg-base-100">
                  <div
                    class="prose max-w-none"
                    innerHTML={marked.parse(props.streamingContent(), { breaks: true, gfm: true })}
                  />
                </div>

              <div class="flex items-center px-4 py-3 bg-base-300/30 text-sm opacity-70">
                <span class="animate-pulse">Streaming…</span>
                <span class="ml-auto text-xs">
                  {props.machineStore.context.currentModel}
                </span>
              </div>
            </div>
          </Show>

        </div>
      </Show>
    </div>
  );
};

export default ResponseSection;
