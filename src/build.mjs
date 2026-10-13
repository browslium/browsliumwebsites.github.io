import { mkdir, writeFile, cp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { languages, copy } from './content.mjs';
import { policies } from './policies.mjs';
import { faqs } from './faq.mjs';
import { legal } from './legal.mjs';
import { productPrivacy } from './product-privacy.mjs';
import { explainers } from './explainers.mjs';
import { showcase } from './showcase.mjs';
import { consumer } from './consumer-copy.mjs';
import { redesign } from './redesign-copy.mjs';

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
const portalCopy = {
  en: ['Sign in', 'Set up a device', 'Pilot access only. New accounts and device enrollment are not yet open to everyone.', 'Client portal'],
  es: ['Iniciar sesión', 'Preparar un dispositivo', 'Acceso piloto: las cuentas nuevas y la inscripción de dispositivos aún no están abiertas a todo el público.', 'Portal de clientes'],
  ru: ['Войти', 'Подготовить устройство', 'Пилотный доступ: новые аккаунты и регистрация устройств пока доступны не всем.', 'Портал клиентов'],
  yi: ['זיך אָנמעלדן', 'צוגרייטן אַ מיטל', 'פּילאָט־צוטריט: נײַע קאָנטעס און אײַנשרײַבן מכשירים זענען נאָך נישט אָפֿן פֿאַר אַלעמען.', 'קונה־פּאָרטאַל'],
  he: ['כניסה', 'הכנת מכשיר', 'גישה לפיילוט בלבד: פתיחת חשבונות ורישום מכשירים עדיין אינם פתוחים לכולם.', 'פורטל לקוחות'],
  'pt-BR': ['Entrar', 'Preparar um dispositivo', 'Acesso piloto: novas contas e cadastro de dispositivos ainda não estão abertos ao público.', 'Portal do cliente'],
  fr: ['Se connecter', 'Préparer un appareil', 'Accès pilote : les nouveaux comptes et l’inscription d’appareils ne sont pas encore ouverts à tous.', 'Portail client'],
};
const portalLogin = 'https://app.browslium.com/login';
const portalSetup = 'https://app.browslium.com/setup';
// Set both only after the private portal's credentialed session endpoint and
// dashboard destination work from a new tab. Empty values keep Sign In.
const verifiedSessionEndpoint = '';
const verifiedDashboardUrl = '';
const e = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sessionAttribute = verifiedSessionEndpoint && verifiedDashboardUrl ? ` data-session-endpoint="${e(verifiedSessionEndpoint)}" data-dashboard-url="${e(verifiedDashboardUrl)}"` : '';
const accentHeading = value => {
  const [first, ...rest] = String(value).split(' ');
  return `<span class="headline-accent">${e(first)}</span>${rest.length ? ` ${e(rest.join(' '))}` : ''}`;
};
const maskSentence = (locale, value) => Array.from(
  new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(value),
  part => /\s/u.test(part.segment) ? part.segment : '*',
).join('');
const L = (slug, page = '') => `/${slug}/${page ? `${page}/` : ''}`;
const locale = slug => languages.find(x => x.slug === slug);
const pageLanguages = page => page === 'product-privacy' ? languages.filter(l => ['en','es'].includes(l.code)) : languages;
const altLinks = (page = '', root = false) => `${pageLanguages(page).map(l => `<link rel="alternate" hreflang="${l.code}" href="${origin}${L(l.slug, page)}">`).join('\n')}
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
  ${page === 'product-privacy' ? pageLanguages(page).filter(x => x.code !== l.code).map(x => `<meta property="og:locale:alternate" content="${x.og}">`).join('\n') : ogAlt(l)}
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
    <ul aria-label="${e(c.language)}">${pageLanguages(page).map(x => `<li><a href="${L(x.slug, page)}" lang="${x.code}" dir="${x.dir}" data-language-choice="${x.code}" ${x.code === l.code ? 'aria-current="page"' : ''}><span class="language-mark ${x.code==='yi'?'yiddish-mark':''}" aria-hidden="true">${languageMarks[x.code]}</span>${e(x.name)}</a></li>`).join('')}</ul>
  </details>`;
}

function header(l, page = '') {
  const c = copy[l.code], r = redesign[l.code];
  const links = ['how', 'levels', 'platforms', 'faq', 'donate'];
  return `<a class="skip-link" href="#main">${e(c.skip)}</a>
  <header class="site-header"><div class="wrap header-inner">
    <a class="brand brand-wordmark" href="${L(l.slug)}" aria-label="Browslium"><img src="/assets/browslium-wordmark-white.webp" width="212" height="51" alt="Browslium"></a>
    <nav class="desktop-nav" aria-label="${e(c.footer[0])}">${links.map((x,i) => `<a href="${L(l.slug)}#${x}">${e(c.nav[i])}</a>`).join('')}</nav>
    <div class="header-actions">${languageMenu(l, 'header-language', page)}<a class="header-sign-in" data-session-link data-dashboard-label="${e(r.dashboard)}" href="${portalLogin}">${e(r.signIn)}</a><a class="header-add-device" href="${portalSetup}">${e(r.addDevice)}</a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${e(c.menu)}"><span></span><span></span><span></span></button></div>
  </div><nav id="mobile-nav" class="mobile-nav" aria-label="${e(c.footer[0])}" hidden><div class="wrap">${links.map((x,i) => `<a href="${L(l.slug)}#${x}">${e(c.nav[i])}</a>`).join('')}<a class="mobile-sign-in" data-session-link data-dashboard-label="${e(r.dashboard)}" href="${portalLogin}">${e(r.signIn)}</a>${languageMenu(l, 'mobile-language', page)}</div></nav></header>`;
}

function closingBands(l) {
  const c = copy[l.code], cc = consumer[l.code], r = redesign[l.code];
  return `<div class="closing-band"><div class="wrap closing-grid"><section class="donation-band" id="donate"><h2>${accentHeading(cc.donate[0])}</h2><a class="button button-primary" href="${donateUrl}" target="_blank" rel="noopener noreferrer">${e(c.donate[4])}<span aria-hidden="true">↗</span></a></section>
  <section class="newsletter-band"><h2>${e(r.newsletter[0])}</h2><form class="newsletter-form" aria-describedby="newsletter-status"><label class="visually-hidden" for="newsletter-email">${e(r.newsletter[1])}</label><input id="newsletter-email" name="email" type="email" autocomplete="email" placeholder="${e(r.newsletter[1])}" disabled><button type="submit" disabled title="${e(r.newsletter[3])}">${e(r.newsletter[2])}</button></form><span id="newsletter-status" class="visually-hidden">${e(r.newsletter[3])}</span></section></div></div>`;
}

function footer(l, page = '') {
  const c = copy[l.code], u = explainers[l.code].ui, cc=consumer[l.code], portal=portalCopy[l.code];
  const productLabel = l.code === 'es' ? 'Aviso de privacidad del producto' : l.code === 'en' ? 'Product Privacy Notice' : 'Product Privacy Notice (English)';
  const productSlug = l.code === 'es' ? 'es' : 'en';
  return `${closingBands(l)}<footer class="site-footer"><div class="wrap footer-grid">
    <div><a class="footer-logo-slot" href="${L(l.slug)}" aria-label="Browslium"><img src="/assets/browslium-wordmark-emerald.webp" width="212" height="51" alt="Browslium"></a><p>${e(cc.slogan)}</p></div>
    <div><h2>${e(c.footer[0])}</h2><a href="${L(l.slug)}#how">${e(c.nav[0])}</a><a href="${L(l.slug,'image-filtering')}">${e(u.imageLink)}</a><a href="${L(l.slug,'video-filtering')}">${e(u.videoLink)}</a><a href="${L(l.slug)}#levels">${e(c.nav[1])}</a><a href="${L(l.slug)}#platforms">${e(c.nav[2])}</a><a href="${L(l.slug)}#faq">${e(c.nav[3])}</a></div>
    <div><h2>${e(c.footer[1])}</h2><a href="${portalLogin}">${e(portal[3])}</a><a href="${L(l.slug, 'privacy')}">${e(c.footer[3])}</a><a href="${L(productSlug, 'product-privacy')}">${e(productLabel)}</a><a href="${L(l.slug, 'terms')}">${e(c.footer[4])}</a><a href="${L(l.slug, 'support')}">${e(c.footer[5])}</a></div>
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
  return `<button type="button" data-showcase-level="0" aria-pressed="true"><span class="level-index" aria-hidden="true">○</span><span class="level-copy"><strong>${e(labels[0])}</strong></span></button>${items.map((description,index)=>`<button type="button" data-showcase-level="${index+1}" aria-pressed="false"><span class="level-index" aria-hidden="true">${index+1}</span><span class="level-copy"><strong>${e(labels[index+1])}</strong><small>${e(description)}</small></span></button>`).join('')}`;
}

function photoShowcase(l, id='levels', number='01', link=true) {
  const s=showcase[l.code], cc=consumer[l.code], first=mediaPath('images','photo-1-original.webp');
  return `<section class="section showcase-section photo-showcase" id="${id}" data-showcase="image" data-original-note="${e(s.originalImage)}" data-original-label="${e(s.original)}" data-level-word="${e(s.level)}" data-result-word="${e(s.after)}"><div class="wrap">
    ${id==='levels'?'<span id="how" class="section-anchor" aria-hidden="true"></span>':''}
    <div class="section-intro showcase-intro"><h2>${accentHeading(s.imageTitle)}</h2></div>
    <div class="showcase-shell"><div class="showcase-main"><div class="showcase-stage compare-stage" data-compare-stage data-original="true" style="--split:50%" dir="ltr">
      <img class="compare-result" data-result-image src="${first}" width="1600" height="1067" alt="" decoding="sync">
      <div class="compare-source" data-compare-source><img data-original-image src="${first}" width="1600" height="1067" alt="${e(s.photoAlts[0])}" decoding="sync"></div>
      <span class="compare-label compare-label-before" data-before-label>${e(s.before)}</span><span class="compare-label compare-label-after" data-after-label hidden>${e(s.after)}</span>
      <span class="compare-handle" data-compare-handle aria-hidden="true">↔</span>
      <input class="compare-range" data-compare-range type="range" min="0" max="100" value="15" aria-label="${e(s.drag)}" hidden disabled>
      <span class="showcase-loading" data-showcase-loading hidden role="status">${e(s.loading)}</span>
    </div><p class="showcase-compare-hint" data-compare-hint hidden>${e(cc.compareHint)}</p></div>
    <div class="showcase-controls"><fieldset class="showcase-scenes"><legend>${e(cc.sceneGuide)}</legend><div class="showcase-scene-list">${sceneChoices(s.photoScenes,s.photoAlts,'image')}</div></fieldset><fieldset class="showcase-policies"><legend>${e(s.policy)}</legend><div class="showcase-level-list">${policyChoices(l,'image')}</div></fieldset><span class="visually-hidden" aria-live="polite" data-showcase-announcement></span></div></div>
    <div class="showcase-foot"><a class="text-link" href="${id==='levels'?'#video-levels':L(l.slug,'video-filtering')}">${e(cc.afterImages)} <span aria-hidden="true">${id==='levels'?'↓':'↗'}</span></a>${link?`<a class="text-link" href="${L(l.slug,'image-filtering')}">${e(s.imageLink)} <span aria-hidden="true">↗</span></a>`:''}</div>
  </div></section>`;
}

function videoShowcase(l, id='video-levels', number='02', link=true) {
  const s=showcase[l.code], cc=consumer[l.code], first=mediaPath('videos','video-1-original.mp4');
  return `<section class="section showcase-section video-showcase" id="${id}" data-showcase="video" data-locale-slug="${l.slug}" data-original-note="${e(s.originalVideo)}" data-original-label="${e(s.original)}" data-level-word="${e(s.level)}" data-result-word="${e(s.after)}"><div class="wrap">
    <div class="section-intro showcase-intro"><h2>${accentHeading(s.videoTitle)}</h2></div>
    <div class="showcase-shell"><div class="showcase-main"><div class="showcase-stage video-stage"><video controls playsinline preload="metadata" width="1280" height="720" src="${first}" poster="${mediaPath('posters','video-1-original.webp')}" aria-label="${e(s.videoAlts[0])}" data-showcase-video></video><span class="video-stage-tag" data-video-stage-tag>${e(s.original)}</span></div>
      <div class="video-view-switch" role="group" aria-label="${e(cc.videoEyebrow)}"><button type="button" data-video-view="original" aria-pressed="true">${e(s.playOriginal)}</button><button type="button" data-video-view="result" aria-pressed="false" disabled>${e(s.playFiltered)}</button></div>
    </div><div class="showcase-controls"><fieldset class="showcase-scenes"><legend>${e(cc.sceneGuide)}</legend><div class="showcase-scene-list">${sceneChoices(s.videoScenes,s.videoAlts,'video')}</div></fieldset><fieldset class="showcase-policies"><legend>${e(s.policy)}</legend><div class="showcase-level-list">${policyChoices(l,'video')}</div></fieldset><span class="visually-hidden" aria-live="polite" data-showcase-announcement></span></div></div>
    <div class="showcase-foot"><a class="text-link" href="${id==='video-levels'?'#text-future':`${L(l.slug)}#text-future`}">${e(cc.afterVideos)} <span aria-hidden="true">${id==='video-levels'?'↓':'↗'}</span></a>${link?`<a class="text-link" href="${L(l.slug,'video-filtering')}">${e(s.videoLink)} <span aria-hidden="true">↗</span></a>`:''}</div>
  </div></section>`;
}

function textVisual(l) {
  const r = redesign[l.code];
  const hidden = [r.textPassage[4], r.textPassage[7]];
  const masked = hidden.map(sentence => maskSentence(l.code, sentence));
  const y = [103, 127, 151, 190, 214, 238, 277, 301, 325];
  const position = l.dir === 'rtl' ? 'x="409" text-anchor="start" direction="rtl"' : 'x="49"';
  const pageLines = r.textPassage.map((line, i) => {
    const hiddenIndex = i === 4 ? 0 : i === 7 ? 1 : -1;
    const content = hiddenIndex < 0 ? line : masked[hiddenIndex];
    return `<text ${position} y="${y[i]}" fill="${hiddenIndex < 0 ? '#263b51' : '#6252bd'}" font-size="15" font-weight="${hiddenIndex < 0 ? 500 : 750}" font-family="Inter,NotoHebrew,Arial,sans-serif">${e(content)}</text>`;
  }).join('');
  return `<svg class="text-concept-svg" viewBox="0 0 720 440" role="img" aria-label="${e(r.textTitle)}: ${e(r.textWritten)}" data-demo-original="${e(hidden.join(' '))}" data-demo-masked="${e(masked.join(' '))}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="text-paper-grad" x2="1" y2="1"><stop stop-color="#fffefa"/><stop offset="1" stop-color="#e9f1f7"/></linearGradient><linearGradient id="text-mask-grad"><stop stop-color="#d6b8f5"/><stop offset=".58" stop-color="#d5c2f0"/><stop offset="1" stop-color="#b4d7ed"/></linearGradient><clipPath id="text-phone-screen"><rect x="465" y="36" width="226" height="384" rx="30"/></clipPath></defs>
    <rect x="16" y="41" width="426" height="358" rx="22" fill="#b8c5d5" opacity=".25"/><rect x="12" y="35" width="426" height="358" rx="22" fill="url(#text-paper-grad)" stroke="#d8e0e8" stroke-width="2"/>
    <path d="M30 35 V393" stroke="#d6e0e9" stroke-width="2" opacity=".7"/><path d="M406 35 Q432 47 438 72 V369 Q432 386 408 393" fill="none" stroke="#e0e9ee" stroke-width="3"/>
    ${pageLines}
    <rect x="453" y="8" width="252" height="426" rx="46" fill="#1c2731" stroke="#6d7b8d" stroke-width="3"/><rect x="459" y="14" width="240" height="414" rx="42" fill="#090e15"/>
    <g clip-path="url(#text-phone-screen)"><image href="/assets/text-page-photo.png" x="465" y="36" width="226" height="384" preserveAspectRatio="xMidYMid slice"/>
      <path d="M482 194 Q503 190 522 192 L594 191 Q609 191 610 197 Q610 203 594 204 L521 205 Q501 205 482 203 Q476 199 482 194Z" fill="url(#text-mask-grad)" opacity=".98"/>
      <path d="M483 211 Q497 207 516 209 L647 208 Q664 209 664 215 Q662 220 647 221 L516 222 Q497 222 483 219 Q477 216 483 211Z" fill="url(#text-mask-grad)" opacity=".98"/>
      <path d="M485 226 Q501 223 519 225 L571 224 Q584 225 583 231 Q582 235 570 236 L518 237 Q501 236 485 234 Q480 231 485 226Z" fill="url(#text-mask-grad)" opacity=".98"/>
    </g><rect x="544" y="41" width="68" height="12" rx="6" fill="#0b1118" opacity=".96"/><rect x="701" y="105" width="3" height="48" rx="2" fill="#8794a5"/><rect x="451" y="107" width="3" height="36" rx="2" fill="#8794a5"/>
  </svg>`;
}

function audioVisual(l) {
  const r = redesign[l.code];
  const muted = x => (x >= 204 && x <= 294) || (x >= 426 && x <= 599);
  const bars = Array.from({length:123}, (_,i) => {
    const x = 42 + i * 5.2;
    if (muted(x)) return '';
    const height = 15 + Math.abs(Math.sin(i*.63)*24 + Math.sin(i*.17)*22 + Math.cos(i*.39)*18);
    return `<rect x="${x.toFixed(1)}" y="${(178-height).toFixed(1)}" width="3.3" height="${(height*2).toFixed(1)}" rx="1.65" fill="url(#wave-grad)" opacity=".92"/>`;
  }).join('');
  const dots = (start,end,color) => Array.from({length:Math.floor((end-start)/12)},(_,i) => `<circle cx="${start+i*12}" cy="${178+Math.sin(i*1.2)*4}" r="${i%3===0?3.4:2.6}" fill="${color}"/>`).join('');
  return `<svg class="audio-concept-svg" viewBox="0 0 720 380" role="img" aria-label="${e(r.audioTitle)}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="audio-grad" x2="1" y2="1"><stop stop-color="#192e50"/><stop offset="1" stop-color="#101d36"/></linearGradient><linearGradient id="wave-grad"><stop stop-color="#21b8ff"/><stop offset=".52" stop-color="#8d4dff"/><stop offset="1" stop-color="#19dfa6"/></linearGradient><marker id="audio-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 1 L7 4 0 7" fill="none" stroke="#b7c9e9" stroke-width="1.5"/></marker></defs>
    <rect x="10" y="22" width="700" height="338" rx="27" fill="url(#audio-grad)" stroke="#4b6385" stroke-width="2"/>
    <path d="M194 128 Q220 112 248 123 T302 128 L302 225 Q267 239 236 226 T194 226Z" fill="#a781ed" opacity=".13"/><path d="M417 131 Q452 110 507 125 T610 130 L610 226 Q561 239 510 225 T417 227Z" fill="#5cd9d0" opacity=".11"/>
    <path d="M40 178 H680" stroke="#7b91b8" stroke-width="1" opacity=".23"/>${bars}${dots(211,292,'#d4b4f5')}${dots(435,594,'#9cf0e1')}
    <path d="M243 298 Q240 269 243 246" fill="none" stroke="#b7c9e9" stroke-width="1.5" marker-end="url(#audio-arrow)"/><path d="M515 298 Q518 271 515 247" fill="none" stroke="#b7c9e9" stroke-width="1.5" marker-end="url(#audio-arrow)"/>
    <text x="243" y="325" text-anchor="middle" direction="${l.dir}" fill="#e8d8ff" font-size="14" font-weight="650" font-family="Inter,NotoHebrew,Arial,sans-serif">${e(r.audioLabels[0])}</text>
    <text x="515" y="325" text-anchor="middle" direction="${l.dir}" fill="#c0f7eb" font-size="14" font-weight="650" font-family="Inter,NotoHebrew,Arial,sans-serif">${e(r.audioLabels[1])}</text>
  </svg>`;
}

function home(l) {
  const c = copy[l.code], cc=consumer[l.code], portal=portalCopy[l.code], r=redesign[l.code];
  const canonical = L(l.slug);
  const serviceSchema = webPageSchema(l,cc.metaTitle,cc.metaDescription,canonical);
  return `${head(l,cc.metaTitle,cc.metaDescription,canonical)}<body data-locale="${l.code}"${sessionAttribute}>
  ${suggestion(l)}${header(l)}<main id="main">
  <section class="hero"><div class="wrap hero-grid"><div class="hero-copy"><h1>${accentHeading(cc.hero[0])}</h1><p>${e(cc.hero[1])}</p><div class="button-row"><a class="button button-primary" href="${portalSetup}">${e(r.addDevice)}<span aria-hidden="true">↗</span></a></div><p class="portal-pilot-note">${e(portal[2])}</p><div class="hero-explore"><a href="#levels">${e(cc.hero[2])} ↓</a><a href="#video-levels">${e(cc.hero[3])} ↓</a></div></div><div class="hero-visual" aria-hidden="true"><div class="hero-glow"></div><div class="hero-display"><div class="hero-display-top"><span class="display-dots"><i></i><i></i><i></i></span></div><div class="hero-display-images"><figure><img src="${mediaPath('images','photo-2-original.webp')}" width="480" height="320" alt=""><figcaption>${e(cc.heroVisual[0])}</figcaption></figure><figure><img src="${mediaPath('images','photo-2-2.webp')}" width="480" height="320" alt=""><figcaption>${e(cc.heroVisual[1])}</figcaption></figure></div></div></div></div></section>
  ${photoShowcase(l)}
  ${videoShowcase(l)}
  <section class="section future-text-section" id="text-future"><div class="wrap future-grid"><div class="future-copy"><h2>${accentHeading(r.textTitle)}</h2><p class="lead">${e(r.textIntro)}</p><div class="future-points"><p>${e(r.textWritten)}</p><p>${e(r.textOcr)}</p></div></div><div class="future-visual">${textVisual(l)}<p class="small-note text-demo-note">${e(r.textDemoNote)}</p></div></div></section>
  <section class="section future-audio-section" id="audio-text"><div class="wrap future-grid future-grid-reverse"><div class="future-visual">${audioVisual(l)}</div><div class="future-copy"><h2>${accentHeading(r.audioTitle)}</h2><p class="lead">${e(r.audioIntro)}</p><p class="small-note">${e(r.audioNote)}</p></div></div></section>
  <section class="section android-section" id="android-apps"><div class="wrap android-grid"><div class="android-copy"><h2>${accentHeading(cc.android[0])}</h2><p class="lead">${e(cc.android[1])}</p><ul>${cc.android.slice(2,5).map(x=>`<li><span aria-hidden="true">✓</span>${e(x)}</li>`).join('')}</ul><a class="button button-soft" href="#platforms">${e(cc.android[5])}<span aria-hidden="true">↓</span></a></div><div class="android-visual" aria-hidden="true"><div class="android-phone"><div class="phone-top"></div><img src="${mediaPath('images','photo-2-2.webp')}" width="440" height="700" alt=""><span>${e(cc.heroVisual[1])}</span></div><div class="android-app-icon"><img src="/assets/icons/android.svg" width="46" height="46" alt=""></div></div></div></section>
  <section class="section platforms-section" id="platforms"><div class="wrap"><div class="section-intro"><h2>${accentHeading(cc.platforms[0])}</h2></div><div class="platform-grid">${cc.platforms[2].map(([name],i)=>`<article class="platform-card"><div class="platform-heading"><span class="platform-icon" aria-hidden="true"><img src="/assets/icons/${['android','ios','macos','windows'][i]}.svg" width="54" height="54" alt=""></span></div><h3>${e(name)}</h3><p class="platform-status">${e(r.platformStatus[i])}</p></article>`).join('')}</div></div></section>
  <section class="section faq-section" id="faq"><div class="wrap faq-grid"><div class="faq-heading"><h2>${accentHeading(c.faq[0])}</h2></div><div class="faq-list">${faqs[l.code].filter((_,i)=>![19,20,21].includes(i)).map(([q,a])=>`<details><summary>${e(q)}<span aria-hidden="true">+</span></summary><p>${e(a)}</p></details>`).join('')}</div></div></section>
  </main>${footer(l)}<script type="application/ld+json">${json(serviceSchema)}</script><script src="${script}" defer></script></body></html>`;
}

function support(l) {
  const c=copy[l.code], title=`${c.support[0]} | Browslium`, canonical=L(l.slug,'support');
  const schema = webPageSchema(l,title,c.support[1],canonical);
  return `${head(l,title,c.support[1],canonical,'support')}<body data-locale="${l.code}" data-page="support"${sessionAttribute}>${suggestion(l)}${header(l,'support')}<main id="main" class="simple-main"><section class="section simple-hero"><div class="wrap narrow"><p class="eyebrow">Browslium / ${e(c.footer[5])}</p><h1>${e(c.support[0])}</h1><p class="lead">${e(c.support[1])}</p><a class="button button-primary" href="mailto:admin@browslium.com">${e(c.support[2])}</a><p class="small-note">${e(c.support[3])}</p></div></section></main>${footer(l,'support')}<script type="application/ld+json">${json(schema)}</script><script src="${script}" defer></script></body></html>`;
}

function explainerPage(l, kind) {
  const c = copy[l.code], x = explainers[l.code], d = x[kind], u = x.ui;
  const isImage = kind === 'image';
  const page = isImage ? 'image-filtering' : 'video-filtering';
  const otherPage = isImage ? 'video-filtering' : 'image-filtering';
  const canonical = L(l.slug,page);
  const schema = webPageSchema(l,d.title,d.description,canonical);
  return `${head(l,d.title,d.description,canonical,page)}<body data-locale="${l.code}" data-page="${page}"${sessionAttribute}>${suggestion(l)}${header(l,page)}<main id="main" class="explainer-main">
  <section class="explainer-hero"><div class="wrap narrow"><h1>${accentHeading(d.h1)}</h1><div class="button-row"><a class="button button-primary" href="${portalSetup}">${e(redesign[l.code].addDevice)} <span aria-hidden="true">↗</span></a><a class="text-link" href="#examples">${e(u.levelsLink)} <span aria-hidden="true">↓</span></a></div><p class="portal-pilot-note">${e(portalCopy[l.code][2])}</p></div></section>
  <section class="section explainer-story"><div class="wrap story-grid"><article><h2>${e(d.whyH)}</h2><p>${e(d.whyP)}</p></article><article><h2>${e(d.processH)}</h2><p>${e(d.processP)}</p></article></div></section>
  ${isImage?photoShowcase(l,'examples','',false):videoShowcase(l,'examples','',false)}
  <section class="section explainer-status" id="next-step"><div class="wrap status-grid"><div><h2>${accentHeading(d.statusH)}</h2><p>${e(d.statusP)}</p><p class="small-note">${e(consumer[l.code].audio[1])}</p></div><a class="button button-soft" href="${L(l.slug)}#platforms">${e(c.nav[2])} <span aria-hidden="true">↗</span></a></div></section>
  <section class="section related-section"><div class="wrap"><h2>${e(u.relatedH)}</h2><p>${e(u.relatedP)}</p><div class="related-links"><a href="${L(l.slug,otherPage)}">${e(isImage?u.videoLink:u.imageLink)} <span aria-hidden="true">↗</span></a><a href="${L(l.slug)}#levels">${e(u.levelsLink)} <span aria-hidden="true">↗</span></a><a href="${L(l.slug)}#faq">${e(c.nav[3])} <span aria-hidden="true">↗</span></a></div></div></section>
  </main>${footer(l,page)}<script type="application/ld+json">${json(schema)}</script><script src="${script}" defer></script></body></html>`;
}

function legalPage(l, type) {
  const c = copy[l.code], d = type === 'product-privacy' ? productPrivacy[l.code] : legal[l.code][type], canonical = L(l.slug,type);
  const productSlug = l.code === 'es' ? 'es' : 'en';
  const related = type === 'privacy'
    ? `<a href="${L(productSlug,'product-privacy')}">${e(l.code === 'es' ? 'Lee el aviso de privacidad del producto' : 'Read the product privacy notice (English)')} <span aria-hidden="true">↗</span></a>`
    : type === 'product-privacy'
      ? `<a href="${L(l.slug,'privacy')}">${e(d.websitePolicy)} <span aria-hidden="true">↗</span></a>`
      : '';
  const schema = webPageSchema(l,`${d.title} | Browslium`,d.description,canonical);
  return `${head(l,`${d.title} | Browslium`,d.description,canonical,type)}<body data-locale="${l.code}" data-page="${type}"${sessionAttribute}>${suggestion(l)}${header(l,type)}<main id="main" class="legal-main"><section class="legal-hero"><div class="wrap narrow"><p class="eyebrow">Browslium / ${e(d.title)}</p><h1>${e(d.title)}</h1><p class="lead">${e(d.intro)}</p><p class="legal-updated">${e(d.updated)}</p></div></section><div class="wrap legal-layout"><nav class="legal-toc" aria-label="${e(d.title)}">${d.sections.map(([h],i)=>`<a href="#section-${i+1}"><span>${String(i+1).padStart(2,'0')}</span>${e(h)}</a>`).join('')}</nav><div class="legal-content">${related ? `<p class="legal-related">${related}</p>` : ''}${d.sections.map(([h,b],i)=>`<section id="section-${i+1}"><h2>${e(h)}</h2><p>${e(b)}</p></section>`).join('')}<div class="legal-contact"><strong>${e(c.footer[2])}</strong><a href="mailto:admin@browslium.com">admin@browslium.com</a></div></div></div></main>${footer(l,type)}<script type="application/ld+json">${json(schema)}</script><script src="${script}" defer></script></body></html>`;
}

function gateway(redirect = false) {
  const l=locale('en');
  const rootRedirect = redirect ? `<script>(function(){if(!['/','/index.html'].includes(location.pathname))return;var supported={en:'en',es:'es',ru:'ru',yi:'yi',he:'he',fr:'fr',pt:'pt-br'};var saved;try{saved=localStorage.getItem('browslium_language_manual')}catch(e){}var choices=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];if(saved&&supported[String(saved).toLowerCase().split('-')[0]])choices=[saved];var target='en';for(var value of choices){var code=String(value||'').toLowerCase().split('-')[0];if(code==='iw')code='he';if(code==='ji')code='yi';if(supported[code]){target=supported[code];break}}location.replace('/'+target+'/'+location.search+location.hash)}())</script>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Browslium — Choose your language</title><meta name="description" content="Explore Browslium in English, Español, Русский, ייִדיש, עברית, Português (Brasil) or Français."><link rel="canonical" href="${origin}/">${altLinks('',true)}<meta name="theme-color" content="#030509"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/assets/favicon-64.png" sizes="64x64">${rootRedirect}<link rel="stylesheet" href="${stylesheet}"></head><body data-locale="en" data-gateway="true">${suggestion(l)}<main class="gateway"><div class="gateway-card"><img src="/assets/browslium-wordmark-white.webp" width="320" height="77" alt="Browslium"><h1>Browslium</h1><p>Choose your language to explore Browslium.</p><p class="preferred-message" data-preferred-message hidden></p><nav aria-label="Choose your language">${languages.map(x=>`<a href="${L(x.slug)}" lang="${x.code}" dir="${x.dir}" data-language-choice="${x.code}"><span class="language-mark ${x.code==='yi'?'yiddish-mark':''}" aria-hidden="true">${languageMarks[x.code]}</span>${e(x.name)} <span aria-hidden="true">↗</span></a>`).join('')}</nav><a class="gateway-portal" href="${portalLogin}">Client portal (pilot) ↗</a><p class="gateway-portal-note">${e(portalCopy.en[2])}</p></div></main>${footer(l)}<script src="${script}" defer></script></body></html>`;
}

await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(path.join(sourceRoot,'assets'),path.join(output,'assets'),{recursive:true});
await cp(path.join(sourceRoot,'assets','favicon.ico'),path.join(output,'favicon.ico'));
await cp(path.join(sourceRoot,'CNAME'),path.join(output,'CNAME'));
await cp(path.join(sourceRoot,'google80ba342909e82f35.html'),path.join(output,'google80ba342909e82f35.html'));
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'index.html'),gateway(true));
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
  if (productPrivacy[l.code]) {
    const productDir=path.join(dir,'product-privacy'); await mkdir(productDir,{recursive:true});
    await writeFile(path.join(productDir,'index.html'),legalPage(l,'product-privacy'));
  }
}
// App Store Connect already references /privacy. Serve the same product notice
// there, with the English product page as its canonical URL.
const appPrivacyAlias=path.join(output,'privacy');
await mkdir(appPrivacyAlias,{recursive:true});
await writeFile(path.join(appPrivacyAlias,'index.html'),legalPage(locale('en'),'product-privacy'));
await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const pages=['','image-filtering','video-filtering','support','privacy','terms'];
const paths=['/',...languages.flatMap(l=>pages.map(page=>L(l.slug,page))),...pageLanguages('product-privacy').map(l=>L(l.slug,'product-privacy'))];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths.map(p=>{const page=([...pages,'product-privacy']).find(x=>x && p.endsWith(`/${x}/`))||'';return `<url><loc>${origin}${p}</loc>${p==='/'?'':pageLanguages(page).map(l=>`<xhtml:link rel="alternate" hreflang="${l.code}" href="${origin}${L(l.slug,page)}"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${page?L('en',page):'/'}"/>`}</url>`}).join('')}</urlset>`;
await writeFile(path.join(output,'sitemap.xml'),sitemap);
await writeFile(path.join(output,'404.html'),gateway());
console.log(`Built ${paths.length} URLs in ${output}`);
