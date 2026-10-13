#!/usr/bin/env python3
"""Audit all generated locale routes and reciprocal international SEO links."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET

ROOT = Path(__file__).parent / 'dist'
CSS_URL = '/assets/site.css?v=' + hashlib.sha256((ROOT/'assets/site.css').read_bytes()).hexdigest()[:12]
JS_URL = '/assets/site.js?v=' + hashlib.sha256((ROOT/'assets/site.js').read_bytes()).hexdigest()[:12]
VERIFICATION_FILE = 'google80ba342909e82f35.html'
if (ROOT / VERIFICATION_FILE).read_text().strip() != f'google-site-verification: {VERIFICATION_FILE}':
    raise SystemExit('Google Search Console verification file missing or changed')
ORIGIN = 'https://browslium.com'
PORTAL_LOGIN = 'https://app.browslium.com/login'
PORTAL_SETUP = 'https://app.browslium.com/setup'
LOCALES = {'en':'en','es':'es','ru':'ru','yi':'yi','he':'he','pt-BR':'pt-br','fr':'fr'}
TEXT_POLICY = {
    'en': ('Visible text passes through unchanged', 'without semantic analysis'),
    'es': ('El texto visible pasa intacto', 'sin análisis semántico'),
    'ru': ('Видимый текст проходит без изменений', 'семантического анализа'),
    'yi': ('דער זעבאַרער טעקסט גייט דורך אומגעענדערט', 'אָן סעמאַנטישע אַנאַליז'),
    'he': ('טקסט גלוי עובר ללא שינוי', 'ללא ניתוח סמנטי'),
    'pt-BR': ('O texto visível passa intacto', 'sem análise semântica'),
    'fr': ('Le texte visible passe intact', 'sans analyse sémantique'),
}
HOME_TEXT_POLICY = {
    'en': 'Written text passes through unchanged today.',
    'es': 'Hoy el texto escrito pasa intacto.',
    'ru': 'Сейчас написанный текст проходит без изменений.',
    'yi': 'הײַנט גייט געשריבן טעקסט דורך אומגעענדערט.',
    'he': 'כיום טקסט כתוב עובר ללא שינוי.',
    'pt-BR': 'Hoje o texto escrito passa intacto.',
    'fr': 'Aujourd’hui, le texte écrit passe intact.',
}
HOME_FUTURE_DEMO = {
    'en': ('future Text/Audio concepts', 'visible text passes through unchanged', 'Illustrative future demo · Not available today', 'Text and audio: future concepts'),
    'es': ('conceptos futuros de texto y audio', 'texto visible pasa intacto', 'Demo futura ilustrativa · No disponible hoy', 'Texto y audio: conceptos futuros'),
    'ru': ('будущие концепции для текста и аудио', 'видимый текст проходит без изменений', 'Иллюстрация будущей функции · Сейчас недоступна', 'Текст и аудио: будущие идеи'),
    'yi': ('צוקונפֿטיקע באַגריפֿן פֿאַר טעקסט און אוידיאָ', 'זעבאַרער טעקסט גייט איצט דורך אומגעענדערט', 'צוקונפֿטיקער בײַשפּיל · איצט נישט פֿאַראַן', 'טעקסט און אוידיאָ: צוקונפֿטיקע באַגריפֿן'),
    'he': ('המחשות עתידיות לטקסט ולשמע', 'טקסט גלוי עובר כיום ללא שינוי', 'הדגמה עתידית להמחשה · אינה זמינה כיום', 'טקסט ושמע: רעיונות לעתיד'),
    'pt-BR': ('conceitos futuros de texto e áudio', 'texto visível passa intacto', 'Demonstração futura ilustrativa · Indisponível hoje', 'Texto e áudio: conceitos futuros'),
    'fr': ('concepts futurs pour le texte et l’audio', 'texte visible passe intact', 'Démo future illustrative · Indisponible aujourd’hui', 'Texte et audio : concepts futurs'),
}
LOGIN_LABELS = {'en':'Sign In','es':'Iniciar sesión','ru':'Войти',
                'yi':'זיך אָנמעלדן','he':'כניסה','pt-BR':'Entrar',
                'fr':'Se connecter'}
PAGES = ('', 'image-filtering', 'video-filtering', 'support', 'privacy', 'terms')
PRODUCT_PAGE = 'product-privacy'
PRODUCT_LOCALES = {'en':'en', 'es':'es'}
SOCIAL_URLS = {
    'https://x.com/Browslium',
    'https://www.instagram.com/browslium/',
    'https://www.youtube.com/@Browslium',
    'https://www.tiktok.com/@browslium',
}

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags=[]; self.scripts=[]; self.text=[]; self.stack=[]; self.title=''; self.in_title=False
        self.in_json=False; self.json_buf=''
    def handle_starttag(self, tag, attrs):
        data=dict(attrs); self.tags.append((tag,data)); self.stack.append(tag)
        if tag=='title': self.in_title=True
        if tag=='script' and data.get('type')=='application/ld+json':self.in_json=True;self.json_buf=''
    def handle_endtag(self, tag):
        if tag=='title':self.in_title=False
        if tag=='script' and self.in_json:
            self.scripts.append(json.loads(self.json_buf));self.in_json=False
        if tag in self.stack:self.stack.pop(len(self.stack)-1-self.stack[::-1].index(tag))
    def handle_data(self, data):
        if self.in_title:self.title+=data
        if self.in_json:self.json_buf+=data
        elif data.strip():self.text.append(data.strip())
    def find(self,tag,**attrs):
        return [x for t,x in self.tags if t==tag and all(x.get(k)==v for k,v in attrs.items())]

errors=[]
app_privacy_alias=ROOT/'privacy/index.html'
english_product_notice=ROOT/'en/product-privacy/index.html'
if not app_privacy_alias.is_file() or app_privacy_alias.read_bytes()!=english_product_notice.read_bytes():
    errors.append('App Store privacy alias must match the English product notice')
all_paths=['/']+[f'/{slug}/{page+"/" if page else ""}' for slug in LOCALES.values() for page in PAGES]+[f'/{slug}/{PRODUCT_PAGE}/' for slug in PRODUCT_LOCALES.values()]
sitemap=ET.parse(ROOT/'sitemap.xml').getroot()
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9','x':'http://www.w3.org/1999/xhtml'}
sitemap_urls={u.find('s:loc',ns).text for u in sitemap.findall('s:url',ns)}
if sitemap_urls != {ORIGIN+p for p in all_paths}:errors.append(f'sitemap URLs mismatch: {len(sitemap_urls)} vs {len(all_paths)}')
for entry in sitemap.findall('s:url',ns):
    url=entry.find('s:loc',ns).text
    if url==ORIGIN+'/':continue
    route=url.removeprefix(ORIGIN)
    page=next((part for part in (*PAGES, PRODUCT_PAGE) if part and route.endswith('/'+part+'/')),'')
    page_locales=PRODUCT_LOCALES if page==PRODUCT_PAGE else LOCALES
    expected={**{lang:ORIGIN+f'/{slug}/{page+"/" if page else ""}' for lang,slug in page_locales.items()},'x-default':ORIGIN+(f'/en/{page}/' if page else '/')}
    actual={link.attrib.get('hreflang'):link.attrib.get('href') for link in entry.findall('x:link',ns)}
    if actual!=expected:errors.append(f'sitemap hreflang {route}')
gateway=Page();gateway.feed((ROOT/'index.html').read_text())
if len([a for a in gateway.find('a', href=PORTAL_LOGIN)
        if 'gateway-portal' in a.get('class','').split()])!=1:
    errors.append('gateway login route')
if not gateway.find('p', **{'class':'gateway-portal-note'}):
    errors.append('gateway pilot notice')
if not gateway.find('link',rel='stylesheet',href=CSS_URL) or not gateway.find('script',src=JS_URL):errors.append('gateway asset versions')
if gateway.find('link',rel='canonical')[0].get('href')!=ORIGIN+'/':errors.append('gateway canonical')
if {x['hreflang']:x.get('href') for x in gateway.find('link',rel='alternate')} != {**{lang:ORIGIN+f'/{slug}/' for lang,slug in LOCALES.items()},'x-default':ORIGIN+'/'}:errors.append('gateway hreflang')
if not (ROOT/'favicon.ico').is_file() or not (ROOT/'assets/favicon-64.png').is_file():errors.append('hostname favicon files')
if not gateway.find('link',rel='icon',href='/favicon.ico'):errors.append('gateway favicon link')
if 'location.replace' not in (ROOT/'index.html').read_text() or 'location.replace' in (ROOT/'404.html').read_text():
    errors.append('root-only locale redirect')
for asset in ('browslium-wordmark-white.webp','browslium-wordmark-emerald.webp'):
    if not (ROOT/'assets'/asset).is_file():errors.append(f'missing brand asset {asset}')
for icon in ('android','ios','macos','windows','x','instagram','youtube','tiktok'):
    if not (ROOT/'assets/icons'/f'{icon}.svg').is_file():errors.append(f'missing SVG icon {icon}')
titles=set(); descriptions=set()
for code,slug in LOCALES.items():
    for page in (*PAGES, *((PRODUCT_PAGE,) if code in PRODUCT_LOCALES else ())):
        route=f'/{slug}/{page+"/" if page else ""}'
        filename=ROOT/slug/page/'index.html' if page else ROOT/slug/'index.html'
        if not filename.exists():errors.append(f'missing {route}');continue
        p=Page();p.feed(filename.read_text())
        if page in ('image-filtering', 'video-filtering'):
            visible_text=' '.join(p.text)
            if not all(marker in visible_text for marker in (*TEXT_POLICY[code], 'GPU')):
                errors.append(f'text pass-through policy missing {route}')
        portal_links=[a for a in p.find('a') if a.get('href','').startswith('https://app.browslium.com/')]
        if any(a.get('href') not in (PORTAL_LOGIN,PORTAL_SETUP) for a in portal_links):
            errors.append(f'unexpected portal route {route}')
        if len([a for a in portal_links if a.get('href')==PORTAL_LOGIN]) < 2:
            errors.append(f'login route {route}')
        if len([a for a in portal_links if a.get('href')==PORTAL_SETUP]) != (2 if page in ('','image-filtering','video-filtering') else 1):
            errors.append(f'setup route {route}')
        if len([a for a in p.find('a') if 'data-session-link' in a]) != 2:
            errors.append(f'verified-session navigation contract {route}')
        if any('data-session-endpoint' in attrs or 'data-dashboard-url' in attrs for attrs in p.find('body')):
            errors.append(f'unverified session integration emitted {route}')
        if not page and (LOGIN_LABELS[code] not in p.text or
                         not p.find('p', **{'class':'portal-pilot-note'}) or
                         len([a for a in portal_links if a.get('href')==PORTAL_SETUP and 'button-primary' in a.get('class','').split()]) != 1 or
                         any(a.get('href')==PORTAL_LOGIN and 'button-primary' in a.get('class','').split() for a in portal_links)):
            errors.append(f'homepage pilot actions or notice {route}')
        if len(p.find('section',**{'class':'donation-band'}))!=1 or len(p.find('section',**{'class':'newsletter-band'}))!=1:
            errors.append(f'shared closing bands {route}')
        if len([x for x in p.find('input',type='email') if 'disabled' in x])!=1 or len([x for x in p.find('button') if x.get('type')=='submit' and 'disabled' in x])!=1:
            errors.append(f'newsletter must not collect email yet {route}')
        if not p.find('link',rel='stylesheet',href=CSS_URL) or not p.find('script',src=JS_URL):errors.append(f'asset versions {route}')
        html=p.find('html')
        if len(html)!=1 or html[0].get('lang')!=code or html[0].get('dir')!=('rtl' if code in ('he','yi') else 'ltr'):errors.append(f'lang/dir {route}')
        if not p.title or p.title in titles:errors.append(f'missing or duplicate title {route}')
        titles.add(p.title)
        desc=p.find('meta',name='description')
        if len(desc)!=1 or not desc[0].get('content') or desc[0]['content'] in descriptions:errors.append(f'missing or duplicate description {route}')
        if desc:descriptions.add(desc[0].get('content'))
        canon=p.find('link',rel='canonical')
        if len(canon)!=1 or canon[0].get('href')!=ORIGIN+route:errors.append(f'canonical {route}')
        page_locales=PRODUCT_LOCALES if page==PRODUCT_PAGE else LOCALES
        expected={**{lang:ORIGIN+f'/{s}/{page+"/" if page else ""}' for lang,s in page_locales.items()},'x-default':ORIGIN+(f'/en/{page}/' if page else '/')}
        actual={x['hreflang']:x.get('href') for x in p.find('link',rel='alternate') if 'hreflang' in x}
        if actual!=expected:errors.append(f'hreflang {route}: {actual}')
        og=p.find('meta',property='og:url')
        if len(og)!=1 or og[0].get('content')!=ORIGIN+route:errors.append(f'og:url {route}')
        if not p.find('meta',property='og:locale'):errors.append(f'og:locale {route}')
        if not p.find('link',rel='icon',href='/favicon.ico'):errors.append(f'favicon link {route}')
        if not any(x.get('inLanguage')==code for x in p.scripts):errors.append(f'localized structured data {route}')
        if not any(set(x.get('isPartOf',{}).get('publisher',{}).get('sameAs',[]))==SOCIAL_URLS for x in p.scripts):errors.append(f'official social identity {route}')
        if not SOCIAL_URLS.issubset({a.get('href') for a in p.find('a')}):errors.append(f'official social links {route}')
        for img in p.find('img'):
            if 'alt' not in img:errors.append(f'img without alt {route}')
        for link in p.find('a'):
            href=link.get('href','')
            if href.startswith('/') and not href.startswith(('/assets/','/'+slug+'/')):
                if 'data-language-choice' not in link and href!='/en/product-privacy/':errors.append(f'locale-changing link {route}: {href}')
            if href.startswith('/') and not href.startswith('/assets/'):
                target=href.split('#')[0]
                if target and target not in all_paths:errors.append(f'broken internal link {route}: {href}')
        if not page:
            text=filename.read_text()
            if HOME_TEXT_POLICY[code] not in ' '.join(p.text):
                errors.append(f'current text pass-through policy missing {route}')
            future_meta, unchanged_meta, demo_note, future_link = HOME_FUTURE_DEMO[code]
            description=desc[0].get('content','') if desc else ''
            if (not all(marker in description for marker in (future_meta, unchanged_meta)) or
                not p.find('meta',property='og:description',content=description) or
                not any(x.get('description')==description for x in p.scripts)):
                errors.append(f'future text metadata missing {route}')
            if demo_note not in p.text or not p.find('p', **{'class':'small-note text-demo-note'}):
                errors.append(f'illustrative future text demo label missing {route}')
            if future_link not in p.text:
                errors.append(f'future text CTA missing {route}')
            concept=p.find('svg',**{'class':'text-concept-svg'})
            if len(concept)!=1:
                errors.append(f'future text SVG missing {route}')
            else:
                source=concept[0].get('data-demo-original','')
                masked=concept[0].get('data-demo-masked','')
                expected=''.join(char if char.isspace() else '*' for char in source if not unicodedata.combining(char))
                if source.count(' ')<2 or not any(char in source for char in ',.!?،؛') or masked!=expected:
                    errors.append(f'full-sentence character mask {route}')
                svg_block=text.split('class="text-concept-svg"',1)[1].split('</svg>',1)[0]
                if (svg_block.count('<p>') != 4 or svg_block.count('class="tablet-masked"') != 2 or
                    svg_block.count('*') < 15):
                    errors.append(f'tablet paragraphs with masked sentences {route}')
            faq_block=text.split('class="section faq-section"',1)[1].split('</main>',1)[0]
            if faq_block.count('<details>')!=20:errors.append(f'FAQ count {route}')
            if text.index('id="faq"')>text.index('id="donate"'):errors.append(f'FAQ after donate {route}')
            if 'FAQPage' in text:errors.append(f'unsupported FAQPage markup {route}')
            if len(p.find('section',**{'data-showcase':'image'}))!=1 or len(p.find('section',**{'data-showcase':'video'}))!=1:
                errors.append(f'photo/video showcases missing {route}')
            if text.count('class="showcase-foot"><a class="text-link"')!=2:
                errors.append(f'showcase navigation must stay secondary {route}')
            if 'problem-section' in text or 'how-section' in text:
                errors.append(f'outdated opening sections present {route}')
            if text.index('data-showcase="image"') > text.index('data-showcase="video"'):
                errors.append(f'photo showcase must precede video {route}')
            if 'id="how"' not in text:
                errors.append(f'how navigation anchor missing {route}')
            if 'id="demo"' in text or 'Choose the filtering policy' in text:
                errors.append(f'outdated illustrative demo {route}')
            if text.count('class="platform-card"')!=4:errors.append(f'four platform cards {route}')
            if not (text.index('id="text-future"') < text.index('id="audio-text"') < text.index('id="android-apps"')):errors.append(f'text then audio then Android {route}')
            if 'class="hero-display"' not in text:errors.append(f'hero comparison {route}')
            if 'footer-logo-slot' not in text or 'browslium-wordmark-emerald.webp' not in text:errors.append(f'footer logo {route}')
            if 'audiences-section' in text or 'id="for-you"' in text:errors.append(f'removed audience section {route}')
            if 'Fully supported' in text:errors.append(f'unsupported platform claim {route}')
            if 'text-concept-svg' not in text or 'audio-concept-svg' not in text:
                errors.append(f'honest future concept demo {route}')
            text_section=text.split('id="text-future"',1)[1].split('id="audio-text"',1)[0]
            if ('GPU' in text_section or 'text-street-sign-v2.png' not in text_section or
                'blog-photo-window' not in text_section or
                'tablet-copy' not in text_section or text_section.count('class="phone-mask"') != 2):
                errors.append(f'tablet and photographic text demo {route}')
            audio_section=text.split('id="audio-text"',1)[1].split('id="android-apps"',1)[0]
            if 'data-muted-regions="2"' not in audio_section or audio_section.count('stroke="#ff6676"') != 2:
                errors.append(f'two outlined audio mute regions {route}')
            if 'Test result' in text or 'SAM 3.1' in text or 'Silent clips from controlled' in text or 'Under development and testing' in text:
                errors.append(f'outdated visible product copy {route}')
            ids={x.get('id') for _,x in p.tags if x.get('id')}
            for link in p.find('a'):
                if 'button-primary' in link.get('class','') and link.get('href','').startswith('#') and link['href'][1:] not in ids:
                    errors.append(f'broken scroll CTA {route}: {link["href"]}')
        if page in ('image-filtering','video-filtering'):
            text=filename.read_text()
            expected_levels=7 if page=='image-filtering' else 6
            if len([b for b in p.find('button') if 'data-showcase-level' in b]) != expected_levels+1:
                errors.append(f'explainer levels missing {route}')
            kind='image' if page=='image-filtering' else 'video'
            if len(p.find('section',**{'data-showcase':kind}))!=1:errors.append(f'explainer showcase missing {route}')
            next_href=f'/{slug}/video-filtering/' if kind=='image' else f'/{slug}/#text-future'
            if not any(a.get('href')==next_href and 'text-link' in a.get('class','').split() for a in p.find('a')):
                errors.append(f'explainer next-step CTA {route}')
            if kind=='video' and HOME_FUTURE_DEMO[code][3] not in p.text:
                errors.append(f'explainer future text CTA missing {route}')
            hero=text.split('class="explainer-hero"',1)[1].split('</section>',1)[0]
            if (f'class="button button-primary" href="{PORTAL_SETUP}"' not in hero or
                'class="text-link" href="#examples"' not in hero or
                'class="portal-pilot-note"' not in hero):
                errors.append(f'explainer pilot action and examples {route}')
        if page==PRODUCT_PAGE:
            text=filename.read_text()
            if len(p.find('section'))<12:errors.append(f'product notice sections missing {route}')
            for term in ('Google','Microsoft','Resend','Stripe','DigitalOcean','admin@browslium.com','30 N Gould St'):
                if term not in text:errors.append(f'product notice missing {term} {route}')
            if f'/{slug}/privacy/' not in {a.get('href') for a in p.find('a')}:errors.append(f'website privacy crosslink {route}')
        if page in ('','image-filtering','video-filtering'):
            for kind, expected in (('image',8),('video',7)):
                if page and page != f'{kind}-filtering':continue
                sections=p.find('section',**{'data-showcase':kind})
                if len(sections)!=1:continue
                if len([b for b in p.find('button') if 'data-showcase-level' in b]) < expected:
                    errors.append(f'{kind} policy choices missing {route}')
                if len([b for b in p.find('button') if 'data-showcase-scene' in b]) < 3:
                    errors.append(f'{kind} scenes missing {route}')
                if kind=='video':
                    if len([x for x in p.find('video') if 'data-showcase-video' in x])!=1:errors.append(f'video player missing {route}')
                    if not any(x.get('data-locale-slug')==slug for x in sections):errors.append(f'localized blocking video map {route}')

media=ROOT/'assets'/'media'
manifest=json.loads((media/'manifest.json').read_text())
if len(manifest)!=68:errors.append(f'media manifest count: {len(manifest)}')
for item in manifest:
    filename=ROOT/'assets'/item['file']
    if not filename.is_file() or filename.stat().st_size!=item['bytes']:
        errors.append(f'missing or changed media asset: {item["file"]}')
    elif hashlib.sha256(filename.read_bytes()).hexdigest()!=item['sha256']:
        errors.append(f'media checksum mismatch: {item["file"]}')
for number in range(1,4):
    for level in ('original',*[str(x) for x in range(1,8)]):
        if not (media/'images'/f'photo-{number}-{level}.webp').is_file():errors.append(f'missing photo {number}-{level}')
    for level in ('original',*[str(x) for x in range(1,5)]):
        if not (media/'videos'/f'video-{number}-{level}.mp4').is_file():errors.append(f'missing video {number}-{level}')
for slug in LOCALES.values():
    if not (media/'videos'/f'blocked-{slug}.mp4').is_file():errors.append(f'missing localized block video {slug}')

if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(all_paths)} URLs, reciprocal hreflang, self canonicals, localized metadata, 20 FAQs per locale, all levels and brand assets')
