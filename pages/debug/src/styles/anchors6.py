import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']

A1 = '''  --dbg-font: var(--el-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif);

  display: flex;
'''
# alias insertion target: after the font token line + blank line, before display:flex
A2 = '''  /* 对应宿主 theme 的一页词：卡片/抬升/填充/悬浮线/基础阴影 */
  --dbg-card: var(--dbg-surface);
  --dbg-elev: var(--dbg-surface-hover);
  --dbg-fill: var(--dbg-surface-hover);
  --dbg-hover: var(--dbg-surface-hover);
  --dbg-line-strong: var(--dbg-line-knife, var(--dbg-line));
  --dbg-shadow-1: var(--dbg-shadow);
'''
A3 = '''/* ==================== 还原动作 ==================== */
'''
A4 = '''.debug-el {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.debug-el__tree {
'''
A5 = '''.debug-modal__hint {
  font-size: 11px;
  color: var(--dbg-t3);
}

/* ==================== 内容容器 ==================== */
'''
A6 = '''.debug-modal__spacer {
  flex: 1;
}
'''

for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    checks = {
        'alias anchor': c.count(A1),
        'modal hint+scroll ': c.count(A5),
        'element el-tree ': c.count(A4),
        'redact title ': c.count(A3),
    }
    print('=====%s' % v)
    for k, n in checks.items():
        print('   %-18s: %d' % (k, n))
    print('   already有 spacer:', c.count('debug-modal__spacer'))
    print()
