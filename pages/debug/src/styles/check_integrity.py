# -*- coding: utf-8 -*-
"""Verify restored variants preserve Chinese comment markers from original debug.css."""
import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
orig = os.path.join(root, 'debug.css')
src = open(orig, encoding='utf-8').read()
markers = ['调试中心', '断点检测', '设备掉线', '连接管理服务']
print('original marker counts:')
for m in markers:
    print('  %-10s x%d' % (m, src.count(m)))

variants_dir = root + '/debug-variants'
if os.path.isdir(variants_dir):
    for t in sorted(os.listdir(variants_dir)):
        if not t.endswith('.css'):
            continue
        p = os.path.join(variants_dir, t)
        c = open(p, encoding='utf-8').read()
        print(t + ' marker counts:')
        bad = False
        for m in markers:
            n = c.count(m)
            print('  %-10s x%d' % (m, n))
            if n == 0:
                bad = True
        print('  INTACT: %s' % (not bad))
