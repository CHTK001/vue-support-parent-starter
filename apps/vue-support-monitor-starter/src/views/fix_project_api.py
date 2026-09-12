import io

with io.open(r'D:\ch\project\vue-support-parent-starter\pages\project\src\api\index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复混乱的注释格式：移除重复的注释行
import re

# 模式：/** 注释 */\n * @author CH\n * @since 4.0.0\n/** 注释 */
# 替换为：/** 注释 */
pattern = r'/\*\*([^*]+)\*/\s*\n\s*\*\s*@author\s+CH\s*\n\s*\*\s*@since\s+[\d.]+\s*\n\s*/\*\*([^*]+)\*/'
content = re.sub(pattern, r'/**\2*/', content)

# 修复单独的错误注释行（以 * 开头但不在 /** */ 块内的）
lines = content.split('\n')
fixed_lines = []
in_comment = False
for line in lines:
    stripped = line.strip()
    if stripped.startswith('/**'):
        in_comment = True
        fixed_lines.append(line)
    elif stripped.startswith('*/'):
        in_comment = False
        fixed_lines.append(line)
    elif stripped.startswith('*') and not in_comment:
        # 这是一个孤立的注释行，跳过
        continue
    else:
        fixed_lines.append(line)

content = '\n'.join(fixed_lines)

with io.open(r'D:\ch\project\vue-support-parent-starter\pages\project\src\api\index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('index.ts 注释格式修复完成')
