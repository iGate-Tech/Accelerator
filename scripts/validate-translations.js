#!/usr/bin/env node
/**
 * Translation Validation Script
 * Checks for missing translation keys between English and Arabic versions
 */

import fs from 'fs';
import path from 'path';

// Path to translations directory
const TRANSLATIONS_DIR = './src/assets/translations';

// Function to get all translation files
function getTranslationFiles() {
  const files = fs.readdirSync(TRANSLATIONS_DIR);
  return files.filter(file => file.startsWith('translations-') && file.endsWith('.js') && file !== 'translations-index.js');
}

// Function to read and extract translation keys from a file using regex
function extractTranslationKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Find all en: { ... } and ar: { ... } sections
  // Look for en: { ... } followed by ar: { ... } or vice versa
  const enSectionMatch = content.match(/en:\s*({[\s\S]*?})\s*,\s*ar:/);
  const arSectionMatch = content.match(/ar:\s*({[\s\S]*?})(?:\s*,\s*|\s*\}|$)/);

  if (!enSectionMatch || !arSectionMatch) {
    console.warn(`Could not find en/ar sections in ${filePath}`);
    // Try alternative pattern - maybe ar comes first
    const enAltMatch = content.match(/en:\s*({[\s\S]*?})(?:\s*,\s*|\s*\}|$)/);
    const arAltMatch = content.match(/ar:\s*({[\s\S]*?})(?:\s*,\s*|\s*\}|$)/);

    if (!enAltMatch || !arAltMatch) {
      console.error(`Could not parse en/ar sections in ${filePath}`);
      return { en: [], ar: [] };
    }

    const enSection = cleanSection(enAltMatch[1]);
    const arSection = cleanSection(arAltMatch[1]);

    // Extract keys from each section
    const enKeys = extractKeysFromSection(enSection);
    const arKeys = extractKeysFromSection(arSection);

    return { en: enKeys, ar: arKeys };
  }

  const enSection = cleanSection(enSectionMatch[1]);
  const arSection = cleanSection(arSectionMatch[1]);

  // Extract keys from each section
  const enKeys = extractKeysFromSection(enSection);
  const arKeys = extractKeysFromSection(arSection);

  return { en: enKeys, ar: arKeys };
}

// Function to clean up the section content
function cleanSection(section) {
  // Remove outer braces if present
  let cleaned = section.trim();
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
}

// Function to extract keys from a section of code
function extractKeysFromSection(section) {
  // Match property names (keys) in the format: keyName: or "keyName": or 'keyName':
  // This regex handles both quoted and unquoted keys
  const keyRegex = /(?:^|,|\s)\s*(?:"([^"]+)"|'([^']+)'|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*:/gm;
  const keys = [];
  let match;

  while ((match = keyRegex.exec(section)) !== null) {
    // The key could be in any of the three capture groups
    const key = match[1] || match[2] || match[3];
    if (key) {
      keys.push(key);
    }
  }

  // Remove duplicates
  return [...new Set(keys)];
}

// Function to compare translation keys
function compareTranslations(enKeys, arKeys, fileName) {
  const enOnly = enKeys.filter(key => !arKeys.includes(key));
  const arOnly = arKeys.filter(key => !enKeys.includes(key));
  
  return { enOnly, arOnly };
}

// Main validation function
function validateTranslations() {
  console.log('🔍 Validating translations...\n');
  
  const files = getTranslationFiles();
  let hasErrors = false;
  
  for (const file of files) {
    console.log(`📄 Checking ${file}...`);
    
    const filePath = path.join(TRANSLATIONS_DIR, file);
    const { en, ar } = extractTranslationKeys(filePath);
    
    const comparison = compareTranslations(en, ar, file);
    
    if (comparison.enOnly.length > 0) {
      console.log(`  ❌ Missing Arabic translations for ${comparison.enOnly.length} keys:`);
      comparison.enOnly.forEach(key => console.log(`    - ${key}`));
      hasErrors = true;
    }
    
    if (comparison.arOnly.length > 0) {
      console.log(`  ❌ Missing English translations for ${comparison.arOnly.length} keys:`);
      comparison.arOnly.forEach(key => console.log(`    - ${key}`));
      hasErrors = true;
    }
    
    if (comparison.enOnly.length === 0 && comparison.arOnly.length === 0) {
      console.log(`  ✅ ${file} is complete`);
    }
    
    console.log('');
  }
  
  if (!hasErrors) {
    console.log('🎉 All translation files are complete!');
    process.exit(0);
  } else {
    console.log('❌ Some translation files have missing keys. Please add the missing translations.');
    process.exit(1);
  }
}

// Run validation
validateTranslations();