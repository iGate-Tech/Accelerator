import { For, Show, onMount, createEffect, createSignal } from "solid-js";
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
  task.step_name ||
  (task.step ? stepNames[task.step] : null) ||
  (Object.keys(promptToStepName).find(k => task.prompt?.includes(k))
    ? promptToStepName[Object.keys(promptToStepName).find(k => task.prompt?.includes(k))]
    : null) ||
  task.step ||
  "Unknown Step";

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
  const startPressedCondition = props.startPressed && props.startPressed();
  const tasksCondition = props.tasksList && props.tasksList().length > 0 && props.machineStore.context?.currentStep !== 'done';
  const shouldShow = startPressedCondition || tasksCondition;
  console.log('ResponseSection: Conditions - startPressed:', startPressedCondition, 'tasks:', tasksCondition, 'currentStep:', props.machineStore.context?.currentStep, 'shouldShow:', shouldShow);
  logger.debug('ResponseSection: component rendered, tasksList length:', props.tasksList()?.length, 'isLoading:', props.isLoading(), 'streamingContent length:', props.streamingContent()?.length);

  // Group tasks by model
  const groupedTasks = () => {
    const groups = {};
    props.tasksList().forEach(task => {
      const model = task.model || "Manual";
      if (!groups[model]) groups[model] = [];
      groups[model].push(task);
    });
    return groups;
  };

  // Model generation order
  const modelOrder = ["Idea Model", "Business Model", "Financial Model", "Funding Model", "Marketing Model", "Team Model", "Legal Model", "Technical Model"];

  // Sort models in custom order: system, models (in generation sequence), reports
  const sortedModels = () => {
    const groups = groupedTasks();
    const system = Object.keys(groups).filter(m => m.toLowerCase().includes('system'));
    const reports = Object.keys(groups).filter(m => m.toLowerCase().includes('report'));
    const models = modelOrder.filter(m => groups[m]); // Use generation order
    const other = Object.keys(groups).filter(m =>
      !system.includes(m) && !reports.includes(m) && !models.includes(m)
    );

    return [...system.sort(), ...models, ...reports.sort(), ...other.sort()];
  };

  // Expanded states for each model group
  const expandedStates = new Map();

  // Expanded states for each section group
  const sectionExpandedStates = new Map();

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
    <div class="flex-1 p-4 max-w-6xl w-full">
      <Show when={shouldShow}>
        <div class="mb-4  mx-auto">
          <div class="flex justify-between items-center">
              <div class="flex gap-3 items-center">
            <h2 class="text-xl font-bold text-primary">{props.project?.name || "Untitled Project"}</h2>

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
        <div id="contentDiv" class="pb-20 px-4 max-w-6xl mx-auto space-y-6 h-[calc(100vh-14rem)] overflow-y-auto">

           {/* Past Tasks */}
            <For each={sortedModels()}>
               {(model, modelIndex) => {
                 const modelTasks = groupedTasks()[model];
                 const modelNumber = modelIndex() + 1;
                 const sectionGroups = {};
                modelTasks.forEach(task => {
                  const section = task.section || "Unknown";
                  if (!sectionGroups[section]) sectionGroups[section] = [];
                  sectionGroups[section].push(task);
                });
                const sortedSections = Object.keys(sectionGroups).sort();

                // Get or create expanded state for this model
                const key = model;
                if (!expandedStates.has(key)) {
                  expandedStates.set(key, createSignal(true)); // Start expanded
                }
                const [isExpanded, setIsExpanded] = expandedStates.get(key);

                return (
                  <div class="mb-6">
                    <div class="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => {
                      setIsExpanded(!isExpanded());
                      setTimeout(() => window.lucide?.createIcons(), 0);
                    }}>
                       <span class="bg-blue-900 text-blue-100 dark:bg-blue-100/10 dark:text-blue-500 px-4 py-2 rounded-full flex items-center gap-1 text-sm">
                        <i data-lucide={isExpanded() ? "chevron-down" : "chevron-right"} class="w-3 h-3"></i>
                        <span class="hidden sm:inline">{modelNumber}. {model}</span>
                      </span>
                    </div>
                    <Show when={isExpanded()}>
                      <For each={sortedSections}>
                        {(section, sectionIndex) => {
                          const sectionKey = `${model}-${section}`;
                           if (!sectionExpandedStates.has(sectionKey)) {
                             sectionExpandedStates.set(sectionKey, createSignal(true)); // Start expanded
                           }
                          const [isSectionExpanded, setIsSectionExpanded] = sectionExpandedStates.get(sectionKey);

                          return (
                            <div class="mb-4">
                              <div class="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => {
                                setIsSectionExpanded(!isSectionExpanded());
                                setTimeout(() => window.lucide?.createIcons(), 0);
                              }}>
                                 <span class="bg-emerald-900 text-emerald-100 dark:bg-emerald-100/10 dark:text-emerald-500 px-3 py-1.5 rounded-full flex items-center gap-1 text-xs">
                                  <i data-lucide={isSectionExpanded() ? "chevron-down" : "chevron-right"} class="w-3 h-3"></i>
                                  <i data-lucide="folder" class="w-3 h-3"></i>
                                  <span class="hidden sm:inline">{modelNumber}.{sectionIndex() + 1} {section}</span>
                                </span>
                              </div>
                              <Show when={isSectionExpanded()}>
                                <For each={sectionGroups[section].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))}>
                                  {(task) => (
                <div class="collapse collapse-arrow bg-base-200 border border-base-300 rounded-xl overflow-hidden mb-4">
                  <input type="checkbox" class="p-0" />
                   <div
                     class="collapse-title flex items-center gap-4 px-4 py-3 bg-base-300/40 cursor-pointer"
                     onClick={() => props.setActiveCardId(task.id)}
                   >

                    <span class="bg-violet-900 text-violet-100 dark:bg-violet-100/10 dark:text-violet-500 px-3 py-1 rounded-full flex items-center gap-1 text-xs">
                      <i data-lucide="list" class="w-3 h-3"></i>
                      <span class="hidden sm:inline">{task.step_name || "Unknown"}</span>
                    </span>
                     <div class="ml-auto mr-5 flex items-center gap-2">
                       <button type="button" onClick={() => props.handleImprove()} class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                         <i data-lucide="sparkles" class="w-3 h-3"></i>
                         <span class="hidden sm:inline">Improve with AI </span>
                       </button>
                     </div>
                  </div>
                  <div class="collapse-content p-0">
                     {/* Body */}
                     <div class="card-body px-5 py-4 bg-base-100">
                        <div
                          class="prose max-w-none dark:prose-invert"
                          innerHTML={marked.parse(renderFilledTemplate(task.content), { breaks: true, gfm: true })}
                        />
                     </div>

                    {/* Footer */}
                    <div class="px-4 py-3 bg-base-300/30">
                       <div class="flex items-center justify-between text-sm opacity-70 mb-2">
                         <span>{task.timestamp ? new Date(task.timestamp).toLocaleString() : 'Unknown'}</span>
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

                        </Show>

                       </div>

                        );
                      }}
                    </For>
                  </Show>
                </div>
              );
            }}
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
                     class="prose max-w-none dark:prose-invert"
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
