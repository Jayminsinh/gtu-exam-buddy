/**
 * @file Dynamic Subject Seeder CLI
 * @description A reusable CLI tool that reads a JSON data file keyed by
 *              branch code + semester number, resolves MongoDB ObjectIds
 *              for Branch and Semester automatically, clears stale entries,
 *              and bulk-inserts fresh subject records.
 *
 * Usage:
 *   node src/seeders/dynamicSeeder.js <branchCode> <semesterNumber>
 *
 * Examples:
 *   node src/seeders/dynamicSeeder.js 07 1
 *   npm run seed:dynamic -- 07 1
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import dns from 'dns';

// ─── Resolve __dirname for ES Modules ─────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load environment + config ────────────────────────────────
import config from '../config/index.js';
import Branch from '../models/branch.model.js';
import Semester from '../models/semester.model.js';
import Subject from '../models/subject.model.js';

// Use reliable DNS servers (matches server.js)
dns.setServers(['1.1.1.1', '8.8.8.8']);

// ──────────────────────────────────────────────
// Styled Console Helpers
// ──────────────────────────────────────────────

const log = {
  info: (msg) => console.log(`\n   ℹ  ${msg}`),
  success: (msg) => console.log(`   ✅  ${msg}`),
  warn: (msg) => console.warn(`   ⚠️  ${msg}`),
  error: (msg) => console.error(`\n   ❌  ${msg}`),
  divider: () => console.log('\n   ─────────────────────────────────────────'),
  header: (msg) => {
    console.log('\n   ═══════════════════════════════════════════');
    console.log(`   ${msg}`);
    console.log('   ═══════════════════════════════════════════');
  },
};

// ──────────────────────────────────────────────
// Argument Parsing & Validation
// ──────────────────────────────────────────────

const args = process.argv.slice(2);
const branchCode = args[0];
const semesterNumber = parseInt(args[1], 10);

if (!branchCode || isNaN(semesterNumber)) {
  log.header('DYNAMIC SEEDER — GTU EXAM BUDDY');
  log.error('Missing or invalid arguments.');
  console.log('\n   Usage:');
  console.log('     node src/seeders/dynamicSeeder.js <branchCode> <semesterNumber>');
  console.log('\n   Example:');
  console.log('     node src/seeders/dynamicSeeder.js 07 1');
  console.log('     npm run seed:dynamic -- 07 1\n');
  process.exit(1);
}

// ──────────────────────────────────────────────
// Main Seeder Engine
// ──────────────────────────────────────────────

const runSeeder = async () => {
  log.header('DYNAMIC SEEDER — GTU EXAM BUDDY');
  log.info(`Target: Branch "${branchCode.toUpperCase()}" · Semester ${semesterNumber}`);
  log.divider();

  // ─── 1. Connect to MongoDB ──────────────────────────────
  try {
    await mongoose.connect(config.database.uri);
    log.success('MongoDB connection established.');
  } catch (err) {
    log.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  // ─── Step A: Resolve Branch ObjectId ────────────────────
  log.info('Resolving branch reference...');
  const branch = await Branch.findOne({
    code: branchCode.toUpperCase(),
  });

  if (!branch) {
    log.error(
      `Branch with code "${branchCode.toUpperCase()}" not found in the database.\n` +
        `   Please create the branch first via the admin panel or a branch seeder.`
    );
    await mongoose.connection.close();
    process.exit(1);
  }

  log.success(`Branch resolved: ${branch.name} (${branch.code}) → ${branch._id}`);

  // ─── Step B: Resolve or Create Semester ─────────────────
  log.info(`Resolving semester ${semesterNumber} for branch ${branch.code}...`);
  let semester = await Semester.findOne({
    branch: branch._id,
    number: semesterNumber,
  });

  if (!semester) {
    log.warn(`Semester ${semesterNumber} not found. Creating it automatically...`);
    semester = await Semester.create({
      number: semesterNumber,
      branch: branch._id,
    });
    log.success(`Semester ${semesterNumber} created on-the-fly → ${semester._id}`);
  } else {
    log.success(`Semester resolved: Term ${semester.number} → ${semester._id}`);
  }

  // ─── Step C: Read & Parse JSON Data File ────────────────
  const dataFileName = `${branchCode}-sem${semesterNumber}.json`;
  const dataFilePath = path.resolve(__dirname, 'data', dataFileName);

  log.info(`Reading data file: ./data/${dataFileName}`);

  let rawSubjects;
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    rawSubjects = JSON.parse(fileContent);
  } catch (err) {
    if (err.code === 'ENOENT') {
      log.error(
        `Data file not found: ${dataFilePath}\n` +
          `   Create the file at: src/seeders/data/${dataFileName}`
      );
    } else {
      log.error(`Failed to read/parse data file: ${err.message}`);
    }
    await mongoose.connection.close();
    process.exit(1);
  }

  if (!Array.isArray(rawSubjects) || rawSubjects.length === 0) {
    log.error('Data file is empty or not a valid JSON array.');
    await mongoose.connection.close();
    process.exit(1);
  }

  log.success(`Parsed ${rawSubjects.length} subject entries from data file.`);

  // Inject Branch and Semester ObjectIds into each record
  const preparedSubjects = rawSubjects.map((sub) => ({
    ...sub,
    branch: branch._id,
    semester: semester._id,
  }));

  // ─── Step D: Clear Stale Data & Bulk Insert ─────────────
  log.info('Clearing existing subjects for this branch + semester combination...');
  const deleteResult = await Subject.deleteMany({
    branch: branch._id,
    semester: semester._id,
  });
  log.success(`Removed ${deleteResult.deletedCount} previous entries.`);

  log.info('Inserting fresh subject dataset...');
  const inserted = await Subject.insertMany(preparedSubjects);
  log.success(`Successfully seeded ${inserted.length} subjects.`);

  // ─── Summary ────────────────────────────────────────────
  log.divider();
  log.header('SEED COMPLETE');
  console.log(`\n   Branch   : ${branch.name} (${branch.code})`);
  console.log(`   Semester : Term ${semesterNumber}`);
  console.log(`   Records  : ${inserted.length} subjects written`);
  console.log(`   Source   : ./data/${dataFileName}\n`);

  // ─── Cleanup ────────────────────────────────────────────
  await mongoose.connection.close();
  log.success('Database connection closed.');
  process.exit(0);
};

// ──────────────────────────────────────────────
// Execute
// ──────────────────────────────────────────────

runSeeder().catch(async (err) => {
  log.error(`Unexpected seeder failure: ${err.message}`);
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch (_) {
    // Silently ignore close errors during crash
  }
  process.exit(1);
});
