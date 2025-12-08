# ScDrawer 抽屉组件

继承 el-drawer 所有功能，并添加记忆功能。

## 功能特性

- **完全继承 el-drawer**：支持 el-drawer 的所有属性和事件
- **记忆功能**：可记录上次打开状态，刷新后自动恢复
- **默认底部按钮**：支持取消/确认按钮的显示和自定义
- **灵活的插槽**：支持 header、default、footer 三个插槽

## 基础用法

```vue
<template>
  <ScDrawer v-model="visible" title="抽屉标题">
    <p>抽屉内容</p>
  </ScDrawer>
</template>

<script setup>
import { ref } from "vue";

const visible = ref(false);
</script>
```

## 启用记忆功能

```vue
<template>
  <!-- 使用独立 ID 存储状态 -->
  <ScDrawer v-model="visible" title="设置面板" memory-id="settings-drawer" memory-enabled>
    <p>设置内容</p>
  </ScDrawer>

  <!-- 使用共享配置（所有 memoryId 为 0 或空的抽屉共享状态） -->
  <ScDrawer v-model="visible2" title="共享面板" :memory-id="0" memory-enabled>
    <p>共享内容</p>
  </ScDrawer>
</template>
```

## 显示底部按钮

```vue
<template>
  <ScDrawer v-model="visible" title="表单抽屉" show-footer @confirm="handleConfirm" @cancel="handleCancel">
    <el-form>
      <!-- 表单内容 -->
    </el-form>
  </ScDrawer>
</template>
```

## API

### 属性

| 属性名               | 说明             | 类型                          | 默认值 |
| -------------------- | ---------------- | ----------------------------- | ------ |
| modelValue / v-model | 是否显示抽屉     | boolean                       | false  |
| title                | 抽屉标题         | string                        | ''     |
| size                 | 抽屉尺寸         | string / number               | '30%'  |
| direction            | 打开方向         | 'ltr' / 'rtl' / 'ttb' / 'btt' | 'rtl'  |
| modal                | 是否显示遮罩     | boolean                       | true   |
| appendToBody         | 是否插入到 body  | boolean                       | true   |
| lockScroll           | 是否锁定滚动     | boolean                       | true   |
| closeOnClickModal    | 点击遮罩关闭     | boolean                       | true   |
| closeOnPressEscape   | ESC 关闭         | boolean                       | true   |
| showClose            | 显示关闭按钮     | boolean                       | true   |
| beforeClose          | 关闭前回调       | (done: () => void) => void    | -      |
| withHeader           | 是否显示头部     | boolean                       | true   |
| destroyOnClose       | 关闭时销毁       | boolean                       | false  |
| showFooter           | 是否显示底部     | boolean                       | false  |
| showCancelButton     | 显示取消按钮     | boolean                       | true   |
| showConfirmButton    | 显示确认按钮     | boolean                       | true   |
| cancelText           | 取消按钮文本     | string                        | '取消' |
| confirmText          | 确认按钮文本     | string                        | '确定' |
| loading              | 确认按钮加载状态 | boolean                       | false  |
| memoryId             | 记忆功能 ID      | string / number               | 0      |
| memoryEnabled        | 是否启用记忆功能 | boolean                       | false  |

### 事件

| 事件名  | 说明                   | 回调参数 |
| ------- | ---------------------- | -------- |
| open    | 抽屉打开时触发         | -        |
| opened  | 抽屉打开动画结束后触发 | -        |
| close   | 抽屉关闭时触发         | -        |
| closed  | 抽屉关闭动画结束后触发 | -        |
| cancel  | 点击取消按钮时触发     | -        |
| confirm | 点击确认按钮时触发     | -        |

### 插槽

| 插槽名  | 说明       |
| ------- | ---------- |
| default | 抽屉内容   |
| header  | 自定义头部 |
| footer  | 自定义底部 |

### 方法

| 方法名    | 说明             | 参数 |
| --------- | ---------------- | ---- |
| open      | 打开抽屉         | -    |
| close     | 关闭抽屉         | -    |
| isVisible | 获取当前可见状态 | -    |

## 记忆功能说明

- `memoryId` 为 `0` 或空字符串时，所有 ScDrawer 共享同一个存储配置
- `memoryId` 设置为其他值时，按 ID 独立存储配置
- 记忆功能默认关闭，需要设置 `memoryEnabled` 为 `true` 才会生效
- 记忆数据存储在 localStorage 中
