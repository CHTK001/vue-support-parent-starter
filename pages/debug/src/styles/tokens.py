# -*- coding: utf-8 -*-
import re, os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'

def defined(c):
    """collect --dbg-IDENT defined in declarations, incl. nested"""
    d = set()
    for m in re.finditer(r'(--dbg-[A-Za-z0-9_-]+)\s*:', c):
        d.add(m.group(1))
    return d

def used(c):
    u = set()
    for m in re.finditer(r'var\(--dbg-[A-Za-z0-9_.\-]+\)', c):
        v = m.group(0)  # var(--dbg-foo)
        v = v[4:-1] if v.startswith('var(') else v
        u.add(v)
    return u

# original
orig = open(os.path.join(root, 'debug.css'), encoding='utf-8').read()
print('ORIGINAL: defines %d, uses %d' % (len(defined(orig)), len(used(orig))))
print('  original defines:')
for d in sorted(defined(orig)):
    print('    %s' % d)
print()

variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    for t in sorted(os.listdir(variants_dir)):
        if not t.endswith('.css'):
            continue
        p = os.path.join(variants_dir, t)
        c = open(p, encoding='utf-8').read()
        d = defined(c)
        u = used(c)
        missing = u - d
        extra = d - u
        print('%s: defines %d/24, uses %d' % (t, len(d), len(u)))
        if missing:
            print('   MISSING (used but not defined): %s' % ', '.join(sorted(missing)))
        if extra:
            print('   EXTRA (defined but unused): %s' % ', '.join(sorted(extra)))
        # recall which host vars they alias
        if t == 'variant-dock.css' or t == 'variant-lumina.css':
            print('   tokens:')
            for m in sorted(defined(c)):
                print('     %s' % m)
