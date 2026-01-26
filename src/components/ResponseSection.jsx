import { createSignal, Show, For, createEffect, onCleanup } from "solid-js";
import UnifiedTaskCard from "./UnifiedTaskCard";

const ResponseSection = (props) => {
  const groupedTasks = () => {
    const tasks = props.tasksList?.() || [];
    const groups = {};

    tasks.forEach((task) => {
      let modelName = task.model || 'General';
      if (modelName === 'System') modelName = 'Welcome to iGate';
      if (!groups[modelName]) {
        groups[modelName] = [];
      }
      groups[modelName].push(task);
    });

    return groups;
  };

  const modelOrder = [
     'Welcome to iGate',
    'Idea Model',
    'Business Model',
    'Technical Model',
    'Marketing Model',
    'Financial Model',
    'Funding Model',
    'Team Model',
    'Legal Model',
    'Reports',
    'General'
  ];

  const sortedModelNames = () => {
    const groups = groupedTasks();
    return Object.keys(groups).sort((a, b) => {
      const idxA = modelOrder.indexOf(a);
      const idxB = modelOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const allTasks = () => props.tasksList?.() || [];
  const lastTaskId = () => {
    const tasks = allTasks();
    return tasks.length > 0 ? tasks[tasks.length - 1].id : null;
  };

  const [collapsedGroups, setCollapsedGroups] = createSignal(
    modelOrder.reduce((acc, modelName) => ({ ...acc, [modelName]: true }), {})
  );

  const [expandedTaskId, setExpandedTaskId] = createSignal(null);
  const isGroupCollapsed = (modelName) => !!collapsedGroups()[modelName];

  const toggleGroup = (modelName) => {
    setCollapsedGroups((prev) => {
      const isCurrentlyCollapsed = prev[modelName];
      const newState = {};
      sortedModelNames().forEach((name) => {
        newState[name] = true;
      });
      if (isCurrentlyCollapsed) {
        newState[modelName] = false;
      }
      return newState;
    });
  };

  const modelIconMap = {
    'Welcome to iGate': 'settings',
    'Idea Model': 'lightbulb',
    'Business Model': 'briefcase',
    'Technical Model': 'cpu',
    'Marketing Model': 'megaphone',
    'Financial Model': 'coins',
    'Funding Model': 'piggy-bank',
    'Team Model': 'users',
    'Legal Model': 'scale',
    'Reports': 'file-text',
    'General': 'layers'
  };

  const getModelIcon = (modelName) => modelIconMap[modelName] || 'layers';

  createEffect(() => {
    groupedTasks();
    collapsedGroups();
    const rafId = requestAnimationFrame(() => {
      if (window?.lucide) {
        window.lucide.createIcons();
      }
    });
    onCleanup(() => {
      cancelAnimationFrame(rafId);
      setExpandedTaskId(null);
    });
  });

  return (
    <div class="flex-1 max-w-full max-w-3xl w-full mx-auto">
      {(props.startPressed?.() || (props.currentProjectId && props.currentProjectId()) || (props.tasksList && props.tasksList().length > 0)) ? (
        <div id="contentDiv" class="pb-40 pt-10 max-w-full lg:max-w-6xl mx-auto min-h-[200px]">
          {props.projectName && (
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-base-content">{props.projectName}</h1>
            </div>
          )}
          <Show when={props.tasksList && props.tasksList().length > 0}>
            <For each={sortedModelNames()}>
              {(modelName) => {
                const tasksForModel = () => groupedTasks()[modelName] || [];
                const taskCount = () => tasksForModel().length;
                const taskCountLabel = () => `${taskCount()} ${taskCount() === 1 ? 'step' : 'steps'}`;
                const isCollapsed = () => isGroupCollapsed(modelName);
                const regionId = `model-group-${modelName.replace(/\s+/g, '-').toLowerCase()}`;

                return (
                  <section class="mb-8"

                  >
                    <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden"

                    >
                      <button
                        type="button"
                        class={`card-header  px-4 py-3 border-b border-base-300 w-full flex items-center justify-between gap-2 transition-colors text-left ${isCollapsed() ? '' : 'hover:bg-base-200/80'}`}
                        onClick={(event) => {
                          event.preventDefault();
                          toggleGroup(modelName);
                        }}
                        aria-expanded={!isCollapsed()}
                        aria-controls={regionId}
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full  text-base-content">
                            <i data-lucide={getModelIcon(modelName)} class="w-4 h-4"></i>
                          </span>
                          <div class="flex flex-col min-w-0">
                            <span class="text-lg font-semibold text-base-content truncate">
                              {modelName}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 text-base-content/70">

                          <i data-lucide={isCollapsed() ? 'chevron-right' : 'chevron-down'} class="w-4 h-4"></i>
                        </div>
                      </button>

                      <div
                        id={regionId}
                        class={`card-body p-4 space-y-4 ${isCollapsed() ? 'hidden' : 'block'}`}
                      >
                        <For each={tasksForModel()}>
                          {(task) => (
                            <UnifiedTaskCard
                              task={task}
                              taskContent={task.content}
                              editingTaskId={props.editingTaskId}
                              editContent={props.editContent}
                              setEditingTaskId={props.setEditingTaskId}
                              setEditContent={props.setEditContent}
                              selectedTaskId={props.selectedTaskId}
                             callLLMForStep={props.callLLMForStep}
                             setTasksList={props.setTasksList}
                             setSelectedTaskId={props.setSelectedTaskId}
                             handleConfirm={props.handleConfirm}
                              updateTask={props.updateTask}
                              refreshTasks={props.refreshTasks}
                              streamingTaskId={props.streamingTaskId}
                              setStreamingTaskId={props.setStreamingTaskId}
                              isLastTask={task.id === lastTaskId()}
                              onDelete={props.onDelete}
                              isExpanded={task.id === (props.expandedTaskId ? props.expandedTaskId() : expandedTaskId())}
                              onToggle={() => {
                                if (props.setExpandedTaskId) {
                                  props.setExpandedTaskId(task.id === (props.expandedTaskId ? props.expandedTaskId() : expandedTaskId()) ? null : task.id);
                                } else {
                                  setExpandedTaskId(task.id === expandedTaskId() ? null : task.id);
                                }
                              }}
                              onForceExpand={(forcedId) => {
                                if (forcedId === task.id) {
                                  if (props.setExpandedTaskId) {
                                    props.setExpandedTaskId(forcedId);
                                  } else {
                                    setExpandedTaskId(forcedId);
                                  }
                                  setCollapsedGroups(prev => ({ ...prev, [modelName]: false }));
                                }
                              }}
                            />
                          )}
                        </For>
                      </div>

                      <div   class="card-footer bg-base-300 border-t border-base-100 text-base-content px-4 py-2 text-xs flex items-center justify-between"
  style={{
    "background-color":
      modelName === "Business Plan Report"
        ? "#6cd14d"
        : modelName === "Pitch Deck Report"
        ? "#60a5fa"
        : modelName === "Valuation Report"
        ? "#facc15"
        : "",

    "border-top": "1px solid",
    "border-color":
      modelName === "Business Plan Report"
        ? "#5bbf45"
        : modelName === "Pitch Deck Report"
        ? "#4f8fd9"
        : modelName === "Valuation Report"
        ? "#e0b814"
        : "",

    color: modelName?.includes("Report") ? "white" : "inherit",
  }}
                      >
                        <span class="flex items-center  gap-1">
                          <i data-lucide="info" class="w-3 h-3"></i>
                          {taskCount() > 0 ? `${modelName} tasks are listed above.` : 'No tasks generated yet.'}
                        </span>
                        <span class="flex items-center gap-1 ">
                          <i data-lucide="layers" class="w-3 h-3"></i>
                          {taskCountLabel()}
                        </span>
                      </div>
                    </div>
                  </section>
                );
              }}
            </For>
          </Show>
          {/* Show message when project is loaded but no tasks exist */}
          <Show when={!(props.tasksList && props.tasksList().length > 0)}>
            <div class="text-center py-10 text-base-content/70">
              <p>No tasks generated yet for this project.</p>
              <p class="text-sm mt-2">Use the Agent Interface below to start working on your project.</p>
            </div>
          </Show>
        </div>
      ) : null}
    </div>
  );
};

export default ResponseSection;
