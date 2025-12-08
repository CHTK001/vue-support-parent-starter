"""
文件预览图片生成脚本
运行: python create_preview_images.py
"""
from PIL import Image, ImageDraw
from shutil import copy
import os

base_path = os.path.dirname(os.path.abspath(__file__))

# 1. 代码预览图 - VS Code 风格真实代码
def create_code_preview():
    w, h = 240, 320
    img = Image.new('RGB', (w, h), '#1e1e1e')
    draw = ImageDraw.Draw(img)
    
    # 顶部标题栏
    draw.rectangle([0, 0, w, 32], fill='#323233')
    draw.ellipse([12, 11, 22, 21], fill='#ff5f57')
    draw.ellipse([28, 11, 38, 21], fill='#febc2e')
    draw.ellipse([44, 11, 54, 21], fill='#28c840')
    
    # 行号区域背景
    draw.rectangle([0, 32, 35, h], fill='#252526')
    
    # 代码行
    y = 45
    lh = 22
    code_lines = [
        [(6, '#858585', '1'), (40, '#569cd6', 'function'), (95, '#dcdcaa', 'getData'), (140, '#d4d4d4', '() {')],
        [(6, '#858585', '2'), (45, '#c586c0', 'const'), (78, '#9cdcfe', 'url'), (100, '#d4d4d4', '='), (110, '#ce9178', '"/api"')],
        [(6, '#858585', '3'), (45, '#c586c0', 'const'), (78, '#9cdcfe', 'res'), (100, '#d4d4d4', '='), (110, '#c586c0', 'await')],
        [(6, '#858585', '4'), (55, '#dcdcaa', 'fetch'), (88, '#d4d4d4', '('), (93, '#9cdcfe', 'url'), (113, '#d4d4d4', ')')],
        [(6, '#858585', '5'), (45, '#c586c0', 'return'), (88, '#9cdcfe', 'res'), (108, '#d4d4d4', '.')],
        [(6, '#858585', '6'), (55, '#dcdcaa', 'json'), (83, '#d4d4d4', '()')],
        [(6, '#858585', '7'), (40, '#d4d4d4', '}')],
        [(6, '#858585', '8')],
        [(6, '#858585', '9'), (40, '#6a9955', '// 导出模块')],
        [(6, '#858585', '10'), (40, '#c586c0', 'export'), (83, '#569cd6', 'default')],
    ]
    
    for line in code_lines:
        for item in line:
            x, color, text = item
            draw.text((x, y), text, fill=color)
        y += lh
    
    img.save(f'{base_path}/code-preview.png')
    
    code_exts = ['js', 'ts', 'py', 'java', 'html', 'css', 'scss', 'xml', 'json', 'yaml', 'yml', 'sql', 'sh', 'vue', 'jsx', 'tsx', 'go', 'cpp', 'c', 'php', 'rb', 'groovy']
    for ext in code_exts:
        copy(f'{base_path}/code-preview.png', f'{base_path}/{ext}.png')
    print('[OK] 代码类图片完成')

# 2. 视频预览图 - 播放按钮风格
def create_video_preview():
    w, h = 200, 280
    img = Image.new('RGB', (w, h), '#1a1a2e')
    draw = ImageDraw.Draw(img)
    # 播放按钮背景
    draw.ellipse([60, 90, 140, 170], fill='#e94560', outline='#ffffff', width=3)
    # 播放三角形
    draw.polygon([(90, 115), (90, 145), (120, 130)], fill='#ffffff')
    # 进度条背景
    draw.rectangle([20, 220, 180, 230], fill='#333355')
    # 进度条
    draw.rectangle([20, 220, 100, 230], fill='#e94560')
    # 时间轴点
    draw.ellipse([95, 217, 108, 233], fill='#ffffff')
    img.save(f'{base_path}/video-preview.png')
    for ext in ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']:
        copy(f'{base_path}/video-preview.png', f'{base_path}/{ext}.png')
    print('[OK] 视频类图片完成')

# 3. 音频预览图 - 波形风格
def create_audio_preview():
    w, h = 200, 280
    img = Image.new('RGB', (w, h), '#0f0e17')
    draw = ImageDraw.Draw(img)
    # 音频波形
    import random
    random.seed(42)
    bar_width = 6
    gap = 3
    start_x = 20
    for i in range(18):
        bar_h = random.randint(30, 120)
        x = start_x + i * (bar_width + gap)
        y = 140 - bar_h // 2
        draw.rectangle([x, y, x + bar_width, y + bar_h], fill='#ff8906')
    # 播放按钮
    draw.ellipse([75, 180, 125, 230], fill='#ff8906')
    draw.polygon([(95, 195), (95, 215), (112, 205)], fill='#0f0e17')
    img.save(f'{base_path}/audio-preview.png')
    for ext in ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma']:
        copy(f'{base_path}/audio-preview.png', f'{base_path}/{ext}.png')
    print('[OK] 音频类图片完成')

# 4. 压缩包预览图 - 文件夹堆叠+拉链
def create_archive_preview():
    w, h = 200, 280
    img = Image.new('RGB', (w, h), '#f5f5f5')
    draw = ImageDraw.Draw(img)
    # 文件夹堆叠效果
    draw.rectangle([40, 60, 160, 180], fill='#ffd54f', outline='#ffb300', width=2)
    draw.rectangle([35, 65, 155, 175], fill='#ffca28', outline='#ffa000', width=2)
    draw.rectangle([30, 70, 150, 170], fill='#ffc107', outline='#ff8f00', width=2)
    # 拉链
    for i in range(6):
        y = 80 + i * 15
        draw.rectangle([85, y, 95, y + 10], fill='#5d4037')
    draw.rectangle([83, 75, 97, 165], outline='#3e2723', width=1)
    img.save(f'{base_path}/archive-preview.png')
    for ext in ['zip', 'rar', '7z', 'gz', 'tgz', 'bz2', 'tar']:
        copy(f'{base_path}/archive-preview.png', f'{base_path}/{ext}.png')
    print('[OK] 压缩包类图片完成')

# 5. 文档预览图 (Word/PDF) - 文档页面风格
def create_doc_preview():
    w, h = 200, 280
    img = Image.new('RGB', (w, h), '#ffffff')
    draw = ImageDraw.Draw(img)
    # 文档页面
    draw.rectangle([30, 30, 170, 250], fill='#ffffff', outline='#e0e0e0', width=2)
    # 标题行
    draw.rectangle([45, 50, 155, 60], fill='#2196f3')
    # 文本行
    for i in range(8):
        y = 75 + i * 20
        width = 100 if i % 3 == 0 else 80 if i % 2 == 0 else 90
        draw.rectangle([45, y, 45 + width, y + 8], fill='#bdbdbd')
    img.save(f'{base_path}/doc-preview.png')
    for ext in ['doc', 'docx', 'pdf', 'ofd']:
        copy(f'{base_path}/doc-preview.png', f'{base_path}/{ext}.png')
    print('[OK] 文档类图片完成')

# 6. PPT预览图 - 幻灯片风格
def create_ppt_preview():
    w, h = 200, 280
    img = Image.new('RGB', (w, h), '#ffffff')
    draw = ImageDraw.Draw(img)
    # 幻灯片
    draw.rectangle([25, 40, 175, 150], fill='#ff5722', outline='#e64a19', width=2)
    # 标题
    draw.rectangle([40, 60, 160, 75], fill='#ffffff')
    # 内容区
    draw.rectangle([40, 90, 100, 130], fill='#ffccbc')
    draw.rectangle([110, 90, 160, 130], fill='#ffccbc')
    # 缩略图
    draw.rectangle([25, 165, 60, 195], fill='#ff8a65', outline='#ff5722')
    draw.rectangle([70, 165, 105, 195], fill='#ff8a65', outline='#ff5722')
    draw.rectangle([115, 165, 150, 195], fill='#ff8a65', outline='#ff5722')
    img.save(f'{base_path}/ppt-preview.png')
    for ext in ['ppt', 'pptx']:
        copy(f'{base_path}/ppt-preview.png', f'{base_path}/{ext}.png')
    print('[OK] PPT类图片完成')

# 7. 文本预览图 - 记事本风格
def create_text_preview():
    w, h = 240, 320
    img = Image.new('RGB', (w, h), '#fafafa')
    draw = ImageDraw.Draw(img)
    # 记事本样式
    draw.rectangle([15, 20, 225, 300], fill='#fffde7', outline='#fbc02d', width=2)
    # 横线
    for i in range(12):
        y = 45 + i * 22
        draw.line([25, y, 215, y], fill='#e0e0e0')
    # 文字模拟
    lines = [90, 70, 110, 60, 100, 80, 75, 65, 95, 50]
    for i, lw in enumerate(lines):
        y = 32 + i * 22
        draw.rectangle([25, y, 25 + lw, y + 10], fill='#757575')
    img.save(f'{base_path}/text-preview.png')
    for ext in ['txt', 'md', 'ini', 'conf']:
        copy(f'{base_path}/text-preview.png', f'{base_path}/{ext}.png')
    print('[OK] 文本类图片完成')

# 8. 日志预览图 - 终端日志风格
def create_log_preview():
    w, h = 240, 320
    img = Image.new('RGB', (w, h), '#0c0c0c')
    draw = ImageDraw.Draw(img)
    
    y = 15
    lh = 28
    log_lines = [
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'Server started')],
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'Port: 8080')],
        [('#888', '['), ('#dcdcaa', 'WARN'), ('#888', '] '), ('#dcdcaa', 'Memory 80%')],
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'User login')],
        [('#888', '['), ('#f14c4c', 'ERROR'), ('#888', '] '), ('#f14c4c', 'DB timeout')],
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'Retry conn...')],
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'Connected')],
        [('#888', '['), ('#569cd6', 'DEBUG'), ('#888', '] '), ('#888', 'Query: 50ms')],
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'Task done')],
        [('#888', '['), ('#6a9955', 'INFO'), ('#888', '] '), ('#ddd', 'Shutdown...')],
    ]
    
    for line in log_lines:
        x = 10
        for color, text in line:
            draw.text((x, y), text, fill=color)
            x += len(text) * 8
        y += lh
    
    img.save(f'{base_path}/log.png')
    print('[OK] 日志图片完成')

# 8. CSV预览图 - 表格风格
def create_csv_preview():
    w, h = 200, 280
    img = Image.new('RGB', (w, h), '#ffffff')
    draw = ImageDraw.Draw(img)
    # 表头
    draw.rectangle([15, 40, 185, 65], fill='#4caf50')
    # 表格行
    for i in range(7):
        y = 65 + i * 25
        bg = '#f5f5f5' if i % 2 == 0 else '#ffffff'
        draw.rectangle([15, y, 185, y + 25], fill=bg, outline='#e0e0e0')
    # 列分隔
    draw.line([75, 40, 75, 240], fill='#e0e0e0')
    draw.line([135, 40, 135, 240], fill='#e0e0e0')
    img.save(f'{base_path}/csv.png')
    print('[OK] CSV图片完成')

if __name__ == '__main__':
    print('开始生成预览图片...\n')
    create_code_preview()
    create_log_preview()
    create_video_preview()
    create_audio_preview()
    create_archive_preview()
    create_doc_preview()
    create_ppt_preview()
    create_text_preview()
    create_csv_preview()
    print('\n全部完成!')
