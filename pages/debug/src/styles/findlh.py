try:
    p = 'D:/ch/project/vue-support-parent-starter/pages/debug/src/styles/debug-variants/variant-sketch.css'
    c = open(p, encoding='utf-8').read()
    lines = c.splitlines()
    for i, l in enumerate(lines):
        if 'line-height: 15px' in l:
            print(i, repr(l))
            print([repr(x) for x in lines[max(0,i-6):i+4]])
            print()
except OSError:
    print('variant-sketch.css not present')
