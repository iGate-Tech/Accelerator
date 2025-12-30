const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const db = new sqlite3.Database('ideas.db');

db.serialize(() => {
  // Clear existing
  db.run('DELETE FROM questions');

  let globalId = 1;

  // Add the 4 from data.json
  data.forEach(model => {
    const modelName = model.name;
    model.sections.forEach((section, sectionIndex) => {
      const sectionName = section.name;
      let localIndex = 1;
      section.content.forEach(group => {
        group.forEach(question => {
          db.run('INSERT INTO questions (id, model, section, question, prompt, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [globalId++, modelName, sectionName, question.question, question.prompt, localIndex++]);
        });
      });
    });
  });

  // Add extra models: Marketing Model, Team Model, Legal Model, using Idea Model's sections
  const extraModels = ['Marketing Model', 'Team Model', 'Legal Model'];
  const ideaModel = data.find(m => m.name === 'Idea Model');
  extraModels.forEach(extraName => {
    ideaModel.sections.forEach((section, sectionIndex) => {
      const sectionName = section.name;
      let localIndex = 1;
      section.content.forEach(group => {
        group.forEach(question => {
          db.run('INSERT INTO questions (id, model, section, question, prompt, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [globalId++, extraName, sectionName, question.question, question.prompt, localIndex++]);
        });
      });
    });
  });

  console.log('Database populated from data.json with extra models');
  db.close();
});