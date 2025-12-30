require('dotenv').config();
console.log('OPENROUTER_API_KEY loaded:', !!process.env.OPENROUTER_API_KEY);

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');
const { marked } = require('marked');
const fs = require('fs');
// const { allQuestions, templateData } = require('./lib/ideas');

// System prompt for AI
const SYSTEM_PROMPT = `You are an expert AI assistant specializing in startup business development and entrepreneurship. Your role is to help users create comprehensive, professional business plans and startup ideas.

Provide responses that are:
- At least 3 lines long to ensure sufficient detail
- Concise yet informative (avoid unnecessary elaboration)
- Professional and practical
- Structured with clear formatting when needed
- Actionable and relevant to startup success

Focus on key insights with enough depth to be valuable. Always provide value-driven, insightful responses that help entrepreneurs succeed.`;

// Lazy init
let client = null;
function getClient() {
    if (!client) {
        client = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1'
        });
    }
    return client;
}

// Global for current idea creations (per session)
const currentIdeas = new Map();
const port = 3000;



// Function to build full context from previous answers
function buildContext(currentIdea, currentIndex) {
    let context = '';
    if (currentIndex > 0) {
        context = 'Based on the following previous answers in the idea creation process:\n';
        for (let i = 0; i < currentIndex; i++) {
            const question = allQuestions[i];
            const answer = currentIdea.answers[i] || 'Not answered yet';
            // Truncate long answers
            const shortAnswer = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
            context += `${question.question}: ${shortAnswer}\n`;
        }
        context += '\nNow, for the current question:\n';
    }
    return context;
}

// Load questions from DB
let allQuestions = [];
let templateData = [];

function loadQuestions() {
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT id, model, section, question, prompt, sort_order FROM questions ORDER BY model, section, sort_order, id", [], (err, rows) => {
        if (err) {
            console.error('Error loading questions:', err);
        } else {
            allQuestions = rows.map(row => ({ id: row.id, model: row.model, section: row.section, question: row.question, prompt: row.prompt, sort_order: row.sort_order }));
            // Rebuild templateData - group by model and section, and put all questions in one group per section for simplicity
            const modelsMap = {};
            rows.forEach(row => {
                if (!modelsMap[row.model]) {
                    modelsMap[row.model] = { name: row.model, sections: {} };
                }
                if (!modelsMap[row.model].sections[row.section]) {
                    modelsMap[row.model].sections[row.section] = { name: row.section, content: [[]] }; // Single group
                }
                modelsMap[row.model].sections[row.section].content[0].push({
                    question: row.question,
                    prompt: row.prompt,
                    answer: ''
                });
            });
            templateData = Object.values(modelsMap).map(model => ({
                name: model.name,
                sections: Object.values(model.sections)
            }));
        }
        db.close();
    });
}

loadQuestions();

// Load raw data for sidebar
let rawData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
let hierarchicalData = JSON.parse(fs.readFileSync('hierarchical-data.json', 'utf8'));

// Function to normalize children property
function normalizeChildren(data) {
  for (let node of data) {
    if (node.childern && !node.children) {
      node.children = node.childern;
      delete node.childern;
    }
    if ('children' in node && (node.children === null || node.children === undefined)) {
      node.children = [];
    }
    if (Array.isArray(node.children)) {
      normalizeChildren(node.children);
    }
  }
}

function deleteNodeById(data, id) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      data.splice(i, 1);
      return true;
    }
    if (data[i].children && deleteNodeById(data[i].children, id)) {
      return true;
    }
  }
  return false;
}

function addNode(data, parentId, newNode) {
  if (!parentId) {
    data.push(newNode);
    return true;
  }
  for (let i = 0; i < data.length; i++) {
    if (data[i].id === parentId) {
      if (!data[i].children) data[i].children = [];
      data[i].children.push(newNode);
      return true;
    }
    if (data[i].children && addNode(data[i].children, parentId, newNode)) {
      return true;
    }
  }
  return false;
}

function updateNode(data, id, updates) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      Object.assign(data[i], updates);
      return true;
    }
    if (data[i].children && updateNode(data[i].children, id, updates)) {
      return true;
    }
  }
  return false;
}

function getNode(data, id) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      return data[i];
    }
    if (data[i].children) {
      const found = getNode(data[i].children, id);
      if (found) return found;
    }
  }
  return null;
}

function copyNode(data, fromId, toParentId) {
  const node = getNode(data, fromId);
  if (!node) return false;
  const copy = JSON.parse(JSON.stringify(node));
  // Generate new id and uniqueId
  copy.id = Date.now().toString();
  copy.uniqueId = Math.random().toString(36).substr(2, 9);
  // If it's a folder, recursively update ids
  function updateIds(obj) {
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach(child => {
        child.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        child.uniqueId = Math.random().toString(36).substr(2, 9);
        updateIds(child);
      });
    }
  }
  updateIds(copy);
  // Add to parent
  addNode(data, toParentId, copy);
  return true;
}

const app = express();

// Session middleware
app.use(session({
    secret: 'acc-agent-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Helper function to get or create current idea
function getCurrentIdea(req) {
    let ideaId = req.session.currentIdeaId;
    if (!ideaId || !currentIdeas.has(ideaId)) {
        ideaId = Date.now().toString();
        req.session.currentIdeaId = ideaId;
        currentIdeas.set(ideaId, { answers: [], index: 0, dbId: null });
    }
    return currentIdeas.get(ideaId);
}

// Set up Handlebars
app.engine('handlebars', exphbs.engine({
    helpers: {
        gt: (a, b) => a > b,
        eq: (a, b) => a === b,
        markdown: (text) => marked.parse(text),
        countQuestions: (arr) => arr ? arr.length : 0,
        sumLengths: (content) => content ? content.reduce((sum, group) => sum + (group ? group.length : 0), 0) : 0,
        totalModelQuestions: (sections) => sections ? sections.reduce((sum, section) => sum + (section.content ? section.content.reduce((s, g) => s + (g ? g.length : 0), 0) : 0), 0) : 0
    },
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
function initDB() {
    const db = new sqlite3.Database('ideas.db');
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY,
            name TEXT,
            created_at TEXT,
            data TEXT,
            status TEXT DEFAULT 'completed'
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model TEXT,
            section TEXT,
            question TEXT,
            prompt TEXT,
            sort_order INTEGER DEFAULT 0
        )`);

        // Add sort_order column if not exists
        db.run("ALTER TABLE questions ADD COLUMN sort_order INTEGER DEFAULT 0", (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding sort_order column:', err);
            } else {
                // Set sort_order for existing rows
                db.run("UPDATE questions SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL");
            }
        });

        // Seed questions if empty
        db.get("SELECT COUNT(*) as count FROM questions", [], (err, row) => {
            if (!err && row.count === 0) {
                const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
                const stmt = db.prepare("INSERT INTO questions (model, section, question, prompt, sort_order) VALUES (?, ?, ?, ?, ?)");
                let sortOrder = 1;
                data.forEach(model => {
                    model.sections.forEach(section => {
                        section.content.forEach(group => {
                            group.forEach(q => {
                                stmt.run(model.name, section.name, q.question, q.prompt, sortOrder++);
                            });
                        });
                    });
                });
                stmt.finalize();
                console.log('Seeded questions into DB');
            }
            db.close();
        });
    });
}

initDB();

// Routes
app.get('/admin', (req, res) => {
    res.redirect('/admin/prompts?admin=1');
});

app.get('/admin/prompts', (req, res) => {
    // Simple admin check - in production, use proper auth
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT id, model, section, question, prompt, sort_order FROM questions ORDER BY model, section, sort_order, id", [], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        // Group by model and section
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.model]) grouped[row.model] = {};
            if (!grouped[row.model][row.section]) grouped[row.model][row.section] = [];
            grouped[row.model][row.section].push(row);
        });
        // Add local and global numbering
        let globalIndex = 1;
        Object.keys(grouped).forEach(modelKey => {
            Object.keys(grouped[modelKey]).forEach(sectionKey => {
                let localIndex = 1;
                grouped[modelKey][sectionKey].forEach(question => {
                    question.localIndex = localIndex++;
                    question.globalIndex = globalIndex++;
                });
            });
        });
        res.render('admin-prompts', { grouped });
    });
});

app.post('/admin/prompts', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    const updates = [];
    for (const key in req.body) {
        if (key.startsWith('prompt-')) {
            const id = key.split('-')[1];
            const prompt = req.body[key];
            updates.push({ id, prompt });
        }
    }
    let completed = 0;
    updates.forEach(update => {
        db.run("UPDATE questions SET prompt = ? WHERE id = ?", [update.prompt, update.id], function(err) {
            if (err) console.error('Update error:', err);
            completed++;
            if (completed === updates.length) {
                db.close();
                // Reload questions
                loadQuestions();
                res.redirect('/admin/prompts?admin=1');
            }
        });
    });
});

app.post('/admin/add-question', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { model, section, question, prompt } = req.body;
    if (!model || !section || !question || !prompt) {
        return res.status(400).send('Missing required fields');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT MAX(sort_order) as maxOrder FROM questions WHERE model = ? AND section = ?", [model, section], (err, row) => {
        const sortOrder = (row && row.maxOrder) ? row.maxOrder + 1 : 1;
        db.run("INSERT INTO questions (model, section, question, prompt, sort_order) VALUES (?, ?, ?, ?, ?)", [model, section, question, prompt, sortOrder], function(err) {
            db.close();
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).send('Database error');
            }
            loadQuestions();
            res.redirect('/admin/prompts?admin=1');
        });
    });
});

app.post('/admin/delete-question', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing question ID');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT model, section FROM questions WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Question not found');
        }
        const { model, section } = row;
        db.run("DELETE FROM questions WHERE id = ?", [id], function(deleteErr) {
            if (deleteErr) {
                console.error('Delete error:', deleteErr);
                db.close();
                return res.status(500).send('Database error');
            }
            // Renumber sort_order in the section
            db.all("SELECT id FROM questions WHERE model = ? AND section = ? ORDER BY sort_order, id", [model, section], (err, rows) => {
                if (err) {
                    console.error('Renumber error:', err);
                } else {
                    let newOrder = 1;
                    rows.forEach(r => {
                        db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [newOrder++, r.id]);
                    });
                }
                db.close();
                loadQuestions();
                res.redirect('/admin/prompts?admin=1');
            });
        });
    });
});

app.post('/admin/move-question-up', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing question ID');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT model, section, sort_order FROM questions WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Question not found');
        }
        const { model, section, sort_order } = row;
        if (sort_order <= 1) {
            db.close();
            return res.redirect('/admin/prompts?admin=1'); // Already at top
        }
        db.get("SELECT id, sort_order FROM questions WHERE model = ? AND section = ? AND sort_order < ? ORDER BY sort_order DESC LIMIT 1", [model, section, sort_order], (err, prevRow) => {
            if (err || !prevRow) {
                db.close();
                return res.redirect('/admin/prompts?admin=1');
            }
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [prevRow.sort_order, id]);
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [sort_order, prevRow.id], function() {
                db.close();
                loadQuestions();
                res.redirect('/admin/prompts?admin=1');
            });
        });
    });
});

app.post('/admin/move-question-down', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing question ID');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT model, section, sort_order FROM questions WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Question not found');
        }
        const { model, section, sort_order } = row;
        db.get("SELECT id, sort_order FROM questions WHERE model = ? AND section = ? AND sort_order > ? ORDER BY sort_order ASC LIMIT 1", [model, section, sort_order], (err, nextRow) => {
            if (err || !nextRow) {
                db.close();
                return res.redirect('/admin/prompts?admin=1');
            }
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [nextRow.sort_order, id]);
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [sort_order, nextRow.id], function() {
                db.close();
                loadQuestions();
                res.redirect('/admin/prompts?admin=1');
            });
        });
    });
});

app.get('/admin/export/json', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT model, section, question, prompt FROM questions ORDER BY id", [], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        // Rebuild structure like data.json
        const data = [];
        const modelsMap = {};
        rows.forEach(row => {
            if (!modelsMap[row.model]) {
                modelsMap[row.model] = { name: row.model, sections: {} };
            }
            if (!modelsMap[row.model].sections[row.section]) {
                modelsMap[row.model].sections[row.section] = { name: row.section, content: [[]] };
            }
            modelsMap[row.model].sections[row.section].content[0].push({
                question: row.question,
                prompt: row.prompt,
                answer: ''
            });
        });
        const structured = Object.values(modelsMap).map(model => ({
            name: model.name,
            sections: Object.values(model.sections)
        }));
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="prompts.json"');
        res.send(JSON.stringify(structured, null, 2));
    });
});

app.get('/admin/export/csv', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT model, section, question, prompt FROM questions ORDER BY id", [], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        let csv = 'Model,Section,Question,Prompt\n';
        rows.forEach(row => {
            csv += `"${row.model}","${row.section}","${row.question.replace(/"/g, '""')}","${row.prompt.replace(/"/g, '""')}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="prompts.csv"');
        res.send(csv);
    });
});

app.get('/admin2', (req, res) => {
    res.redirect('/admin2/prompts?admin=1');
});

app.get('/admin2/prompts', (req, res) => {
    // Simple admin check - in production, use proper auth
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT id, model, section, question, prompt, sort_order FROM questions ORDER BY model, section, sort_order, id", [], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        // Group by model and section
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.model]) grouped[row.model] = {};
            if (!grouped[row.model][row.section]) grouped[row.model][row.section] = [];
            grouped[row.model][row.section].push(row);
        });
        // Get unique sections for navigation
        const uniqueSections = [...new Set(rows.map(row => row.section))];
        const modelOrder = ['Idea Model', 'Business Model', 'Financial Model', 'Funding Model', 'Marketing Model', 'Team Model', 'Legal Model'];
        const uniqueModels = modelOrder.filter(m => grouped[m]);
        // Add local and global numbering
        let globalIndex = 1;
        Object.keys(grouped).forEach(modelKey => {
            Object.keys(grouped[modelKey]).forEach(sectionKey => {
                let localIndex = 1;
                grouped[modelKey][sectionKey].forEach(question => {
                    question.localIndex = localIndex++;
                    question.globalIndex = globalIndex++;
                });
            });
        });
        res.render('admin2-prompts', { grouped, uniqueSections, uniqueModels });
    });
});

app.post('/admin2/prompts', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    const updates = [];
    for (const key in req.body) {
        if (key.startsWith('prompt-')) {
            const id = key.split('-')[1];
            const prompt = req.body[key];
            updates.push({ id, prompt });
        }
    }
    let completed = 0;
    updates.forEach(update => {
        db.run("UPDATE questions SET prompt = ? WHERE id = ?", [update.prompt, update.id], function(err) {
            if (err) console.error('Update error:', err);
            completed++;
            if (completed === updates.length) {
                db.close();
                // Reload questions
                loadQuestions();
                res.redirect('/admin2/prompts?admin=1');
            }
        });
    });
});

app.post('/admin2/add-question', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { model, section, question, prompt } = req.body;
    if (!model || !section || !question || !prompt) {
        return res.status(400).send('Missing required fields');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT MAX(sort_order) as maxOrder FROM questions WHERE model = ? AND section = ?", [model, section], (err, row) => {
        const sortOrder = (row && row.maxOrder) ? row.maxOrder + 1 : 1;
        db.run("INSERT INTO questions (model, section, question, prompt, sort_order) VALUES (?, ?, ?, ?, ?)", [model, section, question, prompt, sortOrder], function(err) {
            db.close();
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).send('Database error');
            }
            loadQuestions();
            res.redirect('/admin2/prompts?admin=1');
        });
    });
});

app.post('/admin2/delete-question', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing question ID');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT model, section FROM questions WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Question not found');
        }
        const { model, section } = row;
        db.run("DELETE FROM questions WHERE id = ?", [id], function(deleteErr) {
            if (deleteErr) {
                console.error('Delete error:', deleteErr);
                db.close();
                return res.status(500).send('Database error');
            }
            // Renumber sort_order in the section
            db.all("SELECT id FROM questions WHERE model = ? AND section = ? ORDER BY sort_order, id", [model, section], (err, rows) => {
                if (err) {
                    console.error('Renumber error:', err);
                } else {
                    let newOrder = 1;
                    rows.forEach(r => {
                        db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [newOrder++, r.id]);
                    });
                }
                db.close();
                loadQuestions();
                res.redirect('/admin2/prompts?admin=1');
            });
        });
    });
});

app.post('/admin2/move-question-up', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing question ID');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT model, section, sort_order FROM questions WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Question not found');
        }
        const { model, section, sort_order } = row;
        if (sort_order <= 1) {
            db.close();
            return res.redirect('/admin2/prompts?admin=1'); // Already at top
        }
        db.get("SELECT id, sort_order FROM questions WHERE model = ? AND section = ? AND sort_order < ? ORDER BY sort_order DESC LIMIT 1", [model, section, sort_order], (err, prevRow) => {
            if (err || !prevRow) {
                db.close();
                return res.redirect('/admin2/prompts?admin=1');
            }
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [prevRow.sort_order, id]);
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [sort_order, prevRow.id], function() {
                db.close();
                loadQuestions();
                res.redirect('/admin2/prompts?admin=1');
            });
        });
    });
});

app.post('/admin2/move-question-down', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing question ID');
    }
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT model, section, sort_order FROM questions WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Question not found');
        }
        const { model, section, sort_order } = row;
        db.get("SELECT id, sort_order FROM questions WHERE model = ? AND section = ? AND sort_order > ? ORDER BY sort_order ASC LIMIT 1", [model, section, sort_order], (err, nextRow) => {
            if (err || !nextRow) {
                db.close();
                return res.redirect('/admin2/prompts?admin=1');
            }
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [nextRow.sort_order, id]);
            db.run("UPDATE questions SET sort_order = ? WHERE id = ?", [sort_order, nextRow.id], function() {
                db.close();
                loadQuestions();
                res.redirect('/admin2/prompts?admin=1');
            });
        });
    });
});

app.get('/admin2/export/json', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT model, section, question, prompt FROM questions ORDER BY id", [], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        // Rebuild structure like data.json
        const data = [];
        const modelsMap = {};
        rows.forEach(row => {
            if (!modelsMap[row.model]) {
                modelsMap[row.model] = { name: row.model, sections: {} };
            }
            if (!modelsMap[row.model].sections[row.section]) {
                modelsMap[row.model].sections[row.section] = { name: row.section, content: [[]] };
            }
            modelsMap[row.model].sections[row.section].content[0].push({
                question: row.question,
                prompt: row.prompt,
                answer: ''
            });
        });
        const structured = Object.values(modelsMap).map(model => ({
            name: model.name,
            sections: Object.values(model.sections)
        }));
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="prompts.json"');
        res.send(JSON.stringify(structured, null, 2));
    });
});

app.get('/admin2/export/csv', (req, res) => {
    if (req.query.admin !== '1') {
        return res.status(403).send('Access denied');
    }
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT model, section, question, prompt FROM questions ORDER BY id", [], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        let csv = 'Model,Section,Question,Prompt\n';
        rows.forEach(row => {
            csv += `"${row.model}","${row.section}","${row.question.replace(/"/g, '""')}","${row.prompt.replace(/"/g, '""')}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="prompts.csv"');
        res.send(csv);
    });
});

app.get('/', (req, res) => {
    const db = new sqlite3.Database('ideas.db');
    db.all("SELECT id, name, created_at, status FROM ideas", [], (err, rows) => {
        if (err) {
            console.error('Select error:', err);
            return res.status(500).send('Database error');
        }
        res.render('home', { ideas: rows || [], rawData });
        db.close();
    });
});

app.get('/idea/:id', (req, res) => {
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT * FROM ideas WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        if (!row) {
            return res.status(404).send('Idea not found');
        }
        const idea = JSON.parse(row.data);
        res.render('idea', { idea });
        db.close();
    });
});

app.get('/create-idea', (req, res) => {
    const ideaId = req.session.currentIdeaId;
    const currentIdea = getCurrentIdea(req);
    if (currentIdea.index >= allQuestions.length) {
        // Build the idea from answers
        const idea = {
            id: Date.now(),
            name: `User Created Idea ${Date.now()}`,
            created_at: new Date().toISOString(),
            models: []
        };
        let answerIndex = 0;
        templateData.forEach(modelTemplate => {
            const model = { name: modelTemplate.name, sections: [] };
            modelTemplate.sections.forEach(sectionTemplate => {
                const section = { name: sectionTemplate.name, questions: [] };
                sectionTemplate.content.forEach(group => {
                    group.forEach(q => {
                        section.questions.push({
                            question: q.question,
                            prompt: q.prompt,
                            answer: currentIdea.answers[answerIndex++]
                        });
                    });
                });
                model.sections.push(section);
            });
            idea.models.push(model);
        });
        // Save to DB
        const db = new sqlite3.Database('ideas.db');
        const data = JSON.stringify(idea);
        const saveCallback = () => {
            if (ideaId) {
                currentIdeas.delete(ideaId);
                delete req.session.currentIdeaId;
            }
            db.close();
            res.redirect('/');
        };
        if (currentIdea.dbId) {
            db.run("UPDATE ideas SET data = ?, status = 'completed' WHERE id = ?", data, currentIdea.dbId, function(err) {
                if (err) {
                    console.error(err);
                }
                saveCallback();
            });
        } else {
            db.run("INSERT INTO ideas (id, name, created_at, data, status) VALUES (?, ?, ?, ?, 'completed')", idea.id, idea.name, idea.created_at, data, function(err) {
                if (err) {
                    console.error(err);
                }
                saveCallback();
            });
        }
    } else {
        const question = allQuestions[currentIdea.index];
        const currentAnswer = currentIdea.answers[currentIdea.index] || '';
        res.render('create', { question, index: currentIdea.index + 1, total: allQuestions.length, currentAnswer });
    }
});

app.post('/next', (req, res) => {
    const currentIdea = getCurrentIdea(req);
    currentIdea.answers[currentIdea.index] = req.body.answer || '';
    currentIdea.index++;
    // Save partial idea
    if (currentIdea.index === 1 && !currentIdea.dbId) {
        const partialIdea = {
            id: Date.now(),
            name: `Draft Idea ${Date.now()}`,
            created_at: new Date().toISOString(),
            status: 'in_progress',
            models: [],
            answers: currentIdea.answers.slice(),
            currentIndex: currentIdea.index
        };
        // Build partial structure
        let answerIndex = 0;
        templateData.forEach(modelTemplate => {
            const model = { name: modelTemplate.name, sections: [] };
            modelTemplate.sections.forEach(sectionTemplate => {
                const section = { name: sectionTemplate.name, questions: [] };
                sectionTemplate.content.forEach(group => {
                    group.forEach(q => {
                        section.questions.push({
                            question: q.question,
                            prompt: q.prompt,
                            answer: partialIdea.answers[answerIndex] || ''
                        });
                        answerIndex++;
                    });
                });
                model.sections.push(section);
            });
            partialIdea.models.push(model);
        });
        const db = new sqlite3.Database('ideas.db');
        const data = JSON.stringify(partialIdea);
        db.run("INSERT INTO ideas (id, name, created_at, data, status) VALUES (?, ?, ?, ?, 'in_progress')", partialIdea.id, partialIdea.name, partialIdea.created_at, data, function(err) {
            if (err) {
                console.error('Error saving partial idea:', err);
            } else {
                currentIdea.dbId = this.lastID;
            }
            db.close();
        });
    }
    res.redirect('/create-idea');
});

app.post('/prev', (req, res) => {
    const currentIdea = getCurrentIdea(req);
    if (currentIdea.index > 0) {
        currentIdea.index--;
    }
    res.redirect('/create-idea');
});

app.get('/resume/:id', (req, res) => {
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT * FROM ideas WHERE id = ? AND status = 'in_progress'", [req.params.id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Incomplete idea not found');
        }
        const idea = JSON.parse(row.data);
        const ideaId = Date.now().toString();
        req.session.currentIdeaId = ideaId;
        currentIdeas.set(ideaId, {
            answers: idea.answers || [],
            index: idea.currentIndex || 0,
            dbId: row.id
        });
        db.close();
        res.redirect('/create-idea');
    });
});

app.post('/ai-fill', async (req, res) => {
    const prompt = req.body.prompt;
    const currentIdea = getCurrentIdea(req);
    let context = '';
    if (currentIdea.answers.length > 0) {
        context = 'Previous questions and answers:\n';
        for (let i = 0; i < currentIdea.answers.length; i++) {
            if (allQuestions[i] && currentIdea.answers[i]) {
                context += `Question: ${allQuestions[i].question}\nAnswer: ${currentIdea.answers[i]}\n\n`;
            }
        }
        context += 'Now, based on the above context and the current question:\n';
    }
    const fullPrompt = SYSTEM_PROMPT + '\n\n' + context + prompt;
    try {
        const completion = await getClient().chat.completions.create({
            model: 'google/gemma-3n-e2b-it:free',
            messages: [{ role: 'user', content: fullPrompt }],
            stream: true
        });
        res.setHeader('Content-Type', 'text/plain');
        for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            res.write(content);
        }
        res.end();
    } catch (error) {
        console.error('AI error:', error);
        res.write('Unable to generate answer, please try again.');
        res.end();
    }
});

app.post('/improve', async (req, res) => {
    const { question, prompt, answer } = req.body;
    const currentIdea = getCurrentIdea(req);
    let context = '';
    if (currentIdea.answers.length > 0) {
        context = 'Previous questions and answers:\n';
        for (let i = 0; i < currentIdea.answers.length; i++) {
            if (allQuestions[i] && currentIdea.answers[i]) {
                context += `Question: ${allQuestions[i].question}\nAnswer: ${currentIdea.answers[i]}\n\n`;
            }
        }
        context += 'Based on the above context:\n';
    }
    const improvePrompt = `${context}Context: ${prompt}\n\nQuestion: ${question}\n\nCurrent Answer: ${answer}\n\nPlease provide an improved, more comprehensive and professional response to the question, taking into account all the context provided.`;
    try {
        const completion = await getClient().chat.completions.create({
            model: 'google/gemma-3n-e2b-it:free',
            messages: [{ role: 'user', content: SYSTEM_PROMPT + '\n\n' + improvePrompt }],
            stream: true
        });
        res.setHeader('Content-Type', 'text/plain');
        for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            res.write(content);
        }
        res.end();
    } catch (error) {
        console.error('AI error:', error);
        res.write('Unable to improve answer, please try again.');
        res.end();
    }
});

app.post('/update-answer', (req, res) => {
    const { id, modelIndex, sectionIndex, questionIndex, answer } = req.body;
    const db = new sqlite3.Database('ideas.db');
    db.get("SELECT * FROM ideas WHERE id = ?", [id], (err, row) => {
        if (err || !row) {
            db.close();
            return res.status(404).send('Idea not found');
        }
        const idea = JSON.parse(row.data);
        if (idea.models[modelIndex] && idea.models[modelIndex].sections[sectionIndex] && idea.models[modelIndex].sections[sectionIndex].questions[questionIndex]) {
            idea.models[modelIndex].sections[sectionIndex].questions[questionIndex].answer = answer;
            const updatedData = JSON.stringify(idea);
            db.run("UPDATE ideas SET data = ? WHERE id = ?", [updatedData, id], function(updateErr) {
                db.close();
                if (updateErr) {
                    console.error('Update error:', updateErr);
                    res.status(500).send('Update failed');
                } else {
                    res.redirect(`/idea/${id}`);
                }
            });
        } else {
            db.close();
            res.status(400).send('Invalid indices');
        }
    });
});

app.post('/delete/:id', (req, res) => {
    const db = new sqlite3.Database('ideas.db');
    db.run("DELETE FROM ideas WHERE id = ?", [req.params.id], function(err) {
        db.close();
        if (err) {
            console.error('Delete error:', err);
            res.status(500).send('Delete failed');
        } else {
            res.redirect('/');
        }
    });
});

app.post('/delete-node/:id', (req, res) => {
  const nodeId = req.params.id;
  if (deleteNodeById(hierarchicalData, nodeId)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.post('/add-node', (req, res) => {
  const { parentId, type, name } = req.body;
  const newId = Date.now().toString();
  const newNode = type === 'sub' ? { id: newId, name, children: [] } : { id: newId, question: name, answer: "", "prompt-en": "", "prompt-ar": "", placeholder: "" };
  newNode.uniqueId = Math.random().toString(36).substr(2, 9);
  if (addNode(hierarchicalData, parentId, newNode)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true, id: newId, uniqueId: newNode.uniqueId });
  } else {
    res.status(400).json({ success: false });
  }
});

app.post('/update-node/:id', (req, res) => {
  const nodeId = req.params.id;
  const { name } = req.body;
  const node = getNode(hierarchicalData, nodeId);
  if (!node) {
    return res.status(400).json({ success: false });
  }
  const updates = 'children' in node ? { name } : { question: name };
  if (updateNode(hierarchicalData, nodeId, updates)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.post('/paste-as-child', (req, res) => {
  const { parentId, copyId } = req.body;
  if (copyNode(hierarchicalData, copyId, parentId)) {
    fs.writeFileSync('hierarchical-data.json', JSON.stringify(hierarchicalData, null, 2));
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.get('/model', (req, res) => {
    res.render('model');
});

app.get('/new', (req, res) => {
    res.render('new', { rawData });
});

app.get('/hierarchy', (req, res) => {
    // Normalize children property
    normalizeChildren(hierarchicalData);
    function addIsFolder(data) {
        for (let node of data) {
            node.isFolder = 'children' in node;
            node.uniqueId = Math.random().toString(36).substr(2, 9);
            if (node.children && node.children.length > 0) {
                addIsFolder(node.children);
            }
        }
    }
    addIsFolder(hierarchicalData);
    res.render('hierarchy', { rawData: hierarchicalData });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});