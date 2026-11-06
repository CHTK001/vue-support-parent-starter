# -*- coding: utf-8 -*-
import os
root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    for t in sorted(os.listdir(variants_dir)):
        if not t.endswith('.css'):
            continue
        p = os.path.join(root + '/debug-variants', t)
        c = open(p, encoding='utf-8').read()
        for pat in ['--dbg-brand-100', '--dbg-radius', '--dbg-shadow-lg', '--dbg-fill', '--dbg-hover']:
            n = c.count(pat)
            if n > 0:
                print('%s %-20s x%d' % (t, pat, n))
