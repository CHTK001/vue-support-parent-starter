# xterm.js ANSI 转义序列问题解决方案

## 问题描述

在 SSH 终端连接成功后，出现 `[xx]` 样式的显示问题，这通常是 ANSI 转义序列没有被正确解析导致的。

## 问题原因

1. **xterm.js 配置不当** - 缺少必要的配置选项
2. **ANSI 转义序列格式错误** - 数据传输过程中格式被破坏
3. **终端主题配置缺失** - 颜色映射不完整
4. **字符编码问题** - UTF-8 编码处理不当

## 解决方案

### 1. 完善 xterm.js 配置

```javascript
const terminal = new Terminal({
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    selection: '#264f78',
    // 完整的颜色映射
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5'
  },
  allowTransparency: true,
  convertEol: true,
  scrollback: 1000,
  tabStopWidth: 8,
  allowProposedApi: true,
  // 关键配置
  windowsMode: false,
  macOptionIsMeta: false,
  rightClickSelectsWord: true,
  rendererType: 'canvas',
  disableStdin: false
});
```

### 2. 正确处理 SSH 数据

```javascript
const handleSSHMessage = (data) => {
  switch (data.messageType) {
    case 'ssh_data':
      if (terminal.value && data.data) {
        // 确保数据是字符串格式
        let outputData = data.data;
        if (typeof outputData !== 'string') {
          outputData = String(outputData);
        }
        
        // 直接写入终端，xterm.js 会自动处理 ANSI 转义序列
        terminal.value.write(outputData);
        bytesReceived.value += outputData.length;
      }
      break;
  }
};
```

### 3. 添加调试功能

```javascript
// 调试：检测 ANSI 转义序列
if (outputData.includes('\x1b[')) {
  console.log('检测到 ANSI 转义序列:', outputData.replace(/\x1b/g, '\\x1b'));
}

// 测试 ANSI 颜色功能
const testAnsiColors = () => {
  if (!terminal.value) return;
  
  const testData = [
    '\r\n=== ANSI 颜色测试 ===\r\n',
    '\x1b[31m红色文本\x1b[0m\r\n',
    '\x1b[32m绿色文本\x1b[0m\r\n', 
    '\x1b[33m黄色文本\x1b[0m\r\n',
    '\x1b[34m蓝色文本\x1b[0m\r\n',
    '\x1b[1m粗体文本\x1b[0m\r\n',
    '\x1b[4m下划线文本\x1b[0m\r\n',
    '=== 测试完成 ===\r\n\r\n'
  ];
  
  testData.forEach((line, index) => {
    setTimeout(() => {
      terminal.value.write(line);
    }, index * 100);
  });
};
```

## 常见 ANSI 转义序列

| 序列 | 功能 | 示例 |
|------|------|------|
| `\x1b[0m` | 重置所有格式 | `\x1b[31m红色\x1b[0m` |
| `\x1b[1m` | 粗体 | `\x1b[1m粗体文本\x1b[0m` |
| `\x1b[4m` | 下划线 | `\x1b[4m下划线\x1b[0m` |
| `\x1b[7m` | 反色 | `\x1b[7m反色文本\x1b[0m` |
| `\x1b[31m` | 红色前景 | `\x1b[31m红色文本\x1b[0m` |
| `\x1b[32m` | 绿色前景 | `\x1b[32m绿色文本\x1b[0m` |
| `\x1b[33m` | 黄色前景 | `\x1b[33m黄色文本\x1b[0m` |
| `\x1b[34m` | 蓝色前景 | `\x1b[34m蓝色文本\x1b[0m` |
| `\x1b[41m` | 红色背景 | `\x1b[41m红色背景\x1b[0m` |
| `\x1b[42m` | 绿色背景 | `\x1b[42m绿色背景\x1b[0m` |

## 故障排除步骤

### 1. 检查数据传输

```javascript
// 在接收 SSH 数据时添加日志
console.log('原始数据:', JSON.stringify(data.data));
console.log('数据长度:', data.data.length);
console.log('数据类型:', typeof data.data);
```

### 2. 验证 ANSI 支持

使用测试按钮发送标准 ANSI 转义序列，检查终端是否正确显示颜色和格式。

### 3. 检查终端配置

确保 xterm.js 的主题配置包含完整的颜色映射，特别是 `black`、`red`、`green` 等基础颜色。

### 4. 检查字符编码

确保 SSH 服务器和客户端都使用 UTF-8 编码：

```bash
# 在 SSH 服务器上设置
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

## 最佳实践

1. **使用标准 ANSI 序列** - 避免使用非标准的转义序列
2. **完整的颜色配置** - 确保终端主题包含所有必要的颜色
3. **数据类型检查** - 确保传输的数据是正确的字符串格式
4. **错误处理** - 添加适当的错误处理和日志记录
5. **测试功能** - 提供测试按钮验证 ANSI 功能

## 测试命令

在 SSH 终端中可以使用以下命令测试 ANSI 支持：

```bash
# 测试基本颜色
echo -e "\e[31m红色\e[0m \e[32m绿色\e[0m \e[33m黄色\e[0m \e[34m蓝色\e[0m"

# 测试格式
echo -e "\e[1m粗体\e[0m \e[4m下划线\e[0m \e[7m反色\e[0m"

# 测试背景色
echo -e "\e[41m红色背景\e[0m \e[42m绿色背景\e[0m"

# 使用 ls 命令测试（如果支持颜色）
ls --color=always
```

## 注意事项

- xterm.js 默认支持大部分标准 ANSI 转义序列
- 确保不要手动处理或转换 ANSI 序列，让 xterm.js 自动处理
- 如果仍然出现 `[xx]` 样式，检查数据是否在传输过程中被修改
- 某些 SSH 服务器可能需要特定的终端类型设置（如 `TERM=xterm-256color`）
