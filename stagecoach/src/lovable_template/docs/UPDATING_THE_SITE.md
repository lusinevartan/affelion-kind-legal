# Updating the Stagecoach website with Claude

The site is finished and lives in your Lovable project. You can keep it current yourselves,
using Claude, without a developer. This guide is the one-time setup and the everyday routine.

## One-time setup (about 15 minutes)

1. **Connect the Lovable project to GitHub.** In Lovable, open the project, click the GitHub
   button in the top bar and follow the prompts. Use a GitHub account the practice owns. Lovable
   creates the repository and keeps it in sync both ways: anything you change in Lovable goes
   to GitHub, anything pushed to GitHub shows up in Lovable within a minute. Do not rename,
   move or delete the repository afterwards; that breaks the sync.
2. **Add the Claude files to the repository.** In GitHub, open the repository, click
   **Add file → Upload files**, and drag in `CLAUDE.md` and the `docs` folder from this handoff.
   Commit to the main branch. (If the files are already there, skip this.)
3. **Connect Claude to GitHub.** Go to claude.ai/code, sign in with your Claude account and
   connect GitHub when it asks. Choose the Stagecoach repository. Claude will now read
   `CLAUDE.md` automatically at the start of every session, so it knows the brand rules, the
   legal lines and where everything lives.

That is all. The `src` folder and settings in the project never need to change.

## Everyday routine

1. Open claude.ai/code, pick the Stagecoach repository and describe the change in plain words.
   `docs/PROMPTS.md` has copy-and-paste examples.
2. Claude makes the change, checks the page at phone and desktop widths and tells you what it
   did. If it asks a question, answer it.
3. When Claude says it has pushed, open Lovable. The preview updates on its own. Look at the page.
4. Click **Publish** in Lovable. The live site updates.

If you would rather stay inside Lovable, you can describe the change in Lovable's own chat.
Always add: "Edit the HTML in public/ directly and keep the existing styles." Lovable uses
credits for each change; Claude does not.

## Things only a person should decide

- Any new number, statistic or outcome claim on the site. Claude is told to refuse these
  unless they are supplied in writing.
- Removing the "pending approval by the District of Columbia" line. Do this only when the
  approval is in hand.
- Changing the domain. Link previews and search tags point at stagecoachmedical.com.
- The waitlist form. It shows a preview message until it is connected to your mailing list
  provider. When you have the form address from the provider, ask Claude to set it as the
  `data-endpoint` on the form on every page.

## If something looks wrong

Ask Claude: "Compare the current page with the last commit and undo anything that changed the
layout." Every change is a commit in GitHub, so nothing is ever lost. In Lovable you can also
open the project history and restore an earlier version.
