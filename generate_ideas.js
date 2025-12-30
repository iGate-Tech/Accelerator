require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { generateText } = require('ai');
const { openrouter } = require('@openrouter/ai-sdk-provider');

// Load the template data
const templateData = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Initialize SQLite database
const db = new sqlite3.Database('ideas.db');
db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS ideas (
id INTEGER PRIMARY KEY,
name TEXT,
created_at TEXT,
data TEXT
)`);
});

// Function to generate an idea using AI via OpenRouter
async function generateIdeaWithAI(prompt) {
    try {
        const result = await generateText({
            model: openrouter('google/gemma-3n-e2b-it:free'),
            prompt: prompt
        });
        return result.text;
    } catch (error) {
        console.error('AI API error:', error.message);
        return 'Error generating response';
    }
}

// Function to create a new idea
async function createIdea(ideaName) {
    const idea = {
        id: Date.now(), // Simple ID
        name: ideaName,
        created_at: new Date().toISOString(),
        models: []
    };

    for (const modelTemplate of templateData) {
        const model = {
            name: modelTemplate.name,
            sections: []
        };

        for (const sectionTemplate of modelTemplate.sections) {
            const section = {
                name: sectionTemplate.name,
                questions: []
            };

            for (const questionGroup of sectionTemplate.content) {
                for (const questionObj of questionGroup) {
                    const answer = await generateIdeaWithAI(questionObj.prompt);
                    section.questions.push({
                        question: questionObj.question,
                        prompt: questionObj.prompt,
                        answer: answer
                    });
                }
            }

            model.sections.push(section);
        }

        idea.models.push(model);
    }

    return idea;
}

// Function to save idea to SQLite database
async function saveIdea(idea) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(idea);
        db.run("INSERT INTO ideas (id, name, created_at, data) VALUES (?, ?, ?, ?)", idea.id, idea.name, idea.created_at, data, function(err) {
            if (err) {
                reject(err);
            } else {
                console.log(`Idea saved to database with id ${this.lastID}`);
                resolve();
            }
        });
    });
}

// Main function to generate multiple ideas
async function generateMultipleIdeas(count) {
    for (let i = 1; i <= count; i++) {
        console.log(`Generating idea ${i}...`);
        const idea = await createIdea(`Startup Idea ${i}`);
        await saveIdea(idea);
    }
    console.log(`Generated ${count} ideas successfully!`);
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}

// Usage: node generate_ideas.js <number_of_ideas>
const args = process.argv.slice(2);
const numIdeas = parseInt(args[0]) || 1;

generateMultipleIdeas(numIdeas).catch(console.error);