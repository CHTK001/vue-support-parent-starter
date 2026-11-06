# -*- coding: utf-8 -*-
"""Restore newline structure in variant files collapsed by a PowerShell
Set-Content -NoNewline run. Text content is intact; newlines must be rebuilt.

Reconstruction rules:
  comment body   : original line starts were ' * ' markers -> split on ' * '
  declaration end: ';' -> new line (keep ';')
  block start    : '{' -> newline after the selector line
  block end      : '}' -> newline (already flushed as the block end)
  blank line     : consecutive empty lines -> at most one
"""
import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants_dir = root + '/debug-variants'
variants = sorted(os.listdir(variants_dir)) if os.path.isdir(variants_dir) else []

def rebuild(text):
    lines = []
    buf = ''
    depth = 0
    in_str = None
    i = 0
    n = len(text)

    def emit():
        nonlocal buf
        if buf.strip():
            lines.append(buf.strip())
        buf = ''

    while i < n:
        c = text[i]

        if in_str is not None:
            buf += c
            if c == '\\':
                buf += text[i+1] if i+1 < n else ''
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue

        if c in '\'"':
            in_str = c
            buf += c
            i += 1
            continue

        if c == '/' and i + 1 < n and text[i+1] == '*':
            if buf:
                emit()
            j = text.find('*/', i + 2)
            if j < 0:
                break
            body = text[i+3:j]  # text between '/*' and '*/'
            parts = body.split(' * ')
            if parts[0].strip():
                lines.append('/* ' + parts[0].strip())
            else:
                lines.append('/*')
            for part in parts[1:]:
                if part.strip():
                    lines.append(' * ' + part.strip())
                else:
                    lines.append(' *')
            lines.append(' */')
            i = j + 2
            continue

        if c == '{':
            buf += ' {'
            emit()
            depth += 1
            i += 1
            continue

        if c == '}':
            buf += '}'
            emit()
            lines.append('')
            depth -= 1
            i += 1
            continue

        if c == ';' and depth > 0:
            buf += ';'
            emit()
            i += 1
            continue

        buf += c
        i += 1

    emit()
    while lines and lines[0] == '':
        lines.pop(0)
    while lines and lines[-1] == '':
        lines.pop()
    out = []
    for l in lines:
        if not l.strip() and out and not out[-1].strip():
            continue
        out.append(l)
    return '\n'.join(out)


for t in variants:
    p = os.path.join(variants_dir, t)
    raw = open(p, encoding='utf-8').read()
    if raw.startswith('\ufeff'):
        raw = raw[1:]
    restored = rebuild(raw)
    open(p, 'w', encoding='utf-8', newline='').write(restored)
    out_bytes = open(p, 'rb').read()
    print('%s: chars=%d newlines=%d bom=%s' % (t, len(restored), restored.count('\n'), out_bytes[:3] == b'\xef\xbb\xbf'))
