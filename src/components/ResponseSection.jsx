import { Show, For, createEffect, createSignal, createMemo, useContext } from "solid-js";
import { marked } from "marked";
import { renderFilledTemplate } from "../lib/ui/llm-template";
import { steps, stepNames } from "../lib/business/steps";
import { LangContext } from "../context/LangContext";
import { uiTranslations } from "../assets/translations/translations-index.js";


/* ---------- Helpers ---------- */

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

const TaskCard = (props) => {
  const task = props.task;
  const taskId = task?.id || 'unknown';
  const stepName = getStepName(task);
  const isEditing = () => props.editingTaskId && props.editingTaskId() === taskId;
  const isLatest = () => props.latestTaskId === taskId;
  const isSelected = () => props.selectedTaskId && props.selectedTaskId() === taskId;
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed());
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ${diffSec % 60}s`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ${diffMin % 60}m`;
  };

  const ActionButtons = () => (
    <div class="flex gap-1.5 flex-wrap">
      <button
        type="button"
        class="btn btn-xs text-white rounded-full flex items-center gap-1 transition-all hover:scale-105"
        style="background-color:#9e28b5"
        onClick={(e) => {
          e.stopPropagation();
          if (props.handleReset) props.handleReset(taskId);
          else console.warn('Reset handler not configured');
        }}
        title="Reset this step"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        <span class="hidden sm:inline">Reset</span>
      </button>
      <button
        type="button"
        class="btn btn-xs text-white rounded-full flex items-center gap-1 transition-all hover:scale-105"
        style="background-color:#00a7e0"
        onClick={(e) => {
          e.stopPropagation();
          if (props.handleInstruct) props.handleInstruct(taskId);
        }}
        title="Add instructions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 7v14"></path>
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 0 0 0-3-3z"></path>
        </svg>
        <span class="hidden sm:inline">Instruct</span>
      </button>
      <button
        type="button"
        class="btn btn-xs text-white rounded-full flex items-center gap-1 transition-all hover:scale-105"
        style="background-color:#ffc600"
        onClick={(e) => {
          e.stopPropagation();
          if (props.handleRegenerate) props.handleRegenerate(taskId);
        }}
        title="Regenerate response"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
          <path d="M16 16h5v5"></path>
        </svg>
        <span class="hidden sm:inline">Regenerate</span>
      </button>
      <button
        type="button"
        class="btn btn-xs text-white rounded-full flex items-center gap-1 transition-all hover:scale-105"
        style="background-color:#6cd14d"
        onClick={(e) => {
          e.stopPropagation();
          if (props.handleConfirm) props.handleConfirm(taskId);
        }}
        title="Confirm and continue"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
        <span class="hidden sm:inline">Confirm</span>
      </button>
    </div>
  );

  return (
    <div 
      class={`card bg-base-100 shadow-sm border transition-all duration-200 hover:shadow-md ${
        isLatest() ? 'border-primary ring-1 ring-primary/20' : 'border-base-300'
      } ${isSelected() ? 'ring-2 ring-info' : ''} mb-4 overflow-hidden`}
      data-task-id={taskId}
    >
      {/* Card Header */}
      <div class="card-header bg-base-200/50 px-4 py-3 border-b border-base-300 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <button
            onClick={toggleCollapse}
            class="btn btn-ghost btn-xs btn-square flex-shrink-0"
            title={isCollapsed() ? 'Expand' : 'Collapse'}
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
              class={`transition-transform duration-200 ${isCollapsed() ? '-rotate-90' : ''}`}
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
              <span class="truncate">{stepName}</span>
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
          <Show when={isLatest()}>
            <span class="badge badge-primary badge-sm">Latest</span>
          </Show>
          <Show when={isSelected()}>
            <span class="badge badge-info badge-sm">Selected</span>
          </Show>
          <ActionButtons />
        </div>
      </div>

      {/* Card Body */}
      <Show when={!isCollapsed()}>
        <div class="card-body p-4 pt-3">
          <Show when={isEditing()} fallback={
            <div 
              class="prose prose-sm max-w-none dark:prose-invert cursor-pointer hover:bg-base-200/30 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => {
                if (props.setEditingTaskId) props.setEditingTaskId(taskId);
                if (props.setEditContent) props.setEditContent(task.content || '');
              }}
              innerHTML={marked.parse(renderFilledTemplate(task.content) || '', { breaks: true, gfm: true })}
            />
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
                  if (props.autoSave) props.autoSave(taskId, e.target.value);
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
                  onClick={() => {
                    if (props.setEditingTaskId) props.setEditingTaskId(null);
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
              <Show when={task.start_time && task.end_time}>
                <span class="flex items-center gap-1" title="Duration">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {formatDuration(task.start_time, task.end_time)}
                </span>
              </Show>
              <Show when={task.created_at && task.updated_at && task.created_at !== task.updated_at}>
                <span class="flex items-center gap-1" title="Last updated">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6"></path>
                    <path d="M21.34 5.5A10 10 0 1 1 12 2"></path>
                  </svg>
                  Updated {formatDate(task.updated_at)}
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


/* ---------- Component ---------- */

const ResponseSection = (props) => {
  const { lang } = useContext(LangContext) || { lang: () => 'ar' };
  const [currentLang, setCurrentLang] = createSignal(lang());

  // Reactive translation function
  const t = createMemo(() => {
    const langKey = currentLang();
    return uiTranslations[langKey] || uiTranslations.ar;
  });

  createEffect(() => {
    if (lang) {
      setCurrentLang(lang());
    }
  });

  const startPressedCondition = props.startPressed && props.startPressed();
  const tasksCondition = props.tasksList && props.tasksList().length > 0;
  const shouldShow = startPressedCondition || tasksCondition;

  const sortedTasks = createMemo(() => {
    return props.tasksList().sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  });

  const latestTask = createMemo(() => {
    const tasks = sortedTasks();
    return tasks[tasks.length - 1];
  });

  const latestTaskId = createMemo(() => latestTask()?.id || null);

  return (
    <div class="flex-1 max-w-full max-w-3xl w-full mx-auto">
      <style>
        {`
          .typing-cursor {
            animation: blink 1s infinite;
            color: #666;
            font-weight: normal;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
      <Show when={shouldShow}>
        <div id="contentDiv" class="pb-40 pt-10 max-w-full lg:max-w-6xl mx-auto min-h-[200px]">
          
          {/* Streaming Content Card */}
          <Show when={typeof props.streamingContent === 'function' && props.streamingContent() && props.streamingContent().length > 0}>
            <div class="card bg-base-100 shadow-sm border border-info/30 mb-4 overflow-hidden">
              <div class="card-header bg-info/10 px-4 py-3 border-b border-info/20 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-info"></div>
                  <span class="font-semibold text-sm text-info">Generating response...</span>
                </div>
                <span class="badge badge-info badge-sm">Awaiting Confirmation</span>
              </div>
              <div class="card-body p-4">
                <div 
                  class="prose prose-sm max-w-none dark:prose-invert"
                  innerHTML={marked.parse(props.streamingContent(), { breaks: true, gfm: true })}
                />
              </div>
              <div class="card-footer bg-info/5 px-4 py-3 border-t border-info/20">
                <div class="flex justify-end gap-2 flex-wrap">
                  <button
                    type="button"
                    class="btn btn-sm text-white"
                    style="background-color:#9e28b5"
                    onClick={() => {
                      if (props.handleReset) props.handleReset();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Reset
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm text-white"
                    style="background-color:#00a7e0"
                    onClick={() => {
                      if (props.handleInstruct) props.handleInstruct();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 7v14"></path>
                      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                    </svg>
                    Instruct
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm text-white"
                    style="background-color:#ffc600"
                    onClick={() => {
                      if (props.handleRegenerate) props.handleRegenerate();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                      <path d="M16 16h5v5"></path>
                    </svg>
                    Regenerate
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm text-white"
                    style="background-color:#6cd14d"
                    onClick={() => {
                      if (props.handleConfirm) props.handleConfirm();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Task Cards */}
          <For each={sortedTasks()}>
            {(task) => (
              <TaskCard 
                task={task}
                tasksList={props.tasksList}
                editingTaskId={props.editingTaskId}
                editContent={props.editContent}
                setEditingTaskId={props.setEditingTaskId}
                setEditContent={props.setEditContent}
                selectedTaskId={props.selectedTaskId}
                latestTaskId={latestTaskId()}
                handleReset={props.handleReset}
                handleInstruct={props.handleInstruct}
                handleRegenerate={props.handleRegenerate}
                handleConfirm={props.handleConfirm}
                updateTask={props.updateTask}
                autoSave={props.autoSave}
              />
            )}
          </For>

          {/* Streaming Error Display */}
          <Show when={props.streamingError && typeof props.streamingError === 'function' && props.streamingError()}>
            <div class="alert alert-error shadow-sm mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <div>
                <h4 class="font-medium">Streaming Error</h4>
                <p class="text-sm">{props.streamingError()}</p>
              </div>
            </div>
          </Show>

          {/* Empty State */}
          <Show when={!tasksCondition && !props.isLoading}>
            <div class="text-center py-12 text-base-content/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 opacity-50">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" x2="8" y1="13" y2="13"></line>
                <line x1="16" x2="8" y1="17" y2="17"></line>
                <line x1="10" x2="8" y1="9" y2="9"></line>
              </svg>
              <p class="text-sm">No tasks yet. Start the accelerator to generate your first task.</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default ResponseSection;
