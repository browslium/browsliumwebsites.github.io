# Browslium international website

Static public website for `browslium.com`, written as seven independent language editions: English, Español, Русский, ייִדיש, עברית, Português (Brasil) and Français. Each edition has a homepage, image and video explainers, Privacy, Terms and Support.

The published root contains generated HTML for every locale and the source in `src/`. Browser language detection only suggests an edition; every localized URL renders complete HTML without JavaScript. The locale switcher saves an explicit preference in local storage.

## Rebuild

Run `npm run build`, then `npm run qa`. No npm dependencies are required. The generator writes `dist/`, which can be published at the repository root on GitHub Pages. It includes `CNAME`, `.nojekyll`, `robots.txt` and `sitemap.xml`.

## Editorial accuracy

Image policies 1–7 and video policies 1–6 follow the project owner's policy document. They describe planned filtering behavior; the website does not claim that all levels are live. The Platforms section summarizes verified development status. Review it against the product before changing availability claims. The informational website's Privacy Policy and Terms do not replace a future product privacy notice or service agreement.

The Stripe button links to a one-time voluntary contribution page. Do not add a recurring option or tax-deductibility claim without verification.

The two short, silent video clips on each video explainer are optimized copies of project test footage provided by the owner. They are labelled as controlled tests and use `preload="none"` so the homepage remains light. They are not evidence of general production availability.

## Search intent and international SEO

The site follows the useful parts of *How to Get to the Top of Google* (2025 Kindle edition): one coherent domain, clear page hierarchy, search-intent-specific content, descriptive titles and headings, natural internal links, mobile-readable design, useful FAQs, lightweight media, and crawlable HTML. The book's predictions about algorithms and ranking factors are not treated as verified facts. No reviews, case studies or performance figures have been invented.

Each language has a homepage plus separate image and video explainers. The research was conducted separately in Chrome search results for each locale. Broad terms observed include `content filtering` / `internet filter` (English), `filtro de contenido` / `filtrado de imágenes` (Spanish), `фильтрация контента` / `фильтр нежелательного контента` (Russian), `סינון תוכן` / `סינון תמונות` (Hebrew), `אינטערנעט פילטער` (Yiddish), `filtro de conteúdo` / `filtro de vídeos` (Brazilian Portuguese), and `filtrage de contenu` / `filtrage des images` (French). Yiddish search results are sparse; wording was kept idiomatic and avoids treating Hebrew results as Yiddish evidence. “Image filter” searches also return photo-editing tools in several languages, so page copy explicitly explains the content-protection purpose.

Every edition has its own self-canonical, reciprocal `hreflang`, localized metadata and structured WebPage data. The sitemap lists all 43 URLs. The JavaScript language prompt does not redirect or gate crawlers. Homepage FAQs are visible in HTML; no FAQ rich-result claim or unsupported FAQPage schema is made. Future search work should use Search Console query data and actual user feedback to refine wording rather than add near-duplicate keyword pages.
