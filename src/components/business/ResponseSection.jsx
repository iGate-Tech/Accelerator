import { createSignal, Show, For, createEffect, onCleanup } from 'solid-js';
import { stepNames, getLocalizedModelName } from '@lib/business.js';
import { useContext } from 'solid-js';
import { LangContext } from '@context/LangContext';
import UnifiedTaskCard from './UnifiedTaskCard';
import { Info, Layers, Settings, Lightbulb, Briefcase, Cpu, Megaphone, Coins, PiggyBank, Users, Scale, Presentation, FileText, TrendingUp, ChevronRight, ChevronDown } from 'lucide-solid';

const ResponseSection = props => {
  const { lang } = useContext(LangContext);
  const currentLang = () => lang();

  const groupedTasks = () => {
    const tasks = props.tasksList?.() || [];
    const groups = {};

    if (tasks && Array.isArray(tasks)) {
      tasks.forEach(task => {
        let modelName = task.model || 'General';
        if (modelName === 'System') modelName = 'Welcome to iGate';
        if (!groups[modelName]) {
          groups[modelName] = [];
        }
        groups[modelName].push(task);
      });
    }

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
    'Pitch Deck Model',
    'Business Plan Model',
    'Valuation Report Model',
    'General',
  ];

  const sortedModelNames = () => {
    const groups = groupedTasks();
    return Object.keys(groups).sort((a, b) => {
      // Use original English names for sorting to maintain consistent order
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
  const isGroupCollapsed = modelName => !!collapsedGroups()[modelName];

  const toggleGroup = modelName => {
    setCollapsedGroups(prev => {
      const isCurrentlyCollapsed = prev[modelName];
      const newState = {};
      sortedModelNames().forEach(name => {
        newState[name] = true;
      });
      if (isCurrentlyCollapsed) {
        newState[modelName] = false;
      }
      return newState;
    });
  };

  const modelIconMap = {
    'Welcome to iGate': Settings,
    'Idea Model': Lightbulb,
    'Business Model': Briefcase,
    'Technical Model': Cpu,
    'Marketing Model': Megaphone,
    'Financial Model': Coins,
    'Funding Model': PiggyBank,
    'Team Model': Users,
    'Legal Model': Scale,
    'Pitch Deck Model': Presentation,
    'Business Plan Model': FileText,
    'Valuation Report Model': TrendingUp,
    General: Layers,
  };

  const getModelIcon = modelName => modelIconMap[modelName] || Layers;

  createEffect(() => {
    groupedTasks();
    collapsedGroups();

    onCleanup(() => {
      cancelAnimationFrame(rafId);
      setExpandedTaskId(null);
    });
  });

  return (
    <div class="mx-auto w-full flex-1">
      {props.currentProjectId && props.currentProjectId() ? (
        <div id="contentDiv" class="min-h-[200px] pt-10 pb-40">
          {props.projectName && (
            <div class="mb-6">
              <h1 class="text-base-content text-2xl font-bold">
                {props.projectName}
              </h1>
            </div>
          )}
          <Show
            when={
              props.tasksList &&
              props.tasksList() &&
              props.tasksList().length > 0
            }
          >
            <For each={sortedModelNames()}>
              {modelName => {
                const tasksForModel = () => groupedTasks()[modelName] || [];
                const taskCount = () => tasksForModel().length;
                const taskCountLabel = () =>
                  `${taskCount()} ${taskCount() === 1 ? 'step' : 'steps'}`;
                const isCollapsed = () => isGroupCollapsed(modelName);
                const regionId = `model-group-${modelName.replace(/\s+/g, '-').toLowerCase()}`;

                return (
                  <section class="mb-8">
                    <div class="card bg-base-100 border-base-300 overflow-hidden border shadow-sm">
                      <button
                        type="button"
                        class={`card-header border-base-300 flex w-full items-center justify-between gap-2 border-b px-4 py-3 text-left transition-colors ${isCollapsed() ? '' : 'hover:bg-base-200/80'}`}
                        onClick={event => {
                          event.preventDefault();
                          toggleGroup(modelName);
                        }}
                        aria-expanded={!isCollapsed()}
                        aria-controls={regionId}
                      >
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="text-base-content inline-flex h-9 w-9 items-center justify-center rounded-full">
                            {(() => {
                              const IconComponent = getModelIcon(modelName);
                              return <IconComponent class="h-4 w-4" />;
                            })()}
                          </span>
                          <div class="flex min-w-0 flex-col">
                            <span class="text-base-content truncate text-lg font-semibold">
                              {getLocalizedModelName(modelName, currentLang())}
                            </span>
                          </div>
                        </div>
                        <div class="text-base-content/70 flex items-center gap-2">
                          {isCollapsed() ? (
                            <ChevronRight class="h-4 w-4" />
                          ) : (
                            <ChevronDown class="h-4 w-4" />
                          )}
                        </div>
                      </button>

                      <div
                        id={regionId}
                        class={`card-body space-y-4 p-4 ${isCollapsed() ? 'hidden' : 'block'}`}
                      >
                        <For each={tasksForModel()}>
                          {task => (
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
                              isExpanded={
                                task.id ===
                                (props.expandedTaskId
                                  ? props.expandedTaskId()
                                  : expandedTaskId())
                              }
                              onToggle={() => {
                                if (props.setExpandedTaskId) {
                                  props.setExpandedTaskId(
                                    task.id ===
                                      (props.expandedTaskId
                                        ? props.expandedTaskId()
                                        : expandedTaskId())
                                      ? null
                                      : task.id
                                  );
                                } else {
                                  setExpandedTaskId(
                                    task.id === expandedTaskId()
                                      ? null
                                      : task.id
                                  );
                                }
                              }}
                              onForceExpand={forcedId => {
                                if (forcedId === task.id) {
                                  if (props.setExpandedTaskId) {
                                    props.setExpandedTaskId(forcedId);
                                  } else {
                                    setExpandedTaskId(forcedId);
                                  }
                                  setCollapsedGroups(prev => ({
                                    ...prev,
                                    [modelName]: false,
                                  }));
                                }
                              }}
                            />
                          )}
                        </For>
                      </div>

                      <div
                        class="card-footer bg-base-300 border-base-100 text-base-content flex items-center justify-between border-t px-4 py-2 text-xs"
                        style={{
                          'background-color':
                            modelName === 'Business Plan Model' ||
                            modelName === 'نموذج خطة العمل'
                              ? '#6cd14d'
                              : modelName === 'Pitch Deck Model' ||
                                  modelName === 'نموذج العرض التقديمي'
                                ? '#60a5fa'
                                : modelName === 'Valuation Report Model' ||
                                    modelName === 'نموذج تقرير التقييم'
                                  ? '#facc15'
                                  : '',

                          'border-top': '1px solid',
                          'border-color':
                            modelName === 'Business Plan Model' ||
                            modelName === 'نموذج خطة العمل'
                              ? '#5bbf45'
                              : modelName === 'Pitch Deck Model' ||
                                  modelName === 'نموذج العرض التقديمي'
                                ? '#4f8fd9'
                                : modelName === 'Valuation Report Model' ||
                                    modelName === 'نموذج تقرير التقييم'
                                  ? '#e0b814'
                                  : '',

                          color:
                            (modelName?.includes('Model') ||
                              modelName?.includes('نموذج')) &&
                            (modelName.includes('Report') ||
                              modelName.includes('Plan') ||
                              modelName.includes('Deck') ||
                              modelName.includes('تقديمي') ||
                              modelName.includes('العمل') ||
                              modelName.includes('التقييم'))
                              ? 'white'
                              : 'inherit',
                        }}
                      >
                        <span class="flex items-center gap-1">
                          <Info class="h-3 w-3" />
                          {taskCount() > 0
                            ? `${getLocalizedModelName(modelName, currentLang())} tasks are listed above.`
                            : 'No tasks generated yet.'}
                        </span>
                        <span class="flex items-center gap-1">
                          <Layers class="h-3 w-3" />
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
          <Show
            when={
              !(
                props.tasksList &&
                props.tasksList() &&
                props.tasksList().length > 0
              )
            }
          >
            <div class="text-base-content/70 py-10 text-center">
              <p>No tasks generated yet for this project.</p>
              <p class="mt-2 text-sm">
                Use the Agent Interface below to start working on your project.
              </p>
            </div>
          </Show>
        </div>
      ) : (
        <div class="flex h-64 items-center justify-center">
          <p class="text-base-content/60 text-lg">
            Select a project to view tasks
          </p>
        </div>
      )}
    </div>
  );
};

export default ResponseSection;
