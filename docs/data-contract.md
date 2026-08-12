# Data contract

The CLI accepts UTF-8 JSON. Use `examples/synthetic-demo/input.json` as the canonical example.

## Top-level fields

| Field | Type | Purpose |
|---|---|---|
| `meta` | object | Title, scope, as-of date, currency and synthetic-data flag |
| `decision` | object | Question, audience and horizon |
| `marketSizing` | object | Method, years, CAGR and three scenarios |
| `sources` | array | Evidence ledger |
| `competitors` | array | Comparable competitor observations |
| `painPoints` | array | Customer problems with severity/frequency |
| `opportunities` | array | Testable opportunities and commercial scores |

## Source

Required fields: `id`, `title`, `type`, `status`. Add `url` or `locator`, `asOf`, `independenceGroup` and `note` for auditability.

Supported statuses: `verified`, `reviewed`, `pending`, `failed`.

Supported source types include `government`, `regulator`, `filing`, `association`, `official`, `research`, `reputable_media`, `marketplace`, `community`, `review`, and `assumption`.

## Market scenario

Each of `low`, `base` and `high` requires:

- `eligibleCustomers` > 0;
- `annualSpend` > 0;
- `serviceableShare` from 0 to 1;
- `attainableShare` from 0 to 1.

## Evidence references

Every competitor, pain point and opportunity contains `sourceIds`. Missing IDs are material validation errors. Reuse the same ID when the same source supports multiple items.

## Opportunity dimensions

`demand`, `competitionGap`, `feasibility` and `urgency` use a 0–10 scale. Evidence is calculated by the engine and must not be manually supplied.

