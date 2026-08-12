# Public release checklist

## Code

- [ ] `npm run check` passes.
- [ ] `npm audit --omit=dev` reports zero known vulnerabilities.
- [ ] CLI help and demo commands match the README.
- [ ] CI runs on push and pull request.

## Data and evidence

- [ ] Public examples are synthetic, licensed, or explicitly authorized.
- [ ] Personal information, credentials, internal hostnames and identifiers are absent.
- [ ] Every material claim has a resolvable source ID.
- [ ] Real-data reports show as-of date, units, currency and scope.
- [ ] Source licensing and quotation limits are respected.

## Narrative

- [ ] README leads with the problem, differentiation and demo.
- [ ] Claims describe implemented behavior, not hypothetical impact.
- [ ] Limitations and future extensions are explicit.
- [ ] Product claims describe implemented and validated behavior.

## Visual QA

- [ ] HTML works from a local file without network access.
- [ ] Desktop and mobile layouts have no clipping or unreadable labels.
- [ ] Print preview remains legible.
- [ ] Chart values reconcile to `analysis.json`.

## Skill

- [ ] `SKILL.md` frontmatter contains only `name` and `description`.
- [ ] Referenced assets and playbooks exist.
- [ ] Skill validator passes.
