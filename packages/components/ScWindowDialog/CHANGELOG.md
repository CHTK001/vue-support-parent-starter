# ScWindowDialog 组件更新日志

## [1.1.1] - 2024-01-XX

### 配置变更 🔧
- **默认配置调整**：`modal` 属性默认值改为 `false`，去除背景遮罩层
- **交互优化**：`closeOnClickModal` 属性默认值改为 `false`，禁用点击外部关闭功能
- **用户体验**：提供更专注的对话框交互体验，避免误操作关闭

---

## [1.1.0] - 2024-01-XX

### 新增功能 ✨

#### 全局ID管理
- **dialogId 属性**：新增对话框唯一标识符，支持全局管理
- **多弹框支持**：允许同时打开多个对话框，每个都有独立状态
- **自动ID生成**：未提供ID时自动生成唯一标识
- **ID复用机制**：相同ID的对话框复用状态，避免重复创建

#### 智能激活功能
- **自动置顶**：点击任意对话框自动调整z-index到最高层
- **智能管理**：其他对话框z-index保持不变，只提升被点击的对话框
- **无缝体验**：激活过程平滑无感知，优化多窗口交互

#### 自动收缩功能
- **autoShrink 属性**：新增自动收缩开关，默认启用
- **shrinkSize 属性**：自定义收缩尺寸，默认64px
- **边缘检测**：拖拽到距离浏览器边缘20px内自动收缩
- **智能收缩**：收缩为圆形小方块，节省屏幕空间
- **一键恢复**：点击小方块或拖离边缘即可恢复
- **状态保持**：收缩状态下保持所有功能和数据

### 新增属性
| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| dialogId | string | - | 对话框唯一标识，用于全局管理 |
| autoShrink | boolean | true | 是否启用自动收缩功能 |
| shrinkSize | number | 64 | 收缩后的尺寸（像素） |

### 新增方法
- **activate()** - 手动激活对话框（置顶）
- **shrink()** - 手动收缩对话框
- **restore()** - 手动恢复对话框大小

### 样式优化
- **收缩状态样式**：圆形小方块，悬停放大效果
- **激活状态样式**：动态z-index管理
- **边缘检测样式**：平滑的收缩/恢复动画

### 技术改进
- **全局管理器**：新增DialogManager类，统一管理所有对话框实例
- **Composable封装**：useAutoShrink组合式函数，处理自动收缩逻辑
- **事件监听优化**：高效的拖拽和边缘检测算法
- **内存管理**：自动清理已关闭对话框的引用

---

## [1.0.0] - 2024-01-XX

### 新增功能 ✨

#### 核心功能
- **完整 el-dialog 支持**：完全兼容 Element Plus el-dialog 的所有属性、事件和插槽
- **主题系统**：新增 `theme` 属性，支持 6 种内置主题
- **图标支持**：新增 `icon` 属性，标题支持显示 Iconify 图标

#### 主题样式
- `default` - 默认主题，简洁的白色背景
- `primary` - 主要主题，蓝色渐变背景
- `success` - 成功主题，绿色渐变背景
- `warning` - 警告主题，黄色渐变背景
- `error` - 错误主题，红色渐变背景
- `info` - 信息主题，灰色渐变背景

#### 视觉增强
- **现代化设计**：圆角边框、渐变背景、阴影效果
- **动画效果**：平滑的打开/关闭动画，悬停交互效果
- **响应式设计**：适配桌面端、平板端和移动端
- **暗色主题**：自动适配系统暗色主题偏好

### 属性 (Props)

#### 扩展属性
| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| theme | ThemeType | 'default' | 主题类型 |
| icon | string | - | 标题图标（Iconify 图标名称） |

#### 继承属性
完全支持 el-dialog 的所有原生属性：
- `modelValue` - 控制显示/隐藏
- `title` - 对话框标题
- `width` - 对话框宽度
- `fullscreen` - 全屏显示
- `top` - 距离顶部距离
- `modal` - 显示遮罩层
- `appendToBody` - 插入到 body
- `lockScroll` - 锁定滚动
- `customClass` - 自定义类名
- `openDelay` / `closeDelay` - 延时控制
- `closeOnClickModal` - 点击遮罩关闭
- `closeOnPressEscape` - ESC 键关闭
- `showClose` - 显示关闭按钮
- `beforeClose` - 关闭前回调
- `draggable` - 可拖拽
- `overflow` - 拖拽溢出
- `center` - 居中布局
- `alignCenter` - 水平垂直对齐
- `destroyOnClose` - 关闭时销毁
- `closeIcon` - 自定义关闭图标
- `zIndex` - 层级控制
- `headerClass` / `bodyClass` / `footerClass` - 区域类名
- `modalClass` - 遮罩类名
- `modalPenetrable` - 遮罩穿透

### 事件 (Events)

完全支持 el-dialog 的所有事件：
- `update:modelValue` - 更新显示状态
- `open` - 打开回调
- `opened` - 打开完成回调
- `close` - 关闭回调
- `closed` - 关闭完成回调
- `openAutoFocus` - 聚焦回调
- `closeAutoFocus` - 失焦回调

### 插槽 (Slots)

#### 扩展插槽
- `header-extra` - 标题区额外内容插槽

#### 继承插槽
- `default` - 默认内容插槽
- `header` - 自定义头部插槽
- `footer` - 自定义底部插槽

### 类型定义

```typescript
// 主题类型
type ThemeType = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

// 组件 Props 接口
interface ScWindowDialogProps extends /* el-dialog props */ {
  theme?: ThemeType
  icon?: string
}

// 组件 Emits 接口
interface ScWindowDialogEmits {
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: []
  closed: []
  openAutoFocus: []
  closeAutoFocus: []
}
```

### 功能特性

#### 🎨 主题系统
- 6 种内置主题，覆盖常见使用场景
- 每个主题包含独特的颜色方案和视觉效果
- 支持暗色模式自动适配
- 可通过 CSS 变量自定义主题

#### 🎯 图标集成
- 使用 IconifyIconOnline 组件
- 支持 Iconify 图标库的所有图标
- 图标与主题颜色自动匹配
- 支持自定义图标大小和样式

#### 📱 响应式设计
- 桌面端：标准对话框样式
- 平板端：适当调整尺寸和间距
- 移动端：全屏显示，优化触摸体验
- 超小屏幕：完全全屏模式

#### ⚡ 性能优化
- CSS-in-JS 样式系统
- 硬件加速动画
- 按需渲染优化
- 内存泄漏防护

### 使用示例

#### 基础用法
```vue
<ScWindowDialog
  v-model="visible"
  title="基础对话框"
  width="500px"
>
  <p>对话框内容</p>
</ScWindowDialog>
```

#### 主题和图标
```vue
<ScWindowDialog
  v-model="visible"
  title="成功提示"
  icon="mdi:check-circle"
  theme="success"
>
  <p>操作成功完成！</p>
</ScWindowDialog>
```

#### 自定义头部
```vue
<ScWindowDialog v-model="visible">
  <template #header="{ close }">
    <div class="custom-header">
      <IconifyIconOnline icon="mdi:settings" />
      <span>设置</span>
    </div>
  </template>
  <p>设置内容</p>
</ScWindowDialog>
```

### 技术实现

#### 架构设计
- **组件继承**：基于 el-dialog 扩展，保持完全兼容
- **属性透传**：智能过滤和透传原生属性
- **样式隔离**：使用 scoped 样式和 CSS 模块
- **类型安全**：完整的 TypeScript 类型定义

#### 样式系统
- **CSS 变量**：使用 Element Plus 设计令牌
- **渐变背景**：每个主题的独特渐变效果
- **动画过渡**：CSS3 动画和过渡效果
- **响应式断点**：标准的媒体查询断点

#### 兼容性
- **Vue 3**：完全支持 Composition API
- **Element Plus**：兼容最新版本
- **TypeScript**：完整类型支持
- **现代浏览器**：支持 ES2020+ 特性

### 迁移指南

#### 从 el-dialog 迁移
1. 直接替换组件名：`el-dialog` → `ScWindowDialog`
2. 所有原有属性和事件保持不变
3. 可选择添加 `theme` 和 `icon` 属性
4. 样式可能有细微差异，建议测试确认

#### 版本兼容性
- Vue 3.0+
- Element Plus 2.0+
- TypeScript 4.5+
- Node.js 16+

### 已知问题

暂无已知问题。

### 贡献指南

欢迎提交 Issue 和 Pull Request 来改进组件：

1. **Bug 报告**：请提供复现步骤和环境信息
2. **功能建议**：请详细描述需求和使用场景
3. **代码贡献**：请遵循项目的代码规范和提交规范

### 许可证

本组件遵循项目的开源许可证。