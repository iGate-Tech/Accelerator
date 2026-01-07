 import { Show, For, createMemo, createEffect } from "solid-js";
import { machineStore, stepOrder, modelCumul } from "../lib/machine";
import ProgressAccordion from "./ProgressAccordion";

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
        if (props.machineStore.state === 'idle') {
          setTimeout(() => {
            props.textareaRef.style.height = 'auto';
            props.textareaRef.style.height = props.textareaRef.scrollHeight + 'px';
          }, 10);
        } else {
          props.textareaRef.style.height = '3rem';
        }
      }
    });

   return (
    <div id="agentBox" class={props.agentBoxClass()}>
      <div id="agentContent" class={props.agentContentClass()}>
         <div class="flex flex-col gap-4">
          <div id="greetingDiv" class={props.greetingClass()}>
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-sans font-light text-base-content mb-2 sm:mb-2">
              Hi <span class='text-primary'>Ahmed</span>, what's your next big idea?
            </h1>
          </div>
          <div ref={props.cardRef} class="card bg-base-100 border border-base-200 shadow-2xl shadow-primary drop-shadow-md rounded-box">
             <div class="card-body relative p-4 !gap-0">
              <Show when={props.currentProjectId() !== null}>
                <ProgressAccordion
                  machineStore={props.machineStore}
                  isAccordionOpen={props.isAccordionOpen}
                  setIsAccordionOpen={props.setIsAccordionOpen}
                  isLoading={props.isLoading}
                   handlePause={props.handlePause}
                   handleResume={props.handleResume}
                />
              </Show>
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
                 <div class="flex justify-between items-center mt-2 gap-2">
                   <div class="flex gap-2">
                    <Show when={props.machineStore.state === 'idle'}>
                       <button type="button" onClick={props.handleImprove} class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                         <i data-lucide="sparkles" class="w-3 h-3"></i>
                         <span class="hidden sm:inline">Improve with AI</span>
                       </button>
                       <button type="button" onClick={props.handleSuggest} class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer">
                         <i data-lucide="lightbulb" class="w-3 h-3"></i>
                         <span class="hidden sm:inline">AI Suggestion</span>
                       </button>
                       <button type="button" onClick={props.handleReset} class="bg-error/10 text-error px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-error/20 transition cursor-pointer">
                         <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                         <span class="hidden sm:inline">Reset</span>
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
                       <span class="hidden sm:inline">Start</span>
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