import os, re

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']

for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    idx = c.find('.debug-page {')
    seg = c[idx:idx+900]
    di = seg.find('  display: flex;')
    b = seg[:di]
    last = b.rfind('  --dbg-')
    print('=====%s' % v)
    print('...tokens before display:flex...')
    print(b[last:])
    print()
