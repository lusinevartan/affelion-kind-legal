# Stagecoach website

This is the public website of Stagecoach Concierge Emergency Medical Services, a doctor-led
mobile emergency medicine practice in Washington, DC. It is a finished, hand-built static site
that lives inside a small Lovable (TanStack Start) shell. Treat it as a published product: make
the change that was asked for, keep everything else exactly as it is.

## Where things are

- `public/home.html` is the home page. Lovable's `/` route redirects to it.
- `public/services.html`, `membership.html`, `kids.html`, `events.html`, `team.html`,
  `careers.html`, `partners.html`, `contact.html`, `404.html` are the other pages.
- `public/site-assets/site.css` and `site.js` are the shared styles and behaviour.
- `public/site-assets/photos/`, `team/`, `clients/` hold the images. `og.jpg` is the link preview.
- `src/` is only the shell (redirect `/` to `/home.html`, unknown routes to `/404.html`). Leave it.
- `docs/` has plain-language guides and ready-made prompts for the team.

There is no build step for the pages. Edit the HTML directly and the preview updates.

## How to make changes

- Copy changes: edit the text in the HTML. Keep the surrounding tags and classes.
- Header, footer or navigation: the same markup is repeated in every page. Make the identical
  change in all ten HTML files, then check them with `grep`.
- New section: copy an existing section of the same kind from the same page and change its text.
  Do not invent new layouts or styles; everything needed already exists in `site.css`.
- New team member: copy a `<figure>` in `team.html`, add a square JPG to `site-assets/team/`
  (about 800×800, under 150 KB), update name, credentials and role, alt text included.
- Photos: drop the new file in `site-assets/photos/` and change the `src`. Compress first.
- Do not convert pages to React, add Tailwind, a database, a CMS, or restructure the folders.
- Do not touch `site.js` or the animation classes (`rise`, `split`, `hero`, `how`) unless asked.

## Writing rules

- Plain English, short sentences, warm and direct. No marketing filler, no exclamation marks.
- Headings are Title Case, as the existing ones are.
- The last two words of every heading, paragraph and caption are joined with `&nbsp;` so no line
  ends on a single word. Keep that when you edit text.
- Never add a statistic, response time, success rate or claim that was not supplied in writing.
- Never describe the service as a replacement for 911.
- Keep these two footer lines on every page, word for word:
  "Not a substitute for 911. In a life-threatening emergency, call 911."
  "Stagecoach Concierge EMS PC is pending EMS Agency approval by the District of Columbia."
  (The second line changes only when the team confirms approval in writing.)
- Phone is 202.839.9439 (`tel:+12028399439`). Email is medical@thestagecoachgroup.com.

## Brand rules

- Typeface is Montserrat only. No italics anywhere.
- Colours live as CSS variables at the top of `site.css`: navy `#1E2A3E`, night `#10192B`,
  coral `#E37970`, peach `#DC8E73`, cream `--porcelain` `#F4F1E9`, coral ink `#A9473B`. Use the variables.
- Buttons: `.btn.btn-light` (coral) is only for "Join the Waitlist". Other actions use
  `.btn-dark`, `.btn-paper` or `.btn-outline`. Do not add new button styles.
- The lockup is always "STAGECOACH" over "CONCIERGE EMERGENCY MEDICAL SERVICES".
- No AI-generated images of doctors or patients. Photos are real or clearly stock.

## Before you finish

- Open the changed page in the preview at phone width and desktop width.
- Check nothing overflows horizontally and no text is cut off.
- If you changed the header, footer or nav, confirm all ten pages match.
- Say exactly what you changed and in which files.
