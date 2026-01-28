# 字体加密字体文件生成说明

## 概述

字体加密功能需要自定义字体文件。字体文件将数字和汉字的字形映射到字母位置，实现真正的字体加密。

## 原理

1. **字符映射**：将数字0-9映射到字母a-j，将常用汉字映射到其他字母和符号
2. **字体文件**：自定义字体文件将字母a显示为数字0的形状，字母b显示为数字1的形状，以此类推
3. **HTML替换**：在HTML中，将数字0替换为字母a
4. **字体渲染**：浏览器通过@font-face加载自定义字体，将字母a渲染为数字0的形状
5. **防复制**：用户看到的是数字0，但复制的是字母a，无法直接使用

## 生成字体文件

### 方法1：使用Python脚本（推荐）

1. 安装依赖：

```bash
pip install fonttools brotli
```

2. 运行脚本：

```bash
cd vue-support-parent-starter/layout/default/scripts
python generate_font.py
```

3. 脚本会自动：
   - 从系统字体读取字形
   - 创建字符映射
   - 生成字体文件到 `src/assets/fonts/font-encryption.woff2`

### 方法2：使用在线工具

1. 使用 [FontForge](https://fontforge.org/) 或其他字体编辑工具
2. 打开系统字体（如微软雅黑、PingFang SC等）
3. 将数字0的字形复制到字母a的位置
4. 将数字1的字形复制到字母b的位置
5. 以此类推，完成所有映射
6. 导出为WOFF2格式

### 方法3：使用fonttools命令行

```bash
# 安装fonttools
pip install fonttools

# 从系统字体创建映射
pyftsubset system_font.ttf --unicodes="U+0030-0039" --output-file=numbers.woff2

# 然后手动修改cmap表，将数字字形映射到字母位置
```

## 字符映射表

### 数字映射

- 0 → a
- 1 → b
- 2 → c
- 3 → d
- 4 → e
- 5 → f
- 6 → g
- 7 → h
- 8 → i
- 9 → j

### 汉字映射

详见 `fontEncryption.ts` 中的 `COMMON_CHINESE_MAP`

## 注意事项

1. 字体文件必须包含所有映射字符的字形
2. 字体文件应使用WOFF2格式以减小体积
3. 字体文件路径在 `font-encryption.css` 中配置
4. 如果字体文件不存在，字体加密功能将无法正常工作

## 测试

生成字体文件后，可以：

1. 在浏览器中打开页面
2. 启用字体加密功能
3. 查看页面中的数字和汉字是否正常显示
4. 尝试复制文本，应该复制到的是映射后的字符（如字母a而不是数字0）
