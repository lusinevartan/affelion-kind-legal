# Stagecoach website: import into Lovable

This zip is the finished Stagecoach Concierge Emergency Medical Services website, packaged as a Lovable project. You do not need GitHub or any code to bring it into Lovable.

## Note for Lovable's AI

This project is complete and already builds and runs. Please keep it as it is.

- The whole website is the static pages in `public/`: `home.html`, `services.html`, `membership.html`, `kids.html`, `events.html`, `team.html`, `careers.html`, `partners.html`, `contact.html` and `404.html`, with their styles, script, photos and icons in `public/site-assets/`.
- The app code does one thing: the home route `/` sends visitors to `/home.html`, and unknown routes send them to `/404.html`, both with a full page load.
- Do not convert these pages to React components. Do not edit, move, rename or restyle anything in `public/`. Do not add a header, footer, layout, Tailwind or a database.

## How to import it

1. Sign in to Lovable and open your dashboard.
2. Click the **+** button in the prompt box and choose **Import project to Lovable**.
3. Under **Code & web**, choose **Upload code**.
4. Drop this zip file in, or click **Choose file**. When it says **Ready to import**, click **Start import**.
5. Lovable opens the new project and checks it in the chat. Wait until it says the migration is complete.
6. Paste this into the Lovable chat:

   > Keep this project exactly as imported. The website is the static pages in public/. Do not rewrite, convert or restyle them. Only confirm that / opens /home.html and that an unknown address opens /404.html.

7. Open the preview. The home page should appear with the opening animation. Click through the menu to check a few pages.
8. When it looks right, click **Publish**. To use the real domain, open the project's domain settings in Lovable and connect it there.

If **Import project to Lovable** is not in your **+** menu, Lovable has not turned the feature on for your account yet. Contact Lovable support, or ask your web designer for the other install route.

## Before launch

- **Waitlist form.** The sign-up form shows a friendly preview message until it is connected to a mailing list. When you choose a provider (for example Mailchimp, Kit or Klaviyo), give the form address it provides to whoever maintains the site. It goes in the `data-endpoint` attribute of the form on each page.
- **Domain.** Link previews and search tags use `https://stagecoachmedical.com`. If the site launches on another address, those need updating.
- **Photos and logos.** The current photos are placeholders until the professional shoot. Confirm you have permission to show each client logo.

## Making changes later

Small text changes can be made by asking Lovable's AI. Always add: "Edit the HTML in public/ directly and keep the existing styles." Without that, Lovable may try to rebuild a page in its own style.

Lovable uses credits for the import and for each change it makes.
