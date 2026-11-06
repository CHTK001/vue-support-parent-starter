# -*- coding: utf-8 -*-
"""Encoding-integrity scan: look for U+FFFD, invalid bytes, GBK-mangled CJK."""
import os, re

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'

paths = {
    'debug.css': os.path.join(root, 'debug.css'),
}
for t in ['debug-variants']:
    if not os.path.isdir(root + '/' + t):
        continue
    for u in os.listdir(root + '/' + t):
        if u.endswith('.css'):
            paths[u] = os.path.join(root + '/debug-variants', u)

for name, p in paths.items():
    data = open(p, 'rb').read()
    cjk = re.compile(r'[\u3040-\u9fff]+')
    text = data.decode('utf-8', errors='replace')

    ur = text.count('\ufffd')
    # raw bytes with non-UTF8 sequences
    bad_bytes = 0
    i = 0
    while i < len(data):
        b = data[i]
        if b < 0x80:
            i += 1
        elif b >> 5 == 0b110:
            if i + 1 >= len(data): bad_bytes += 1; break
            if not (data[i+1] >> 6 == 0b10): bad_bytes += 1; i += 1
            else: i += 2
        elif b >> 4 == 0b1110:
            if i + 2 >= len(data): bad_bytes += 1; break
            if not (data[i+1] >> 6 == 0b10 and data[i+2] >> 6 == 0b10): bad_bytes += 1; i += 1
            else: i += 3
        elif b >> 3 == 0b11110:
            if i + 3 >= len(data): bad_bytes += 1; break
            if not all(data[i+k] >> 6 == 0b10 for k in (1,2,3)): bad_bytes += 1; i += 1
            else: i += 4
        else:
            bad_bytes += 1; i += 1

    print('%-20s len=%d  U+FFFD=%d  bad_bytes=%d  CJK_runs=%d lines=%d' % (
        name, len(data), ur, bad_bytes, len(cjk.findall(text)), text.count('\n')))

# Read actual text of one variant header to verify it's real Chinese
variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    print('\n--- variant-atelier.css first 25 lines ---')
    lines = open(os.path.join(variants_dir + '/variant-atelier.css'), encoding='utf-8').read().splitlines()
    for l in lines[:25]:
        print('  %s' % l)
