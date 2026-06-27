# Haven Desk GitHub Pages site

This folder is the static early-access marketing site for Haven Desk.

## Current repo URL note

If this repo publishes GitHub Pages from `omerakben/swiss-knife`, the default project URL is:

```text
https://omerakben.github.io/swiss-knife/
```

To use:

```text
https://omerakben.github.io/haven-desk/
```

publish the same `site/` folder from a repo named `haven-desk`, or from the `omerakben.github.io` user-site repo under a `/haven-desk/` directory.

The site uses relative links, so either path works after deployment.

## One-line installer URLs

The Quick Start card currently uses the `swiss-knife` project Pages path:

```bash
curl -fsSL https://omerakben.github.io/swiss-knife/install.sh | bash
```

```powershell
irm https://omerakben.github.io/swiss-knife/install.ps1 | iex
```

Those URLs are correct only after publishing this `site/` folder from `omerakben/swiss-knife`.
If Haven Desk moves to its own repo or a `/haven-desk/` user-site path, update the commands in
`index.html` before publishing.

## Before publishing

Update `CONTACT_EMAIL` in `site/app.js` or replace the form handler with a Google Form, Tally, Airtable, or other approved application destination.

The page intentionally uses "Apply for early access" instead of "Download now." The one-line
installer is present for approved pilots, but the public CTA should stay gated until installer
support and intake routing are ready.
