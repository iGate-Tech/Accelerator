import {Show, For, createMemo, onMount} from "solid-js";
import {stepOrder, modelCumul} from "../../lib/machine";
import logger from '../../lib/logger.js';


const ProgressAccordion = (props) => {
    logger.debug('ProgressAccordion props.project:', props.project);

    const TOTAL_STEPS = 60;

    const modelsWithChecked = createMemo(() => {
        if (!props.machineStore.context) return [];
        
        const models = [
            { name: 'System', icon: 'cpu', color: 'neutral', order: 0 },
            { name: 'Idea Model', icon: 'lightbulb', color: 'warning', order: 1 },
            { name: 'Business Model', icon: 'briefcase', color: 'primary', order: 2 },
            { name: 'Technical Model', icon: 'server', color: 'info', order: 3 },
            { name: 'Marketing Model', icon: 'megaphone', color: 'accent', order: 4 },
            { name: 'Financial Model', icon: 'dollar-sign', color: 'success', order: 5 },
            { name: 'Funding Model', icon: 'trending-up', color: 'secondary', order: 6 },
            { name: 'Team Model', icon: 'users', color: 'error', order: 7 },
            { name: 'Legal Model', icon: 'scale', color: 'warning', order: 8 }
        ];

        const completedSteps = props.machineStore.context.completedSteps || 0;
        const currentStep = props.machineStore.context.currentStep || 'system';
        const currentModel = props.machineStore.context.currentModel || 'System';

        return models.map(model => {
            const threshold = modelCumul[model.name] || 0;
            const isCompleted = completedSteps >= threshold;
            const isCurrent = currentModel === model.name;
            
            return {
                ...model,
                checked: isCompleted,
                current: isCurrent,
                threshold: threshold
            };
        }).sort((a, b) => a.order - b.order);
    });

    const reportsWithChecked = createMemo(() => {
        if (!props.machineStore.context) return [];
        
        const reports = [
            { name: 'Pitch Deck Report', icon: 'file-text', color: 'base', order: 0 },
            { name: 'Business Plan Report', icon: 'file-text', color: 'ghost', order: 1 },
            { name: 'Valuation Report', icon: 'file-text', color: 'primary', order: 2 }
        ];

        const completedSteps = props.machineStore.context.completedSteps || 0;
        const currentModel = props.machineStore.context.currentModel || 'System';

        return reports.map(report => {
            const threshold = modelCumul[report.name] || 0;
            const isCompleted = completedSteps >= threshold;
            const isCurrent = currentModel === report.name;
            
            return {
                ...report,
                checked: isCompleted,
                current: isCurrent,
                threshold: threshold
            };
        }).sort((a, b) => a.order - b.order);
    });

    const currentStepNumber = createMemo(() => {
        const completed = props.machineStore.context?.completedSteps || 0;
        const current = props.machineStore.context?.currentStep || 'system';
        if (current === 'done') return TOTAL_STEPS;
        if (current === 'system') return 0;
        return completed;
    });

    const progressValue = createMemo(() => {
        const progress = props.machineStore.context?.uiProgress || 0;
        return isFinite(progress) ? progress : 0;
    });

    const canResume = createMemo(() => {
        return props.machineStore.state === 'pause' || 
               (props.machineStore.state === 'processing' && props.machineStore.context?.uiStatus === 'paused');
    });

    const canPause = createMemo(() => {
        return props.machineStore.state === 'processing' && 
               props.machineStore.context?.uiStatus === 'processing';
    });

    onMount(() => {
        if (window.lucide)
            window.lucide.createIcons();
    });

    return (
        <div class="flex items-center w-full mb-2">
            <div class="collapse max-w-6xl mx-auto collapse-arrow bg-base-100 flex-1">
                <input type="checkbox" class="p-0" name="ai-tasks-accordion"
                    checked={false}
                    onChange={
                        () => props.setIsAccordionOpen && props.setIsAccordionOpen(!props.isAccordionOpen?.())
                    }/>
                <div class="collapse-title font-semibold flex !p-2 items-center flex-wrap gap-2">
                    <span class="badge bg-primary/10 badge-sm text-primary whitespace-nowrap">
                        iGate OS - Accelerator Agent: {currentStepNumber()} / {TOTAL_STEPS}
                    </span>
                    <div class="flex px-4 w-full md:w-auto md:flex-1 gap-4 min-w-[200px]">
                        <progress id="agent-progress" class="progress progress-primary h-2 w-full" 
                            value={progressValue()}
                            max="100"></progress>
                        <span class="text-xs whitespace-nowrap self-center">{Math.round(progressValue())}%</span>
                    </div>
                </div>
                <div class="collapse-content p-0">
                    <div class="space-y-4">
                        <div class="card">
                            <div class="card-body p-1">
                                <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-0">
                                    <legend class="fieldset-legend text-primary">Models</legend>
                                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        <For each={modelsWithChecked()}>
                                            {(model) => (
                                                <label class="label cursor-pointer">
                                                    <span class="w-6 h-6 flex items-center justify-center">
                                                        {model.checked ? 
                                                            <i data-lucide="circle-check" class={`w-5 h-5 text-success`}></i> :
                                                            model.current ? 
                                                            <i data-lucide="circle-dot-dashed" class={`w-5 h-5 text-primary animate-pulse`}></i> :
                                                            <i data-lucide="circle-minus" class={`w-5 h-5 text-base-content/30`}></i>}
                                                    </span>
                                                    <span class={`label-text flex items-center gap-1 text-sm ${model.checked ? 'text-success font-medium' : model.current ? 'text-primary font-semibold' : 'text-base-content/50'}`}>
                                                        <i data-lucide={model.icon} class="w-3 h-3"></i>
                                                        {model.name}
                                                    </span>
                                                </label>
                                            )}
                                        </For>
                                    </div>
                                </fieldset>
                                <fieldset class="fieldset bg-base-100 border border-base-300 rounded-box p-4 mt-4">
                                    <legend class="fieldset-legend text-primary">Reports</legend>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <For each={reportsWithChecked()}>
                                            {(report) => (
                                                <label class="label cursor-pointer">
                                                    <span class="w-6 h-6 flex items-center justify-center">
                                                        {report.checked ? 
                                                            <i data-lucide="circle-check" class={`w-5 h-5 text-success`}></i> :
                                                            report.current ? 
                                                            <i data-lucide="circle-dot-dashed" class={`w-5 h-5 text-primary animate-pulse`}></i> :
                                                            <i data-lucide="circle-minus" class={`w-5 h-5 text-base-content/30`}></i>}
                                                    </span>
                                                    <span class={`label-text flex items-center gap-1 text-sm ${report.checked ? 'text-success font-medium' : report.current ? 'text-primary font-semibold' : 'text-base-content/50'}`}>
                                                        <i data-lucide={report.icon} class="w-3 h-3"></i>
                                                        {report.name}
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
                <div class="flex items-center justify-end gap-2 ml-4 flex-wrap">
                    <Show when={props.machineStore.context?.uiStatus === 'completed'}>
                        <span class="badge badge-success gap-1">
                            <i data-lucide="check-circle" class="w-3 h-3"></i>
                            Complete
                        </span>
                    </Show>
                    
                    <Show when={canPause()}>
                        <button type="button"
                            onClick={props.handlePause}
                            class="bg-warning/10 text-warning px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs hover:bg-warning/20 transition cursor-pointer">
                            <i data-lucide="pause" class="w-3 h-3"></i>
                            <span class="hidden sm:inline">Pause</span>
                        </button>
                    </Show>

                    <Show when={canResume()}>
                        <button type="button"
                            onClick={props.handleResume}
                            class="bg-success/10 text-success px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs hover:bg-success/20 transition cursor-pointer">
                            <i data-lucide="play" class="w-3 h-3"></i>
                            <span class="hidden sm:inline">Resume</span>
                        </button>
                    </Show>

                    <Show when={props.machineStore.state === 'idle' && props.machineStore.context?.completedSteps > 0}>
                        <button type="button"
                            onClick={props.handleStart}
                            class="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs hover:bg-primary/20 transition cursor-pointer">
                            <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                            <span class="hidden sm:inline">Restart</span>
                        </button>
                    </Show>

                    <Show when={props.machineStore.state === 'error'}>
                        <span class="badge badge-error gap-1">
                            <i data-lucide="alert-circle" class="w-3 h-3"></i>
                            Error
                        </span>
                        <button type="button"
                            onClick={props.handleStart}
                            class="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs hover:bg-primary/20 transition cursor-pointer">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                            <span class="hidden sm:inline">Retry</span>
                        </button>
                    </Show>
                </div>
            </div>
        </div>
    );
};

export default ProgressAccordion;
