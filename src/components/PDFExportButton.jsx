import { createSignal, Show } from 'solid-js';

const PDFExportButton = (props) => {
  const [isExporting, setIsExporting] = createSignal(false);
  const [exportStatus, setExportStatus] = createSignal('');

  const {
    reportType = 'pitchDeck',
    context = {},
    companyName = 'My Startup',
    onExportStart,
    onExportComplete,
    onExportError,
    showLabel = true,
    variant = 'primary',
    size = 'md',
    disabled = false,
  } = props;

  const exportPDF = async () => {
    if (isExporting() || disabled) return;

    setIsExporting(true);
    setExportStatus('Generating PDF...');

    try {
      const { generatePitchDeckPDF, generateBusinessPlanPDF, generateValuationReportPDF, downloadPDF } = await import('../lib/reports/pdfGenerator.js');

      let doc;
      let filename;

      switch (reportType) {
        case 'pitchDeck':
          setExportStatus('Generating Pitch Deck...');
          doc = await generatePitchDeckPDF(context, { companyName });
          filename = `${companyName.replace(/\s+/g, '_')}_PitchDeck`;
          break;
        case 'businessPlan':
          setExportStatus('Generating Business Plan...');
          doc = await generateBusinessPlanPDF(context, { companyName });
          filename = `${companyName.replace(/\s+/g, '_')}_BusinessPlan`;
          break;
        case 'valuation':
          setExportStatus('Generating Valuation Report...');
          doc = await generateValuationReportPDF(context, { companyName });
          filename = `${companyName.replace(/\s+/g, '_')}_ValuationReport`;
          break;
        case 'all':
          setExportStatus('Generating Complete Package...');
          const { generateAllInOnePDF } = await import('../lib/reports/pdfGenerator.js');
          doc = await generateAllInOnePDF(context, { companyName });
          filename = `${companyName.replace(/\s+/g, '_')}_Complete_Package`;
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      downloadPDF(doc, filename);
      setExportStatus('Download complete!');

      setTimeout(() => {
        setIsExporting(false);
        setExportStatus('');
      }, 2000);

      if (onExportComplete) onExportComplete(reportType);
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportStatus('Export failed');
      setIsExporting(false);

      if (onExportError) onExportError(error);
    }
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-error',
  };

  return (
    <button
      class={`btn ${sizeClasses[size] || ''} ${variantClasses[variant] || 'btn-primary'} ${isExporting() ? 'loading' : ''}`}
      onClick={exportPDF}
      disabled={isExporting() || disabled}
      title={`Export ${reportType.replace(/([A-Z])/g, ' $1').trim()}`}
    >
      <Show when={!isExporting()} fallback={
        <>
          <span class="loading loading-spinner loading-sm"></span>
          {exportStatus() || 'Exporting...'}
        </>
      }>
        <Show when={showLabel}>
          <Show when={reportType === 'pitchDeck'} fallback={
            <Show when={reportType === 'businessPlan'} fallback={
              <Show when={reportType === 'valuation'} fallback={
                <Show when={reportType === 'all'}>
                  📦 Export Complete Package
                </Show>
              }>📊 Export Valuation Report
              </Show>
            }>📋 Export Business Plan
            </Show>
          }>📽️ Export Pitch Deck
          </Show>
        </Show>
      </Show>
    </button>
  );
};

export default PDFExportButton;
