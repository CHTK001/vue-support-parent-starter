import re

path = r'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter\src\views\AssetsView.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 526: el-option for bound identities
old_line1 = ':key="b.id" :label="`${b.msServerIdentityName} / ${b.msServerIdentityUsername}`" :value="b.id"'
new_line1 = ':key="b" :label="`${identities.find(i => i.id === b)?.msServerIdentityName ?? ''} / ${identities.find(i => i.id === b)?.msServerIdentityUsername ?? ''}`" :value="b"'
content = content.replace(old_line1, new_line1)

# Fix line 529: filter for available identities
old_line2 = 'hostBoundIdentities.some(b => b.id === x.id)'
new_line2 = 'hostBoundIdentities.includes(x.id)'
content = content.replace(old_line2, new_line2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
