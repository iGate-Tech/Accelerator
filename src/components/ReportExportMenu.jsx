import { createSignal, Show, For } from 'solid-js';
import PDFExportButton from './PDFExportButton';

const ReportExportMenu = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedReport, setSelectedReport] = createSignal('pitchDeck');

  const {
    context = {},
    companyName = 'My Startup',
    onExportStart,
    onExportComplete,
    onExportError,
    showLabels = true,
    buttonText = 'Export PDF',
    buttonIcon = '📥',
  } = props;

  const reportOptions = [
    { id: 'pitchDeck', name: 'Pitch Deck', icon: '📽️', description: 'Investor-ready presentation' },
    { id: 'businessPlan', name: 'Business Plan', icon: '📋', description: 'Detailed business document' },
    { id: 'valuation', name: 'Valuation Report', icon: '📊', description: 'Financial analysis' },
    { id: 'all', name: 'Complete Package', icon: '📦', description: 'All documents combined' },
  ];

  const handleExport = (reportType) => {
    setSelectedReport(reportType);
  };

  const handleExportComplete = (type) => {
    setIsOpen(false);
    if (props.onExportComplete) props.onExportComplete(type);
  };

  return (
    <div class="dropdown dropdown-end">
      <div tabIndex={0} role="button" class="btn btn-primary m-1" onClick={() => setIsOpen(!isOpen())}>
        {buttonIcon} {buttonText}
        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <Show when={isOpen()}>
        <div 
          tabIndex={0} 
          class="dropdown-content z-50 card card-compact shadow-lg bg-base-100 w-80 p-4 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="card-body p-0">
            <h3 class="font-bold text-lg mb-3">Export Options</h3>
            
            <div class="flex flex-col gap-2">
              <For each={reportOptions}>
                {(option) => (
                  <div 
                    class={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedReport() === option.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => handleExport(option.id)}
                  >
                    <div class="flex items-start gap-3">
                      <div class="text-2xl">{option.icon}</div>
                      <div class="flex-1">
                        <div class="font-semibold">{option.name}</div>
                        <div class="text-xs text-base-content/60">{option.description}</div>
                      </div>
                      <Show when={selectedReport() === option.id}>
                        <div class="text-primary">✓</div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="divider my-2"></div>

            <div class="flex gap-2">
              <PDFExportButton
                reportType={selectedReport()}
                context={context}
                companyName={companyName}
                onExportStart={onExportStart}
                onExportComplete={handleExportComplete}
                onExportError={onExportError}
                showLabel={showLabels}
                variant="primary"
                size="md"
              />
            </div>

            <button 
              class="btn btn-ghost btn-sm mt-2" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ReportExportMenu;
