# The Affelion colour system

Single source of truth: `src/core/color/palette.ts`. Every visual and every sentence in the app uses
these ten entries and nothing else.

| Colour | Hex | Meaning | Measured state |
| --- | --- | --- | --- |
| Deep red | `#C8322B` | High activation | Fast pulse, low beat-to-beat variability |
| Bright orange | `#F0781E` | Vitality and intensity | Elevated pulse with reasonable variability |
| Golden yellow | `#F2C230` | Mental clarity | Moderately raised pulse with good variability, or a bright, well-articulated voice |
| Lime green | `#9BD53A` | Growth | Variability trending up with a steady mid-range pulse |
| Teal | `#1FB5A3` | High coherence | High variability with a calm pulse |
| Sky blue | `#4FA8E8` | Calm ease | Low, steady pulse with healthy variability |
| Indigo | `#4A4BC0` | Deep rest | Very low pulse |
| Violet | `#8E5BD6` | Quiet insight | Low pulse with a soft, low-variance voice |
| Soft white | `#F3EFE6` | Strong coherence | Unusually high variability for the pulse rate, steady voice |
| Muted earth | `#8C6F55` | Low energy | Low pulse, low variability, quiet flat voice |

## Mapping rules (from the brief)

- High BPM or low HRV → reds/oranges with higher turbulence.
- High HRV + calm BPM → greens/teals with smooth motion.
- Low BPM → blues/indigos.
- Vocal variance raises saturation and can add bright accents (golden yellow; soft white when the voice is steady and coherence is high; violet when the pulse is low and the voice is quiet).

## Regions

Every portrait has a **core** (dominant colour, driven by heart rate), a **halo** (secondary colour,
driven by HRV) and optionally an **accent** (driven by the voice). Each region carries a sentence that
quotes the user's numbers. See `docs/renders/` for reference portraits of five presets.

## Honesty rules

`src/core/color/explain.ts` holds the banned-phrase list (energy fields, chakras, psychic, predict,
destiny, diagnose, and so on). Generated copy asserts against it in tests; AI replies are filtered
through `sanitiseGuideReply` and replaced with a grounded fallback if they cross the line.
