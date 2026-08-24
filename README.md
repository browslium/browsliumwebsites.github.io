# Browslium website — Android + Apple + Windows proxy architecture (v6)

Static public website for `https://browslium.com`, prepared for GitHub Pages.

## Public pages

- `index.html` — product page for individuals, families, businesses, schools, nonprofits, religious and community organizations, and other authorized customers
- `privacy.html` — Privacy Policy
- `terms.html` — Terms of Service
- `support.html` — support contacts and request form
- `404.html` — page-not-found fallback
- `privacy/index.html` — clean privacy route redirect (`/privacy`)
- `support/index.html` — clean support route redirect (`/support`)
- `terms/index.html` — clean terms route redirect (`/terms`)

## Version 6 changes

Version 6 updates the public contact to `admin@browslium.com`, makes email the only public support channel, confirms that requests are received 24/7 with normal review Monday through Friday from 9:00 a.m. to 6:00 p.m. America/Mexico_City, removes pilot and waitlist language, changes worldwide claims to selected-region availability, and includes individuals, families, businesses, schools, nonprofits, religious and community organizations, and other authorized customers.

The Windows disclosure now describes the approved extension-free core architecture: a Windows local agent and service, Windows Filtering Platform enforcement, a transparent local HTTPS proxy, a managed certificate authority, and pre-delivery content controls. It removes Chrome Web Store, Microsoft Edge Add-ons, Mozilla Add-ons, browser-extension identifiers, and browser-store Limited Use language.

Some platform capabilities described publicly remain under development. Keep the website synchronized with the actual applications, production driver-signing status, platform approvals, retention settings, regional availability, and customer contracts before publication or material product changes.

## Publishing

Upload every file and folder in this directory to the repository root. Keep the `assets` folder intact. The `CNAME` file preserves the custom domain `browslium.com` and `.nojekyll` tells GitHub Pages to serve the site as plain static files.

In GitHub, configure **Settings → Pages → Deploy from a branch → main → /(root)**. Do not upload secrets, certificates, API keys, enrollment tokens, private configuration profiles, or service-account files.

## Typography and privacy

The site self-hosts the provided Inter Display font. Titles use weight 900 and body copy uses weight 400. No Google Fonts, advertising trackers, third-party analytics, or remote form processor is included. The support form prepares an email to `admin@browslium.com` in the visitor's local email application. No public telephone number or street address is published.

After publishing, verify all of these public addresses:

- `https://browslium.com/`
- `https://browslium.com/privacy`
- `https://browslium.com/privacy.html`
- `https://browslium.com/support`
- `https://browslium.com/support.html`
- `https://browslium.com/terms`
- `https://browslium.com/terms.html`
