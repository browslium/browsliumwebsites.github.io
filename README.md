# Browslium international website

Static public website for `browslium.com`, written as seven independent language editions: English, Español, Русский, ייִדיש, עברית, Português (Brasil) and Français.

The published root contains generated HTML for every locale and the source in `src/`. Browser language detection only suggests an edition; every localized URL renders complete HTML without JavaScript. The locale switcher saves an explicit preference in local storage.

## Rebuild

Run `npm run build`, then `npm run qa`. No npm dependencies are required. The generator writes `dist/`, which can be published at the repository root on GitHub Pages. It includes `CNAME`, `.nojekyll`, `robots.txt` and `sitemap.xml`.

## Editorial accuracy

Image policies 1–7 and video policies 1–6 follow the project owner's policy document. They describe planned filtering behavior; the website does not claim that all levels are live. The Platforms section summarizes verified development status. Review it against the product before changing availability claims. The informational website's Privacy Policy and Terms do not replace a future product privacy notice or service agreement.

The Stripe button links to a one-time voluntary contribution page. Do not add a recurring option or tax-deductibility claim without verification.
