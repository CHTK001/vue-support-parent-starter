# -*- coding: utf-8 -*-
"""A real CSS tokenizer parser: tracks strings, comments, braces.
Produces line/col errors for unbalanced delimiters, unterminated strings."""
import os

def parse(css):
    errors = []
    pos = 0
    n = len(css)
    line = 1
    depth = 0
    in_str = None

    def err(msg):
        errors.append((line, msg))

    while pos < n:
        c = css[pos]

        if in_str is not None:
            if c == '\\':
                pos += 2
                continue
            if c == in_str:
                in_str = None
            pos += 1
            continue

        if c in '\'"':
            in_str = c
            pos += 1
            continue

        if c == '/' and pos + 1 < n and css[pos+1] == '*':
            j = css.find('*/', pos + 2)
            if j < 0:
                err('Unterminated comment')
                break
            while pos < j + 2:
                if css[pos] == '\n':
                    line += 1
                pos += 1
            continue

        if c == '{':
            depth += 1
            pos += 1
            continue

        if c == '}':
            depth -= 1
            if depth < 0:
                err('Unbalanced } near line %d' % line)
                depth = 0
            pos += 1
            continue

        if c == '\n':
            line += 1
            pos += 1
            continue

        pos += 1

    if depth != 0:
        err('Unclosed block (depth %d)' % depth)
    if in_str is not None:
        err('Unterminated %s string' % in_str)
    return errors, depth, in_str

def selector_count(css):
    """Collect selector names for top-level selector text (depth 0)."""
    sels = set()
    pos = 0
    n = len(css)
    in_str = None
    depth = 0
    buf = ''

    while pos < n:
        c = css[pos]

        if in_str is not None:
            if c == '\\':
                pos += 2
                continue
            if c == in_str:
                in_str = None
            pos += 1
            continue

        if c in '\'"':
            in_str = c
            pos += 1
            continue

        if c == '/' and pos + 1 < n and css[pos+1] == '*':
            j = css.find('*/', pos + 2)
            if j < 0:
                break
            while pos < j + 2:
                pos += 1
            continue

        if c == '{':
            depth += 1
            if depth == 1 and buf.strip():
                for part in buf.strip().split(','):
                    part = part.strip()
                    if part and part.startswith('.'):
                        sels.add(part.split()[0])
            buf = ''
            pos += 1
            continue

        if c == '}':
            depth -= 1
            if depth == 0 and buf.strip():
                for part in buf.strip().split(','):
                    part = part.strip()
                    if part and part.startswith('.'):
                        sels.add(part.split()[0])
            buf = ''
            pos += 1
            continue

        if depth == 0:
            buf += c
        pos += 1

    return sels

if __name__ == '__main__':
    root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
    targets = []
    targets.append('debug.css')
    variants_dir = root + '/debug-variants'
    if os.path.isdir(variants_dir):
        for d in sorted(os.listdir(variants_dir)):
            if d.endswith('.css'):
                targets.append(os.path.join('debug-variants', d))

    for t in targets:
        p = os.path.join(root, t)
        css = open(p, encoding='utf-8').read()
        errors, depth, in_str = parse(css)
        sels = selector_count(css)
        ob = css.count('{')
        cb = css.count('}')
        print('=== %s ===' % t)
        print('braces: %d/%d | selectors: %d | syntax errors: %d' % (ob, cb, len(sels), len(errors)))
        if errors:
            for e in errors:
                print('   L%d: %s' % e)
        if in_str is not None:
            print('   Unterminated string')
        print()
