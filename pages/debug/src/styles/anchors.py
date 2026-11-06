import os

root = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles'
variants = ['debug.css']

for v in variants:
    p = os.path.join(root, v)
    c = open(p, encoding='utf-8').read()
    print('=====%s' % v)
    i_t = c.find('.debug-el__tree')
    i_h = c.find('.debug-modal__hint')
    i_c = c.rfind('还原动作')
    print('--- el_tree (el..tree):')
    print(repr(c[i_t-140:i_t+40]))
    print('--- modal_hint (..modal__spacer):')
    print(repr(c[i_h:i_h+260]))
    print('--- ctxmenu pos (还原动作):')
    if i_c >= 0:
        print(repr(c[i_c-120:i_c+40]))
    else:
        print('NO 还原动作')
    print('ctxmenu:', c.count('debug-ctxmenu'), ' el--top:', c.count('debug-el--top'), ' el__stage:', c.count('debug-el__stage'), ' spacer:', c.count('debug-modal__spacer'))
