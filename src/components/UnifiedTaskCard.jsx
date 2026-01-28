import { createMemo, createEffect, Show, createSignal } from 'solid-js';
import { marked } from 'marked';
import { renderFilledTemplate } from '@lib/ui/llm-template';
import { updateTask, deleteTask } from '@lib/database';
import { logger } from '@lib/core';
import { toastManager } from '@lib/ui/feedback';
import { stepNames } from '@lib/business.js';
import { normalizeLLMResponse } from '@lib/ui/response-normalizer';

const UnifiedTaskCard = props => {
  const task = props.task;
  const taskId = task?.id || 'unknown';

  const content = () =>
    normalizeLLMResponse(props.taskContent ?? task?.content ?? '');

  // Make llmResponse reactive to changes in task
  const llmResponse = () => {
    // Access task.llm_response to track it reactively
    const response = task?.llm_response;
    return normalizeLLMResponse(response ?? '');
  };

  // During streaming, use llm_response if available, otherwise fall back to content
  const displayContent = () => {
    // Explicitly access both values to ensure reactivity
    const llmResp = llmResponse();
    const cont = content();

    // During active streaming, prioritize the llm_response which gets updated in real-time
    if (isCurrentlyStreaming()) {
      return llmResp || cont;
    }
    // When not streaming, use the final llm_response if available, otherwise content
    return llmResp || cont;
  };

  const isEditing = () =>
    props.editingTaskId && props.editingTaskId() === taskId;
  const isSelected = () =>
    props.selectedTaskId && props.selectedTaskId() === taskId;
  const isExpanded = () => props.isExpanded;
  let contentRef;
  let cardRef;

  const isStreaming = () => props.isStreaming ?? false;
  const isStreamingComplete = () => props.isStreamingComplete ?? true;
  const isCurrentlyStreaming = () => props.streamingTaskId?.() === taskId;
  const isLastTask = () => props.isLastTask ?? false;
  const projectIsComplete = () =>
    typeof props.isProjectComplete === 'function'
      ? (props.isProjectComplete() ?? false)
      : !!props.isProjectComplete;

  createEffect(() => {
    if (isCurrentlyStreaming() && typeof props.onForceExpand === 'function') {
      props.onForceExpand(taskId);
    }
  });

  // Preprocess markdown to handle ==text== syntax (highlight)
  const preprocessMarkdown = markdown => {
    if (!markdown) return '';
    // Convert ==text== to <mark>text</mark> for highlighting
    return markdown.replace(/==(.*?)==/g, '<mark>$1</mark>');
  };

  // Create a signal to track the current content for reactivity
  const [currentContent, setCurrentContent] = createSignal(displayContent());

  // Effect to update current content when displayContent changes during streaming
  createEffect(() => {
    if (isCurrentlyStreaming()) {
      setCurrentContent(displayContent());
    }
  });

  // Subscribe to changes in task's content during streaming
  createEffect(() => {
    // Access both content and llm_response to track changes
    const taskContent = task?.content;
    const taskLlmResponse = task?.llm_response;
    const taskTimestamp = task?.last_modified; // Use timestamp to detect changes

    // Only update the current content if we're currently streaming this task
    if (isCurrentlyStreaming()) {
      const contentValue = displayContent();
      setCurrentContent(contentValue);
    }
  });

  // Memoize expensive rendering operations - based on currentContent signal
  const renderedContent = createMemo(() => {
    const displayText = currentContent();
    if (!displayText || displayText.trim().length === 0) return '';
    const processedContent = preprocessMarkdown(
      renderFilledTemplate(displayText) || ''
    );
    return marked.parse(processedContent, { breaks: true, gfm: true });
  });

  // Auto-expand if this is the last task

  // Auto-scroll to this card when streaming content updates
  createEffect(() => {
    const streamingId = props.streamingTaskId?.();
    const currentContent = displayContent();

    if (
      streamingId === taskId &&
      currentContent?.trim().length > 0 &&
      cardRef
    ) {
      requestAnimationFrame(() => {
        // Use the native scrollIntoView but adjust the scroll position afterwards
        cardRef.scrollIntoView({ behavior: 'auto', block: 'end' });

        // Then adjust the scroll position to account for 200px from the bottom
        const rect = cardRef.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 200) {
          const currentScrollY = window.scrollY || window.pageYOffset;
          const adjustment = rect.bottom - (window.innerHeight - 500);
          window.scrollTo({
            top: currentScrollY + adjustment,
            behavior: 'smooth',
          });
        }
      });
    }
  });

  // Only auto-expand if this is the currently streaming task (for non-last tasks)
  // All other tasks stay collapsed by default

  const toggleCollapse = e => {
    e.stopPropagation();
    if (props.onToggle) {
      props.onToggle();
    }
  };

  const getStepName = task =>
    task.step_name ||
    (task.step ? stepNames('en')[task.step] : null) || // Use English for task matching
    task.step ||
    'Unknown Step';

  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const ActionButtons = () => {
    // Hide buttons only during active streaming for this specific task
    if (isCurrentlyStreaming()) {
      return null;
    }

    return (
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="btn btn-sm group flex items-center gap-0 rounded-full p-2 text-white transition-all hover:scale-105"
          style={{ 'background-color': '#9e28b5' }}
          onClick={async e => {
            e.stopPropagation();
            try {
              await deleteTask(taskId);
              await props.refreshTasks();
              if (props.onDelete) {
                props.onDelete(taskId);
              }
              toastManager.success('Step deleted successfully');
            } catch (error) {
              logger.error('Error deleting task:', error);
              toastManager.error('Failed to delete step: ' + error.message);
            }
          }}
          title="Delete this step"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[60px] group-hover:opacity-100">
            Reset
          </span>
        </button>
        <button
          type="button"
          class="btn btn-sm group flex items-center gap-0 rounded-full p-2 text-white transition-all hover:scale-105"
          style={{ 'background-color': '#00a7e0' }}
          onClick={e => {
            e.stopPropagation();
            if (props.setSelectedTaskId) {
              props.setSelectedTaskId(taskId);
            }
            // Also clear streaming state when selecting for instruct
            if (props.setStreamingTaskId) {
              props.setStreamingTaskId(null);
            }
          }}
          title={
            isCurrentlyStreaming()
              ? 'Cannot instruct on streaming task'
              : 'Add instructions'
          }
          disabled={isCurrentlyStreaming()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0"
          >
            <path d="M12 7v14" />
            <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 0 0 0-3-3z" />
          </svg>
          <span class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[60px] group-hover:opacity-100">
            Instruct
          </span>
        </button>
        <button
          type="button"
          class="btn btn-sm group flex items-center gap-0 rounded-full p-2 text-white transition-all hover:scale-105"
          style={{ 'background-color': '#ffc600' }}
          onClick={async e => {
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

              let accumulatedResponse = '';
              await props.callLLMForStep(taskPrompt, chunk => {
                accumulatedResponse += chunk;
                const normalized = normalizeLLMResponse(accumulatedResponse);
                if (props.setTasksList) {
                  props.setTasksList(currentTasks =>
                    currentTasks.map(t =>
                      t.id === taskId
                        ? {
                            ...t,
                            llm_response: normalized, // Update llm_response during streaming
                            last_modified: new Date().toISOString(),
                          }
                        : t
                    )
                  );
                }

                // Also update the current content signal directly for immediate UI feedback
                setCurrentContent(normalized);
              });

              const finalResponse = normalizeLLMResponse(accumulatedResponse);
              await updateTask(taskId, {
                llm_response: finalResponse,
                last_modified: new Date().toISOString(),
              });
              await props.refreshTasks();

              if (props.setStreamingTaskId) {
                props.setStreamingTaskId(null);
              }

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[80px] group-hover:opacity-100">
            Regenerate
          </span>
        </button>
        <Show when={!projectIsComplete()}>
          <button
            type="button"
            class="btn btn-sm group flex items-center gap-0 rounded-full p-2 text-white transition-transform hover:scale-105"
            style={{ 'background-color': '#6cd14d' }}
            onClick={e => {
              e.stopPropagation();
              if (props.handleConfirm) props.handleConfirm(taskId);
            }}
            title="Confirm and proceed to next step"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="flex-shrink-0"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[70px] group-hover:opacity-100">
              Confirm
            </span>
          </button>
        </Show>
        <Show when={projectIsComplete()}>
          <button
            type="button"
            class="btn btn-sm flex cursor-not-allowed items-center gap-0 rounded-full p-2 text-white opacity-50"
            style={{ 'background-color': '#6cd14d' }}
            title="All steps completed"
            disabled
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="flex-shrink-0"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Completed</span>
          </button>
        </Show>
      </div>
    );
  };

  const stepName = () => {
    return getStepName(task);
  };

  const showActionButtons = () => isExpanded();

  return (
    <div
      ref={cardRef}
      class={`card bg-base-100 border-base-300 border transition-all duration-200 ${
        isSelected() ? 'ring-info ring-2' : ''
      } mb-4 overflow-hidden`}
      data-task-id={taskId}
    >
      {/* Card Header */}
      <div
        class={`card-header border-base-300 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${
          props.streamingTaskId?.() === taskId &&
          displayContent() &&
          displayContent().trim().length > 0 &&
          !isExpanded()
            ? 'ring-primary/30 ring-1'
            : ''
        } ${isCurrentlyStreaming() ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        <div class="flex min-w-0 items-center gap-2">
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
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <div class="flex flex-col">
            <span class="flex items-center gap-1.5 truncate text-sm font-semibold">
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
                class="text-base-content flex-shrink-0"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
              <span class="truncate">{stepName()}</span>
            </span>
            <span class="text-base-content/60 mt-0.5 flex items-center gap-1 text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDate(task.timestamp || task.created_at)}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Show when={isSelected()}>
            <span class="badge badge-info badge-sm">Selected</span>
          </Show>
          <Show
            when={
              props.streamingTaskId?.() === taskId &&
              displayContent() &&
              displayContent().trim().length > 0 &&
              !isExpanded()
            }
          >
            <span class="badge badge-primary badge-sm animate-pulse">
              Streaming
            </span>
          </Show>
          <Show when={isCurrentlyStreaming() && isExpanded()}>
            <span class="badge badge-info badge-sm flex animate-pulse items-center gap-1">
              <span class="loading loading-spinner loading-xs" />
              Generating
            </span>
          </Show>
          <Show when={isExpanded()}>
            <ActionButtons />
          </Show>
        </div>
      </div>

      {/* Card Body */}
      <Show when={isExpanded()}>
        <div class="card-body p-4 pt-3">
          <Show
            when={isEditing()}
            fallback={
              <div
                ref={contentRef}
                class="prose prose-base dark:prose-invert hover:bg-base-200/30 relative -m-2 max-w-none cursor-pointer rounded-lg p-2 transition-colors"
                onClick={() => {
                  if (props.setEditingTaskId) props.setEditingTaskId(taskId);
                  if (props.setEditContent)
                    props.setEditContent(currentContent() || '');
                }}
              >
                <Show
                  when={
                    !currentContent() || currentContent().trim().length === 0
                  }
                >
                  <div class="text-base-content/60 flex items-center gap-2">
                    <div class="loading loading-dots loading-sm" />
                    <span class="text-sm">Generating response...</span>
                  </div>
                </Show>
                <Show
                  when={
                    isCurrentlyStreaming() &&
                    currentContent() &&
                    currentContent().trim().length > 0
                  }
                >
                  <div class="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-300">
                    <div class="loading loading-dots loading-sm" />
                    <span class="text-sm font-medium">
                      Generating response...
                    </span>
                  </div>
                </Show>
                <Show
                  when={currentContent() && currentContent().trim().length > 0}
                >
                  <div innerHTML={renderedContent()} />
                </Show>
                <Show
                  when={
                    isCurrentlyStreaming() &&
                    (!currentContent() || currentContent().trim().length === 0)
                  }
                >
                  <div class="text-base-content/60 flex items-center gap-2">
                    <div class="loading loading-dots loading-sm" />
                    <span class="text-sm">Waiting for response...</span>
                  </div>
                </Show>
              </div>
            }
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="label py-0">
                  <span class="label-text font-medium">Edit Content</span>
                </label>
                <div class="flex gap-1">
                  <select
                    class="select select-bordered select-xs w-auto"
                    value={task.priority || 'medium'}
                    onChange={e => {
                      const newPriority = e.target.value;
                      if (props.updateTask)
                        props.updateTask(taskId, { priority: newPriority });
                    }}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <textarea
                class="textarea textarea-bordered min-h-[150px] w-full font-mono text-sm"
                value={
                  props.editContent && typeof props.editContent === 'function'
                    ? props.editContent()
                    : ''
                }
                onInput={e => {
                  if (props.setEditContent)
                    props.setEditContent(e.target.value);
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
                      await updateTask(taskId, {
                        content: props.editContent(),
                      });
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
        <div class="card-footer bg-base-200/30 border-base-300 border-t px-4 py-2">
          <div class="text-base-content/60 flex items-center justify-between text-xs">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1" title="Task ID">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <line x1="9" x2="9" y1="3" y2="21" />
                </svg>
                <span class="font-mono">{taskId.substring(0, 8)}</span>
              </span>
              <Show when={task.model}>
                <span class="flex items-center gap-1" title="Model">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M12 2v10l7.5 7.5" />
                  </svg>
                  {task.model}
                </span>
              </Show>
            </div>
            <span class="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
