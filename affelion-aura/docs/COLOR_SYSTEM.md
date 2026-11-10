# The Affelion Aura colour knowledge base

Single source of truth: `src/core/color/knowledgeBase.ts`, which holds the specification's twenty
entries verbatim (id, name, hue range, primary meaning, biometric condition, explanation). Every
visual, tappable explanation, summary and AI response uses only this text. `SWATCH_HSL` in the same
file supplies presentation colours for legends; the portrait itself is coloured by the mapping output.

## Mapping rules (as specified)

Inputs: `bpm`, `hrv` (ms, RMSSD), `vocalPitchHz`, `vocalVariance` (0–1), `vocalStability` (0–1).

| Order | Condition | Family | Hue | Motion |
| --- | --- | --- | --- | --- |
| 1 | hrv ≥ 55 and bpm ≤ 78 | greens / teals | 140–190 | low turbulence |
| 2 | bpm ≥ 92 or hrv ≤ 28 | reds / oranges | 0–40 (crimson 345–360) | higher turbulence, pulse speed × 1.15 |
| 3 | bpm ≤ 62 | blues / indigos | 200–270 | low turbulence |
| 4 | otherwise | sky blue | 195–215 | moderate |

`vocalVariance` raises saturation (+0.32 × variance) and, at 0.6 or above, triggers a brighter
accent (the primary colour lifted in lightness). `vocalStability` sets lightness (0.40 + 0.22 ×
stability). Rules are evaluated in order; the first that matches wins.

## Shade refinement (secondary signals, quoting each entry's biometric description)

| Family | Shade | Rule |
| --- | --- | --- |
| greens/teals | aqua | hue ≥ 175 and an open, steady voice (stability ≥ 0.6, variance ≥ 0.3) |
| greens/teals | teal | hue ≥ 155 |
| greens/teals | emerald | otherwise |
| reds/oranges | crimson | bpm ≥ 92 and vocalVariance ≥ 0.5 and intensity ≥ 0.35 |
| reds/oranges | deep red | hue ≤ 15 (strongest intensity) |
| reds/oranges | amber | hue ≥ 34 and vocalVariance ≥ 0.4 without high bpm |
| reds/oranges | bright orange | otherwise |
| blues/indigos | violet | hue ≥ 255 and vocalStability ≥ 0.7 |
| blues/indigos | lavender | hue ≥ 255 and vocalVariance ≤ 0.25 |
| blues/indigos | indigo | hue ≥ 230 |
| blues/indigos | cobalt | hue ≥ 210 and vocalStability ≥ 0.6 |
| blues/indigos | sky blue | otherwise |

Achromatic entries (no hue range) are selected after the family rule from their biometric
descriptions, with precedence charcoal → muted gray → earth brown → soft white → pearl, and are
expressed through saturation and lightness. Low-energy tones never override the greens/teals family.
Thresholds live in `selectAchromatic()` in `src/core/color/mapping.ts`.

## Entries the rules do not reach

As specified, the four family rules never produce hues in 48–65 (golden yellow), 75–110 (lime),
300–330 (magenta), or 270–290 beyond its 270 boundary (lavender is reached at exactly 270). Those
entries remain in the knowledge base for legends and the guide but cannot be a portrait's primary
colour until the rules say when they apply.

## Honesty rules

`src/core/color/explain.ts` holds the banned-phrase list (energy fields, invisible light, chakras,
psychic, predict, destiny, diagnose, and so on). Generated copy asserts against it in tests; AI
replies are filtered through `sanitiseGuideReply` and replaced with a grounded fallback if they
cross the line.
