---
name: industry-intelligence-analyzer
description: Build evidence-gated industry, brand, website, or topic research into an auditable decision report with market sizing, competition, customer pain points, opportunity prioritization, source traceability, validation, and a 90-day action plan. Use when the user asks for industry analysis, market entry, competitor research, opportunity discovery, an industry OS, or a decision-ready commercial research report.
---

# Industry Intelligence Analyzer

Turn broad research into a decision-ready, reproducible analysis. Keep facts, assumptions, interpretations, and recommendations separate throughout.

## 1. Start from the decision

Record:

- the decision and audience;
- market boundary, geography, segment and time horizon;
- included and excluded categories;
- the action that could follow the analysis.

If the input is self-contained, proceed. Ask only when a missing choice would materially change the market boundary or recommendation.

## 2. Select mode and depth

Modes:

- `industry`: full market, value chain, competitors, customers and opportunities;
- `brand`: one focal brand plus a relevant comparison set;
- `website`: site positioning, conversion, content and competitive gaps;
- `topic`: concept boundary, ecosystem, adoption barriers and opportunities.

Depth:

- `quick`: directional scan and validation priorities;
- `standard`: decision report with full evidence ledger;
- `deep`: additional value-chain, content ecosystem and monitoring design.

Read `references/research-playbook/modes.md` when mode boundaries are ambiguous. Match a reusable industry skeleton from `assets/skeletons/`; use `_generic.md` when none fits.

## 3. Build the evidence ledger first

For each source record:

- stable source ID;
- title and type;
- URL or traceable locator;
- data as-of date;
- verification status;
- independence group;
- what claim or input it supports.

Prefer government, regulatory, filings, industry associations, official first-party data and reputable research. Treat marketplace, community and review data as useful behavioral signals, not universal facts.

Do not count two pages that repeat the same underlying report as independent evidence. Preserve conflicts and explain which source controls the conclusion.

If browsing is part of the task, use `references/research-playbook/google-search-tactics.md` as a query pattern library, then verify every selected URL and source identity before citing it.

## 4. Build the analysis

For market sizing:

1. define the unit and market boundary;
2. choose bottom-up, top-down or value-based sizing;
3. separate sourced facts from assumptions;
4. calculate low, base and high scenarios;
5. identify the assumptions with the largest sensitivity;
6. state what would most improve confidence.

For commercial analysis:

- compare competitors at one consistent grain;
- distinguish scale, momentum, concentration, differentiation and addressability;
- rank pain points by severity and frequency, but do not equate complaints with willingness to pay;
- make each opportunity specific enough to test with an MVP;
- attach source IDs to every material claim.

## 5. Enforce evidence gating

Use the repository engine when the input follows `docs/data-contract.md`:

```bash
node src/process_industry.js <input.json> --out <output-directory>
```

The opportunity score uses demand, competition gap, evidence, feasibility and urgency. Apply these caps:

- `decision_ready`: at least two independent, sufficiently strong sources; no cap below 10;
- `directional`: at least one verified or reviewed source; cap at 6.9;
- `hypothesis`: no reliable source; cap at 4.9.

Never label a high-attractiveness hypothesis as high priority when it fails the evidence gate. Recommend the next validation action instead.

## 6. Deliver an answer-first report

Required reader-facing sections:

1. executive answer and recommendation;
2. decision and market boundary;
3. market size and scenario sensitivity;
4. competitive landscape;
5. customer pain points;
6. ranked opportunities with evidence status;
7. 90-day validation plan;
8. caveats, sources and validation result.

Generate the repository outputs rather than manually copying calculations. Keep exact source metadata in the evidence ledger and use concise source IDs in the main narrative.

## 7. Validate before sharing

Run:

```bash
npm run check
```

Confirm:

- every source ID resolves;
- as-of dates, units, currency and market boundaries are visible;
- TAM/SAM/SOM formulas recompute from inputs;
- categories and comparison grains are consistent;
- weak evidence cannot bypass the score cap;
- charts and tables match the underlying `analysis.json`;
- synthetic or confidential data is labeled correctly;
- the final HTML renders on desktop and mobile and remains printable.

If validation returns `needs_revision`, fix material issues before presenting recommendations. If it returns `share_with_caveats`, keep the caveats adjacent to the affected claims.

## 8. Close with reflection

Use `references/research-playbook/reflection-prompts.md` to identify missing sources, alternative explanations and the cheapest next validation. State what evidence would change the recommendation.

