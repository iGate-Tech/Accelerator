import { Show, For, createEffect, createSignal, createMemo } from "solid-js";
import { marked } from "marked";
import { renderFilledTemplate } from "../lib/ui/llm-template";
import { updateTask } from "../lib/database";
import { logger } from "../lib/core";
import { toastManager } from "../lib/ui/feedback";
import { stepNames } from "../lib/business/steps";

const UnifiedTaskCard = (props) => {
  const task = props.task;
  const taskId = task?.id || 'unknown';
  
  const content = () => props.taskContent ?? task?.content ?? '';
  const llmResponse = () => task?.llm_response ?? '';

  const isEditing = () => props.editingTaskId && props.editingTaskId() === taskId;
  const isSelected = () => props.selectedTaskId && props.selectedTaskId() === taskId;
  const [isExpanded, setIsExpanded] = createSignal(false);
  let contentRef;
  let cardRef;

  const isStreaming = () => props.isStreaming ?? (content() && content().trim().length > 0 && !llmResponse());
  const isStreamingComplete = () => props.isStreamingComplete ?? true;
  const isCurrentlyStreaming = () => props.streamingTaskId?.() === taskId;
  const isLastTask = () => props.isLastTask ?? false;

  // Auto-expand if this is the last task
  createEffect(() => {
    if (isLastTask() && !isExpanded()) {
      setIsExpanded(true);
    }
  });

  // Auto-scroll to this card when streaming content updates
  createEffect(() => {
    const streamingId = props.streamingTaskId?.();
    const currentContent = content();

    if (streamingId === taskId && currentContent?.trim().length > 0 && cardRef) {
      requestAnimationFrame(() => {
        cardRef.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  });

  // Only auto-expand if this is the currently streaming task (for non-last tasks)
  // All other tasks stay collapsed by default
  createEffect(() => {
    const currentContent = content();
    const streamingTaskId = props.streamingTaskId?.();
    const shouldAutoExpand = streamingTaskId === taskId;
    
    if (shouldAutoExpand && !isExpanded() && currentContent && currentContent.trim().length > 0) {
      setIsExpanded(true);
    }
  });

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded());
  };

  const getStepName = (task) =>
    task.step_name ||
    (task.step ? stepNames[task.step] : null) ||
    task.step ||
    "Unknown Step";

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const ActionButtons = () => {
    // Hide buttons only during active streaming for this specific task
    if (isCurrentlyStreaming()) {
      return null;
    }

    return (
      <div class="flex gap-1.5 flex-wrap">
        <button
          type="button"
          class="btn btn-sm text-white rounded-full transition-all hover:scale-105 group flex items-center gap-1 p-2 hover:pr-3"
          style="background-color:#9e28b5"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              await updateTask(taskId, { llm_response: '', content: '' });
              await props.refreshTasks();
              setIsExpanded(false);
              toastManager.success('Task reset successfully');
            } catch (error) {
              logger.error('Error resetting task:', error);
              toastManager.error('Failed to reset task: ' + error.message);
            }
          }}
          title="Reset this step"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span class="max-w-0 overflow-hidden transition-all duration-300 group-hover:max-w-[60px] whitespace-nowrap opacity-0 group-hover:opacity-100">
            Reset
          </span>
        </button>
        <button
          type="button"
          class="btn btn-sm text-white rounded-full transition-all hover:scale-105 group flex items-center gap-1 p-2 hover:pr-3"
          style="background-color:#00a7e0"
          onClick={(e) => {
            e.stopPropagation();
            if (props.setSelectedTaskId) {
              props.setSelectedTaskId(taskId);
            }
            // Also clear streaming state when selecting for instruct
            if (props.setStreamingTaskId) {
              props.setStreamingTaskId(null);
            }
          }}
          title={isCurrentlyStreaming() ? 'Cannot instruct on streaming task' : 'Add instructions'}
          disabled={isCurrentlyStreaming()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <path d="M12 7v14"></path>
            <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 0 0 0-3-3z"></path>
          </svg>
          <span class="max-w-0 overflow-hidden transition-all duration-300 group-hover:max-w-[60px] whitespace-nowrap opacity-0 group-hover:opacity-100">
            Instruct
          </span>
        </button>
        <button
          type="button"
          class="btn btn-sm text-white rounded-full transition-all hover:scale-105 group flex items-center gap-1 p-2 hover:pr-3"
          style="background-color:#ffc600"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const taskPrompt = task.prompt || '';
              if (!taskPrompt) {
                toastManager.error('No prompt available for this task');
                return;
              }
              
              // Set this task as streaming for UI feedback
              if (props.setStreamingTaskId) {
                props.setStreamingTaskId(taskId);
              }
              
              let newResponse = '';
              await props.callLLMForStep(taskPrompt, (chunk) => {
                newResponse += chunk;
              });
              
              await updateTask(taskId, { llm_response: newResponse, content: newResponse });
              await props.refreshTasks();
              
              if (props.setStreamingTaskId) {
                props.setStreamingTaskId(null);
              }
              
              setIsExpanded(true);
              toastManager.success('Task regenerated successfully');
            } catch (error) {
              if (props.setStreamingTaskId) {
                props.setStreamingTaskId(null);
              }
              logger.error('Error regenerating task:', error);
              toastManager.error('Failed to regenerate: ' + error.message);
            }
          }}
          title="Regenerate response"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 16h5v5"></path>
          </svg>
          <span class="max-w-0 overflow-hidden transition-all duration-300 group-hover:max-w-[80px] whitespace-nowrap opacity-0 group-hover:opacity-100">
            Regenerate
          </span>
        </button>
        <button
          type="button"
          class="btn btn-sm text-white rounded-full transition-all hover:scale-105 group flex items-center gap-1 p-2 hover:pr-3"
          style="background-color:#6cd14d"
          onClick={(e) => {
            e.stopPropagation();
            if (props.handleConfirm) props.handleConfirm(taskId);
          }}
          title="Confirm and proceed to next step"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span class="max-w-0 overflow-hidden transition-all duration-300 group-hover:max-w-[70px] whitespace-nowrap opacity-0 group-hover:opacity-100">
            Confirm
          </span>
        </button>
      </div>
    );
  };

  const stepName = () => {
    return getStepName(task);
  };

  const showActionButtons = () => true;



  return (
    <div
      ref={cardRef}
      class={`card bg-base-100 shadow-sm border border-base-300 transition-all duration-200 hover:shadow-md ${
        isSelected() ? 'ring-2 ring-info' : ''
      } mb-4 overflow-hidden`}
      data-task-id={taskId}
    >
        {/* Card Header */}
        <div class={`card-header bg-base-200/50 px-4 py-3 border-b border-base-300 flex flex-wrap items-center justify-between gap-2 ${
          props.streamingTaskId?.() === taskId && content() && content().trim().length > 0 && !isExpanded() ? 'ring-1 ring-primary/30' : ''
        }`}>
        <div class="flex items-center gap-2 min-w-0">
           <button
             onClick={toggleCollapse}
             class="btn btn-ghost btn-xs btn-square flex-shrink-0"
             title={!isExpanded() ? 'Expand' : 'Collapse'}
           >
             <svg 
               xmlns="http://www.w3.org/2000/svg" 
               width="16" 
               height="16" 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="currentColor" 
               stroke-width="2" 
               stroke-linecap="round" 
               stroke-linejoin="round"
               class={`transition-transform duration-200 ${!isExpanded() ? '-rotate-90' : ''}`}
             >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
          <div class="flex flex-col">
            <span class="font-semibold text-sm truncate flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary flex-shrink-0">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" x2="8" y1="13" y2="13"></line>
                <line x1="16" x2="8" y1="17" y2="17"></line>
                <line x1="10" x2="8" y1="9" y2="9"></line>
              </svg>
              <span class="truncate">{stepName()}</span>
            </span>
            <span class="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
               {formatDate(task.timestamp || task.created_at)}
            </span>
          </div>
        </div>
           <div class="flex items-center gap-2">
              <Show when={isSelected()}>
                <span class="badge badge-info badge-sm">Selected</span>
              </Show>
               <Show when={props.streamingTaskId?.() === taskId && content() && content().trim().length > 0 && !isExpanded()}>
                 <span class="badge badge-primary badge-sm animate-pulse">Streaming</span>
               </Show>
             <Show when={showActionButtons()}>
               <ActionButtons />
             </Show>
            </div>
      </div>

      {/* Card Body */}
      <Show when={isExpanded()}>
        <div class="card-body p-4 pt-3">
            <Show when={isEditing()} fallback={
              <div
                ref={contentRef}
                class="prose prose-base max-w-none dark:prose-invert rounded-lg p-2 -m-2 cursor-pointer hover:bg-base-200/30 transition-colors relative"
                onClick={() => {
                  if (props.setEditingTaskId) props.setEditingTaskId(taskId);
                  if (props.setEditContent) props.setEditContent(content() || '');
                }}
                >
                <Show when={!content() || content().trim().length === 0}>
                  <div class="flex items-center gap-2 text-base-content/60">
                    <div class="loading loading-dots loading-sm"></div>
                    <span class="text-sm">Generating response...</span>
                  </div>
                </Show>
                <Show when={content() && content().trim().length > 0}>
                  {(() => {
                    const rendered = marked.parse(renderFilledTemplate(content()) || '', { breaks: true, gfm: true });
                    return <div innerHTML={rendered} />;
                  })()}
                </Show>
              </div>
            }>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="label py-0">
                  <span class="label-text font-medium">Edit Content</span>
                </label>
                <div class="flex gap-1">
                  <select
                    class="select select-bordered select-xs w-auto"
                    value={task.priority || 'medium'}
                    onChange={(e) => {
                      const newPriority = e.target.value;
                      if (props.updateTask) props.updateTask(taskId, { priority: newPriority });
                    }}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
               <textarea
                 class="textarea textarea-bordered w-full min-h-[150px] text-sm font-mono"
                 value={props.editContent && typeof props.editContent === 'function' ? props.editContent() : ''}
                 onInput={(e) => {
                   if (props.setEditContent) props.setEditContent(e.target.value);
                 }}
                 placeholder="Enter task content..."
                 autofocus
               />
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      if (props.setEditingTaskId) props.setEditingTaskId(null);
                      if (props.setEditContent) props.setEditContent('');
                    }}
                    class="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await updateTask(taskId, { content: props.editContent() });
                        await props.refreshTasks();
                        if (props.setEditingTaskId) props.setEditingTaskId(null);
                        if (props.setEditContent) props.setEditContent('');
                        toastManager.success('Task saved successfully');
                      } catch (error) {
                        logger.error('Error saving task:', error);
                        toastManager.error('Failed to save task');
                      }
                    }}
                    class="btn btn-primary btn-sm"
                  >
                    Done
                  </button>
                </div>
            </div>
          </Show>
        </div>



        {/* Card Footer */}
        <div class="card-footer bg-base-200/30 px-4 py-2 border-t border-base-300">
          <div class="flex items-center justify-between text-xs text-base-content/60">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1" title="Task ID">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <line x1="9" x2="9" y1="3" y2="21"></line>
                </svg>
                <span class="font-mono">{taskId.substring(0, 8)}</span>
              </span>
              <Show when={task.model}>
                <span class="flex items-center gap-1" title="Model">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10"></path>
                    <path d="M12 2v10l7.5 7.5"></path>
                  </svg>
                  {task.model}
                </span>
              </Show>
            </div>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Click content to edit
            </span>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default UnifiedTaskCard;