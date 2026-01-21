import { createMemo, createSignal, Show } from "solid-js";
import UnifiedTaskCard from "./UnifiedTaskCard";

const ResponseSection = (props) => {

  const startPressedCondition = props.startPressed && props.startPressed();
  const tasksCondition = props.tasksList && props.tasksList().length > 0;

  const tasksListValue = () => props.tasksList?.() || [];

  return (
    <div class="flex-1 max-w-full max-w-3xl w-full mx-auto">
      {startPressedCondition || tasksCondition ? (
        <div id="contentDiv" class="pb-40 pt-10 max-w-full lg:max-w-6xl mx-auto min-h-[200px]">
          {props.projectName && (
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-base-content">{props.projectName}</h1>
            </div>
          )}
          <Show when={tasksListValue().length > 0}>
            {tasksListValue().map((task) => (
              <UnifiedTaskCard
                task={task}
                editingTaskId={props.editingTaskId}
                editContent={props.editContent}
                setEditingTaskId={props.setEditingTaskId}
                setEditContent={props.setEditContent}
                selectedTaskId={props.selectedTaskId}
                callLLMForStep={props.callLLMForStep}
                setSelectedTaskId={props.setSelectedTaskId}
                handleConfirm={props.handleConfirm}
                updateTask={props.updateTask}
                refreshTasks={props.refreshTasks}
              />
            ))}
          </Show>
        </div>
      ) : null}
    </div>
  );
};

export default ResponseSection;
