import re, os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
with open(os.path.join(root, 'debug.css'), encoding='utf-8') as f:
    orig = f.read()

def bad(c):
    out = []
    for line in c.splitlines():
        s = line.strip()
        if ':' in s and not s.endswith(';') and not s.endswith('{') and not s.endswith('}') and not s.startswith('//') and not s.startswith('/*') and not s.startswith('@') and '{' not in s:
            out.append(s)
    return out

print('original bad decls:', bad(orig))
variants_dir = os.path.join(root, 'debug-variants')
if os.path.isdir(variants_dir):
    for name in sorted(os.listdir(variants_dir)):
        if not name.endswith('.css'):
            continue
        p = os.path.join(variants_dir, name)
        c = open(p, encoding='utf-8').read()
        print('%s bad decls:' % name, bad(c))
