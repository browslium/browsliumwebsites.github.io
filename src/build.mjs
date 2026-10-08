import { mkdir, writeFile, cp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { languages, copy } from './content.mjs';
import { policies } from './policies.mjs';
import { faqs } from './faq.mjs';
import { legal } from './legal.mjs';
import { explainers } from './explainers.mjs';
import { showcase } from './showcase.mjs';
import { consumer } from './consumer-copy.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(sourceRoot, 'dist');
const origin = 'https://browslium.com';
const assetHash = async filename => createHash('sha256').update(await readFile(path.join(sourceRoot,'assets',filename))).digest('hex').slice(0,12);
const stylesheet = `/assets/site.css?v=${await assetHash('site.css')}`;
const script = `/assets/site.js?v=${await assetHash('site.js')}`;
const donateUrl = 'https://donate.stripe.com/6oU14mgxEgEqgJF7HZ3wQ00';
const socialProfiles = [
  ['X', 'https://x.com/Browslium', 'x'],
  ['Instagram', 'https://www.instagram.com/browslium/', 'instagram'],
  ['YouTube', 'https://www.youtube.com/@Browslium', 'youtube'],
  ['TikTok', 'https://www.tiktok.com/@browslium', 'tiktok'],
];
const languageMarks = { en:'🇬🇧', es:'🇪🇸', ru:'🇷🇺', yi:'אָ', he:'🇮🇱', 'pt-BR':'🇧🇷', fr:'🇫🇷' };
const audienceIcons = [
  '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  '<path d="M3 21v-2a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2"/><circle cx="12" cy="7" r="4"/>',
  '<path d="M3 5a3 3 0 0 1 3-3h15v18H6a3 3 0 0 0-3 2z"/><path d="M3 5v14a3 3 0 0 1 3-3h15"/>',
  '<path d="M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z"/>',
];
const lineIcon = content => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;

const e = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const L = (slug, page = '') => `/${slug}/${page ? `${page}/` : ''}`;
const locale = slug => languages.find(x => x.slug === slug);
const altLinks = (page = '', root = false) => `${languages.map(l => `<link rel="alternate" hreflang="${l.code}" href="${origin}${L(l.slug, page)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${origin}${root ? '/' : L('en', page)}">`;
const ogAlt = current => languages.filter(l => l.code !== current.code).map(l => `<meta property="og:locale:alternate" content="${l.og}">`).join('\n');
const json = data => JSON.stringify(data).replace(/</g, '\\u003c');
const webPageSchema = (l, name, description, canonical) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name,
  description,
  inLanguage: l.code,
  url: `${origin}${canonical}`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Browslium',
    url: origin,
    publisher: {
      '@type': 'Organization',
      name: 'Browslium',
      url: origin,
      logo: `${origin}/assets/browslium-icon.webp`,
      sameAs: socialProfiles.map(([, url]) => url),
    },
  },
});

function head(l, title, description, canonical, page = '') {
  return `<!doctype html>
<html lang="${l.code}" dir="${l.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#030509">
  <link rel="canonical" href="${origin}${canonical}">
  ${altLinks(page, !page)}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Browslium">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${origin}${canonical}">
  <meta property="og:image" content="${origin}/assets/browslium-og.webp">
  <meta property="og:image:alt" content="${e(copy[l.code].logoAlt)}">
  <meta property="og:locale" content="${l.og}">
  ${ogAlt(l)}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/assets/favicon-64.png" sizes="64x64">
  <link rel="icon" type="image/png" href="/assets/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="${stylesheet}">
</head>`;
}

function languageMenu(l, kind, page = '') {
  const c = copy[l.code];
  return `<details class="language-menu ${kind}" data-language-menu>
    <summary aria-label="${e(c.switchLanguage)}"><span class="language-mark ${l.code==='yi'?'yiddish-mark':''}" aria-hidden="true">${languageMarks[l.code]}</span><span>${e(l.short)}</span><span class="caret" aria-hidden="true">⌄</span></summary>
    <ul aria-label="${e(c.language)}">${languages.map(x => `<li><a href="${L(x.slug, page)}" lang="${x.code}" dir="${x.dir}" data-language-choice="${x.code}" ${x.code === l.code ? 'aria-current="page"' : ''}><span class="language-mark ${x.code==='yi'?'yiddish-mark':''}" aria-hidden="true">${languageMarks[x.code]}</span>${e(x.name)}</a></li>`).join('')}</ul>
  </details>`;
}

function header(l, page = '') {
  const c = copy[l.code];
  const links = ['how', 'levels', 'platforms', 'faq', 'donate'];
  return `<a class="skip-link" href="#main">${e(c.skip)}</a>
  <header class="site-header"><div class="wrap header-inner">
    <a class="brand brand-wordmark" href="${L(l.slug)}" aria-label="Browslium"><img src="/assets/browslium-wordmark-white.webp" width="212" height="51" alt="Browslium"></a>
    <nav class="desktop-nav" aria-label="${e(c.footer[0])}">${links.map((x,i) => `<a href="${L(l.slug)}#${x}">${e(c.nav[i])}</a>`).join('')}</nav>
    <div class="header-actions">${languageMenu(l, 'header-language', page)}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${e(c.menu)}"><span></span><span></span><span></span></button></div>
  </div><nav id="mobile-nav" class="mobile-nav" aria-label="${e(c.footer[0])}" hidden><div class="wrap">${links.map((x,i) => `<a href="${L(l.slug)}#${x}">${e(c.nav[i])}</a>`).join('')}${languageMenu(l, 'mobile-language', page)}</div></nav></header>`;
}

function footer(l, page = '') {
  const c = copy[l.code], u = explainers[l.code].ui, cc=consumer[l.code];
  return `<footer class="site-footer"><div class="wrap footer-grid">
    <div><a class="brand brand-wordmark footer-brand" href="${L(l.slug)}" aria-label="Browslium"><img class="brand-normal" src="/assets/browslium-wordmark-white.webp" width="224" height="54" alt="Browslium"><img class="brand-hover" src="/assets/browslium-wordmark-emerald.webp" width="224" height="54" alt="" aria-hidden="true"></a><p>${e(cc.slogan)}</p></div>
    <div><h2>${e(c.footer[0])}</h2><a href="${L(l.slug)}#how">${e(c.nav[0])}</a><a href="${L(l.slug,'image-filtering')}">${e(u.imageLink)}</a><a href="${L(l.slug,'video-filtering')}">${e(u.videoLink)}</a><a href="${L(l.slug)}#levels">${e(c.nav[1])}</a><a href="${L(l.slug)}#platforms">${e(c.nav[2])}</a><a href="${L(l.slug)}#faq">${e(c.nav[3])}</a></div>
    <div><h2>${e(c.footer[1])}</h2><a href="${L(l.slug, 'privacy')}">${e(c.footer[3])}</a><a href="${L(l.slug, 'terms')}">${e(c.footer[4])}</a><a href="${L(l.slug, 'support')}">${e(c.footer[5])}</a></div>
    <div><h2>${e(c.footer[2])}</h2><a href="mailto:admin@browslium.com">admin@browslium.com</a><nav class="footer-social" aria-label="${e(c.socialHeading)}"><h3>${e(c.socialHeading)}</h3>${socialProfiles.map(([name,url,icon]) => `<a href="${e(url)}" aria-label="${name}" title="${name}" target="_blank" rel="noopener noreferrer"><img src="/assets/icons/${icon}.svg" width="22" height="22" alt="" aria-hidden="true"></a>`).join('')}</nav>${languageMenu(l, 'footer-language', page)}</div>
  </div><div class="wrap footer-bottom"><span>© ${new Date().getUTCFullYear()} Browslium LLC. ${e(c.footer[7])}</span></div></footer>`;
}

function suggestion(l) {
  return `<aside class="language-suggestion" data-language-suggestion hidden aria-live="polite"><div class="wrap suggestion-inner"><p data-suggestion-message></p><div><a data-suggestion-link href="#"></a><button type="button" data-suggestion-dismiss></button></div></div></aside>`;
}

const mediaPath = (folder, filename) => `/assets/media/${folder}/${filename}`;

function sceneChoices(names, alts, kind) {
  return names.map((name, index) => `<button type="button" class="showcase-scene" data-showcase-scene="${index+1}" data-scene-alt="${e(alts[index])}" aria-pressed="${index===0}"><img src="${mediaPath(kind==='image'?'images':'posters', `${kind==='image'?'photo':'video'}-${index+1}-original.webp`)}" width="112" height="74" alt="" loading="lazy"><span>${e(name)}</span></button>`).join('');
}

function policyChoices(l, kind) {
  const s=showcase[l.code], items=policies[l.code][kind], labels=consumer[l.code][kind==='image'?'imageLevels':'videoLevels'];
  return `<button type="button" data-showcase-level="0" aria-pressed="true"><span class="level-index" aria-hidden="true">○</span><span class="level-copy">${e(labels[0])}</span></button>${items.map((description,index)=>`<button type="button" data-showcase-level="${index+1}" data-description="${e(description)}" aria-pressed="false"><span class="level-index" aria-hidden="true">${index+1}</span><span class="level-copy">${e(labels[index+1])}</span></button>`).join('')}`;
}

function photoShowcase(l, id='levels', number='01', link=true) {
  const s=showcase[l.code], cc=consumer[l.code], first=mediaPath('images','photo-1-original.webp');
  return `<section class="section showcase-section photo-showcase" id="${id}" data-showcase="image" data-original-note="${e(s.originalImage)}" data-original-label="${e(s.original)}" data-level-word="${e(s.level)}" data-result-word="${e(s.after)}"><div class="wrap">
    ${id==='levels'?'<span id="how" class="section-anchor" aria-hidden="true"></span>':''}
    <div class="section-intro showcase-intro"><p class="eyebrow">${e(cc.imageEyebrow)}</p><h2>${e(s.imageTitle)}</h2><p>${e(s.imageIntro)}</p></div>
    <div class="showcase-shell"><div class="showcase-main"><div class="showcase-stage compare-stage" data-compare-stage data-original="true" style="--split:50%" dir="ltr">
      <img class="compare-result" data-result-image src="${first}" width="1600" height="1067" alt="" decoding="sync">
      <div class="compare-source" data-compare-source><img data-original-image src="${first}" width="1600" height="1067" alt="${e(s.photoAlts[0])}" decoding="sync"></div>
      <span class="compare-label compare-label-before" data-before-label>${e(s.before)}</span><span class="compare-label compare-label-after" data-after-label hidden>${e(s.after)}</span>
      <span class="compare-handle" data-compare-handle aria-hidden="true">↔</span>
      <input class="compare-range" data-compare-range type="range" min="0" max="100" value="15" aria-label="${e(s.drag)}" hidden disabled>
      <span class="showcase-loading" data-showcase-loading hidden role="status">${e(s.loading)}</span>
    </div><p class="showcase-compare-hint">${e(cc.compareHint)}</p></div>
    <div class="showcase-controls"><fieldset class="showcase-scenes"><legend>${e(cc.sceneGuide)}</legend><div class="showcase-scene-list">${sceneChoices(s.photoScenes,s.photoAlts,'image')}</div></fieldset><div class="showcase-readout" aria-live="polite"><strong data-showcase-selection>${e(s.original)}</strong><p data-showcase-description>${e(s.originalImage)}</p></div><fieldset class="showcase-policies"><legend>${e(s.policy)}</legend><p class="control-help">${e(cc.levelGuide)}</p><div class="showcase-level-list">${policyChoices(l,'image')}</div></fieldset></div></div>
    <div class="showcase-foot"><a class="button button-primary" href="${id==='levels'?'#video-levels':'#next-step'}">${e(cc.afterImages)} <span aria-hidden="true">↓</span></a>${link?`<a class="text-link" href="${L(l.slug,'image-filtering')}">${e(s.imageLink)} <span aria-hidden="true">↗</span></a>`:''}</div>
  </div></section>`;
}

function videoShowcase(l, id='video-levels', number='02', link=true) {
  const s=showcase[l.code], cc=consumer[l.code], first=mediaPath('videos','video-1-original.mp4');
  return `<section class="section showcase-section video-showcase" id="${id}" data-showcase="video" data-locale-slug="${l.slug}" data-original-note="${e(s.originalVideo)}" data-original-label="${e(s.original)}" data-level-word="${e(s.level)}" data-result-word="${e(s.after)}"><div class="wrap">
    <div class="section-intro showcase-intro"><p class="eyebrow">${e(cc.videoEyebrow)}</p><h2>${e(s.videoTitle)}</h2><p>${e(s.videoIntro)}</p></div>
    <div class="showcase-shell"><div class="showcase-main"><div class="showcase-stage video-stage"><video controls playsinline preload="metadata" width="1280" height="720" src="${first}" poster="${mediaPath('posters','video-1-original.webp')}" aria-label="${e(s.videoAlts[0])}" data-showcase-video></video><span class="video-stage-tag" data-video-stage-tag>${e(s.original)}</span></div>
      <div class="video-view-switch" role="group" aria-label="${e(cc.videoEyebrow)}"><button type="button" data-video-view="original" aria-pressed="true">${e(s.playOriginal)}</button><button type="button" data-video-view="result" aria-pressed="false" disabled>${e(s.playFiltered)}</button></div>
    </div><div class="showcase-controls"><fieldset class="showcase-scenes"><legend>${e(cc.sceneGuide)}</legend><div class="showcase-scene-list">${sceneChoices(s.videoScenes,s.videoAlts,'video')}</div></fieldset><div class="showcase-readout" aria-live="polite"><strong data-showcase-selection>${e(s.original)}</strong><p data-showcase-description>${e(s.originalVideo)}</p></div><fieldset class="showcase-policies"><legend>${e(s.policy)}</legend><p class="control-help">${e(cc.levelGuide)}</p><div class="showcase-level-list">${policyChoices(l,'video')}</div></fieldset></div></div>
    <div class="showcase-foot"><a class="button button-primary" href="${id==='video-levels'?'#audio-text':'#next-step'}">${e(cc.afterVideos)} <span aria-hidden="true">↓</span></a>${link?`<a class="text-link" href="${L(l.slug,'video-filtering')}">${e(s.videoLink)} <span aria-hidden="true">↗</span></a>`:''}</div>
  </div></section>`;
}

function home(l) {
  const c = copy[l.code], cc=consumer[l.code];
  const canonical = L(l.slug);
  const serviceSchema = webPageSchema(l,cc.metaTitle,cc.metaDescription,canonical);
  return `${head(l,cc.metaTitle,cc.metaDescription,canonical)}<body data-locale="${l.code}">
  ${suggestion(l)}${header(l)}<main id="main">
  <section class="hero"><div class="wrap hero-grid"><div class="hero-copy"><h1><span class="hero-gradient">${e(cc.hero[0].split(' ')[0])}</span> ${e(cc.hero[0].split(' ').slice(1).join(' '))}</h1><p>${e(cc.hero[1])}</p><div class="button-row"><a class="button button-primary" href="#levels">${e(cc.hero[2])}<span aria-hidden="true">↓</span></a><a class="button button-outline" href="#video-levels">${e(cc.hero[3])}</a></div></div><div class="hero-visual" aria-hidden="true"><div class="hero-glow"></div><div class="hero-display"><div class="hero-display-top"><span class="display-dots"><i></i><i></i><i></i></span><span>${e(cc.heroVisual[2])}</span></div><div class="hero-display-images"><figure><img src="${mediaPath('images','photo-2-original.webp')}" width="480" height="320" alt=""><figcaption>${e(cc.heroVisual[0])}</figcaption></figure><figure><img src="${mediaPath('images','photo-2-2.webp')}" width="480" height="320" alt=""><figcaption>${e(cc.heroVisual[1])}</figcaption></figure></div></div></div></div></section>
  ${photoShowcase(l)}
  ${videoShowcase(l)}
  <section class="section audio-section" id="audio-text"><div class="wrap"><div class="section-intro"><p class="eyebrow">${e(c.media[6])}</p><h2>${e(cc.audio[0])}</h2><p>${e(cc.audio[1])}</p></div><div class="audio-grid"><article><div class="feature-icon">${lineIcon('<path d="M5 9v6M9 5v14M13 3v18M17 6v12M21 9v6"/>')}</div><h3>${e(cc.audio[2])}</h3><p>${e(cc.audio[3])}</p></article><article><div class="feature-icon">${lineIcon('<path d="M5 4h14M5 9h14M5 14h10M5 19h8"/>')}</div><h3>${e(cc.audio[4])}</h3><p>${e(cc.audio[5])}</p></article></div><a class="button button-primary section-cta" href="#android-apps">${e(cc.audio[6])}<span aria-hidden="true">↓</span></a></div></section>
  <section class="section android-section" id="android-apps"><div class="wrap android-grid"><div class="android-copy"><p class="eyebrow">Android</p><h2>${e(cc.android[0])}</h2><p class="lead">${e(cc.android[1])}</p><ul>${cc.android.slice(2,5).map(x=>`<li><span aria-hidden="true">✓</span>${e(x)}</li>`).join('')}</ul><a class="button button-primary" href="#platforms">${e(cc.android[5])}<span aria-hidden="true">↓</span></a></div><div class="android-visual" aria-hidden="true"><div class="android-phone"><div class="phone-top"></div><img src="${mediaPath('images','photo-2-2.webp')}" width="440" height="700" alt=""><span>${e(cc.heroVisual[1])}</span></div><div class="android-app-icon"><img src="/assets/icons/android.svg" width="46" height="46" alt=""></div></div></div></section>
  <section class="section platforms-section" id="platforms"><div class="wrap"><div class="section-intro"><p class="eyebrow">${e(c.nav[2])}</p><h2>${e(cc.platforms[0])}</h2><p>${e(cc.platforms[1])}</p></div><div class="platform-grid">${cc.platforms[2].map(([name,description],i)=>`<article class="platform-card"><div class="platform-heading"><span class="platform-icon" aria-hidden="true"><img src="/assets/icons/${['android','ios','macos','windows'][i]}.svg" width="30" height="30" alt=""></span></div><h3>${e(name)}</h3><p>${e(description)}</p></article>`).join('')}</div><a class="button button-primary section-cta" href="#for-you">${e(cc.platforms[3])}<span aria-hidden="true">↓</span></a></div></section>
  <section class="section audiences-section" id="for-you"><div class="wrap audience-grid"><div><p class="eyebrow">Browslium</p><h2>${e(cc.audiences[0])}</h2><p>${e(cc.audiences[1])}</p><a class="button button-primary section-cta" href="#faq">${e(cc.audiences[3])}<span aria-hidden="true">↓</span></a></div><div class="audience-list">${cc.audiences[2].map((x,i)=>`<div><span class="audience-icon">${lineIcon(audienceIcons[i])}</span><strong>${e(x)}</strong></div>`).join('')}</div></div></section>
  <section class="section faq-section" id="faq"><div class="wrap faq-grid"><div class="faq-heading"><p class="eyebrow">FAQ</p><h2>${e(c.faq[0])}</h2><p>${e(cc.faqIntro)}</p></div><div class="faq-list">${faqs[l.code].filter((_,i)=>![19,20,21].includes(i)).map(([q,a])=>`<details><summary>${e(q)}<span aria-hidden="true">+</span></summary><p>${e(a)}</p></details>`).join('')}</div></div></section>
  <section class="section donate-section" id="donate"><div class="wrap donate-grid"><div><p class="eyebrow">Browslium</p><h2>${e(cc.donate[0])}</h2><p class="lead">${e(cc.donate[1])}</p></div><div class="donate-box"><strong>${e(cc.donate[2])}</strong><p>${e(c.donate[3])}</p><a class="button button-primary" href="${donateUrl}" target="_blank" rel="noopener noreferrer">${e(c.donate[4])}<span aria-hidden="true">↗</span></a></div></div></section>
  </main>${footer(l)}<script type="application/ld+json">${json(serviceSchema)}</script><script src="${script}" defer></script></body></html>`;
}

function support(l) {
  const c=copy[l.code], title=`${c.support[0]} | Browslium`, canonical=L(l.slug,'support');
  const schema = webPageSchema(l,title,c.support[1],canonical);
  return `${head(l,title,c.support[1],canonical,'support')}<body data-locale="${l.code}" data-page="support">${suggestion(l)}${header(l,'support')}<main id="main" class="simple-main"><section class="section simple-hero"><div class="wrap narrow"><p class="eyebrow">Browslium / ${e(c.footer[5])}</p><h1>${e(c.support[0])}</h1><p class="lead">${e(c.support[1])}</p><a class="button button-primary" href="mailto:admin@browslium.com">${e(c.support[2])}</a><p class="small-note">${e(c.support[3])}</p></div></section></main>${footer(l,'support')}<script type="application/ld+json">${json(schema)}</script><script src="${script}" defer></script></body></html>`;
}

function explainerPage(l, kind) {
  const c = copy[l.code], x = explainers[l.code], d = x[kind], u = x.ui;
  const isImage = kind === 'image';
  const page = isImage ? 'image-filtering' : 'video-filtering';
  const otherPage = isImage ? 'video-filtering' : 'image-filtering';
  const canonical = L(l.slug,page);
  const schema = webPageSchema(l,d.title,d.description,canonical);
  const list = policies[l.code][kind];
  return `${head(l,d.title,d.description,canonical,page)}<body data-locale="${l.code}" data-page="${page}">${suggestion(l)}${header(l,page)}<main id="main" class="explainer-main">
  <section class="explainer-hero"><div class="wrap narrow"><p class="eyebrow">Browslium / ${e(isImage?u.imageLabel:u.videoLabel)}</p><h1>${e(d.h1)}</h1><p class="lead">${e(d.lead)}</p><div class="button-row"><a class="button button-primary" href="#examples">${e(u.levelsLink)} <span aria-hidden="true">↓</span></a><a class="button button-light-outline" href="${L(l.slug)}#platforms">${e(c.nav[2])}</a></div></div></section>
  <section class="section explainer-story"><div class="wrap story-grid"><article><h2>${e(d.whyH)}</h2><p>${e(d.whyP)}</p></article><article><h2>${e(d.processH)}</h2><p>${e(d.processP)}</p></article></div></section>
  <section class="section explainer-levels" id="levels"><div class="wrap"><div class="section-intro"><p class="eyebrow">${e(isImage?u.imageLabel:u.videoLabel)}</p><h2>${e(d.levelsH)}</h2><p>${e(d.levelsP)}</p></div><ol class="policy-grid">${list.map((policy,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><p>${e(policy)}</p></li>`).join('')}</ol></div></section>
  ${isImage?photoShowcase(l,'examples','',false):videoShowcase(l,'examples','',false)}
  <section class="section explainer-status" id="next-step"><div class="wrap status-grid"><div><p class="eyebrow">Browslium</p><h2>${e(d.statusH)}</h2><p>${e(d.statusP)}</p></div><a class="button button-primary" href="${L(l.slug)}#platforms">${e(c.nav[2])} <span aria-hidden="true">↗</span></a></div></section>
  <section class="section related-section"><div class="wrap"><h2>${e(u.relatedH)}</h2><p>${e(u.relatedP)}</p><div class="related-links"><a href="${L(l.slug,otherPage)}">${e(isImage?u.videoLink:u.imageLink)} <span aria-hidden="true">↗</span></a><a href="${L(l.slug)}#levels">${e(u.levelsLink)} <span aria-hidden="true">↗</span></a><a href="${L(l.slug)}#faq">${e(c.nav[3])} <span aria-hidden="true">↗</span></a></div></div></section>
  </main>${footer(l,page)}<script type="application/ld+json">${json(schema)}</script><script src="${script}" defer></script></body></html>`;
}

function legalPage(l, type) {
  const c = copy[l.code], d = legal[l.code][type], canonical = L(l.slug,type);
  const schema = webPageSchema(l,`${d.title} | Browslium`,d.description,canonical);
  return `${head(l,`${d.title} | Browslium`,d.description,canonical,type)}<body data-locale="${l.code}" data-page="${type}">${suggestion(l)}${header(l,type)}<main id="main" class="legal-main"><section class="legal-hero"><div class="wrap narrow"><p class="eyebrow">Browslium / ${e(d.title)}</p><h1>${e(d.title)}</h1><p class="lead">${e(d.intro)}</p><p class="legal-updated">${e(d.updated)}</p></div></section><div class="wrap legal-layout"><nav class="legal-toc" aria-label="${e(d.title)}">${d.sections.map(([h],i)=>`<a href="#section-${i+1}"><span>${String(i+1).padStart(2,'0')}</span>${e(h)}</a>`).join('')}</nav><div class="legal-content">${d.sections.map(([h,b],i)=>`<section id="section-${i+1}"><h2>${e(h)}</h2><p>${e(b)}</p></section>`).join('')}<div class="legal-contact"><strong>${e(c.footer[2])}</strong><a href="mailto:admin@browslium.com">admin@browslium.com</a></div></div></div></main>${footer(l,type)}<script type="application/ld+json">${json(schema)}</script><script src="${script}" defer></script></body></html>`;
}

function gateway() {
  const l=locale('en');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Browslium — Choose your language</title><meta name="description" content="Explore Browslium in English, Español, Русский, ייִדיש, עברית, Português (Brasil) or Français."><link rel="canonical" href="${origin}/">${altLinks('',true)}<meta name="theme-color" content="#030509"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/assets/favicon-64.png" sizes="64x64"><link rel="stylesheet" href="${stylesheet}"></head><body data-locale="en" data-gateway="true">${suggestion(l)}<main class="gateway"><div class="gateway-card"><img src="/assets/browslium-wordmark-white.webp" width="320" height="77" alt="Browslium"><h1>Browslium</h1><p>Choose your language to explore Browslium.</p><p class="preferred-message" data-preferred-message hidden></p><nav aria-label="Choose your language">${languages.map(x=>`<a href="${L(x.slug)}" lang="${x.code}" dir="${x.dir}" data-language-choice="${x.code}"><span class="language-mark ${x.code==='yi'?'yiddish-mark':''}" aria-hidden="true">${languageMarks[x.code]}</span>${e(x.name)} <span aria-hidden="true">↗</span></a>`).join('')}</nav></div></main><script src="${script}" defer></script></body></html>`;
}

await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(path.join(sourceRoot,'assets'),path.join(output,'assets'),{recursive:true});
await cp(path.join(sourceRoot,'assets','favicon.ico'),path.join(output,'favicon.ico'));
await cp(path.join(sourceRoot,'CNAME'),path.join(output,'CNAME'));
await cp(path.join(sourceRoot,'google80ba342909e82f35.html'),path.join(output,'google80ba342909e82f35.html'));
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'index.html'),gateway());
for (const l of languages) {
  const dir=path.join(output,l.slug); await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),home(l));
  for (const [page,kind] of [['image-filtering','image'],['video-filtering','video']]) {
    const explainerDir=path.join(dir,page); await mkdir(explainerDir,{recursive:true});
    await writeFile(path.join(explainerDir,'index.html'),explainerPage(l,kind));
  }
  const supportDir=path.join(dir,'support'); await mkdir(supportDir,{recursive:true});
  await writeFile(path.join(supportDir,'index.html'),support(l));
  for (const type of ['privacy','terms']) {
    const legalDir=path.join(dir,type); await mkdir(legalDir,{recursive:true});
    await writeFile(path.join(legalDir,'index.html'),legalPage(l,type));
  }
}
await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const pages=['','image-filtering','video-filtering','support','privacy','terms'];
const paths=['/',...languages.flatMap(l=>pages.map(page=>L(l.slug,page)))];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths.map(p=>{const page=pages.find(x=>x && p.endsWith(`/${x}/`))||'';return `<url><loc>${origin}${p}</loc>${p==='/'?'':languages.map(l=>`<xhtml:link rel="alternate" hreflang="${l.code}" href="${origin}${L(l.slug,page)}"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${page?L('en',page):'/'}"/>`}</url>`}).join('')}</urlset>`;
await writeFile(path.join(output,'sitemap.xml'),sitemap);
await writeFile(path.join(output,'404.html'),gateway());
console.log(`Built ${languages.length} locales × ${pages.length} page types in ${output}`);
