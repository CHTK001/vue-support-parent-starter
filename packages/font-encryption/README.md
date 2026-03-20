# 字体加密与防爬虫系统

## 概述

本项目实现了完整的字体加密和防爬虫系统，包括：

1. **字体加密** - 通过自定义字体映射，让 DOM 中的文本显示为乱码，但视觉上正常
2. **OCR 噪点** - 在文本周围添加细微噪点，干扰 OCR 识别
3. **零宽字符** - 插入不可见字符，干扰文本复制
4. **禁用选择/复制** - 可选的用户交互限制

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     防爬虫系统架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ 字体生成层    │    │  运行时层     │    │   应用层      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ font-cloak   │───▶│ @repo/font-  │───▶│ useFontEn-   │  │
│  │ generate     │    │ encryption   │    │ cryption     │  │
│  │ script       │    │ register     │    │ Hook         │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ .woff2 fonts │    │ FontFace API │    │ CSS classes  │  │
│  │ + metadata   │    │ registration │    │ + directives │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 核心原理

### 1. 字体加密原理

```
原始文本: "账号: 123456"
         ↓
字符映射: "账号: 󰀀󰀁󰀂󰀃󰀄󰀅"  (Unicode 私有区)
         ↓
自定义字体: 将私有区字符映射回正常显示
         ↓
视觉效果: "账号: 123456"  (看起来正常)
         ↓
DOM 内容: "账号: 󰀀󰀁󰀂󰀃󰀄󰀅"  (实际是乱码)
         ↓
XPath 抓取: 获取到乱码，无法识别
```

### 2. OCR 噪点原理

```css
/* 使用 CSS 伪元素添加噪点背景 */
.font-encryption-ocr-noise::after {
  content: "";
  position: absolute;
  opacity: 0.025; /* 极低透明度，人眼几乎看不见 */
  background-image: radial-gradient(...); /* 随机噪点 */
  pointer-events: none; /* 不影响交互 */
}
```

效果：
- 人眼：看起来正常，几乎察觉不到噪点
- OCR：识别率大幅下降，因为噪点干扰了字符边缘

## 使用方式

### 方式 1: 全局启用（推荐用于后台管理系统）

```typescript
// main.ts
import "@repo/font-encryption"; // 自动注册字体

// App.vue 或 Layout
import { useFontEncryption } from "@layout/default";

useFontEncryption({
  enabled: true,
  applyGlobal: true, // 全局应用
  ocrNoise: { level: "medium" }, // 启用中等强度噪点
});
```

### 方式 2: 选择器模式（推荐用于特定区域）

```typescript
import { useFontEncryption } from "@layout/default";

useFontEncryption({
  enabled: true,
  applyGlobal: false,
  selectors: [
    ".sensitive-data", // 敏感数据
    ".user-info", // 用户信息
    ".financial-amount", // 金额
  ],
  ocrNoise: { level: "high" }, // 高强度噪点
});
```

### 方式 3: CSS 类名（最灵活）

```vue
<template>
  <!-- 单个元素 -->
  <div class="font-encryption-enabled">
    账号: 123456
  </div>

  <!-- 敏感数据 -->
  <div class="fe-sensitive">
    身份证: 110101199001011234
  </div>

  <!-- 带噪点 -->
  <div class="font-encryption-enabled font-encryption-ocr-noise">
    银行卡: 6222 0000 0000 0000
  </div>

  <!-- 禁用选择 -->
  <div class="font-encryption-enabled font-encryption-no-select">
    密钥: abc123def456
  </div>
</template>
```

### 方式 4: 指令方式（动态控制）

```vue
<template>
  <div v-font-encryption="{ enabled: true, encryptNumbers: true }">
    订单号: 20250315001
  </div>
</template>

<script setup>
import { vFontEncryption } from "@layout/default";
</script>
```

### 方式 5: Composable 控制（完全控制）

```vue
<script setup>
import { useFontEncryptionControl } from "@layout/default";

const {
  enabled,
  encryptNumbers,
  encryptChinese,
  ocrNoise,
  disableCopy,
  toggle,
  enable,
  disable,
} = useFontEncryptionControl({
  initialEnabled: true,
  initialEncryptNumbers: true,
  initialEncryptChinese: true,
  initialOcrNoise: { level: "medium" },
});
</script>

<template>
  <div>
    <button @click="toggle">切换加密</button>
    <div>当前状态: {{ enabled ? "已启用" : "已禁用" }}</div>
  </div>
</template>
```

## 可用的 CSS 类

### 基础类

| 类名 | 说明 | 使用场景 |
|------|------|---------|
| `.font-encryption-enabled` | 启用字体加密 | 需要加密的元素 |
| `.font-encryption-global` | 全局加密（应用到 body） | 整个应用加密 |
| `.font-encryption-numbers` | 仅加密数字 | 订单号、金额等 |
| `.font-encryption-chinese` | 仅加密中文 | 姓名、地址等 |

### 语义类

| 类名 | 说明 | 使用场景 |
|------|------|---------|
| `.fe-sensitive` | 敏感数据 | 通用敏感信息 |
| `.fe-sensitive-id` | 身份证号 | 身份证 |
| `.fe-sensitive-phone` | 手机号 | 电话号码 |
| `.fe-sensitive-card` | 银行卡号 | 银行卡 |
| `.fe-sensitive-address` | 地址 | 收货地址 |

### 增强类

| 类名 | 说明 | 副作用 |
|------|------|--------|
| `.font-encryption-ocr-noise` | OCR 噪点 | 无 |
| `.font-encryption-no-select` | 禁用选择 | 影响用户体验 |
| `.font-encryption-no-context` | 禁用右键菜单 | 影响用户体验 |

## 配置选项

### FontEncryptionConfig

```typescript
interface FontEncryptionConfig {
  /** 是否启用字体加密 */
  enabled: boolean;
  
  /** 是否应用到全局 */
  applyGlobal: boolean;
  
  /** 需要加密的选择器（CSS 选择器） */
  selectors?: string[];
  
  /** 是否启用 OCR 噪点 */
  ocrNoise?: boolean | {
    level?: "low" | "medium" | "high";
  };
}
```

### 噪点级别说明

| 级别 | 透明度 | 噪点大小 | 视觉影响 | OCR 干扰 |
|------|--------|---------|---------|---------|
| `low` | 0.025 | 3px | 几乎不可见 | 轻度干扰 |
| `medium` | 0.035 | 3px | 仔细看能发现 | 中度干扰 |
| `high` | 0.045 | 2.5px | 明显可见 | 强力干扰 |

## 字体生成

### 生成新的加密字体

```bash
cd packages/font-encryption
pnpm run font:generate
```

这会生成：
- `packages/assets/fonts/font-cloak-default.woff2`
- `packages/assets/fonts/font-cloak-variant-a.woff2`
- `packages/assets/fonts/font-cloak-variant-b.woff2`
- 对应的 `.json` 元数据文件

### 字体变体说明

系统会随机选择 2 个字体变体：
- 注册为 `AppTextPrimary` 和 `AppTextSecondary`
- 每次刷新页面可能使用不同的字体组合
- 增加爬虫破解难度

## 安全性说明

### 防护等级

| 攻击方式 | 防护效果 | 说明 |
|---------|---------|------|
| 简单复制粘贴 | ⭐⭐⭐⭐⭐ | 复制到的是乱码 |
| XPath/CSS 选择器 | ⭐⭐⭐⭐⭐ | 获取到的是乱码 |
| OCR 识别 | ⭐⭐⭐⭐ | 噪点干扰识别 |
| 截图 + 人工录入 | ⭐ | 无法防护 |
| 浏览器开发者工具 | ⭐⭐ | 可以看到字体映射 |
| 字体文件逆向 | ⭐⭐⭐ | 需要技术能力 |

### 注意事项

1. **不是绝对安全**：字体加密只是增加爬虫难度，不能完全防止
2. **用户体验**：禁用选择/复制会影响用户体验，谨慎使用
3. **性能影响**：全局启用会增加 DOM 监听，建议只在必要区域使用
4. **SEO 影响**：搜索引擎可能无法正确索引加密文本
5. **无障碍**：屏幕阅读器可能无法正确读取加密文本

## 最佳实践

### 1. 分级保护

```typescript
// 公开信息 - 不加密
<div>产品名称: iPhone 15</div>

// 一般信息 - 仅字体加密
<div class="font-encryption-enabled">
  订单号: 20250315001
</div>

// 敏感信息 - 字体加密 + 轻度噪点
<div class="fe-sensitive font-encryption-ocr-noise">
  手机号: 138****8888
</div>

// 高度敏感 - 字体加密 + 高强度噪点 + 禁用选择
<div class="fe-sensitive-card font-encryption-ocr-noise font-encryption-no-select">
  银行卡: 6222 **** **** 0000
</div>
```

### 2. 按场景选择

```typescript
// 后台管理系统 - 全局启用
useFontEncryption({
  enabled: true,
  applyGlobal: true,
  ocrNoise: { level: "medium" },
});

// 用户中心 - 选择器模式
useFontEncryption({
  enabled: true,
  selectors: [".user-info", ".order-detail"],
  ocrNoise: { level: "low" },
});

// 公开页面 - 不启用
// 不调用 useFontEncryption
```

### 3. 配合后端脱敏

```typescript
// 前端：字体加密
<div class="fe-sensitive-phone">
  {{ phoneNumber }}
</div>

// 后端：数据脱敏
{
  phoneNumber: "138****8888" // 已脱敏
}

// 双重保护：
// 1. 后端返回脱敏数据
// 2. 前端字体加密显示
```

## 演示页面

访问 `/font-encryption-demo` 查看完整演示。

## 技术栈

- **font-cloak**: 字体加密库
- **@repo/codec-wasm**: WASM 加解密模块
- **FontFace API**: 动态字体注册
- **MutationObserver**: DOM 变化监听
- **CSS 伪元素**: 噪点生成

## 常见问题

### Q: 为什么复制出来是乱码？

A: 这是字体加密的核心功能。DOM 中存储的就是乱码（Unicode 私有区字符），只是通过自定义字体显示为正常文本。

### Q: 会影响性能吗？

A: 有轻微影响。全局模式会监听 DOM 变化，建议只在必要区域使用。

### Q: 可以和其他字体一起使用吗？

A: 可以。加密字体会作为 font-family 的第一选项，未加密的字符会回退到系统字体。

### Q: 如何调试？

A: 在开发环境可以临时禁用：
```typescript
useFontEncryption({
  enabled: import.meta.env.PROD, // 仅生产环境启用
  // ...
});
```

### Q: 支持哪些字符？

A: 当前支持：
- 数字 0-9
- 常用汉字（约 1000 个）
- 可以通过修改 WASM 模块扩展

## 更新日志

### v1.0.0 (2025-03-15)
- ✅ 字体加密基础功能
- ✅ OCR 噪点干扰
- ✅ 多种使用方式
- ✅ 完整的 TypeScript 类型
- ✅ 演示页面

## 许可证

MIT
