import re, os
root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']
for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    decls = set(re.findall(r'(?m)^\s*(--dbg-[\w-]+)\s*:', c))
    uses = set(re.findall(r'var\(\s*(--dbg-[\w-]+)\b', c))
    used_not_decl = uses - decls
    print(v)
    print('   declares:', sorted(decls))
    if used_not_decl:
        print('   *** USED NOT DECLARED:', sorted(used_not_decl))
    print()
