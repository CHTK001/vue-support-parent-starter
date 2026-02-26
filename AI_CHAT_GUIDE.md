# AI 聊天助手使用指南

## 概述

本系统集成了 AI 聊天助手功能，默认使用 **Hugging Face 免费推理 API**，无需配置即可使用。

## 默认配置

- **模型**: Qwen/Qwen2.5-7B-Instruct
- **提供商**: Hugging Face Serverless Inference API
- **费用**: 完全免费
- **限制**: 有速率限制，首次使用需要加载模型（约 20 秒）

## 快速开始

1. 打开系统设置
2. 找到 "AI 助手" 设置区域
3. 启用 "启用 AI 助手" 开关
4. 页面右下角会出现 AI 机器人图标
5. 点击图标开始聊天

## 功能特性

### 1. 无需配置即可使用

- 默认使用 Hugging Face 免费模型
- 无需注册或申请 API Key
- 开箱即用

### 2. 多种机器人皮肤

- 🤖 机器人（默认）
- 🦊 阿狸
- 🐱 猫咪
- 🐻 小熊
- 🐼 熊猫

### 3. 多种主题风格

- Default（紫色渐变）
- Blue（蓝色渐变）
- Green（绿色渐变）
- Orange（橙色渐变）
- Pink（粉色渐变）
- Dark（深色主题）

### 4. 灵活的位置设置

- 右下角（默认）
- 左下角
- 底部居中

### 5. 可拖拽窗口

- 聊天窗口可以通过拖拽标题栏移动位置
- 方便在不同场景下使用

## 高级配置

### 使用自定义 API

如果你有自己的 API Key 或想使用其他模型，可以在系统设置中配置：

#### 1. Hugging Face API（推荐）

**获取 API Key**:

1. 访问 [Hugging Face](https://huggingface.co/)
2. 注册并登录
3. 进入 Settings → Access Tokens
4. 创建新的 Token

**配置**:

- API URL: `https://api-inference.huggingface.co/models/模型名称`
- API Key: 你的 Hugging Face Token

**推荐模型**:

- `Qwen/Qwen2.5-7B-Instruct` - 中英文对话（默认）
- `mistralai/Mistral-7B-Instruct-v0.2` - 英文对话
- `meta-llama/Llama-2-7b-chat-hf` - 英文对话
- `google/gemma-7b-it` - 多语言对话

#### 2. OpenAI API

**配置**:

- API URL: `https://api.openai.com/v1/chat/completions`
- API Key: 你的 OpenAI API Key

#### 3. 其他兼容 OpenAI 格式的 API

许多 AI 服务提供商都提供兼容 OpenAI 格式的 API，例如：

- Azure OpenAI
- 阿里云通义千问
- 百度文心一言
- 讯飞星火

## 使用技巧

### 1. 首次使用

- 首次发送消息时，模型需要加载（约 20 秒）
- 加载完成后，后续响应会更快

### 2. 速率限制

- 免费 API 有速率限制
- 如果遇到 429 错误，请稍后再试
- 建议配置自己的 API Key 以获得更好的体验

### 3. 对话上下文

- 系统会保留最近 10 条消息作为上下文
- 这样 AI 可以理解对话的连贯性
- 如需重新开始，刷新页面即可

### 4. 错误处理

- 如果遇到错误，系统会显示友好的错误提示
- 常见错误及解决方法：
  - **503 错误**: 模型正在加载，等待 20 秒后重试
  - **429 错误**: 请求过于频繁，稍后再试
  - **401 错误**: API Key 无效，检查配置
  - **网络错误**: 检查网络连接

## 可用的免费 AI 模型

### Hugging Face 免费模型列表

#### 中文对话模型

1. **Qwen/Qwen2.5-7B-Instruct** ⭐ 推荐
   - 阿里巴巴开源
   - 中英文双语
   - 7B 参数
   - 性能优秀

2. **THUDM/chatglm3-6b**
   - 清华大学开源
   - 中英文双语
   - 6B 参数

#### 英文对话模型

1. **mistralai/Mistral-7B-Instruct-v0.2**
   - 欧洲开源
   - 英文对话
   - 7B 参数
   - 性能优秀

2. **meta-llama/Llama-2-7b-chat-hf**
   - Meta 开源
   - 英文对话
   - 7B 参数

3. **google/gemma-7b-it**
   - Google 开源
   - 多语言
   - 7B 参数

#### 代码助手模型

1. **Qwen/Qwen2.5-Coder-7B-Instruct**
   - 专注代码生成
   - 支持多种编程语言

2. **bigcode/starcoder2-15b**
   - 代码生成专家
   - 15B 参数

## API 格式说明

### Hugging Face Inference API

**请求格式**:

```json
{
  "inputs": "用户消息",
  "parameters": {
    "max_new_tokens": 512,
    "temperature": 0.7,
    "top_p": 0.95,
    "return_full_text": false
  }
}
```

**响应格式**:

```json
[
  {
    "generated_text": "AI 回复内容"
  }
]
```

### OpenAI Compatible API

**请求格式**:

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [{ "role": "user", "content": "用户消息" }],
  "temperature": 0.7,
  "max_tokens": 512
}
```

**响应格式**:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI 回复内容"
      }
    }
  ]
}
```

## 隐私说明

- 所有配置（API Key、API URL）仅保存在本地浏览器
- 不会上传到服务器
- 对话内容直接发送到配置的 API 端点
- 系统不会记录或存储对话内容

## 故障排除

### 问题 1: 机器人图标不显示

**解决方法**:

1. 检查系统设置中是否启用了 AI 助手
2. 刷新页面
3. 清除浏览器缓存

### 问题 2: 发送消息后一直加载

**可能原因**:

1. 模型首次加载（等待 20 秒）
2. 网络连接问题
3. API 服务不可用

**解决方法**:

1. 等待 20-30 秒
2. 检查网络连接
3. 尝试刷新页面

### 问题 3: 收到错误消息

**解决方法**:

1. 查看错误提示中的具体信息
2. 根据错误代码采取相应措施
3. 如果是 API Key 问题，重新配置

### 问题 4: 回复质量不佳

**改进方法**:

1. 尝试更换其他模型
2. 配置自己的 API Key
3. 使用更大参数的模型
4. 提供更清晰的问题描述

## 开发者信息

### 技术栈

- Vue 3 Composition API
- TypeScript
- Hugging Face Inference API
- VueUse (useDraggable)

### 自定义开发

如需自定义 AI 聊天功能，可以修改以下文件：

- `layout/default/src/components/lay-ai-chat/index.vue` - 主组件
- `layout/default/src/components/lay-setting/themes/BaseSetting.vue` - 设置界面
- `layout/default/src/types/theme.ts` - 类型定义

## 更新日志

### v1.0.0 (2026-02-26)

- ✨ 初始版本发布
- 🎨 支持 5 种机器人皮肤
- 🎨 支持 6 种主题风格
- 🚀 默认使用 Hugging Face 免费 API
- 📱 支持拖拽移动窗口
- 🔧 支持自定义 API 配置
- 🌐 支持中英文对话

## 反馈与支持

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 在线客服

---

**享受与 AI 的对话吧！** 🤖✨
