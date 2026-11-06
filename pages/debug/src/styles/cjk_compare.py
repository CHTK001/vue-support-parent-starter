# -*- coding: utf-8 -*-
"""Compare Chinese text content between variant and original debug.css.

Checks:
1. Every CJK string literal in the original (comments, ?: strings) that appears in a variant
   must appear identically.
2. Variety count of CJK text.
"""
import os, re

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
orig = open(os.path.join(root, 'debug.css'), encoding='utf-8').read()

# Extract Chinese text runs from original
CJK = re.compile(r'[\u3040-\u9fff\u3000-\u303f\uff00-\uffef]+')

def all_cjk(src):
    return CJK.findall(src)

orig_cjk = all_cjk(orig)
print('original CJK runs: %d' % len(orig_cjk))
print('unique:', len(set(orig_cjk)))

# For each variant, find CJK runs and compare
variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    for t in sorted(os.listdir(variants_dir)):
        if not t.endswith('.css'):
            continue
        v = open(os.path.join(variants_dir, t), encoding='utf-8').read()
        v_cjk = all_cjk(v)
        # set diff
        miss = set(orig_cjk) - set(v_cjk)
        extra = set(v_cjk) - set(orig_cjk)
        print('\n%s: CJK runs %d (orig %d), unique %d (orig %d)' % (t, len(v_cjk), len(orig_cjk), len(set(v_cjk)), len(set(orig_cjk))))
        if miss:
            print('   MISSING (not in variant):', sorted(miss)[:10])
        if extra:
            print('   EXTRA (new in variant):', sorted(extra)[:10])
        # check that number of lines containing CJK is similar
        o_lines = sum(1 for l in orig.splitlines() if CJK.search(l))
        v_lines = sum(1 for l in v.splitlines() if CJK.search(l))
        print('   CJK-lined lines: orig %d vs %s %d' % (o_lines, t, v_lines))
