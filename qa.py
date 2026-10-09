#!/usr/bin/env python3
"""Audit all generated locale routes and reciprocal international SEO links."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).parent / 'dist'
CSS_URL = '/assets/site.css?v=' + hashlib.sha256((ROOT/'assets/site.css').read_bytes()).hexdigest()[:12]
JS_URL = '/assets/site.js?v=' + hashlib.sha256((ROOT/'assets/site.js').read_bytes()).hexdigest()[:12]
VERIFICATION_FILE = 'google80ba342909e82f35.html'
if (ROOT / VERIFICATION_FILE).read_text().strip() != f'google-site-verification: {VERIFICATION_FILE}':
    raise SystemExit('Google Search Console verification file missing or changed')
ORIGIN = 'https://browslium.com'
LOCALES = {'en':'en','es':'es','ru':'ru','yi':'yi','he':'he','pt-BR':'pt-br','fr':'fr'}
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
if not gateway.find('link',rel='stylesheet',href=CSS_URL) or not gateway.find('script',src=JS_URL):errors.append('gateway asset versions')
if gateway.find('link',rel='canonical')[0].get('href')!=ORIGIN+'/':errors.append('gateway canonical')
if {x['hreflang']:x.get('href') for x in gateway.find('link',rel='alternate')} != {**{lang:ORIGIN+f'/{slug}/' for lang,slug in LOCALES.items()},'x-default':ORIGIN+'/'}:errors.append('gateway hreflang')
if not (ROOT/'favicon.ico').is_file() or not (ROOT/'assets/favicon-64.png').is_file():errors.append('hostname favicon files')
if not gateway.find('link',rel='icon',href='/favicon.ico'):errors.append('gateway favicon link')
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
            faq_block=text.split('class="section faq-section"',1)[1].split('class="section donate-section"',1)[0]
            if faq_block.count('<details>')!=20:errors.append(f'FAQ count {route}')
            if text.index('id="faq"')>text.index('id="donate"'):errors.append(f'FAQ after donate {route}')
            if 'FAQPage' in text:errors.append(f'unsupported FAQPage markup {route}')
            if len(p.find('section',**{'data-showcase':'image'}))!=1 or len(p.find('section',**{'data-showcase':'video'}))!=1:
                errors.append(f'photo/video showcases missing {route}')
            if 'problem-section' in text or 'how-section' in text:
                errors.append(f'outdated opening sections present {route}')
            if text.index('data-showcase="image"') > text.index('data-showcase="video"'):
                errors.append(f'photo showcase must precede video {route}')
            if 'id="how"' not in text:
                errors.append(f'how navigation anchor missing {route}')
            if 'id="demo"' in text or 'Choose the filtering policy' in text:
                errors.append(f'outdated illustrative demo {route}')
            if text.count('class="platform-card"')!=4:errors.append(f'four platform cards {route}')
            if 'id="audio-text"' not in text or 'id="android-apps"' not in text:errors.append(f'new content sections {route}')
            if 'class="hero-display"' not in text:errors.append(f'hero comparison {route}')
            if 'browslium-wordmark-white.webp' not in text or 'browslium-wordmark-emerald.webp' not in text:errors.append(f'official brand wordmarks {route}')
            if 'audience-account-note' not in text:errors.append(f'adult account note missing {route}')
            if 'Test result' in text or 'SAM 3.1' in text or 'Silent clips from controlled' in text or 'Under development and testing' in text:
                errors.append(f'outdated visible product copy {route}')
            ids={x.get('id') for _,x in p.tags if x.get('id')}
            for link in p.find('a'):
                if 'button-primary' in link.get('class','') and link.get('href','').startswith('#') and link['href'][1:] not in ids:
                    errors.append(f'broken scroll CTA {route}: {link["href"]}')
        if page in ('image-filtering','video-filtering'):
            expected_levels=7 if page=='image-filtering' else 6
            if len(p.find('li')) < expected_levels:errors.append(f'explainer levels missing {route}')
            kind='image' if page=='image-filtering' else 'video'
            if len(p.find('section',**{'data-showcase':kind}))!=1:errors.append(f'explainer showcase missing {route}')
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
