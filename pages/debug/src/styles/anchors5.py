import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']

for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    di = c.find('  display: flex;', c.find('.debug-page {') + 20)
    print('=====%s' % v)
    print(repr(c[di-160:di+80]))
    print()
