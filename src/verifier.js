'use strict';

const fs = require('fs');
const path = require('path');
const { assessEvidence, buildAnalysis } = require('./analysis');

function issue(severity, code, message) {
  return { severity, code, message };
}

function validateDataset(input) {
  const issues = [];
  const requiredObjects = ['meta', 'decision', 'marketSizing'];
  const requiredArrays = ['sources', 'competitors', 'painPoints', 'opportunities'];
  for (const key of requiredObjects) {
    if (!input[key] || typeof input[key] !== 'object') issues.push(issue('high', 'missing_object', `${key} is required.`));
  }
  for (const key of requiredArrays) {
    if (!Array.isArray(input[key])) issues.push(issue('high', 'missing_array', `${key} must be an array.`));
  }
  if (issues.some(item => item.severity === 'high')) {
    return { status: 'needs_revision', issues, checks: {}, analysis: null };
  }

  const ids = input.sources.map(source => source.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) issues.push(issue('high', 'duplicate_source_id', `Duplicate source IDs: ${[...new Set(duplicateIds)].join(', ')}`));

  for (const source of input.sources) {
    if (!source.id || !source.title || !source.type || !source.status) {
      issues.push(issue('medium', 'incomplete_source', `Source ${source.id || '(missing id)'} lacks required metadata.`));
    }
    if (source.status === 'verified' && !source.url && !source.locator && source.type !== 'assumption') {
      issues.push(issue('medium', 'untraceable_verified_source', `Verified source ${source.id} has no URL or traceable locator.`));
    }
  }

  const analysis = buildAnalysis(input);
  const evidenceItems = [
    ...input.competitors.map(item => ({ label: `competitor:${item.name}`, ids: item.sourceIds })),
    ...input.painPoints.map(item => ({ label: `pain:${item.theme}`, ids: item.sourceIds })),
    ...input.opportunities.map(item => ({ label: `opportunity:${item.id}`, ids: item.sourceIds }))
  ];
  for (const item of evidenceItems) {
    const evidence = assessEvidence(item.ids, input.sources);
    if (evidence.missingSourceIds.length) {
      issues.push(issue('high', 'broken_source_reference', `${item.label} references missing IDs: ${evidence.missingSourceIds.join(', ')}`));
    }
  }

  if (!input.meta.asOf) issues.push(issue('medium', 'missing_as_of', 'meta.asOf is required for time-bounded research.'));
  if (input.meta.synthetic !== true) {
    issues.push(issue('low', 'public_data_review', 'This dataset is not marked synthetic; complete the public-release review before publishing.'));
  }
  const actionableWithoutEvidence = analysis.opportunities.filter(item => item.priority === 'high' && item.evidence.gate !== 'decision_ready');
  if (actionableWithoutEvidence.length) {
    issues.push(issue('high', 'evidence_gate_failure', 'A high-priority opportunity bypassed the evidence gate.'));
  }

  const highCount = issues.filter(item => item.severity === 'high').length;
  const mediumCount = issues.filter(item => item.severity === 'medium').length;
  const status = highCount ? 'needs_revision' : mediumCount ? 'share_with_caveats' : 'ready_to_share';
  return {
    status,
    issues,
    checks: {
      sourceCount: input.sources.length,
      verifiedSourceCount: input.sources.filter(source => ['verified', 'reviewed'].includes(source.status)).length,
      brokenReferenceCount: issues.filter(item => item.code === 'broken_source_reference').length,
      actionableOpportunityCount: analysis.opportunities.filter(item => item.recommendationStatus === 'actionable').length,
      evidenceGatePassed: actionableWithoutEvidence.length === 0
    },
    analysis
  };
}

function validationMarkdown(result) {
  const labels = {
    ready_to_share: 'Ready to share',
    share_with_caveats: 'Share with caveats',
    needs_revision: 'Needs revision'
  };
  const issueRows = result.issues.length
    ? result.issues.map((item, index) => `${index + 1}. **${item.severity.toUpperCase()} · ${item.code}** — ${item.message}`).join('\n')
    : 'No material issues found.';
  return `# Validation report\n\n## Overall assessment: ${labels[result.status]}\n\n## Checks\n\n| Check | Result |\n|---|---:|\n| Sources | ${result.checks.sourceCount ?? 0} |\n| Verified/reviewed sources | ${result.checks.verifiedSourceCount ?? 0} |\n| Broken source references | ${result.checks.brokenReferenceCount ?? 0} |\n| Actionable opportunities | ${result.checks.actionableOpportunityCount ?? 0} |\n| Evidence gate | ${result.checks.evidenceGatePassed ? 'PASS' : 'FAIL'} |\n\n## Issues\n\n${issueRows}\n`;
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node src/verifier.js <input.json>');
    process.exit(2);
  }
  const input = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
  const result = validateDataset(input);
  console.log(validationMarkdown(result));
  process.exitCode = result.status === 'needs_revision' ? 1 : 0;
}

module.exports = { validateDataset, validationMarkdown };
