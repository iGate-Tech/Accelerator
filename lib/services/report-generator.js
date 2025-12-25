import { callOpenRouter } from './ai.js';

/**
 * Generate a business plan report using AI
 * @param {Object} idea - The idea data
 * @param {Array} modelData - Completed model instances with sections
 * @returns {Promise<string>} The generated business plan content
 */
export async function generateBusinessPlan(idea, modelData) {
  try {
    // Extract relevant data from completed models
    const businessData = extractModelData(modelData, 'business');
    const financialData = extractModelData(modelData, 'financial');
    const teamData = extractModelData(modelData, 'team');

    const systemPrompt = `You are an expert business consultant. Generate a comprehensive, detailed business plan based on the provided startup idea and model data.

Create a professional business plan with the following detailed structure:

1. EXECUTIVE SUMMARY
   - Company overview and mission
   - Products/services summary
   - Market opportunity
   - Competitive advantage
   - Financial highlights
   - Funding requirements and use of funds

2. COMPANY DESCRIPTION
   - Legal structure and ownership
   - Location and facilities
   - Company history and milestones
   - Mission statement and objectives
   - Keys to success

3. PRODUCTS AND SERVICES
   - Product/service description
   - Features and benefits
   - Development status and roadmap
   - Proprietary features and intellectual property
   - Future products/services

4. MARKET ANALYSIS
   - Industry overview and outlook
   - Target market demographics and psychographics
   - Market size and growth projections
   - Market trends and drivers
   - Regulatory environment

5. COMPETITIVE ANALYSIS
   - Direct competitors
   - Indirect competitors
   - Competitive advantage
   - Barriers to entry
   - SWOT analysis

6. MARKETING AND SALES STRATEGY
   - Marketing strategy and positioning
   - Pricing strategy
   - Sales strategy and distribution channels
   - Advertising and promotion plan
   - Customer acquisition and retention

7. OPERATIONS PLAN
   - Operational workflow
   - Technology and systems
   - Supply chain and logistics
   - Quality control
   - Facilities and equipment

8. MANAGEMENT AND ORGANIZATION
   - Organizational structure
   - Management team biographies
   - Board of directors
   - Advisors and consultants
   - Human resources plan

9. FINANCIAL PLAN
   - Financial assumptions
   - Revenue projections (3-5 years)
   - Cost structure and expenses
   - Profit and loss projections
   - Cash flow projections
   - Balance sheet projections
   - Break-even analysis

10. FUNDING REQUEST
    - Amount requested
    - Use of funds
    - Repayment plan
    - Exit strategy

11. RISK ANALYSIS
    - Market risks
    - Operational risks
    - Financial risks
    - Mitigation strategies

12. APPENDIX
    - Detailed financials
    - Market research data
    - Resumes of key personnel
    - Legal documents
    - Product specifications

Use the provided data to fill in details. If information is missing, provide reasonable assumptions based on the industry and idea type. Make the business plan compelling, realistic, and professional. Include specific numbers, timelines, and measurable goals.

Format the output as clean, readable text with proper headings, subheadings, and sections. Use professional business language and be thorough in each section.`;

    const userPrompt = `
Idea Details:
- Title: ${idea.title}
- Description: ${idea.description}
- Category: ${idea.category}
- Tags: ${idea.tags?.join(', ') || 'N/A'}

Business Model Data: ${JSON.stringify(businessData, null, 2)}
Financial Data: ${JSON.stringify(financialData, null, 2)}
Team Data: ${JSON.stringify(teamData, null, 2)}

Generate a complete business plan based on this information.`;

    const result = await callOpenRouter(userPrompt, systemPrompt, 2000, 0.7);

    if (!result.success) {
      throw new Error(result.error?.message || 'AI generation failed');
    }

    return result.content;
  } catch (error) {
    console.error('Business plan generation error:', error);
    throw error;
  }
}

/**
 * Generate a pitch deck report using AI
 * @param {Object} idea - The idea data
 * @param {Array} modelData - Completed model instances with sections
 * @returns {Promise<string>} The generated pitch deck content
 */
export async function generatePitchDeck(idea, modelData) {
  try {
    const businessData = extractModelData(modelData, 'business');
    const financialData = extractModelData(modelData, 'financial');

    const systemPrompt = `You are a pitch deck expert. Create a comprehensive, investor-ready pitch deck based on the startup idea.

Structure the pitch deck with 12-15 slides following standard VC pitch deck format:

1. TITLE SLIDE
   - Company name and logo
   - Tagline
   - Founder names and titles
   - Contact information
   - Date

2. PROBLEM
   - Clear problem statement
   - Market size affected
   - Current solutions and their shortcomings
   - Evidence of problem significance
   - Personal connection/anecdote

3. SOLUTION
   - Product/service overview
   - Key features and benefits
   - How it solves the problem
   - Unique value proposition
   - Demo or product screenshot

4. MARKET OPPORTUNITY
   - Total addressable market (TAM)
   - Serviceable addressable market (SAM)
   - Serviceable obtainable market (SOM)
   - Market growth rate and trends
   - Market validation evidence

5. PRODUCT/SERVICE
   - Detailed feature breakdown
   - User experience walkthrough
   - Technology/platform details
   - Development roadmap
   - Competitive advantages

6. TRACTION & MILESTONES
   - Key metrics and KPIs
   - User growth and engagement
   - Revenue figures (if any)
   - Partnerships and integrations
   - Awards and recognition

7. BUSINESS MODEL
   - Revenue streams and pricing
   - Customer acquisition strategy
   - Sales and distribution channels
   - Unit economics
   - Scalability plan

8. COMPETITION
   - Competitive landscape map
   - Direct and indirect competitors
   - Competitive advantages
   - Barriers to entry
   - Market positioning

9. FINANCIAL PROJECTIONS
   - Revenue projections (3-5 years)
   - Cost structure
   - Unit economics and margins
   - Path to profitability
   - Key assumptions

10. MARKETING & GO-TO-MARKET
    - Marketing strategy
    - Customer acquisition channels
    - Brand positioning
    - Launch plan
    - Growth strategy

11. TEAM
    - Founder backgrounds and expertise
    - Key team members and roles
    - Advisors and board members
    - Gaps and hiring plan
    - Team dynamics and culture

12. FUNDING ASK & USE OF FUNDS
    - Amount raising and terms
    - Detailed use of funds breakdown
    - Milestones to achieve
    - Future fundraising plans

13. VISION & IMPACT
    - Long-term vision
    - Market disruption potential
    - Social/environmental impact
    - Company culture and values

14. CLOSING & CONTACT
    - Summary of opportunity
    - Call to action
    - Contact information
    - Next steps

For each slide, provide:
- Slide number and title
- Detailed content (4-6 key points)
- Specific data, metrics, and evidence
- Visual suggestions (charts, graphs, images)
- Speaker notes for presentation

Make it comprehensive yet concise. Use compelling language that would convince sophisticated investors. Include specific numbers, timelines, and measurable goals. Back up claims with data and evidence.`;

    const userPrompt = `
Startup Idea:
- Title: ${idea.title}
- Description: ${idea.description}
- Category: ${idea.category}

Business Data: ${JSON.stringify(businessData, null, 2)}
Financial Data: ${JSON.stringify(financialData, null, 2)}

Create a complete pitch deck outline and content.`;

    const result = await callOpenRouter(userPrompt, systemPrompt, 1500, 0.7);

    if (!result.success) {
      throw new Error(result.error?.message || 'AI generation failed');
    }

    return result.content;
  } catch (error) {
    console.error('Pitch deck generation error:', error);
    throw error;
  }
}

/**
 * Generate a valuation report using AI
 * @param {Object} idea - The idea data
 * @param {Array} modelData - Completed model instances with sections
 * @returns {Promise<string>} The generated valuation report content
 */
export async function generateValuation(idea, modelData) {
  try {
    const financialData = extractModelData(modelData, 'financial');
    const businessData = extractModelData(modelData, 'business');

    const systemPrompt = `You are a valuation expert. Provide a comprehensive startup valuation analysis.

Include the following sections:
1. Valuation Methodology Overview
2. Comparable Company Analysis
3. Market Size and Opportunity
4. Financial Projections Analysis
5. Risk Factors
6. Valuation Range
7. Key Assumptions
8. Recommendations

Use multiple valuation methods (Market, Income, Asset-based approaches). Provide realistic valuation ranges based on the startup's stage, market, and financials. Be thorough but concise.`;

    const userPrompt = `
Startup Valuation Request:
- Company: ${idea.title}
- Description: ${idea.description}
- Category: ${idea.category}
- Current Rating: ${idea.rating || 'N/A'}

Business Data: ${JSON.stringify(businessData, null, 2)}
Financial Data: ${JSON.stringify(financialData, null, 2)}

Provide a complete valuation analysis with realistic ranges and methodologies.`;

    const result = await callOpenRouter(userPrompt, systemPrompt, 1500, 0.7);

    if (!result.success) {
      throw new Error(result.error?.message || 'AI generation failed');
    }

    return result.content;
  } catch (error) {
    console.error('Valuation generation error:', error);
    throw error;
  }
}

/**
 * Extract data from completed model instances
 * @param {Array} modelData - Model instances with sections
 * @param {string} modelType - Type of model to extract
 * @returns {Object} Extracted data organized by section
 */
function extractModelData(modelData, modelType) {
  const model = modelData?.find((m) => m.model_type === modelType);
  if (!model) {return {};}

  const data = {};
  model.model_sections?.forEach((section) => {
    data[section.section_name] = section.section_data;
  });

  return data;
}
