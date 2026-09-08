import re, glob

for f in sorted(glob.glob(r'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter\src\views\*.vue')):
    src = open(f, encoding='utf-8').read()
    labels = re.findall(r'>\s*([^<>]{1,16})\s*</(ReButton|el-button|ReButtonV)\s*>', src)
    attrs = re.findall(r'<(ReButton|el-button)\b([^>]*)>', src)
    print('===', f.split('\\')[-1])
    seen = set()
    for tag, body in attrs:
        m = re.search(r'text=["\']([^"\']+)["\']', body)
        t = re.search(r'title=["\']([^"\']+)["\']', body)
        showtext = ':show-text' in body or 'show-text' in body
        label = m.group(1) if m else None
        # find the trailing text between tag and close
        print(f'   {tag} text={label} title={t.group(1) if t else None} showtext={bool(showtext)}')
