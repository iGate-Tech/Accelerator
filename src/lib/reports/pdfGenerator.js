import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const PDF_PAGE_WIDTH = 210;
export const PDF_PAGE_HEIGHT = 297;
export const PDF_MARGIN = 20;
export const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - (PDF_MARGIN * 2);

export async function generatePitchDeckPDF(context, options = {}) {
  const {
    title = 'Pitch Deck',
    author = 'iGate Accelerator',
    companyName = context.companyName || 'My Startup',
    includeDate = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = margin;
  let pageCount = 1;

  const addNewPage = () => {
    doc.addPage();
    pageCount++;
    yPos = margin;
  };

  const addTitlePage = () => {
    yPos = pageHeight / 2 - 30;
    
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFontSize(24);
    doc.setFont('helvetica', 'normal');
    doc.text('Pitch Deck', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Prepared by iGate Accelerator', pageWidth / 2, yPos, { align: 'center' });
    
    if (includeDate) {
      yPos += 10;
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(today, pageWidth / 2, yPos, { align: 'center' });
    }
    
    doc.setTextColor(0, 0, 0);
  };

  const addSlide = (slideNumber, title, content, yOffset = 0) => {
    if (yPos > pageHeight - 50) {
      addNewPage();
    }

    yPos += yOffset;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${slideNumber}. ${title}`, margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(content || '', contentWidth);
    
    lines.forEach((line) => {
      if (yPos > pageHeight - 30) {
        addNewPage();
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    yPos += 10;
  };

  const addTwoColumnSlide = (slideNumber, title, leftContent, rightContent) => {
    if (yPos > pageHeight - 60) {
      addNewPage();
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${slideNumber}. ${title}`, margin, yPos);
    yPos += 10;

    const colWidth = (contentWidth - 10) / 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Points:', margin, yPos);
    doc.text('Details:', margin + colWidth + 10, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const leftLines = doc.splitTextToSize(leftContent || '', colWidth);
    const rightLines = doc.splitTextToSize(rightContent || '', colWidth);

    leftLines.forEach((line) => {
      if (yPos > pageHeight - 30) {
        addNewPage();
      }
      doc.text('• ' + line, margin, yPos);
      yPos += 5;
    });

    yPos = yPos - (leftLines.length * 5) + 6;

    rightLines.forEach((line) => {
      if (yPos > pageHeight - 30) {
        addNewPage();
      }
      doc.text('• ' + line, margin + colWidth + 10, yPos);
      yPos += 5;
    });

    yPos += 15;
  };

  addTitlePage();
  addNewPage();

  addSlide(1, 'Executive Summary', 
    context.executiveSummary || 
    `${companyName} is a ${context.modelType || 'startup'} addressing ${context.problem || 'a significant market opportunity'}. ` +
    `With a ${context.tam || 'large'} total addressable market, we aim to capture ${context.som || 'meaningful'} market share. ` +
    `Our solution offers ${context.differentiation || 'unique value'} with proven unit economics. ` +
    `We are seeking ${context.askAmount || '$X'} to achieve key milestones.`
  );

  addSlide(2, 'The Problem',
    context.problem ||
    'The market faces significant challenges that impact customers daily. Current solutions are inadequate, leaving a gap for innovative approaches.'
  );

  addTwoColumnSlide(3, 'Our Solution', 
    context.coreFeatures || '• Core feature 1\n• Core feature 2\n• Core feature 3',
    context.solution ||
    `${companyName} provides a comprehensive solution that addresses the core pain points. Our approach leverages technology to deliver superior outcomes.`
  );

  addTwoColumnSlide(4, 'Market Opportunity',
    `TAM: ${context.tam || '$X B'}\nSAM: ${context.sam || '$X M'}\nSOM: ${context.som || '$X K'}`,
    `Market is growing at ${context.trends || 'X%'} annually with strong tailwinds. Timing is optimal for entry.`
  );

  addSlide(5, 'Business Model',
    `${companyName} operates on a ${context.modelType || 'subscription'} model. ` +
    `Primary revenue streams include ${context.revenue || 'subscription fees'}. ` +
    `Pricing is positioned at ${context.pricing || '$X/month'} with tiered options.`
  );

  addTwoColumnSlide(6, 'Traction & Metrics',
    context.traction || '• Customer validation complete\n• Key metrics identified\n• Initial user feedback positive',
    context.keyMilestones || '• Milestone 1 achieved\n• Milestone 2 in progress\n• Milestone 3 planned'
  );

  addSlide(7, 'Competitive Landscape',
    context.competitors ||
    'The market includes several competitors. Our differentiation comes from unique technology, market positioning, and execution capability.'
  );

  addSlide(8, 'Go-to-Market Strategy',
    `Initial target: ${context.targetMarket || 'Defined market segment'}\n` +
    `Sales approach: ${context.salesMotion || 'Direct sales'}\n` +
    `Customer acquisition: ${context.customerChannels || 'Multiple channels'}`
  );

  addTwoColumnSlide(9, 'Financial Projections',
    `Year 1: ${context.year1 || '$X K'}\nYear 2: ${context.year2 || '$X M'}\nYear 3: ${context.year3 || '$X M'}`,
    `Unit economics:\n• CAC: ${context.cac || '$X'}\n• LTV: ${context.ltv || '$X'}\n• Margin: ${context.grossMargin || 'X%'}`
  );

  addSlide(10, 'Team',
    context.team ||
    'Our founding team combines deep domain expertise with technical excellence. Key hires are planned for critical functions.'
  );

  addSlide(11, 'Funding Request',
    `Company is raising ${context.askAmount || '$X M'} at ${context.preMoney || '$X M'} pre-money valuation. ` +
    `Funds will be allocated: ${context.allocation || 'Product (X%), Sales (X%), Operations (X%)'}.`
  );

  addSlide(12, 'Use of Funds',
    context.useOfFunds ||
    '• Product Development: X%\n• Sales & Marketing: X%\n• Operations: X%\n• Reserve: X%'
  );

  addSlide(13, 'The Ask',
    `Join us in transforming ${context.industry || 'this market'} with ${companyName}. ` +
    `Your investment will accelerate growth and create significant value.`
  );

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by iGate Accelerator - Page ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

export async function generateBusinessPlanPDF(context, options = {}) {
  const {
    title = 'Business Plan',
    author = 'iGate Accelerator',
    companyName = context.companyName || 'My Startup',
    includeDate = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = margin;
  let pageCount = 1;

  const addNewPage = () => {
    doc.addPage();
    pageCount++;
    yPos = margin;
  };

  const addSection = (sectionNumber, title, content, level = 1) => {
    if (yPos > pageHeight - 40) {
      addNewPage();
    }

    doc.setFontSize(level === 1 ? 16 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionNumber}. ${title}`, margin, yPos);
    yPos += level === 1 ? 10 : 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(content || '', contentWidth);
    
    lines.forEach((line) => {
      if (yPos > pageHeight - 20) {
        addNewPage();
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    yPos += 8;
  };

  const addTitlePage = () => {
    yPos = pageHeight / 2 - 40;
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('Business Plan', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 30;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Prepared by iGate Accelerator', pageWidth / 2, yPos, { align: 'center' });
    
    if (includeDate) {
      yPos += 15;
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(today, pageWidth / 2, yPos, { align: 'center' });
    }
    
    doc.setTextColor(0, 0, 0);
  };

  const addTableOfContents = () => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, yPos);
    yPos += 15;

    const sections = [
      ['1.', 'Executive Summary'],
      ['2.', 'Company Description'],
      ['3.', 'Market Analysis'],
      ['4.', 'Products & Services'],
      ['5.', 'Operations Plan'],
      ['6.', 'Marketing Strategy'],
      ['7.', 'Financial Projections'],
      ['8.', 'Management Team'],
      ['9.', 'Funding Request'],
      ['10.', 'Risk Analysis'],
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    sections.forEach(([num, name], index) => {
      if (yPos > pageHeight - 20) {
        addNewPage();
      }
      doc.text(num, margin, yPos);
      doc.text(name, margin + 15, yPos);
      doc.text(String(index + 1), pageWidth - margin - 10, yPos, { align: 'right' });
      yPos += 8;
    });
  };

  addTitlePage();
  addNewPage();
  addTableOfContents();
  addNewPage();

  addSection('1', 'Executive Summary',
    `${companyName} is a ${context.modelType || 'startup'} company addressing ${context.problem || 'a significant market opportunity'}. ` +
    `Our mission is to deliver exceptional value through innovative solutions. ` +
    `With a ${context.tam || 'substantial'} market opportunity, we are positioned for rapid growth. ` +
    `We seek ${context.askAmount || 'investment'} to execute our growth strategy and achieve key milestones.`
  );

  addSection('2', 'Company Description',
    `${companyName} was founded to solve ${context.problem || 'critical market challenges'}. ` +
    `Our vision is to become a leader in ${context.industry || 'our target market'}. ` +
    `Legal structure: ${context.legalEntity || 'To be determined'}. ` +
    `Jurisdiction: ${context.jurisdiction || 'US'}`
  );

  addSection('3', 'Market Analysis',
    `Total Addressable Market (TAM): ${context.tam || 'TBD'}\n` +
    `Serviceable Available Market (SAM): ${context.sam || 'TBD'}\n` +
    `Serviceable Obtainable Market (SOM): ${context.som || 'TBD'}\n\n` +
    `Market trends: ${context.trends || 'Favorable'}. ` +
    `Competitive landscape: ${context.competitors || 'Moderate competition'}.`
  );

  addSection('4', 'Products & Services',
    `Our solution: ${context.solution || 'To be detailed'}\n\n` +
    `Core features: ${context.coreFeatures || 'Feature 1, Feature 2, Feature 3'}\n\n` +
    `Competitive differentiation: ${context.differentiation || 'Unique value proposition'}`
  );

  addSection('5', 'Operations Plan',
    `Technical infrastructure: ${context.techStack || 'Modern stack'}\n` +
    `Development approach: ${context.mvpFeatures || 'Agile methodology'}\n` +
    `Timeline: ${context.timeline || 'Phased approach'}`
  );

  addSection('6', 'Marketing Strategy',
    `Target market: ${context.targetMarket || 'Defined segment'}\n` +
    `Customer acquisition: ${context.customerChannels || 'Multi-channel'}\n` +
    `Sales strategy: ${context.salesMotion || 'Direct and indirect'}\n` +
    `Retention: ${context.retentionStrategy || 'Ongoing engagement'}`
  );

  addSection('7', 'Financial Projections',
    `Revenue model: ${context.revenue || 'Subscription-based'}\n` +
    `Pricing: ${context.pricing || 'Tiered pricing'}\n\n` +
    `Year 1: ${context.year1 || 'TBD'}\n` +
    `Year 2: ${context.year2 || 'TBD'}\n` +
    `Year 3: ${context.year3 || 'TBD'}\n\n` +
    `Unit economics: CAC $${context.cac || 'TBD'}, LTV $${context.ltv || 'TBD'}`
  );

  addSection('8', 'Management Team',
    context.team ||
    'Our team combines expertise in technology, business development, and market operations. Key positions are being filled with experienced professionals.'
  );

  addSection('9', 'Funding Request',
    `Amount raising: ${context.askAmount || 'TBD'}\n` +
    `Pre-money valuation: ${context.preMoney || 'TBD'}\n` +
    `Use of funds: ${context.useOfFunds || 'To be allocated'}\n` +
    `Milestones: ${context.milestones || 'Defined in funding model'}`
  );

  addSection('10', 'Risk Analysis',
    `Key risks: ${context.risks || 'Market, execution, competition'}\n` +
    `Mitigation strategies: ${context.mitigation || 'Comprehensive risk management'}`
  );

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by iGate Accelerator - Page ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

export async function generateValuationReportPDF(context, options = {}) {
  const {
    title = 'Valuation Report',
    author = 'iGate Accelerator',
    companyName = context.companyName || 'My Startup',
    includeDate = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = margin;
  let pageCount = 1;

  const addNewPage = () => {
    doc.addPage();
    pageCount++;
    yPos = margin;
  };

  const addSection = (title, content) => {
    if (yPos > pageHeight - 40) {
      addNewPage();
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(content || '', contentWidth);
    
    lines.forEach((line) => {
      if (yPos > pageHeight - 20) {
        addNewPage();
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    yPos += 10;
  };

  const addTitlePage = () => {
    yPos = pageHeight / 2 - 30;
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Valuation Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(companyName, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Prepared by iGate Accelerator', pageWidth / 2, yPos, { align: 'center' });
    
    if (includeDate) {
      yPos += 15;
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(today, pageWidth / 2, yPos, { align: 'center' });
    }
    
    doc.setTextColor(0, 0, 0);
  };

  addTitlePage();
  addNewPage();

  addSection('1. Executive Summary',
    `${companyName} is valued at ${context.preMoney || '$X M'} pre-money based on comprehensive analysis. ` +
    `This valuation reflects market opportunity, team capability, and growth potential.`
  );

  addSection('2. Market Valuation',
    `Total Addressable Market (TAM): ${context.tam || 'TBD'}\n` +
    `Serviceable Available Market (SAM): ${context.sam || 'TBD'}\n` +
    `Serviceable Obtainable Market (SOM): ${context.som || 'TBD'}\n\n` +
    `Market growth rate: ${context.trends || 'X% annually'}`
  );

  addSection('3. Financial Performance',
    `Current revenue: ${context.revenue || 'Pre-revenue'}\n` +
    `Year 1 projection: ${context.year1 || 'TBD'}\n` +
    `Year 2 projection: ${context.year2 || 'TBD'}\n` +
    `Year 3 projection: ${context.year3 || 'TBD'}`
  );

  addSection('4. Unit Economics',
    `Customer Acquisition Cost (CAC): ${context.cac || 'TBD'}\n` +
    `Lifetime Value (LTV): ${context.ltv || 'TBD'}\n` +
    `LTV:CAC Ratio: ${context.ltv && context.cac ? (context.ltv / context.cac).toFixed(2) + 'x' : 'TBD'}\n` +
    `Gross Margin: ${context.grossMargin || 'TBD%'}`
  );

  addSection('5. Traction & Metrics',
    context.traction ||
    'Early traction metrics demonstrate market validation and growth potential.'
  );

  addSection('6. Team Assessment',
    context.team ||
    'Experienced founding team with relevant industry expertise.'
  );

  addSection('7. Risk Factors',
    `Key risks: ${context.risks || 'Market, operational, competitive'}\n` +
    `Risk level: ${context.riskLevel || 'Moderate'}`
  );

  addSection('8. Valuation Methodology',
    `Pre-money valuation: ${context.preMoney || 'TBD'}\n` +
    `Valuation method: Multi-factor analysis including market comparables, financial projections, and qualitative factors.`
  );

  addSection('9. Funding Recommendation',
    `Recommended raise: ${context.askAmount || 'TBD'}\n` +
    `Use of funds: ${context.useOfFunds || 'Growth and operations'}\n` +
    `Expected milestones: ${context.milestones || 'Achievable targets'}`
  );

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by iGate Accelerator - Page ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

export async function generateAllInOnePDF(context, options = {}) {
  const pitchDeck = await generatePitchDeckPDF(context, options);
  const businessPlan = await generateBusinessPlanPDF(context, options);
  const valuationReport = await generateValuationReportPDF(context, options);

  const combined = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pitchPages = pitchDeck.internal.getNumberOfPages();
  for (let i = 1; i <= pitchPages; i++) {
    if (i > 1) combined.addPage();
    combined.setPage(i);
    const pageWidth = combined.internal.pageSize.getWidth();
    const pageHeight = combined.internal.pageSize.getHeight();
    combined.setPage(1);
    const content = pitchDeck.getPageContent(i);
    combined.addPage();
    combined.addImage(content, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  const businessPages = businessPlan.internal.getNumberOfPages();
  for (let i = 1; i <= businessPages; i++) {
    combined.addPage();
    combined.setPage(i);
    const pageWidth = combined.internal.pageSize.getWidth();
    const pageHeight = combined.internal.pageSize.getHeight();
    combined.setPage(1);
    const content = businessPlan.getPageContent(i);
    combined.addPage();
    combined.addImage(content, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  const valuationPages = valuationReport.internal.getNumberOfPages();
  for (let i = 1; i <= valuationPages; i++) {
    combined.addPage();
    combined.setPage(i);
    const pageWidth = combined.internal.pageSize.getWidth();
    const pageHeight = combined.internal.pageSize.getHeight();
    combined.setPage(1);
    const content = valuationReport.getPageContent(i);
    combined.addPage();
    combined.addImage(content, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  return combined;
}

export function downloadPDF(doc, filename) {
  doc.save(`${filename}.pdf`);
}

export function getPDFBlob(doc) {
  return doc.output('blob');
}

export function getPDFDataUri(doc) {
  return doc.output('datauristring');
}
