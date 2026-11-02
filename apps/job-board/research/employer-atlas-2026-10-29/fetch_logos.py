#!/usr/bin/env python3
"""Build an offline employer-icon pack from public, attributed website assets.

Requires Pillow; SVG wordmarks additionally use Node and Sharp (set
ATLAS_LOGO_NODE and ATLAS_LOGO_SHARP when they are outside the default paths).
Run with a Python installation that provides Pillow. Downloads are
bounded (eight workers, 8-second requests, 2 MiB per response). Existing successful
entries are reused; pass --refresh to fetch again. No keys, browser automation,
authentication, or runtime logo service is required by the resulting atlas.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import io
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from datetime import date
import xml.etree.ElementTree as ET

from PIL import Image

ROOT = Path(__file__).resolve().parent
MAX_BYTES = 2 * 1024 * 1024
DOMAIN_OVERRIDES = {
    'hugging-face': 'huggingface.co',
    'framatome': 'framatome.com',
    'schneider-electric': 'se.com',
    'amentum': 'amentum.com',
    'pacific-fusion': 'pacificfusion.com',
    'aalo-atomics': 'aalo.com',
    'fervo-energy': 'fervoenergy.com',
    'carboncapture': 'carboncapture.com',
    'energy-vault': 'energyvault.com',
    'ascend-elements': 'ascendelements.com',
    'lilac-solutions': 'lilacsolutions.com',
    'enphase-energy': 'enphase.com',
    'planet-labs': 'planet.com',
    'loft-orbital': 'loftorbital.com',
    'skild-ai': 'skild.ai',
    'torc-robotics': 'torc.ai',
    'crispr-therapeutics': 'crisprtx.com',
    'parker-hannifin': 'parker.com',
    'abb': 'global.abb',
    'dropbox': 'dropbox.com',
    'spotify': 'spotify.com',
    'safetywing': 'safetywing.com',
}
STRIP_PREFIXES = {'www', 'careers', 'jobs', 'talentcommunity', 'ir', 'corporate',
                  'livebrighterbenefits', 'about'}
VENDOR_DOMAINS = {'greenhouse.io', 'lever.co', 'workable.com', 'rippling.com',
                  'jobvite.com', 'hrmdirect.com', 'applytojob.com', 'pinpointhq.com',
                  'ttcportals.com', 'myworkdayjobs.com', 'workday.com'}
ASSET_OVERRIDES = {
    'eos-energy': {
        'url': 'https://www.eose.com/wp-content/uploads/2022/03/logo.png',
        'status': 'official_site_icon',
        'note': 'Official company header wordmark used in place of the site mascot favicon.',
        'attributionPage': 'https://www.eose.com/',
    },
    'sierra-space': {
        'url': 'https://www.sierraspace.com/wp-content/uploads/2024/04/logo-no-tagline-r-1.svg',
        'status': 'official_site_icon',
        'note': 'Official white company header wordmark, safely rasterized to PNG on navy for contrast; used in place of a questionable cached site icon.',
        'background': '#102638',
        'attributionPage': 'https://www.sierraspace.com/',
    },
    'ascend-elements': {
        'url': 'https://mma.prnewswire.com/media/1930392/Ascend_Elements_Logo.jpg',
        'status': 'employer_press_asset',
        'note': 'Employer-supplied logo linked from its PR Newswire announcement; retrieved because its website was unavailable.',
        'attributionPage': 'https://www.prnewswire.co.uk/news-releases/ascend-elements-raises-additional-162-million-to-build-sustainable-lithium-ion-battery-materials-in-united-states-302065369.html',
    },
    'array-technologies': {
        'url': 'https://arraytechinc.com/wp-content/uploads/2022/08/Array-logo-1.png',
        'status': 'official_site_icon',
        'note': 'Official company wordmark linked from the employer website header.',
        'attributionPage': 'https://arraytechinc.com/',
    },
    'roper-technologies': {
        'url': 'https://www.google.com/s2/favicons?domain=www.ropertech.com&sz=64',
        'status': 'cached_site_icon',
        'note': 'Company website icon delivered through Google favicon cache; www host has a separate cache entry.',
    },
    'rockwell-automation': {
        'url': 'https://www.google.com/s2/favicons?domain=www.rockwellautomation.com&sz=64',
        'status': 'cached_site_icon',
        'note': 'Company website icon delivered through Google favicon cache; www host has a separate cache entry.',
    },
    'sierra-nevada-corporation': {
        'url': 'https://www.google.com/s2/favicons?domain=sncorp.com&sz=64',
        'status': 'cached_site_icon',
        'note': 'SNC icon cached for its alternate corporate domain sncorp.com; the directory domain returned a certificate error. Cached branding may lag the employer site.',
    },
}


def domain_for(employer):
    if employer['id'] in DOMAIN_OVERRIDES:
        return DOMAIN_OVERRIDES[employer['id']]
    parts = urllib.parse.urlparse(employer['careerUrl']).hostname.split('.')
    while len(parts) > 2 and parts[0] in STRIP_PREFIXES:
        parts.pop(0)
    domain = '.'.join(parts)
    if any(domain == x or domain.endswith('.' + x) for x in VENDOR_DOMAINS):
        raise ValueError('Unmapped ATS host: ' + domain)
    return domain


def download(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; EmployerAtlasAssetPack/1.0)',
        'Accept': 'image/avif,image/webp,image/png,image/*,text/html;q=0.8,*/*;q=0.5',
    })
    with urllib.request.urlopen(req, timeout=8) as response:
        if int(response.headers.get('Content-Length', '0')) > MAX_BYTES:
            raise ValueError('Asset too large')
        blob = response.read(MAX_BYTES + 1)
        if len(blob) > MAX_BYTES:
            raise ValueError('Asset too large')
        return blob, response.headers.get('Content-Type', ''), response.url


class IconParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.icons = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag != 'link' or 'href' not in attrs:
            return
        rel = attrs.get('rel', '').lower()
        if not any(x in rel.split() for x in ['icon', 'apple-touch-icon', 'apple-touch-icon-precomposed']):
            return
        href = attrs['href']
        # Raster icons preserve the original brand mark without executing SVG.
        if 'mask-icon' in rel or href.lower().split('?')[0].endswith('.svg'):
            return
        size = re.search(r'(\d+)x(\d+)', attrs.get('sizes', ''))
        size = int(size.group(1)) if size else 32
        score = 4 if 64 <= size <= 256 else 2
        if 'apple-touch-icon' in rel:
            score += 2
        self.icons.append((score, href))


def normalize(blob):
    if b'<svg' in blob[:1000]:
        # Rasterize only self-contained SVGs. Do not execute scripts or fetch
        # external styles, images, fonts, or entities while building the pack.
        if any(token in blob.lower() for token in [b'<!doctype', b'<!entity', b'<script', b'<foreignobject']):
            raise ValueError('Unsafe SVG markup')
        svg = ET.fromstring(blob)
        if svg.tag.split('}')[-1] != 'svg':
            raise ValueError('Not an SVG document')
        for element in svg.iter():
            for key, value in element.attrib.items():
                if key.split('}')[-1] == 'href' and not (value.startswith('#') or re.match(r'^data:image/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$', value)):
                    raise ValueError('External SVG reference')
            if element.tag.split('}')[-1] == 'style' and re.search(r'@import|url\(\s*[\"\']?(?!#)', element.text or ''):
                raise ValueError('External SVG styles')
        node = os.environ.get('ATLAS_LOGO_NODE', 'node')
        sharp = os.environ.get('ATLAS_LOGO_SHARP', 'sharp')
        script = "const sharp=require(process.argv[1]);const chunks=[];process.stdin.on('data',c=>chunks.push(c));process.stdin.on('end',async()=>{try{const b=await sharp(Buffer.concat(chunks),{limitInputPixels:16777216}).resize({width:96,height:96,fit:'inside'}).png().toBuffer();process.stdout.write(b)}catch(e){process.stderr.write(String(e));process.exit(1)}});"
        result = subprocess.run([node, '-e', script, sharp], input=blob, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=10, check=True)
        blob = result.stdout
    with Image.open(io.BytesIO(blob)) as source:
        if source.format == 'ICO':
            sizes = source.ico.sizes()
            preferred = min(sizes, key=lambda s: abs(s[0] - 96))
            source = source.ico.getimage(preferred)
        source.load()
        if min(source.size) < 12 or max(source.size) > 4096:
            raise ValueError('Unusable icon dimensions')
        icon = source.convert('RGBA')
        icon.thumbnail((96, 96), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        icon.save(output, format='PNG', optimize=True)
        blob = output.getvalue()
        # Keep the original proportions; object-fit:contain handles card layout.
        return blob, icon.size


def fetch_employer(employer):
    domain = domain_for(employer)
    base = 'https://' + domain + '/'
    override = ASSET_OVERRIDES.get(employer['id'])
    candidates = [override['url']] if override else []
    if not override:
        try:
            html, content_type, final_url = download(base)
            if 'html' in content_type:
                parser = IconParser()
                parser.feed(html.decode('utf-8', errors='replace'))
                for score, href in sorted(parser.icons, reverse=True):
                    target = urllib.parse.urljoin(final_url, href)
                    if target.startswith(('https://', 'http://')) and target not in candidates:
                        candidates.append(target)
        except Exception:
            pass
    candidates = candidates[:3]
    candidates.append(base + 'favicon.ico')
    candidates.append('https://www.google.com/s2/favicons?' + urllib.parse.urlencode({'domain': domain, 'sz': 64}))
    errors = []
    for candidate in candidates:
        try:
            raw, _, final_url = download(candidate)
            blob, size = normalize(raw)
            cached = 'google.com/s2/favicons' in candidate
            overridden = override and candidate == override['url']
            if overridden and override.get('background'):
                mark = Image.open(io.BytesIO(blob)).convert('RGBA')
                canvas = Image.new('RGBA', mark.size, override['background'])
                canvas.alpha_composite(mark)
                output = io.BytesIO()
                canvas.save(output, format='PNG', optimize=True)
                blob = output.getvalue()
            entry = {
                'dataUri': 'data:image/png;base64,' + base64.b64encode(blob).decode('ascii'),
                'sourceUrl': candidate,
                'resolvedSourceUrl': final_url,
                'domain': domain,
                'status': override['status'] if overridden else ('cached_site_icon' if cached else 'official_site_icon'),
                'note': (override['note'] if overridden else 'Company website icon delivered through Google favicon cache.' if cached else
                         'Company website icon, retrieved from its site or a linked asset CDN.') +
                        ' Used to identify the employer; no endorsement implied.',
                'width': size[0], 'height': size[1], 'bytes': len(blob),
                'sha256': hashlib.sha256(blob).hexdigest(),
                'checkedAt': date.today().isoformat(),
                'domainBasis': ('Explicit employer-domain mapping for the supplied career link.' if
                                employer['id'] in DOMAIN_OVERRIDES else
                                'Employer domain from the supplied career link.'),
            }
            if overridden and override.get('attributionPage'):
                entry['attributionPage'] = override['attributionPage']
            return employer['id'], entry
        except Exception as error:
            errors.append(str(error)[:150])
    return employer['id'], {
        'dataUri': None, 'sourceUrl': base, 'domain': domain,
        'status': 'unavailable', 'note': 'No usable public icon retrieved; use labeled initials.',
        'checkedAt': date.today().isoformat(), 'errors': errors,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--only', nargs='*', help='Employer IDs to retry')
    options = parser.parse_args()
    data = json.loads((ROOT / 'atlas-data.json').read_text())
    path = ROOT / 'logos.json'
    existing = json.loads(path.read_text()) if path.exists() else {}
    employers = data['employers']
    if options.only:
        employers = [e for e in employers if e['id'] in options.only]
    if not options.refresh:
        employers = [e for e in employers if not existing.get(e['id'], {}).get('dataUri')]
    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_employer, e): e for e in employers}
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            employer = futures[future]
            try:
                key, value = future.result()
            except Exception as error:
                key, value = employer['id'], {'dataUri': None, 'status': 'unavailable', 'note': str(error)}
            existing[key] = value
            print(f"{index}/{len(employers)} {key}: {value['status']}", flush=True)
            # Save progress so an interrupted network run remains useful.
            path.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + '\n')
    ordered = {e['id']: existing[e['id']] for e in data['employers'] if e['id'] in existing}
    path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + '\n')
    available = sum(bool(v.get('dataUri')) for v in ordered.values())
    print(f'Wrote {path.name}: {available}/{len(data["employers"])} icons in {time.monotonic()-started:.1f}s')


if __name__ == '__main__':
    main()
