import re, os
root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
with open(os.path.join(root, 'debug.css'), encoding='utf-8') as f:
    content = f.read()
sel = re.compile(r'\.debug-[a-zA-Z0-9_.\:+-]+')
lines = content.splitlines()
keys = ['ctxmenu', 'el--left', 'el--top', 'el__body', 'el__stage', 'stage__hl', '__spacer']
found = 0
for i, line in enumerate(lines):
    if sel.search(line) and any(k in line for k in keys):
        found += 1
        block = lines[max(0,i-2):i+26]
        print('='*72)
        print('\n'.join(f'{m+1}: {l}' for m, l in enumerate(block)))
print('MATCHES FOUND:', found)
