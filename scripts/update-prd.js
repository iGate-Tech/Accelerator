#!/usr/bin/env node

import fs from 'fs';

function updateStoryInPRD(storyId, passes, notes) {
  if (!fs.existsSync('PRD.md')) {
    console.error('PRD.md not found');
    return;
  }

  const prdContent = fs.readFileSync('PRD.md', 'utf8');
  const lines = prdContent.split('\n');
  let updatedLines = [];
  let inUserStoriesSection = false;
  let updated = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      inUserStoriesSection = line.includes('User Stories');
    }

    if (inUserStoriesSection && line.includes(storyId)) {
      // Update the story line with pass status and notes
      let updatedLine = line.replace(' ✅', '').replace(/ \[.*\]$/, ''); // Remove existing status

      if (passes) {
        updatedLine = updatedLine.replace(' - ', ' ✅ - ');
        if (notes) {
          updatedLine += ` [${notes}]`;
        }
      }
      updatedLines.push(updatedLine);
      updated = true;
    } else {
      updatedLines.push(line);
    }
  }

  if (updated) {
    fs.writeFileSync('PRD.md', updatedLines.join('\n'));
    console.log(`Updated ${storyId} in PRD.md`);
  } else {
    console.log(`Story ${storyId} not found in PRD.md`);
  }
}

// Command line usage: node scripts/update-prd.js US-001 true "Implementation notes"
if (process.argv.length >= 4) {
  const [, , storyId, passes, ...notesParts] = process.argv;
  const notes = notesParts.join(' ');
  updateStoryInPRD(storyId, passes === 'true', notes);
} else {
  console.log('Usage: node scripts/update-prd.js <storyId> <passes> [notes]');
}