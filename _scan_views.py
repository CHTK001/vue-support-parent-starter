import re
base = r'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter\src\views'
for f in ['AssetsView','RedisView','WorkbenchView','TsharkView','TerminalView','AlarmsView']:
    src = open(f'{base}\\{f}.vue', encoding='utf-8').read()
    cls = sorted(set(re.findall(r'class="([a-z0-9_-]+)', src)))
    inputs = re.findall(r'placeholder="([^"]+)"', src)
    apis = re.findall(r'import\s*\{([^}]+)\}\s*from\s*"[^"]*api[^"]*"', src)
    print('===', f)
    keep = [c for c in cls if c in ('as-error','hd-error','kpi-value','kpi','filter','card','re-table','as','page-header','page-actions')]
    print('  key-classes:', keep)
    print('  placeholders:', inputs[:5])
    if apis: print('  api-imports:', apis[0][:120])
