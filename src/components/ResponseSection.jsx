 import { For, Show } from "solid-js";
 import { marked } from 'marked';
 import { renderFilledTemplate } from '../lib/llm-template';
 import { sectionMap, stepNames } from '../lib/machine';

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

 const promptToStepName = {
   "You are an AI-powered startup accelerator": stepNames.system,
   "Analyze the problem": stepNames.step2,
   "Evaluate the severity": stepNames.step3,
   "List and categorize current solutions": stepNames.step4,
   "Analyze why current": stepNames.step5,
   "Develop a detailed user persona": stepNames.step6,
   "Assess the urgency": stepNames.step7,
   "Gather and validate evidence": stepNames.step8,
   "Design a comprehensive solution": stepNames.step9,
   "Craft a compelling value proposition": stepNames.step10,
   "List key features": stepNames.step11,
   "Determine the optimal business model": stepNames.step12,
   "Design revenue streams": stepNames.step13,
   "Develop a pricing strategy": stepNames.step14,
   "Build competitive moats": stepNames.step15,
   "List key assumptions": stepNames.step16,
   "Clearly define the target market": stepNames.step17,
   "Estimate the Total Addressable Market": stepNames.step18,
   "Estimate the Serviceable Available Market": stepNames.step19,
   "Estimate the Serviceable Obtainable Market": stepNames.step20,
   "Check if": stepNames.validate_tam_sam_som,
   "Identify trends": stepNames.step21,
   "List direct and indirect competitors": stepNames.step22,
   "Develop a strategy to enter": stepNames.step23,
   "Identify channels": stepNames.step24,
   "Describe the sales motion": stepNames.step25,
   "Develop strategies to retain": stepNames.step26,
   "Explain how revenue is generated": stepNames.step27,
   "Provide Customer Acquisition Cost": stepNames.step28,
   "List major fixed and variable costs": stepNames.step29,
   "Provide 3-year revenue": stepNames.step30,
   "Calculate the monthly burn rate": stepNames.step31,
   "Determine when": stepNames.step32,
   "Provide current traction": stepNames.step33,
   "Calculate the valuation": stepNames.step34,
   "Determine the appropriate funding stage": stepNames.step35,
   "Determine how much capital": stepNames.step36,
   "Check if {{valuation}}": stepNames.validate_deck_ask,
   "Plan the allocation": stepNames.step37,
   "Calculate the expected pre-money": stepNames.step38,
   "Validate if {{preMoney}}": stepNames.validate_pre_money,
   "Identify target investor types": stepNames.step39,
   "List milestones": stepNames.step40,
   "List founding team members": stepNames.step41,
   "Identify key skills": stepNames.step42,
   "Develop a hiring plan": stepNames.step43,
   "List advisors": stepNames.step44,
   "Determine the legal structure": stepNames.step45,
   "Plan intellectual property": stepNames.step46,
   "Identify key contracts": stepNames.step47,
   "Identify legal and regulatory risks": stepNames.step48
 };

 const getSection = (task) => {
   for (let key in promptToSection) {
     if (task.prompt && task.prompt.includes(key)) {
       return promptToSection[key];
     }
   }
   return "Unknown Section";
 };

 const getStepName = (task) => {
   for (let key in promptToStepName) {
     if (task.prompt && task.prompt.includes(key)) {
       return promptToStepName[key];
     }
   }
   return "Unknown Step";
 };

 const ResponseSection = (props) => {
  return (
    <div class="flex-1 overflow-y-auto p-4">
      <div id="contentDiv" class="max-w-6xl mx-auto space-y-6 pb-48">
        {/* Response History */}
        <h3 class="text-lg font-semibold mb-4">Response History</h3>
        {/* All Tasks */}
        <For each={props.tasksList()}>
          {(task) => (
             <div class="card bg-base-100 shadow-md">
               <div class="card-body">
                 <div class="text-lg font-semibold mb-2 p-2 bg-primary text-primary-content rounded-lg">{task.model} - {getSection(task)} - {getStepName(task)}</div>
                 <Show when={props.editingTaskId() === task.id} fallback={
                  <>
                    <div class="prose max-w-none" innerHTML={marked.parse(renderFilledTemplate(task.content))}></div>
                    <div class="flex gap-2 mt-2">
                      <button onClick={() => { props.setEditingTaskId(task.id); props.setEditContent(task.content); }} class="btn btn-xs">Edit</button>
                    </div>
                  </>
                }>
                  <textarea value={props.editContent()} onInput={(e) => props.setEditContent(e.target.value)} class="textarea textarea-bordered w-full"></textarea>
                  <div class="flex gap-2 mt-2">
                    <button onClick={async () => { await props.updateTask(task.id, props.editContent()); props.setTasksList(props.tasksList().map(t => t.id === task.id ? {...t, content: props.editContent()} : t)); props.setEditingTaskId(null); }} class="btn btn-xs btn-primary">Save</button>
                    <button onClick={() => props.setEditingTaskId(null)} class="btn btn-xs">Cancel</button>
                  </div>
                </Show>
                 <div class="mt-4 p-2 bg-base-200 rounded text-sm">{new Date(task.timestamp).toLocaleString()} - {task.model}</div>
              </div>
            </div>
          )}
        </For>

        {/* Current Response */}
         <Show when={props.isLoading() && props.streamingContent()}>
           <div ref={props.streamingRef} class="card bg-base-100 shadow-md">
             <div class="card-body">
               <div class="text-lg font-semibold mb-2 p-2 bg-primary text-primary-content rounded-lg">{props.machineStore.context.currentModel} - {props.machineStore.context.currentSection} - {props.machineStore.context.stepName}</div>
              <div class="prose max-w-none" innerHTML={marked.parse(props.streamingContent())}></div>
               <div class="mt-4 p-2 bg-base-200 rounded text-sm">Streaming... - {props.machineStore.context.currentModel}</div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default ResponseSection;