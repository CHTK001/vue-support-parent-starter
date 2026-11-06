import re, os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
with open(os.path.join(root, 'debug.css'), encoding='utf-8') as f:
    orig = f.read()

sel_re = re.compile(r'(?m)^\s*\.[\w=-]+(?:\s+[\w=-]+)*\s*\{')
# simpler: every selector start line: a line that begins with . after optional whitespace
sel_re2 = re.compile(r'(?m)^\s*\.\S+[\w=-]*')
# use the project's own pattern from validate.py (class-based)
cls_re = re.compile(r'\.debug-[a-zA-Z0-9_:\.-]+')

# original selector names (dedup)
orig_sels = set(re.findall(cls_re, orig))
print('original debug.css unique selectors: %d' % len(orig_sels))
print()

variants_dir = os.path.join(root, 'debug-variants')
if os.path.isdir(variants_dir):
    for name in sorted(os.listdir(variants_dir)):
        if not name.endswith('.css'):
            continue
        p = os.path.join(variants_dir, name)
        with open(p, encoding='utf-8') as f:
            c = f.read()
        sels = set(re.findall(cls_re, c))
        missing = orig_sels - sels
        extra = sels - orig_sels
        dup_total = len(re.findall(cls_re, c))
        ob, cb = c.count('{'), c.count('}')
        # semicolon check
        decl_bad = []
        for line in c.splitlines():
            s = line.strip()
            if ':' in s and not s.endswith(';') and not s.endswith('{') and not s.endswith('}') and not s.startswith('//') and not s.startswith('/*') and not s.startswith('@') and '{' not in s:
                decl_bad.append(s)
        print('--- %s: %d unique (dup lines %d), braces %d/%d, missing:%d extra:%d, bad-decl:%d' % (
            name, len(sels), dup_total - len(sels), ob, cb, len(missing), len(extra), len(decl_bad)))
        if missing:
            for m in sorted(missing):
                print('     missing: %s' % m)
        if extra:
            for m in sorted(extra):
                print('     extra: %s' % m)
        if decl_bad:
            for d in decl_bad[:5]:
                print('     bad: %s' % d)
