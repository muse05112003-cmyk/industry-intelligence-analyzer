#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { buildAnalysis } = require('./analysis');
const { validateDataset } = require('./verifier');
const { generateReports } = require('./report_generator');

function parseArgs(argv) {
  const args = { input: null, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') args.out = argv[++index];
    else if (argv[index] === '--help' || argv[index] === '-h') args.help = true;
    else if (!args.input) args.input = argv[index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

function usage() {
  return `Industry Intelligence Analyzer\n\nUsage:\n  node src/process_industry.js <input.json> [--out <directory>]\n\nExample:\n  npm run demo\n`;
}

function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return { exitCode: 0 };
  }
  if (!args.input) throw new Error(`Input JSON is required.\n\n${usage()}`);
  const inputPath = path.resolve(args.input);
  const outputDir = path.resolve(args.out || path.join('output', path.basename(args.input, path.extname(args.input))));
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const validation = validateDataset(input);
  const analysis = validation.analysis || buildAnalysis(input);
  const files = generateReports(analysis, validation, outputDir);

  console.log(`Analysis complete: ${analysis.meta.title}`);
  console.log(`Validation: ${validation.status}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Files: ${files.length}`);
  if (validation.status === 'needs_revision') process.exitCode = 1;
  return { analysis, validation, outputDir, files, exitCode: process.exitCode || 0 };
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { run, parseArgs };

