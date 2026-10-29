# Stagecoach imagery: what the site needs

The site is built so photos can be swapped without touching layout. Until the real shoot, it uses the client's existing photos. The list below is the shot list for the real shoot, and it doubles as the Higgsfield prompt list if they want placeholders first.

## The feeling

Five-star hotel, not hospital. Warm window light, calm faces, clean hands, good tailoring. Clinicians dressed for the room: dark navy, no logos bigger than a lapel pin. Equipment is present but never the subject. No sirens, no stretchers, no blood, no fear. People look cared for, not rescued.

Colour grade: warm, soft contrast, cream highlights. Navy and warm neutrals in wardrobe and rooms. A little coral or peach somewhere in frame (a flower, a book, a blanket) ties into the brand.

## Shot list (in order of importance)

| # | Where it goes | The shot | Format |
|---|---|---|---|
| 1 | Home hero | The black Suburban on a Georgetown street at golden hour, no signage. Already supplied; may need the sign removed. | 21:9 and 9:16 |
| 2 | Membership hero, Services | A clinician in a navy blazer taking a blood pressure reading in a bright living room. Patient relaxed on a sofa, coffee on the table. | 4:5 |
| 3 | Stagecoach Kids | A clinician kneeling at a child's bedside at night, soft lamp light, parent in the doorway, child calm. | 4:5 |
| 4 | Events | A clinician standing quietly at the edge of a gala ballroom, chandeliers, guests out of focus. | 16:9 |
| 5 | Executive | A clinician and an executive in a hotel suite or corner office, morning light, a leather bag open on the desk. | 4:5 |
| 6 | Private care | A home lab draw at a kitchen island, close on gloved hands and a cuff, warm wood. | 4:5 |
| 7 | Dental | Dr. Charles White with a patient in a calm home setting, mobile dental kit. | 4:5 |
| 8 | Team / About | The founders together on K Street steps, overcoat weather, relaxed. | 16:9 |
| 9 | Partners | A quiet meeting: clinician with a hotel manager at a front desk, or with an embassy security lead. | 16:9 |
| 10 | Contact / footer | The 24/7 line being answered: a clinician with a headset in a calm, dark operations room, one screen glow. | 4:5 |

Portraits: all ten team members, same setup. Window light from the left, neutral warm background, navy clothing, chest-up, 4:5, eyes to camera, slight smile. Shot at the same session so they match.

## If generating placeholders with Higgsfield

Use the prompt structure from the hero brief. For each shot above, start with:

> Photorealistic editorial photograph, warm window light, Washington, DC. [the shot]. Clinician in a tailored navy blazer, no visible logos, calm expression. Five-star hospitality mood, discreet, high end. Shot on 50mm at f/2, shallow depth of field, natural light.

Negative prompt: text, lettering, logos, sirens, stretchers, blood, hospital corridors, scrubs, masks, fear, crowds, plastic skin, oversaturated, HDR, watermark.

Never generate images of the real team members. Use real photos for people.

## Swapping images in

Images live in `src/build.py` under `IMG` (shared photos) and `TEAM` (portraits). Replace the URL, run `python3 src/build.py`, and every page updates.
