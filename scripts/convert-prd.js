#!/usr/bin/env node

import fs from 'fs';

function parsePRDContent(prdContent) {
  const lines = prdContent.split('\n');
  const stories = [];
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '');
    } else if ((currentSection === 'Existing User Stories' || currentSection === 'Inferred User Stories') && line.startsWith('- US-')) {
      const match = line.match(/- (US-\d+): (.+) \(Priority (\d+)\) - (.+)/);
      if (match) {
        const [, id, title, priority, description] = match;
        const acceptanceCriteria = description.split(', ').map(c => c.trim());
        stories.push({
          id,
          title,
          description: description.split(' - ')[0],
          acceptanceCriteria,
          priority: parseInt(priority),
          passes: false,
          notes: ''
        });
      }
    }
  }

  return stories;
}

function updateStoryInPRD(storyId, passes, notes) {
  const prdContent = fs.readFileSync('PRD.md', 'utf8');
  const lines = prdContent.split('\n');
  let updatedLines = [];
  let inUserStoriesSection = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      inUserStoriesSection = line.includes('User Stories');
    }

    if (inUserStoriesSection && line.includes(storyId)) {
      // Update the story line with pass status and notes
      let updatedLine = line;
      if (passes) {
        updatedLine = line.replace(' - ', ' ✅ - ');
        if (notes) {
          updatedLine += ` [${notes}]`;
        }
      }
      updatedLines.push(updatedLine);
    } else {
      updatedLines.push(line);
    }
  }

  fs.writeFileSync('PRD.md', updatedLines.join('\n'));
  console.log(`Updated ${storyId} in PRD.md`);
}

// If called with arguments, update a specific story
if (process.argv.length > 2) {
  const [,, storyId, passes, ...notesParts] = process.argv;
  const notes = notesParts.join(' ');
  updateStoryInPRD(storyId, passes === 'true', notes);
} else {
  // Parse and display stories
  const prdContent = fs.readFileSync('PRD.md', 'utf8');
  const stories = parsePRDContent(prdContent);
  console.log('Found', stories.length, 'user stories in PRD.md');
}