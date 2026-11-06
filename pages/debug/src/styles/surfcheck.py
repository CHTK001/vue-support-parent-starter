# -*- coding: utf-8 -*-
import os
root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    for t in sorted(os.listdir(variants_dir)):
        p = os.path.join(variants_dir, t)
        c = open(p, encoding='utf-8').read()
        lines = c.splitlines()
        for i, l in enumerate(lines, 1):
            if '--dbg-surface-hover' in l or '--dbg-surface' in l:
                print('%s L%d: %s' % (t, i, l.strip()))
