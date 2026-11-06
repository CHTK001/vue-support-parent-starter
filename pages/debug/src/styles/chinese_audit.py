# -*- coding: utf-8 -*-
"""Compare Chinese text content of variants vs original debug.css."""
import os, re

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
orig = open(os.path.join(root, 'debug.css'), encoding='utf-8').read()

# extract all CJK lines (comments and any CJK text)
def ch_lines(src):
    return [l for l in src.splitlines() if re.search(r'[\u3040-\u9fff\u3000-\u303f\uff00-\uffef]', l)]

print('original Chinese text blocks (%d):' % len(ch_lines(orig)))
for i, l in enumerate(ch_lines(orig)):
    print(' %d: %s' % (i + 1, l.strip()[:120]))

# Chinese text inside comments (/* */) of original
cn_comments = [l for l in ch_lines(orig) if '/*' in l or '*/' in l]
print('\noriginal comment snippets (%d):' % len(cn_comments))
for l in cn_comments[:20]:
    print(' | ' + l.strip()[:100])
