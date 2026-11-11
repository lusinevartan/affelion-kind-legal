# The Affelion Aura colour knowledge base

Single source of truth: `src/core/color/knowledgeBase.ts`, which holds the specification's twenty
entries verbatim (id, name, hue range, primary meaning, biometric condition, explanation). Every
visual, tappable explanation, summary and AI response uses only this text. `SWATCH_HSL` in the same
file supplies presentation colours for legends; the portrait itself is coloured by the mapping output.

## Mapping rules (as specified)

Inputs: `bpm`, `hrv` (ms, RMSSD), `vocalPitchHz`, `vocalVariance` (0–1), `vocalStability` (0–1),
and an optional `recovery` (0–1, measured inside the reading; see below).

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

Two shades carry bounds that give them the character their names promise, so they can be told
apart from their neighbours: deep red is held to the red end of its range (hue 0–8), kept dark
(lightness at most 0.44) and paired with a crimson halo; lavender is pale (lightness at least
0.68, saturation at most 0.46). Vocal stability still sets lightness inside those bounds.

Achromatic entries (no hue range) are selected after the family rule from their biometric
descriptions, with precedence charcoal → muted gray → earth brown → soft white → pearl, and are
expressed through saturation and lightness. Low-energy tones never override the greens/teals family.
Thresholds live in `selectAchromatic()` in `src/core/color/mapping.ts`.

## The three colours outside the family ranges

Golden yellow (48–65), lime green (75–110) and magenta (300–330) have hues that none of the four
family ranges contain. So that every entry in the knowledge base can appear, each is selected by
its own stated biometric description. They apply only inside the "otherwise" band, plus, for
lime, the mild edge of reds/oranges. The family rule that matched is still what is reported.

| Shade | Knowledge-base description | Rule | Halo |
| --- | --- | --- | --- |
| lime green | improving HRV or recovering from activation | recovery ≥ 0.35 in the otherwise band, or in reds/oranges with intensity < 0.35 | emerald |
| magenta | mixed activation with expressive voice | bpm 79–91 with hrv ≥ 55 (pulse and variability disagree) and vocalVariance ≥ 0.5 | violet |
| golden yellow | balanced-to-active state + vocal variance | bpm ≥ 70 in the otherwise band and vocalVariance ≥ 0.55 | amber |

Precedence where more than one applies: lime, magenta, golden yellow. Magenta and golden yellow
need a usable voice sample. Achromatic tones still take precedence over all three.

**Recovery** is measured inside the reading (`recoveryOf` in `src/core/signal/ppg.ts`): the first
half of the accepted beat intervals is compared with the second. It is zero unless the direction
is unambiguous, meaning the pulse fell by at least 3 bpm without variability falling, or
variability rose by at least a fifth without the pulse rising. The score is then half the pulse
drop (over 8 bpm) plus half the variability gain (over 60%). A practice session's "after"
portrait uses the same score across the session (`recoveryFromChange`). Readings saved before
recovery was measured have none and map exactly as they did.

A test (`__tests__/mapping.test.ts`) fails if any of the twenty entries stops being reachable.
Lime, emerald and earth brown are also used as display colours for the personal HRV trend
(`src/core/insight/baseline.ts`).

## Honesty rules

`src/core/color/explain.ts` holds the banned-phrase list (energy fields, invisible light, chakras,
psychic, predict, destiny, diagnose, and so on). Generated copy asserts against it in tests; AI
replies are filtered through `sanitiseGuideReply` and replaced with a grounded fallback if they
cross the line.
