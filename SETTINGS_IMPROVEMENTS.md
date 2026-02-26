# 系统设置改进任务清单

## 问题列表

### 1. ✅ 加载动画样式预览问题

**问题**: 预览无法直接看到效果，样式有问题
**解决方案**:

- 已添加完整的预览动画 CSS
- 需要将压缩的 CSS 格式化为可读格式
- 添加实时预览功能

**需要修改的文件**:

- `layout/default/src/components/lay-setting/themes/BaseSetting.vue`

**修改内容**:

1. 格式化 `<style>` 标签中的压缩 CSS
2. 确保所有 10 种动画的预览样式都正确
3. 添加预览框的背景和边框样式

### 2. ⏳ 顶部实现不够美观，缺少动画

**问题**: 顶部工具栏样式单调，没有动画效果
**解决方案**:

- 添加悬停动画效果
- 改进图标和按钮样式
- 添加过渡动画

**需要修改的文件**:

- `layout/default/src/components/lay-navbar/index.vue`
- `layout/default/src/components/lay-header/index.vue`

**建议改进**:

```scss
// 添加悬停效果
.header-button {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

// 添加图标旋转动画
.icon-rotate {
  transition: transform 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}
```

### 3. ⏳ 消息配置点击发送测试消息无效

**问题**: `sendDevDefaultMessage` 函数没有正确触发
**解决方案**:

- 检查 emitter 事件监听
- 确保消息中心组件正确监听 `devMessagePush` 事件

**需要修改的文件**:

- `layout/default/src/components/lay-setting/themes/BaseSetting.vue` (已有函数)
- `layout/default/src/components/lay-message/index.vue` (需要添加监听)

**修改内容**:

```typescript
// 在消息中心组件中添加
import { emitter } from "@repo/core";

onMounted(() => {
  emitter.on("devMessagePush", (payload) => {
    // 添加消息到列表
    messages.value.unshift(payload);
  });
});

onUnmounted(() => {
  emitter.off("devMessagePush");
});
```

### 4. ✅ 显示 AI 设置激活没有显示出 AI

**问题**: AI 助手组件未创建或未正确集成
**解决方案**:

- 已创建 `lay-ai-chat/index.vue` 组件
- 需要在主布局中引入和使用

**需要修改的文件**:

- `layout/default/src/index.vue` (主布局)

**修改内容**:

```vue
<template>
  <div>
    <!-- 现有布局内容 -->

    <!-- 添加 AI 聊天组件 -->
    <LayAiChat />
  </div>
</template>

<script setup>
import LayAiChat from "./components/lay-ai-chat/index.vue";
</script>
```

### 4.1 ✅ AI 支持切换皮肤

**问题**: 需要支持多种机器人皮肤
**解决方案**:

- 已在 AI 组件中实现 5 种皮肤：
  - 🤖 机器人 (robot)
  - 🦊 阿狸 (fox)
  - 🐱 猫咪 (cat)
  - 🐻 小熊 (bear)
  - 🐼 熊猫 (panda)

**需要在设置中添加**:

```vue
<!-- 在 BaseSetting.vue 的 AI 设置区域添加 -->
<div class="setting-item">
  <div class="setting-item-label">
    <span>机器人皮肤</span>
    <span class="setting-item-desc">选择 AI 助手的外观</span>
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

**添加选项**:

```typescript
const aiChatSkinOptions = computed<Array<OptionsType>>(() => [
  { label: "🤖 机器人", value: "robot", tip: "经典机器人造型" },
  { label: "🦊 阿狸", value: "fox", tip: "可爱的小狐狸" },
  { label: "🐱 猫咪", value: "cat", tip: "萌萌的小猫咪" },
  { label: "🐻 小熊", value: "bear", tip: "憨厚的小熊" },
  { label: "🐼 熊猫", value: "panda", tip: "国宝熊猫" },
]);

function aiChatSkinChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.aiChatSkin = value;
  storageConfigureChange("aiChatSkin", value);
}
```

### 4.2 ⏳ 支持配置 API Key 和 URL

**问题**: 需要配置 AI 服务的 API
**解决方案**:

- 已在 AI 组件中预留配置项
- 需要在设置中添加输入框

**需要在设置中添加**:

```vue
<!-- API URL 配置 -->
<div class="setting-item">
  <div class="setting-item-label">
    <span>API URL</span>
    <span class="setting-item-desc">AI 服务的接口地址</span>
  </div>
  <div class="setting-item-control">
    <el-input
      v-model="settings.aiChatApiUrl"
      placeholder="https://api.openai.com/v1/chat/completions"
      @change="aiChatApiUrlChange"
      style="max-width: 300px"
    />
  </div>
</div>

<!-- API Key 已存在，确保正确配置 -->
```

**添加函数**:

```typescript
function aiChatApiUrlChange(value: string) {
  settings.aiChatApiUrl = value;
  storageConfigureChange("aiChatApiUrl", value);
}
```

## 实施步骤

### 第一步：修复加载动画预览

1. 格式化 BaseSetting.vue 中的 CSS
2. 测试所有 10 种动画预览
3. 确保样式正确显示

### 第二步：集成 AI 聊天组件

1. 在主布局中引入 LayAiChat 组件
2. 在 BaseSetting.vue 中添加皮肤选择
3. 添加 API URL 配置
4. 测试 AI 聊天功能

### 第三步：修复消息测试功能

1. 找到消息中心组件
2. 添加 devMessagePush 事件监听
3. 测试发送测试消息

### 第四步：美化顶部工具栏

1. 添加悬停动画
2. 改进图标样式
3. 添加过渡效果

## 文件清单

### 已创建

- ✅ `layout/default/src/components/lay-ai-chat/index.vue`

### 需要修改

- ⏳ `layout/default/src/components/lay-setting/themes/BaseSetting.vue`
- ⏳ `layout/default/src/index.vue`
- ⏳ `layout/default/src/components/lay-message/index.vue`
- ⏳ `layout/default/src/components/lay-navbar/index.vue`

## 配置项说明

### AI 聊天配置

```typescript
interface AIChatConfig {
  aiChatEnabled: boolean; // 是否启用
  aiChatPosition: string; // 位置: bottom-right, bottom-left, bottom-center
  aiChatTheme: string; // 主题: default, blue, green, orange, pink, dark
  aiChatSkin: string; // 皮肤: robot, fox, cat, bear, panda
  aiChatApiKey: string; // API 密钥
  aiChatApiUrl: string; // API 地址
}
```

### 加载动画配置

```typescript
interface LoaderConfig {
  loaderStyle: string; // 样式: default, rings, simple, pulse, blocks,
  //       minecraft, pokemon, cyberpunk, book, writing
}
```

## 测试清单

- [ ] 加载动画预览正常显示
- [ ] 所有 10 种动画样式正确
- [ ] AI 聊天组件正常显示
- [ ] AI 皮肤切换正常
- [ ] API 配置保存正常
- [ ] 测试消息发送成功
- [ ] 顶部工具栏动画流畅

## 注意事项

1. 所有配置都应该保存到 `$storage.configure`
2. 使用 `storageConfigureChange` 函数统一保存
3. 使用 `emitter` 进行组件间通信
4. 确保深色模式下样式正常
5. 移动端适配需要测试

## 优先级

1. 🔴 高优先级：AI 聊天组件集成（核心功能）
2. 🟡 中优先级：加载动画预览修复（用户体验）
3. 🟢 低优先级：顶部美化、消息测试（锦上添花）
