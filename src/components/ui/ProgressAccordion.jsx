import {Show, For, createMemo, onMount} from "solid-js";
import {stepOrder, modelCumul} from "../../lib/machine";
import logger from '../../lib/logger.js';


const ProgressAccordion = (props) => {
    logger.debug('ProgressAccordion props.project:', props.project);

    const modelsWithChecked = createMemo(() => props.machineStore.context ? [
        {
            name: 'Idea Model',
            icon: 'lightbulb',
            color: 'warning'
        },
        {
            name: 'Business Model',
            icon: 'briefcase',
            color: 'primary'
        },
        {
            name: 'Financial Model',
            icon: 'dollar-sign',
            color: 'success'
        },
        {
            name: 'Funding Model',
            icon: 'trending-up',
            color: 'secondary'
        },
        {
            name: 'Marketing Model',
            icon: 'megaphone',
            color: 'accent'
        },
        {
            name: 'Team Model',
            icon: 'users',
            color: 'info'
        },
        {
            name: 'Legal Model',
            icon: 'scale',
            color: 'error'
        },
        {
            name: 'Technical Model',
            icon: 'cpu',
            color: 'neutral'
        }
    ].map(model => ({
        ...model,
        checked: props.machineStore.context.completedSteps >= (modelCumul[model.name] || 0)
    })) : []);

    const reportsWithChecked = createMemo(() => props.machineStore.context ? [
        {
            name: 'Pitch Deck Report',
            icon: 'file-text',
            color: 'base'
        }, {
            name: 'Business Plan Report',
            icon: 'file-text',
            color: 'ghost'
        }, {
            name: 'Valuation Report',
            icon: 'file-text',
            color: 'warning'
        }
    ].map(model => ({
        ...model,
        checked: props.machineStore.context.completedSteps >= (modelCumul[model.name] || 0)
    })) : []);

    onMount(() => {
        if (window.lucide)
            window.lucide.createIcons();

    });
    return (
        <div class="flex items-center w-full mb-2 ">
            <div class="collapse max-w-6xl mx-auto collapse-arrow bg-base-100 flex-1 ">
                <input type="checkbox" class="p-0" name="ai-tasks-accordion"
                    checked={false}
                    onChange={
                        () => props.setIsAccordionOpen(!props.isAccordionOpen())
                    }/>
                <div class="collapse-title font-semibold flex !p-2 items-center">
                    <span class="badge bg-primary/10 badge-sm text-primary whitespace-nowrap">iGate OS - Accelerator Agent : {
                        props.machineStore.context.completedSteps || 0
                    }
                        / 51 Complete</span>
                    <div class="flex px-4 w-full mr-8 gap-4">

                        <progress id="agent-progress" class="progress progress-primary h-2 w-full px-4"
                            value={
                                isFinite(props.machineStore.context.uiProgress) ? props.machineStore.context.uiProgress : 0
                            }
                            max="100"></progress>
                    </div>
                </div>
                <div class="collapse-content p-0">
                    <div class="space-y-4">
                        {/* Database Setup */}
                        <div class="card">
                            <div class="card-body p-1">
                                <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-0">
                                    <legend class="fieldset-legend text-primary">Models</legend>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-base-content/30">
                                        <For each={modelsWithChecked()}>
                                            {(model) => (
                                                <label class="label cursor-pointer">
                                                    <span class="w-4 h-4 flex items-center justify-center">
                                                        {model.checked ? <i data-lucide="circle-check" class={`w-4 h-4 text-success`}></i> :
                                                         model.name === props.machineStore.context?.currentModel ? <i data-lucide="circle-dot-dashed" class={`w-4 h-4 text-primary`}></i> :
                                                         <i data-lucide="circle-minus" class={`w-4 h-4 text-base-content/30`}></i>}
                                                    </span>
                                                    <span class={`label-text flex items-center gap-1 ${model.checked ? 'text-success' : model.name === props.machineStore.context?.currentModel ? 'text-primary' : 'text-base-content/30'}`}>
                                                        {model.name}
                                                    </span>
                                                </label>
                                            )}
                                        </For>
                                    </div>
                                </fieldset>
                                <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-4">
                                    <legend class="fieldset-legend text-primary">Reports</legend>
                                    <div class="grid grid-cols-3 gap-4 text-base-content/30">
                                        <For each={reportsWithChecked()}>
                                            {(model) => (
                                                <label class="label cursor-pointer">
                                                    <span class="w-4 h-4 flex items-center justify-center">
                                                        {model.checked ? <i data-lucide="circle-check" class={`w-4 h-4 text-success`}></i> :
                                                         model.name === props.machineStore.context?.currentModel ? <i data-lucide="circle-dot-dashed" class={`w-4 h-4 text-primary`}></i> :
                                                         <i data-lucide="circle-minus" class={`w-4 h-4 text-base-content/30`}></i>}
                                                    </span>
                                                    <span class={`label-text flex items-center gap-1 ${model.checked ? 'text-success' : model.name === props.machineStore.context?.currentModel ? 'text-primary' : 'text-base-content/30'}`}>
                                                        {model.name}
                                                    </span>
                                                </label>
                                            )}
                                        </For>
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 ml-4 ">

                     <Show when={
                        props.machineStore.state === 'processing'
                    }>
                        <button type="button"
                            onClick={
                                props.handlePause
                            }
                            class="bg-warning/10 text-warning px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-warning/20 transition cursor-pointer">
                            <i data-lucide="pause" class="w-3 h-3"></i>
                            <span class="hidden sm:inline">Pause</span>
                        </button>
                    </Show>

           </div>
            </div>
        </div>
    );
};

export default ProgressAccordion;
