# 快速修复指南

## 立即可以做的修改

### 1. 在 BaseSetting.vue 的 AI 设置区域添加（第 1770 行附近，API Key 设置后面）

```vue
<!-- API URL 设置 -->
<div class="setting-item">
  <div class="setting-item-label">
    <span>API URL</span>
    <span class="setting-item-desc"
      >AI 服务的接口地址</span
    >
  </div>
  <div class="setting-item-control">
    <el-input
      v-model="settings.aiChatApiUrl"
      placeholder="https://api.openai.com/v1/chat/completions"
      @change="aiChatApiUrlChange"
      style="max-width: 260px"
    />
  </div>
</div>

<!-- 机器人皮肤设置 -->
<div class="setting-item">
  <div class="setting-item-label">
    <span>机器人皮肤</span>
    <span class="setting-item-desc"
      >选择 AI 助手的外观造型</span
    >
  </div>
  <div class="setting-item-control">
    <Segmented
      :model-value="settings.aiChatSkin"
      :options="aiChatSkinOptions"
      @change="aiChatSkinChange"
    />
  </div>
</div>
```

### 2. 在 BaseSetting.vue 的 script 部分添加（settings 对象中）

```typescript
// 在 settings 对象中添加
aiChatSkin: $storage.configure.aiChatSkin ?? "robot",
aiChatApiUrl: $storage.configure.aiChatApiUrl ?? "",
```

### 3. 在 BaseSetting.vue 的 script 部分添加（computed 选项）

```typescript
/** 机器人皮肤选项 */
const aiChatSkinOptions = computed<Array<OptionsType>>(() => [
  {
    label: "🤖 机器人",
    value: "robot",
    tip: "经典机器人造型",
  },
  {
    label: "🦊 阿狸",
    value: "fox",
    tip: "可爱的小狐狸",
  },
  {
    label: "🐱 猫咪",
    value: "cat",
    tip: "萌萌的小猫咪",
  },
  {
    label: "🐻 小熊",
    value: "bear",
    tip: "憨厚的小熊",
  },
  {
    label: "🐼 熊猫",
    value: "panda",
    tip: "国宝熊猫",
  },
]);
```

### 4. 在 BaseSetting.vue 的 script 部分添加（函数）

```typescript
/**
 * AI 机器人皮肤变更
 */
function aiChatSkinChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.aiChatSkin = value;
  storageConfigureChange("aiChatSkin", value);
}

/**
 * AI API URL 变更
 */
function aiChatApiUrlChange(value: string) {
  settings.aiChatApiUrl = value;
  storageConfigureChange("aiChatApiUrl", value);
}
```

### 5. 在主布局文件中引入 AI 聊天组件

文件: `layout/default/src/index.vue`

```vue
<template>
  <div>
    <!-- 现有的布局内容 -->

    <!-- 在最后添加 AI 聊天组件 -->
    <LayAiChat />
  </div>
</template>

<script setup lang="ts">
// 在 import 部分添加
import LayAiChat from "./components/lay-ai-chat/index.vue";

// 其他现有代码...
</script>
```

## 测试步骤

1. 打开系统设置
2. 找到 "AI 助手" 设置区域
3. 启用 AI 助手开关
4. 选择机器人皮肤
5. 输入 API URL（可选）
6. 输入 API Key（可选）
7. 保存设置
8. 查看页面右下角是否出现 AI 机器人图标
9. 点击图标测试聊天功能

## 完整的配置示例

```typescript
{
  aiChatEnabled: true,
  aiChatPosition: "bottom-right",
  aiChatTheme: "default",
  aiChatSkin: "fox",  // 新增
  aiChatApiKey: "sk-xxx",
  aiChatApiUrl: "https://api.openai.com/v1/chat/completions"  // 新增
}
```

## 注意事项

1. AI 聊天组件已创建在 `layout/default/src/components/lay-ai-chat/index.vue`
2. 所有配置都会自动保存到 localStorage
3. 刷新页面后配置会保持
4. 深色模式下样式会自动适配
5. 移动端会自动调整布局

## 如果遇到问题

### AI 图标不显示

- 检查 `aiChatEnabled` 是否为 `true`
- 检查主布局是否正确引入 `LayAiChat` 组件
- 打开浏览器控制台查看是否有错误

### 皮肤切换无效

- 检查 `aiChatSkin` 配置是否正确保存
- 刷新页面重新加载配置
- 检查 AI 组件是否正确监听配置变化

### API 调用失败

- 检查 API URL 是否正确
- 检查 API Key 是否有效
- 查看浏览器控制台的网络请求

## 下一步优化

1. 实现真实的 API 调用（目前是模拟）
2. 添加更多机器人皮肤
3. 支持自定义皮肤图片
4. 添加聊天历史记录
5. 支持语音输入
6. 支持 Markdown 渲染
7. 添加代码高亮显示
