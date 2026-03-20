# 字体加密快速开始

## 5 分钟快速上手

### 1. 最简单的方式（推荐）

```vue
<template>
  <!-- 只需添加 CSS 类 -->
  <div class="font-encryption-enabled">
    账号: 123456
  </div>
</template>
```

就这么简单！文本会自动加密。

### 2. 添加 OCR 噪点

```vue
<template>
  <div class="font-encryption-enabled font-encryption-ocr-noise">
    手机号: 13800138000
  </div>
</template>
```

### 3. 敏感数据（推荐）

```vue
<template>
  <!-- 使用语义化类名 -->
  <div class="fe-sensitive">身份证: 110101199001011234</div>
  <div class="fe-sensitive-phone">手机: 13800138000</div>
  <div class="fe-sensitive-card">银行卡: 6222 0000 0000 0000</div>
</template>
```

## 常用场景

### 场景 1: 用户信息页面

```vue
<template>
  <div class="user-profile">
    <div class="info-item">
      <label>姓名:</label>
      <span class="fe-sensitive">张三</span>
    </div>
    <div class="info-item">
      <label>手机:</label>
      <span class="fe-sensitive-phone">138****8888</span>
    </div>
    <div class="info-item">
      <label>身份证:</label>
      <span class="fe-sensitive-id">110101********1234</span>
    </div>
  </div>
</template>
```

### 场景 2: 订单详情

```vue
<template>
  <div class="order-detail">
    <div class="order-number">
      订单号: <span class="font-encryption-enabled">20250315001</span>
    </div>
    <div class="order-amount">
      金额: <span class="font-encryption-enabled">¥1,234.56</span>
    </div>
    <div class="shipping-address">
      地址: <span class="fe-sensitive-address">北京市朝阳区xxx</span>
    </div>
  </div>
</template>
```

### 场景 3: 数据表格

```vue
<template>
  <el-table :data="tableData">
    <el-table-column prop="name" label="姓名">
      <template #default="{ row }">
        <span class="fe-sensitive">{{ row.name }}</span>
      </template>
    </el-table-column>
    
    <el-table-column prop="phone" label="手机号">
      <template #default="{ row }">
        <span class="fe-sensitive-phone">{{ row.phone }}</span>
      </template>
    </el-table-column>
    
    <el-table-column prop="amount" label="金额">
      <template #default="{ row }">
        <span class="font-encryption-enabled">{{ row.amount }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>
```

## 全局配置（可选）

如果想全局启用，在 `App.vue` 或 `Layout` 中：

```vue
<script setup>
import { useFontEncryption } from "@layout/default";

// 全局启用
useFontEncryption({
  enabled: true,
  applyGlobal: true,
  ocrNoise: { level: "medium" },
});
</script>
```

## CSS 类速查表

### 基础类
- `.font-encryption-enabled` - 启用加密
- `.font-encryption-ocr-noise` - 添加噪点

### 语义类（推荐）
- `.fe-sensitive` - 通用敏感数据
- `.fe-sensitive-id` - 身份证
- `.fe-sensitive-phone` - 手机号
- `.fe-sensitive-card` - 银行卡
- `.fe-sensitive-address` - 地址

### 增强类（谨慎使用）
- `.font-encryption-no-select` - 禁用选择
- `.font-encryption-no-context` - 禁用右键

## 组合使用

```vue
<!-- 加密 + 噪点 -->
<div class="font-encryption-enabled font-encryption-ocr-noise">
  数据
</div>

<!-- 敏感数据 + 噪点 + 禁用选择 -->
<div class="fe-sensitive-card font-encryption-ocr-noise font-encryption-no-select">
  6222 0000 0000 0000
</div>
```

## 效果对比

### 未加密
```html
<div>账号: 123456</div>
```
- DOM 内容: `账号: 123456`
- 视觉效果: `账号: 123456`
- XPath 抓取: `账号: 123456` ❌ 可以抓取

### 已加密
```html
<div class="font-encryption-enabled">账号: 123456</div>
```
- DOM 内容: `账号: 󰀀󰀁󰀂󰀃󰀄󰀅` (乱码)
- 视觉效果: `账号: 123456` (正常显示)
- XPath 抓取: `账号: 󰀀󰀁󰀂󰀃󰀄󰀅` ✅ 抓取到乱码

## 注意事项

1. **不要过度使用** - 只在敏感数据上使用
2. **配合后端脱敏** - 前后端双重保护
3. **注意用户体验** - 避免禁用选择/复制
4. **测试兼容性** - 确保在目标浏览器正常工作

## 下一步

- 查看 [完整文档](./README.md)
- 访问 `/font-encryption-demo` 查看演示
- 了解 [最佳实践](./README.md#最佳实践)

## 常见问题

**Q: 为什么复制出来是乱码？**  
A: 这是正常的，说明加密生效了。

**Q: 会影响 SEO 吗？**  
A: 会。搜索引擎可能无法索引加密文本。

**Q: 可以只加密数字吗？**  
A: 可以，使用 `.font-encryption-numbers` 类。

**Q: 如何调试？**  
A: 临时移除 CSS 类即可看到原始文本。
