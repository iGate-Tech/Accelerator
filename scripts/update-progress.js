#!/usr/bin/env node

import fs from 'fs';

function updateProgressFile(storyId) {
  const progressFile = 'progress.txt';

  if (!fs.existsSync(progressFile)) {
    console.error('progress.txt not found');
    return;
  }

  let content = fs.readFileSync(progressFile, 'utf8');

  // First, read PRD.md to get the story title
  let storyTitle = storyId;
  try {
    if (fs.existsSync('PRD.md')) {
      const prdContent = fs.readFileSync('PRD.md', 'utf8');
      const storyMatch = prdContent.match(new RegExp(`- ${storyId}: ([^(]+)`));
      if (storyMatch) {
        storyTitle = storyMatch[1].trim();
      }
    }
  } catch (error) {
    console.log('Could not read PRD.md for story title, using ID only');
  }

  // Update the completed stories section
  const completedStoriesMatch = content.match(/## Completed Stories\n([\s\S]*?)(?=\n## Current Status)/);
  if (completedStoriesMatch) {
    const currentCompleted = completedStoriesMatch[1].trim();
    const newCompleted = currentCompleted + `\n- ${storyId}: ${storyTitle} (${new Date().toISOString().split('T')[0]})`;

    content = content.replace(completedStoriesMatch[0], `## Completed Stories\n${newCompleted}`);
  }

  // Update the current status
  const statusMatch = content.match(/## Current Status\n([\s\S]*?)(?=\n## Learnings)/);
  if (statusMatch) {
    const statusContent = statusMatch[1];
    const completedMatch = statusContent.match(/- Completed: (\d+)/);
    const remainingMatch = statusContent.match(/- Remaining: (\d+)/);

    if (completedMatch && remainingMatch) {
      const currentCompleted = parseInt(completedMatch[1]);
      const currentRemaining = parseInt(remainingMatch[1]);

      const newCompleted = currentCompleted + 1;
      const newRemaining = currentRemaining - 1;

      const updatedStatus = statusContent
        .replace(`- Completed: ${currentCompleted}`, `- Completed: ${newCompleted}`)
        .replace(`- Remaining: ${currentRemaining}`, `- Remaining: ${newRemaining}`);

      content = content.replace(statusMatch[0], `## Current Status\n${updatedStatus}`);
    }
  }

  fs.writeFileSync(progressFile, content);
  console.log(`Updated progress.txt for ${storyId} completion`);
}

// Command line usage: node scripts/update-progress.js US-014
if (process.argv.length >= 3) {
  const [, , storyId] = process.argv;
  updateProgressFile(storyId);
} else {
  console.log('Usage: node scripts/update-progress.js <storyId>');
}