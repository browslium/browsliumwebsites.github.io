#!/usr/bin/env python3
"""Audit all generated locale routes and reciprocal international SEO links."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).parent / 'dist'
ORIGIN = 'https://browslium.com'
LOCALES = {'en':'en','es':'es','ru':'ru','yi':'yi','he':'he','pt-BR':'pt-br','fr':'fr'}
PAGES = ('', 'support', 'privacy', 'terms')

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
all_paths=['/']+[f'/{slug}/{page+"/" if page else ""}' for slug in LOCALES.values() for page in PAGES]
sitemap=ET.parse(ROOT/'sitemap.xml').getroot()
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9','x':'http://www.w3.org/1999/xhtml'}
sitemap_urls={u.find('s:loc',ns).text for u in sitemap.findall('s:url',ns)}
if sitemap_urls != {ORIGIN+p for p in all_paths}:errors.append(f'sitemap URLs mismatch: {len(sitemap_urls)} vs {len(all_paths)}')
titles=set(); descriptions=set()
for code,slug in LOCALES.items():
    for page in PAGES:
        route=f'/{slug}/{page+"/" if page else ""}'
        filename=ROOT/slug/page/'index.html' if page else ROOT/slug/'index.html'
        if not filename.exists():errors.append(f'missing {route}');continue
        p=Page();p.feed(filename.read_text())
        html=p.find('html')
        if len(html)!=1 or html[0].get('lang')!=code or html[0].get('dir')!=('rtl' if code in ('he','yi') else 'ltr'):errors.append(f'lang/dir {route}')
        if not p.title or p.title in titles:errors.append(f'missing or duplicate title {route}')
        titles.add(p.title)
        desc=p.find('meta',name='description')
        if len(desc)!=1 or not desc[0].get('content') or desc[0]['content'] in descriptions:errors.append(f'missing or duplicate description {route}')
        if desc:descriptions.add(desc[0].get('content'))
        canon=p.find('link',rel='canonical')
        if len(canon)!=1 or canon[0].get('href')!=ORIGIN+route:errors.append(f'canonical {route}')
        expected={**{lang:ORIGIN+f'/{s}/{page+"/" if page else ""}' for lang,s in LOCALES.items()},'x-default':ORIGIN+(f'/en/{page}/' if page else '/')}
        actual={x['hreflang']:x.get('href') for x in p.find('link',rel='alternate') if 'hreflang' in x}
        if actual!=expected:errors.append(f'hreflang {route}: {actual}')
        og=p.find('meta',property='og:url')
        if len(og)!=1 or og[0].get('content')!=ORIGIN+route:errors.append(f'og:url {route}')
        if not p.find('meta',property='og:locale'):errors.append(f'og:locale {route}')
        if not any(x.get('inLanguage')==code for x in p.scripts):errors.append(f'localized structured data {route}')
        for img in p.find('img'):
            if 'alt' not in img:errors.append(f'img without alt {route}')
        for link in p.find('a'):
            href=link.get('href','')
            if href.startswith('/') and not href.startswith(('/assets/','/'+slug+'/')):
                if 'data-language-choice' not in link:errors.append(f'locale-changing link {route}: {href}')
            if href.startswith('/') and not href.startswith('/assets/'):
                target=href.split('#')[0]
                if target and target not in all_paths:errors.append(f'broken internal link {route}: {href}')
        if not page:
            if len(p.find('details'))<23:errors.append(f'FAQ count {route}')
            text=filename.read_text()
            if text.index('id="faq"')>text.index('id="donate"'):errors.append(f'FAQ after donate {route}')
            if 'FAQPage' in text:errors.append(f'unsupported FAQPage markup {route}')
            if len(p.find('button',**{'class':'level-choice'}))<13:errors.append(f'levels missing {route}')

if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(all_paths)} URLs, reciprocal hreflang, self canonicals, localized metadata, all FAQs and levels')
