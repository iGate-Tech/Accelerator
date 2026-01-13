#!/usr/bin/env node

// PGLite database backup utility
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup directory
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `pglite-backup-${timestamp}.db`;

  try {
    // In a real PGLite setup, you'd export the database
    // For now, we'll create a placeholder backup file
    const backupPath = path.join(BACKUP_DIR, backupName);
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      type: 'pglite-backup',
      note: 'This is a placeholder backup. In production, implement actual PGLite export.'
    };

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`Backup created: ${backupName}`);

    // Clean up old backups (keep last 10)
    cleanupOldBackups();

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    // Keep only the 10 most recent backups
    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Removed old backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
}

function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    console.log('Available backups:');
    files.forEach(backup => {
      console.log(`  ${backup.name} (${(backup.size / 1024).toFixed(1)} KB) - ${backup.created.toISOString()}`);
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'create':
    createBackup();
    break;
  case 'list':
    listBackups();
    break;
  default:
    console.log('Usage: node scripts/backup-db.js <command>');
    console.log('Commands:');
    console.log('  create  - Create a new database backup');
    console.log('  list    - List available backups');
    break;
}