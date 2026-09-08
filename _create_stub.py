import os, json

pkg_dir = r'D:\ch\project\vue-support-parent-starter\packages\vue-element-plus-x-stub'
os.makedirs(pkg_dir, exist_ok=True)
os.makedirs(os.path.join(pkg_dir, 'styles'), exist_ok=True)

with open(os.path.join(pkg_dir, 'package.json'), 'w', encoding='utf-8') as f:
    json.dump({"name": "vue-element-plus-x", "version": "2.0.3", "main": "./index.js", "types": "./index.d.ts"}, f, indent=2)

with open(os.path.join(pkg_dir, 'index.js'), 'w', encoding='utf-8') as f:
    f.write('// stub\nexport const Conversations = {}\nexport const BubbleList = {}\nexport const XSender = {}\n')

with open(os.path.join(pkg_dir, 'index.d.ts'), 'w', encoding='utf-8') as f:
    f.write('export const Conversations: any\nexport const BubbleList: any\nexport const XSender: any\n')

with open(os.path.join(pkg_dir, 'styles', 'index.css'), 'w', encoding='utf-8') as f:
    f.write('/* vue-element-plus-x styles stub */\n')

# Update packages/ui/package.json
ui_pkg = r'D:\ch\project\vue-support-parent-starter\packages\ui\package.json'
with open(ui_pkg, 'r', encoding='utf-8') as f:
    cfg = json.load(f)
cfg['dependencies']['vue-element-plus-x'] = 'workspace:*'
with open(ui_pkg, 'w', encoding='utf-8') as f:
    json.dump(cfg, f, indent=2, ensure_ascii=False)

print('stub created and package.json updated')
