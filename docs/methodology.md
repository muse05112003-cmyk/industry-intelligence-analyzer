# Methodology

## Objective

The analyzer supports a commercial decision, not a broad knowledge dump. Each run begins with an audience, decision, market boundary and time horizon.

## Analytical layers

1. **Evidence layer** — source identity, type, status, as-of date and independence.
2. **Sizing layer** — low/base/high TAM, SAM and SOM from inspectable assumptions.
3. **Market layer** — competitors and pain points at consistent comparison grains.
4. **Decision layer** — opportunity attractiveness plus evidence gating.
5. **Delivery layer** — answer-first report, evidence ledger, machine-readable analysis and validation.

## Evidence scoring

Source type establishes a base weight. Verification status applies a factor. The evidence score combines:

- coverage: 40%;
- source quality: 35%;
- source independence: 25%.

Two sources in the same `independenceGroup` do not satisfy independent cross-validation.

## Opportunity scoring

```text
raw score = demand × 30%
          + competition gap × 25%
          + evidence × 20%
          + feasibility × 15%
          + urgency × 10%
```

The final score is the lower of the raw score and the evidence-gate cap. This makes uncertainty operational: it changes prioritization rather than appearing only in a footnote.

## Market sizing

The built-in model uses a bottom-up chain:

```text
TAM = eligible customers × annual spend
SAM = TAM × serviceable share
SOM = SAM × attainable share
forecast TAM = current TAM × (1 + CAGR) ^ years
```

Low, base and high cases are scenario boundaries, not probability forecasts. A real study should document the source or rationale for each input and run sensitivity checks on the inputs that move the answer most.

## Interpretation rules

- A pain point score measures severity and recurrence, not willingness to pay.
- A competitor score compresses selected dimensions for comparison, not company value.
- Correlation and co-occurrence do not establish causality.
- Marketplace and social signals can identify hypotheses; they do not define the whole market.
- A recommendation is actionable only after the evidence gate passes.

## Quality states

- `ready_to_share`: no material validation issue.
- `share_with_caveats`: directionally usable; caveats must stay visible.
- `needs_revision`: broken references, material methodology errors or evidence-gate failures block sharing.

