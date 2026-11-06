import os, re

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']

for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    # find the .debug-page block
    idx = c.find('.debug-page {')
    seg = c[idx:idx+800]
    print('=====%s' % v)
    print('block start:', repr(seg[:120]))
    # find the last var definition line before display:flex
    di = seg.find('  display: flex;')
    b = seg[:di]
    last = b.rfind('  --dbg-')
    print('last token before display:', repr(b[last-40:di]))
    print()
