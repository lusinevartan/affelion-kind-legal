# Stagecoach site for Lovable

This package is the finished Stagecoach Concierge Emergency Medical Services site, ready to run inside a Lovable project.

## What is in here

- `public/` holds the whole site as static pages. The home page is `home.html`. Styles, script, photos, logos and icons are in `public/site-assets/`.
- `LOVABLE_PROMPT.md` holds the one request to paste into Lovable's chat.
- This README.

The pages are served exactly as designed. Lovable's job is only to send visitors from `/` to the home page.

## Why it is packaged this way

Lovable cannot import a zip file or an existing GitHub repository. It does sync code that you push to the GitHub repository Lovable creates for a project. Older Lovable projects are React and Vite; projects created since May 2026 use TanStack Start. Both serve the `public/` folder as plain files, so this package works in either one without converting the site to React.

## Steps

Use a new Lovable project, so the client's current Lovable site is untouched.

1. In Lovable, create a new project. Any starting prompt works, for example "Blank site".
2. Open the project's GitHub settings and connect GitHub. Lovable creates a new repository.
3. Copy this package's `public/` folder into that repository's `public/` folder, replacing any `favicon` or `placeholder` files with the same names. Push to the `main` branch. You can do this on github.com with "Add file", then "Upload files", by dragging the contents of `public/` in.
4. Wait for the commit to appear in Lovable, then paste the request from `LOVABLE_PROMPT.md` into Lovable's chat.
5. Open the preview. `/` should show the home page, and every page, link and image should work.
6. Publish from Lovable and connect the custom domain there.

## If you would rather make the routing change yourself

**React and Vite projects** (they have `src/App.tsx` with `<Routes>`). Add this component and two routes:

```tsx
import { useEffect } from "react";

const GoTo = ({ to }: { to: string }) => {
  useEffect(() => { window.location.replace(to); }, [to]);
  return null;
};

// inside <Routes>, replacing the existing "/" and "*" routes:
<Route path="/" element={<GoTo to="/home.html" />} />
<Route path="*" element={<GoTo to="/404.html" />} />
```

**TanStack Start projects** (they have `src/routes/index.tsx`). Replace that file with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: GoHome });

function GoHome() {
  useEffect(() => { window.location.replace("/home.html"); }, []);
  return null;
}
```

Then, in `src/routes/__root.tsx`, add this component and pass it to `createRootRoute` as `notFoundComponent: GoNotFound`:

```tsx
import { useEffect } from "react";

function GoNotFound() {
  useEffect(() => { window.location.replace("/404.html"); }, []);
  return null;
}
```

Both versions were tested: a React, Vite and React Router app, and a blank TanStack Start app. In each, `/` opens the home page, an unknown address opens the 404 page, and all ten pages load with no errors in development and production builds.

## Things to set before launch

- **Waitlist form.** It shows a friendly preview message until it is connected. Put the mailing-list provider's form address in the `data-endpoint` attribute of `<form id="join-form">` on each page that has the form. The form sends `{ "email": "..." }` as JSON.
- **Domain.** Link previews and canonical tags point to `https://stagecoachmedical.com`. If the site launches elsewhere, search the pages for that address and replace it.

## Editing later

The design source lives in the original repository: `stagecoach/src/build.py` and `stagecoach/src/home.html` generate every page, and `python3 src/export_lovable.py` rebuilds this package. Small text edits can also be made straight in the `.html` files in `public/`, in Lovable or on GitHub. If you ask Lovable's AI to change these pages, tell it to edit the HTML in `public/` and keep the existing styles.
