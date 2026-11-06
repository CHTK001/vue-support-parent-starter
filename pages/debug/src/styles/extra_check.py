# -*- coding: utf-8 -*-
import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'

def ctx_lines(src, keyword, n=3):
    lines = src.splitlines()
    out = []
    for i, l in enumerate(lines):
        if keyword in l:
            for j in range(max(0, i - n), min(len(lines), i + n + 1)):
                out.append('%d: %s' % (j + 1, lines[j]))
            out.append('  ...')
    return out

variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    for t in sorted(os.listdir(variants_dir)):
        if not t.endswith('.css'):
            continue
        src = open(os.path.join(variants_dir, t), encoding='utf-8').read()
        print('\n<<< ' + t)
        for kw in ['--dbg-shadow-lg', '--dbg-brand-100', '--dbg-radius-sm']:
            hits = ctx_lines(src, kw + ': var(')
            if len(hits) > 0:
                print(' --- ' + kw + ' definition:')
                print('\n'.join(hits[:7]))
