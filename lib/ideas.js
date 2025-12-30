require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
});

// Load the template data
const templateData = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Flatten all questions
const allQuestions = [];
templateData.forEach(model => {
    model.sections.forEach(section => {
        section.content.forEach(group => {
            group.forEach(q => {
                allQuestions.push({ model: model.name, section: section.name, ...q });
            });
        });
    });
});

// Function to generate an idea using AI via OpenRouter
async function generateIdeaWithAI(prompt) {
    try {
        const completion = await client.chat.completions.create({
            model: 'google/gemma-3n-e2b-it:free',
            messages: [{ role: 'user', content: prompt }]
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('AI API error:', error.message);
        return 'Unable to generate answer, please try again.';
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
        console.log('Processing model:', modelTemplate.name);
        const model = {
            name: modelTemplate.name,
            sections: []
        };

        for (const sectionTemplate of modelTemplate.sections) {
            console.log('Processing section:', sectionTemplate.name);
            const section = {
                name: sectionTemplate.name,
                questions: []
            };

            for (const questionGroup of sectionTemplate.content) {
                for (const questionObj of questionGroup) {
                    console.log('Answering question:', questionObj.question.substring(0, 50) + '...');
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
    console.log('Saving idea to database:', idea.name);
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('ideas.db');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS ideas (
                id INTEGER PRIMARY KEY,
                name TEXT,
                created_at TEXT,
                data TEXT,
                status TEXT DEFAULT 'completed'
            )`);
        });
        const data = JSON.stringify(idea);
        db.run("INSERT INTO ideas (id, name, created_at, data) VALUES (?, ?, ?, ?)", idea.id, idea.name, idea.created_at, data, function(err) {
            db.close();
            if (err) {
                console.error('Database save error:', err);
                reject(err);
            } else {
                console.log(`Idea saved to database with id ${this.lastID}`);
                resolve();
            }
        });
    });
}

// Function to generate multiple ideas
async function generateMultipleIdeas(count) {
    for (let i = 1; i <= count; i++) {
        console.log(`Generating idea ${i}...`);
        const idea = await createIdea(`Startup Idea ${i}`);
        await saveIdea(idea);
    }
    console.log(`Generated ${count} ideas successfully!`);
}

module.exports = { generateMultipleIdeas, allQuestions, generateIdeaWithAI, templateData };