#!/usr/bin/env python3
"""Create small web copies of the owner-approved SAM 3.1 galleries.

Usage: python3 scripts/prepare_media.py PHOTO_GALLERY VIDEO_GALLERY BRAND_ARCHIVE
The three source arguments are read-only. This script never resegments or
changes the approved masking; it only scales and encodes display copies.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

if len(sys.argv) != 4:
    raise SystemExit(__doc__)

photo_root, video_root, archive_path = map(Path, sys.argv[1:])
output = Path(__file__).resolve().parents[1] / 'assets' / 'media'
images = output / 'images'
videos = output / 'videos'
posters = output / 'posters'
for directory in (images, videos, posters):
    directory.mkdir(parents=True, exist_ok=True)

def run(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def webp(source: Path, target: Path, width: int = 1600):
    run('cwebp', '-quiet', '-q', '79', '-m', '6', '-resize', str(width), '0',
        '-metadata', 'none', str(source), '-o', str(target))

photos = {'1': '01_colegas', '2': '02_compras', '3': '03_tienda'}
clips = {'1': '01_tienda', '2': '02_pareja', '3': '03_reunion'}
entries = []
for number, folder in photos.items():
    for level in (['original'] + [str(i) for i in range(1, 8)]):
        source = photo_root / folder / ('original.jpg' if level == 'original' else f'nivel_{int(level):02d}.png')
        target = images / f'photo-{number}-{level}.webp'
        webp(source, target)
        entries.append((source, target))

tasks = []
for number, folder in clips.items():
    for level in (['original'] + [str(i) for i in range(1, 5)]):
        source = video_root / folder / (f'{folder}_original_vista.mp4' if level == 'original' else f'{folder}_nivel_{int(level):02d}.mp4')
        target = videos / f'video-{number}-{level}.mp4'
        tasks.append((source, target))
        poster_source = video_root / 'assets' / 'posters' / (f'{folder}_original.jpg' if level == 'original' else f'{folder}_nivel_{int(level):02d}.jpg')
        poster_target = posters / f'video-{number}-{level}.webp'
        if number != '2':
            webp(poster_source, poster_target, 960)
            entries.append((poster_source, poster_target))

archive_codes = {'en':'EN', 'es':'ES', 'ru':'RU', 'yi':'YI', 'he':'HE', 'pt-br':'PT', 'fr':'FR'}
archive_prefix = 'Video/Video de bloqueo/Video 16 9/'
with tempfile.TemporaryDirectory(prefix='browslium-blocks-') as temporary:
    temporary = Path(temporary)
    with zipfile.ZipFile(archive_path) as archive:
        names = archive.namelist()
        for locale, code in archive_codes.items():
            video_candidates = [name for name in names if name.startswith(archive_prefix+'Video/') and name.endswith('.mp4') and f'blocked_{code}_horizontal_' in name]
            image_candidates = [name for name in names if name.startswith(archive_prefix+'Foto/') and name.endswith('.png') and f'blocked_14s_{code}_4K' in name]
            if len(video_candidates) != 1 or len(image_candidates) != 1:
                raise RuntimeError(f'Expected one official blocked video and poster for {locale}: {video_candidates}, {image_candidates}')
            video_source = temporary / f'blocked-{locale}.mp4'
            poster_source = temporary / f'blocked-{locale}.png'
            video_source.write_bytes(archive.read(video_candidates[0]))
            poster_source.write_bytes(archive.read(image_candidates[0]))
            target = videos / f'blocked-{locale}.mp4'
            poster_target = posters / f'blocked-{locale}.webp'
            tasks.append((video_source, target))
            webp(poster_source, poster_target, 960)
            entries.append((f'Archive.zip:{image_candidates[0]}', poster_target))

    def encode(pair):
        source, target = pair
        trim = source.parent.name == '02_pareja'
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source)]
        if trim:
            command.extend(['-ss', '1.000'])
        run(*command,
            '-map', '0:v:0', '-an', '-vf', 'scale=\'min(1280,iw)\':-2',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p',
            '-threads', '2', '-movflags', '+faststart', str(target))
        if trim:
            poster_target = posters / target.with_suffix('.webp').name
            with tempfile.TemporaryDirectory(prefix='browslium-poster-') as poster_dir:
                still = Path(poster_dir) / 'frame.jpg'
                run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.25',
                    '-i', str(target), '-frames:v', '1', '-q:v', '2', str(still))
                webp(still, poster_target, 960)
        return source, target

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(encode, pair) for pair in tasks]
        for future in as_completed(futures):
            source, target = future.result()
            entries.append((source if source.exists() else source.name, target))
            if source.parent.name == '02_pareja':
                entries.append((f'{source.name}:after-1s-cut', posters / target.with_suffix('.webp').name))
            print(f'Encoded {target.name}: {target.stat().st_size / 1024 / 1024:.2f} MiB', flush=True)

manifest = []
for source, target in sorted(entries, key=lambda pair: str(pair[1])):
    manifest.append({
        'file': str(target.relative_to(output.parent)),
        'source': Path(source).name if isinstance(source, Path) else source,
        'bytes': target.stat().st_size,
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    })
(output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(f'Prepared {len(manifest)} compressed assets ({sum(x["bytes"] for x in manifest) / 1024 / 1024:.1f} MiB).')
