path = r'D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter\src\views\AssetsView.vue'
with open(path, 'rb') as f:
    content = f.read()

# line 526: el-option for bound identities
old1 = b':key="b.id" :label="`${b.msServerIdentityName}\xef\xbc\x88${b.msServerIdentityUsername}\xef\xbc\x89`" :value="b.id"'
new1 = b':key="b" :label="`${identities.find(i => i.id === b)?.msServerIdentityName ?? \'\'}\xef\xbc\x88${identities.find(i => i.id === b)?.msServerIdentityUsername ?? \'\'}\xef\xbc\x89`" :value="b"'
content = content.replace(old1, new1)

with open(path, 'wb') as f:
    f.write(content)
print('done')
