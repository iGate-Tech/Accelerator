#!/usr/bin/env node

// Translation validation script
// Checks for missing keys between English and Arabic in all translation files

const fs = require('fs');
const path = require('path');

const translationDir = path.join(__dirname, 'src/assets/translations');
const files = fs.readdirSync(translationDir).filter(f => f.endsWith('.js') && f !== 'translations-index.js');

let hasErrors = false;

files.forEach(file => {
  console.log(`Checking ${file}...`);
  const filePath = path.join(translationDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract en and ar objects (simplified regex)
  const enMatch = content.match(/en:\s*{([^}]+)}/);
  const arMatch = content.match(/ar:\s*{([^}]+)}/);

  if (!enMatch || !arMatch) {
    console.error(`❌ Could not parse en/ar objects in ${file}`);
    hasErrors = true;
    return;
  }

  // Extract keys (match lines that start with key:)
  const enKeys = enMatch[1].split('\n').map(line => line.trim()).filter(line => line.match(/^[a-zA-Z_]+:/)).map(line => line.match(/^([a-zA-Z_]+):/)[1]);
  const arKeys = arMatch[1].split('\n').map(line => line.trim()).filter(line => line.match(/^[a-zA-Z_]+:/)).map(line => line.match(/^([a-zA-Z_]+):/)[1]);

  const missingInAr = enKeys.filter(k => !arKeys.includes(k));
  const missingInEn = arKeys.filter(k => !enKeys.includes(k));

  if (missingInAr.length > 0) {
    console.error(`❌ Missing in Arabic: ${missingInAr.join(', ')}`);
    hasErrors = true;
  }
  if (missingInEn.length > 0) {
    console.error(`❌ Missing in English: ${missingInEn.join(', ')}`);
    hasErrors = true;
  }

  if (missingInAr.length === 0 && missingInEn.length === 0) {
    console.log(`✅ ${file} has matching keys (${enKeys.length})`);
  }
});

if (hasErrors) {
  console.error('\n❌ Validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ All translations validated successfully!');
}