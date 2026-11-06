import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']

for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    idx = c.find('.debug-page {')
    di = c.find('  display: flex;', idx)
    lines = c[idx:di].splitlines()
    print('=====%s' % v)
    for l in lines[-8:]:
        print('   ' + l)
    print()
