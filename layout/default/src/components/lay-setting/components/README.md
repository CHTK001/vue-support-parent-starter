# 系统设置组件化结构

## 目录结构

```
components/
├── base/                    # 基础组件（默认主题使用）
│   ├── OverallStyleSetting.vue
│   ├── ThemeColorSetting.vue
│   ├── ThemeAnimationSetting.vue
│   ├── ThemeSkinSetting.vue
│   ├── AiChatSkinSetting.vue
│   ├── AiChatFunctionSetting.vue
│   ├── LayoutModeSetting.vue
│   ├── MobileNavSetting.vue
│   ├── DoubleNavSetting.vue
│   ├── PageStretchSetting.vue
│   ├── LayoutParamsSetting.vue
│   ├── TagsStyleSetting.vue
│   ├── InterfaceDisplaySetting.vue
│   ├── MenuSetting.vue
│   └── AdvancedSetting.vue
│
├── themes/                  # 主题特定组件
│   ├── pixel-art/          # Pixel Art 主题组件
│   │   ├── OverallStyleSetting.vue
│   │   ├── ThemeColorSetting.vue
│   │   ├── ThemeAnimationSetting.vue
│   │   ├── ThemeSkinSetting.vue
│   │   ├── AiChatSkinSetting.vue
│   │   ├── AiChatFunctionSetting.vue
│   │   ├── LayoutModeSetting.vue
│   │   ├── MobileNavSetting.vue
│   │   ├── DoubleNavSetting.vue
│   │   ├── PageStretchSetting.vue
│   │   ├── LayoutParamsSetting.vue
│   │   ├── TagsStyleSetting.vue
│   │   ├── InterfaceDisplaySetting.vue
│   │   ├── MenuSetting.vue
│   │   └── AdvancedSetting.vue
│   │
│   ├── christmas/          # 圣诞节主题组件（待实现）
│   ├── halloween/          # 万圣节主题组件（待实现）
│   ├── mid-autumn/         # 中秋节主题组件（待实现）
│   └── ...
│
└── index.ts                # 组件注册中心
```

## 组件化原则

1. **基础组件**：包含所有功能逻辑，使用默认样式
2. **主题组件**：继承或覆盖基础组件，应用主题特定样式
3. **组件注册**：通过 `index.ts` 统一管理组件映射
4. **功能保留**：所有功能必须完整保留，只改变样式和结构

## 使用方式

在 `BaseSetting.vue` 中：

```vue
<script setup lang="ts">
import { getThemeComponents } from "./components";
import { useGlobal } from "@pureadmin/utils";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const currentTheme = computed(() => $storage?.configure?.systemTheme || "default");
const components = getThemeComponents(currentTheme.value);

// 使用动态组件
const OverallStyleSetting = defineAsyncComponent(components.OverallStyleSetting);
</script>

<template>
  <component :is="OverallStyleSetting" />
</template>
```

## 实现进度

- [x] 组件注册系统
- [ ] 基础组件（14个）
- [ ] Pixel Art 主题组件（14个）
- [ ] 其他主题组件（待实现）

## 注意事项

1. 所有组件必须保留原有功能
2. 主题组件可以覆盖样式，但不能改变功能逻辑
3. 使用组合式 API，保持代码简洁
4. 遵循项目编码规范
