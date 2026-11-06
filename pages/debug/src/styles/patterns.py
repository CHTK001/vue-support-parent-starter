import os, re

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']
for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    print('=====%s' % v)
    for m in re.finditer(r'repeating-conic-gradient\([^)]*\)', c):
        print('   ', m.group(0))
    print()
