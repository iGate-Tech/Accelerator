const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('ideas.db');

// Function to generate pitch deck
function generatePitchDeck(idea) {
    let content = `# Pitch Deck for ${idea.name}\n\n`;

    // Extract key sections from Idea Model
    const ideaModel = idea.models.find(m => m.name === 'Idea Model');
    if (ideaModel) {
        // Problem
        const problemSection = ideaModel.sections.find(s => s.name === 'Section 1: Problem Validation');
        if (problemSection) {
            content += `## Problem\n\n`;
            problemSection.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        }

        // Solution
        const solutionSection = ideaModel.sections.find(s => s.name === 'Section 2: Solution Development');
        if (solutionSection) {
            content += `## Solution\n\n`;
            solutionSection.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        }

        // Customer Model
        const customerSection = ideaModel.sections.find(s => s.name === 'Section 3: Customer Model');
        if (customerSection) {
            content += `## Market and Customers\n\n`;
            customerSection.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        }

        // Branding
        const brandingSection = ideaModel.sections.find(s => s.name === 'Section 4: Branding');
        if (brandingSection) {
            content += `## Brand\n\n`;
            brandingSection.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        }
    }

    return content;
}

// Function to generate business plan
function generateBusinessPlan(idea) {
    let content = `# Business Plan for ${idea.name}\n\n`;

    // Include all models and sections in detail
    idea.models.forEach(model => {
        content += `## ${model.name}\n\n`;
        model.sections.forEach(section => {
            content += `### ${section.name}\n\n`;
            section.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        });
    });

    return content;
}

// Function to generate valuation
function generateValuation(idea) {
    let content = `# Valuation for ${idea.name}\n\n`;

    // Focus on Financial Model and Funding Model
    const financialModel = idea.models.find(m => m.name === 'Financial Model');
    if (financialModel) {
        content += `## Financial Model\n\n`;
        financialModel.sections.forEach(section => {
            content += `### ${section.name}\n\n`;
            section.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        });
    }

    const fundingModel = idea.models.find(m => m.name === 'Funding Model');
    if (fundingModel) {
        content += `## Funding Model\n\n`;
        fundingModel.sections.forEach(section => {
            content += `### ${section.name}\n\n`;
            section.questions.forEach(q => {
                if (q.answer) content += `- **${q.question}**: ${q.answer}\n`;
            });
            content += '\n';
        });
    }

    // Add basic valuation note (placeholder)
    content += `## Valuation Estimate\n\n`;
    content += `Based on the financial projections and market data, a preliminary valuation can be calculated using methods like DCF, comparables, etc. (Detailed calculation requires specific financial inputs.)\n\n`;

    return content;
}

// Main function
db.all("SELECT * FROM ideas", [], (err, rows) => {
    if (err) {
        throw err;
    }

    rows.forEach(ideaRow => {
        const idea = JSON.parse(ideaRow.data);

        // Create subfolder for each idea
        const ideaFolder = path.join('reports', `idea_${idea.id}`);
        fs.mkdirSync(ideaFolder, { recursive: true });

        const pitchDeck = generatePitchDeck(idea);
        fs.writeFileSync(path.join(ideaFolder, 'pitch_deck.md'), pitchDeck);

        const businessPlan = generateBusinessPlan(idea);
        fs.writeFileSync(path.join(ideaFolder, 'business_plan.md'), businessPlan);

        const valuation = generateValuation(idea);
        fs.writeFileSync(path.join(ideaFolder, 'valuation.md'), valuation);

        console.log(`Reports generated for idea ${idea.id} in reports/idea_${idea.id}/ folder`);
    });

    db.close();
});