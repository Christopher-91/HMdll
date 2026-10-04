import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const sqlPath = path.join(__dirname, '../migrations/add_group_chat.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration script...');
    await query(sql);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
