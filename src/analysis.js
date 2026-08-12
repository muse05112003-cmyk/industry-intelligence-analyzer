'use strict';

const SOURCE_WEIGHTS = Object.freeze({
  government: 1,
  regulator: 1,
  filing: 0.95,
  association: 0.9,
  official: 0.85,
  research: 0.8,
  reputable_media: 0.7,
  marketplace: 0.6,
  community: 0.45,
  review: 0.4,
  assumption: 0.2
});

const OPPORTUNITY_WEIGHTS = Object.freeze({
  demand: 0.3,
  competitionGap: 0.25,
  evidence: 0.2,
  feasibility: 0.15,
  urgency: 0.1
});

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function calculateCagr(startValue, endValue, years) {
  if (startValue <= 0 || endValue <= 0 || years <= 0) {
    throw new Error('CAGR requires positive startValue, endValue and years.');
  }
  return (endValue / startValue) ** (1 / years) - 1;
}

function sourceIndex(sources = []) {
  return new Map(sources.map(source => [source.id, source]));
}

function scoreSource(source) {
  if (!source) return 0;
  const typeWeight = SOURCE_WEIGHTS[source.type] ?? SOURCE_WEIGHTS.assumption;
  const statusFactor = {
    verified: 1,
    reviewed: 0.85,
    pending: 0.45,
    failed: 0
  }[source.status] ?? 0.25;
  return round(typeWeight * statusFactor, 3);
}

function assessEvidence(sourceIds = [], sources = []) {
  const index = sourceIndex(sources);
  const resolved = [...new Set(sourceIds)].map(id => index.get(id)).filter(Boolean);
  const verified = resolved.filter(source => ['verified', 'reviewed'].includes(source.status));
  const groups = new Set(verified.map(source => source.independenceGroup || source.id));
  const meanScore = verified.length
    ? verified.reduce((sum, source) => sum + scoreSource(source), 0) / verified.length
    : 0;
  const coverageScore = clamp((verified.length / 2) * 10, 0, 10);
  const qualityScore = clamp(meanScore * 10, 0, 10);
  const independenceScore = clamp((groups.size / 2) * 10, 0, 10);
  const score = round(coverageScore * 0.4 + qualityScore * 0.35 + independenceScore * 0.25, 1);

  let gate = 'hypothesis';
  if (verified.length >= 2 && groups.size >= 2 && meanScore >= 0.6) gate = 'decision_ready';
  else if (verified.length >= 1) gate = 'directional';

  return {
    score,
    gate,
    resolvedCount: resolved.length,
    verifiedCount: verified.length,
    independentCount: groups.size,
    meanSourceScore: round(meanScore, 2),
    missingSourceIds: sourceIds.filter(id => !index.has(id))
  };
}

function calculateMarketScenario(inputs) {
  const eligible = Number(inputs.eligibleCustomers);
  const annualSpend = Number(inputs.annualSpend);
  const serviceableShare = clamp(inputs.serviceableShare, 0, 1);
  const attainableShare = clamp(inputs.attainableShare, 0, 1);
  const tam = eligible * annualSpend;
  const sam = tam * serviceableShare;
  const som = sam * attainableShare;
  return { tam: round(tam), sam: round(sam), som: round(som) };
}

function calculateMarketSizing(marketSizing = {}) {
  const scenarios = marketSizing.scenarios || {};
  const required = ['low', 'base', 'high'];
  for (const name of required) {
    if (!scenarios[name]) throw new Error(`marketSizing.scenarios.${name} is required.`);
  }
  const calculated = Object.fromEntries(required.map(name => [name, calculateMarketScenario(scenarios[name])]));
  const years = Number(marketSizing.forecastYear) - Number(marketSizing.baseYear);
  const cagr = clamp(marketSizing.cagr, -0.99, 10);
  for (const scenario of Object.values(calculated)) {
    scenario.forecastTam = round(scenario.tam * (1 + cagr) ** years);
  }
  return {
    method: marketSizing.method || 'bottom_up',
    baseYear: marketSizing.baseYear,
    forecastYear: marketSizing.forecastYear,
    cagr,
    scenarios: calculated,
    formula: 'TAM = eligible customers × annual spend; SAM = TAM × serviceable share; SOM = SAM × attainable share'
  };
}

function analyzeCompetitors(competitors = [], sources = []) {
  const dimensions = ['productBreadth', 'channelStrength', 'innovation', 'brandTrust', 'growthMomentum'];
  return competitors.map(competitor => {
    const score = dimensions.reduce((sum, dimension) => sum + clamp(competitor[dimension], 0, 10), 0) / dimensions.length;
    return {
      ...competitor,
      overallScore: round(score, 1),
      evidence: assessEvidence(competitor.sourceIds, sources)
    };
  }).sort((a, b) => b.overallScore - a.overallScore);
}

function analyzePainPoints(painPoints = [], sources = []) {
  return painPoints.map(point => {
    const severity = clamp(point.severity, 1, 5);
    const frequency = clamp(point.frequency, 1, 5);
    const evidence = assessEvidence(point.sourceIds, sources);
    const weightedScore = round((severity * 0.55 + frequency * 0.45) * 2, 1);
    return { ...point, severity, frequency, weightedScore, evidence };
  }).sort((a, b) => b.weightedScore - a.weightedScore);
}

function scoreOpportunity(opportunity, sources = []) {
  const evidence = assessEvidence(opportunity.sourceIds, sources);
  const dimensions = {
    demand: clamp(opportunity.dimensions?.demand, 0, 10),
    competitionGap: clamp(opportunity.dimensions?.competitionGap, 0, 10),
    evidence: evidence.score,
    feasibility: clamp(opportunity.dimensions?.feasibility, 0, 10),
    urgency: clamp(opportunity.dimensions?.urgency, 0, 10)
  };
  const rawScore = Object.entries(OPPORTUNITY_WEIGHTS)
    .reduce((sum, [key, weight]) => sum + dimensions[key] * weight, 0);
  const gateCap = { decision_ready: 10, directional: 6.9, hypothesis: 4.9 }[evidence.gate];
  const score = round(Math.min(rawScore, gateCap), 1);
  const priority = evidence.gate === 'decision_ready' && score >= 7.5
    ? 'high'
    : score >= 5
      ? 'medium'
      : 'low';
  return {
    ...opportunity,
    dimensions,
    rawScore: round(rawScore, 1),
    score,
    priority,
    evidence,
    recommendationStatus: evidence.gate === 'decision_ready' ? 'actionable' : 'validate_first'
  };
}

function buildAnalysis(input) {
  const market = calculateMarketSizing(input.marketSizing);
  const competitors = analyzeCompetitors(input.competitors, input.sources);
  const painPoints = analyzePainPoints(input.painPoints, input.sources);
  const opportunities = input.opportunities
    .map(opportunity => scoreOpportunity(opportunity, input.sources))
    .sort((a, b) => b.score - a.score);
  const topOpportunity = opportunities[0];
  return {
    meta: input.meta,
    decision: input.decision,
    generatedAt: new Date().toISOString(),
    market,
    competitors,
    painPoints,
    opportunities,
    sources: input.sources,
    executiveRecommendation: topOpportunity
      ? `${topOpportunity.recommendationStatus === 'actionable' ? '优先验证并推进' : '先补证据再决策'}“${topOpportunity.title}”：当前评分 ${topOpportunity.score}/10，证据门控为 ${topOpportunity.evidence.gate}。`
      : '当前没有足够的机会输入可形成建议。'
  };
}

module.exports = {
  SOURCE_WEIGHTS,
  OPPORTUNITY_WEIGHTS,
  calculateCagr,
  calculateMarketSizing,
  assessEvidence,
  scoreOpportunity,
  buildAnalysis,
  round
};

