'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  calculateCagr,
  calculateMarketSizing,
  assessEvidence,
  scoreOpportunity,
  buildAnalysis
} = require('../src/analysis');
const { validateDataset } = require('../src/verifier');
const { htmlReport } = require('../src/report_generator');

const fixturePath = path.join(__dirname, '..', 'examples', 'synthetic-demo', 'input.json');
const fixture = () => JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

test('calculates CAGR without averaging annual rates', () => {
  assert.equal(Number(calculateCagr(100, 121, 2).toFixed(4)), 0.1);
});

test('calculates TAM, SAM and SOM for all scenarios', () => {
  const result = calculateMarketSizing({
    baseYear: 2026,
    forecastYear: 2028,
    cagr: 0.1,
    scenarios: {
      low: { eligibleCustomers: 100, annualSpend: 10, serviceableShare: 0.5, attainableShare: 0.1 },
      base: { eligibleCustomers: 200, annualSpend: 10, serviceableShare: 0.5, attainableShare: 0.1 },
      high: { eligibleCustomers: 300, annualSpend: 10, serviceableShare: 0.5, attainableShare: 0.1 }
    }
  });
  assert.deepEqual(result.scenarios.base, { tam: 2000, sam: 1000, som: 100, forecastTam: 2420 });
});

test('requires independent evidence for decision-ready claims', () => {
  const sources = [
    { id: 's1', type: 'research', status: 'verified', independenceGroup: 'g1' },
    { id: 's2', type: 'official', status: 'verified', independenceGroup: 'g1' },
    { id: 's3', type: 'association', status: 'reviewed', independenceGroup: 'g2' }
  ];
  assert.equal(assessEvidence(['s1', 's2'], sources).gate, 'directional');
  assert.equal(assessEvidence(['s1', 's3'], sources).gate, 'decision_ready');
});

test('caps opportunity score when evidence is weak', () => {
  const opportunity = {
    sourceIds: ['s1'],
    dimensions: { demand: 10, competitionGap: 10, feasibility: 10, urgency: 10 }
  };
  const result = scoreOpportunity(opportunity, [{ id: 's1', type: 'review', status: 'pending' }]);
  assert.equal(result.evidence.gate, 'hypothesis');
  assert.ok(result.score <= 4.9);
  assert.equal(result.recommendationStatus, 'validate_first');
});

test('builds and validates the synthetic case end to end', () => {
  const input = fixture();
  const analysis = buildAnalysis(input);
  const validation = validateDataset(input);
  assert.equal(analysis.market.scenarios.base.tam, 504000000);
  assert.equal(validation.status, 'ready_to_share');
  assert.equal(validation.checks.evidenceGatePassed, true);
});

test('detects broken source references', () => {
  const input = fixture();
  input.opportunities[0].sourceIds.push('missing-source');
  const result = validateDataset(input);
  assert.equal(result.status, 'needs_revision');
  assert.ok(result.issues.some(item => item.code === 'broken_source_reference'));
});

test('renders a self-contained responsive HTML report with calculated values', () => {
  const input = fixture();
  const validation = validateDataset(input);
  const html = htmlReport(validation.analysis, validation);
  assert.match(html, /基准 TAM/);
  assert.match(html, /Evidence Gate|证据门控/);
  assert.match(html, /@media\(max-width:580px\)/);
  assert.match(html, /href="#market"/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
  assert.equal((html.match(/<section/g) || []).length, 7);
});
