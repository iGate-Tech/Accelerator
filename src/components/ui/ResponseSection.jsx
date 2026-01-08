import { For, Show } from "solid-js";
import { marked } from "marked";
import { renderFilledTemplate } from "../../lib/llm-template";
import { sectionMap, stepNames, modelMap } from "../../lib/machine";

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
  Object.keys(promptToSection).find(k => task.prompt?.includes(k))
    ? promptToSection[Object.keys(promptToSection).find(k => task.prompt?.includes(k))]
    : "Unknown Section";

const getStepName = (task) =>
  Object.keys(promptToStepName).find(k => task.prompt?.includes(k))
    ? promptToStepName[Object.keys(promptToStepName).find(k => task.prompt?.includes(k))]
    : "Unknown Step";

/* ---------- Component ---------- */

const ResponseSection = (props) => {
  return (
    <div class="flex-1 p-4">
      <Show when={props.tasksList().length > 0 || (props.isLoading() && props.streamingContent())}>
        <div id="contentDiv" class="max-w-6xl mx-auto space-y-6 mt-15 h-[calc(100vh-20rem)] overflow-y-auto">

          {/* Past Tasks */}
          <For each={props.tasksList()}>
            {(task) => (
              <div
                id={task.id}
                ref={(el) => (props.taskRefs[task.id] = el)}
                 class={`card shadow-lg rounded-xl border border-base-300 bg-base-200 overflow-hidden`}
                 onClick={() => props.setActiveCardId(task.id)}
              >
                {/* Header */}
                <div class="flex items-center justify-between px-4 py-3 bg-base-300/40">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-outline badge-sm">
                      {modelMap[task.step] || task.model}
                    </span>
                    <span class="font-semibold text-sm">
                      {getSection(task)} – {getStepName(task)}
                    </span>
                  </div>
                   <i
                     data-lucide="copy"
                     class="w-4 h-4 cursor-pointer"
                     onClick={(e) => {
                       e.stopPropagation();
                       navigator.clipboard.writeText(task.content);
                     }}
                   />
                </div>

                 {/* Body */}
                 <div class="card-body px-5 py-4 bg-base-100">
                  <div
                    class="prose max-w-none"
                    innerHTML={marked.parse(renderFilledTemplate(task.content))}
                  />
                </div>

                {/* Footer */}
                <div class="flex items-center px-4 py-3 bg-base-300/30 text-sm opacity-70">
                  <span>{new Date(task.timestamp).toLocaleString()}</span>
                  <span class="ml-auto text-xs">{task.model}</span>
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
                   innerHTML={marked.parse(props.streamingContent())}
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
