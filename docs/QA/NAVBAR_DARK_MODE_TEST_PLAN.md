# Lay-Navbar Dark Mode 适配测试用例

## 1. 测试概览
本测试计划旨在验证 `lay-navbar` 组件在深色模式（Dark Mode）下的显示效果、响应机制及子元素的一致性。

**测试环境**:
- 浏览器: Chrome (Latest), Edge (Latest), Firefox (Latest)
- 视口尺寸: Desktop (1920x1080), Laptop (1366x768)
- 主题: Default (默认主题)

## 2. 样式验证清单

### 2.1 基础容器样式
| 测试项 | 预期结果 (深色模式) | 检查点 |
| :--- | :--- | :--- |
| **背景颜色** | `rgba(15, 23, 42, 0.8)` (Slate 900 + 透明度) | 检查 `--default-navbar-bg` 变量应用 |
| **边框颜色** | `#334155` (Slate 700) | 检查底边框 `border-bottom` |
| **模糊效果** | `blur(12px)` | 检查 `backdrop-filter` 属性 |

### 2.2 子元素对比度
| 元素 | 预期样式 | 备注 |
| :--- | :--- | :--- |
| **面包屑 (Breadcrumb)** | 文字颜色: Slate 300 (`#cbd5e1`) / 高亮: Primary | 确保路径清晰可见 |
| **工具栏图标 (Icons)** | 默认: Slate 300 (`#cbd5e1`) / Hover: Primary | 搜索、全屏、消息图标 |
| **用户头像 (Avatar)** | 边框清晰，无异常白边 | 检查头像圆角和阴影 |
| **下拉菜单 (Dropdown)** | 背景: Slate 800 (`#1e293b`) / 文字: White | 检查弹出层的背景色 |

## 3. 交互测试场景

### 场景 A: 模式切换响应
**步骤**:
1. 进入系统设置。
2. 确保当前主题为 "Default"。
3. 点击 "浅色模式" / "深色模式" 切换开关。

**预期结果**:
- 导航栏背景色应在 **白色半透明** 与 **深蓝灰色半透明** 之间平滑过渡。
- 过渡时间约为 `0.3s` (由 `--stitch-lay-transition` 控制)。
- 无闪烁或样式错乱。

### 场景 B: 滚动效果
**步骤**:
1. 页面内容区域向下滚动。
2. 观察导航栏背景。

**预期结果**:
- 导航栏保持固定（Sticky/Fixed）。
- 背景模糊效果（Glassmorphism）使下方滚动内容依稀可见，但不影响导航栏文字阅读。

### 场景 C: 悬停反馈
**步骤**:
1. 鼠标悬停在搜索图标、消息图标上。
2. 鼠标悬停在面包屑链接上。

**预期结果**:
- 图标背景出现微光（Primary Color tint）。
- 图标颜色变为主题色。
- 面包屑链接变为主题色。

## 4. 自动化测试建议 (Jest/Vitest)
若集成自动化测试，建议编写如下组件测试：

```typescript
import { mount } from '@vue/test-utils';
import DefaultNavbar from '@/layout/default/src/components/lay-navbar/themes/Default.vue';

describe('DefaultNavbar Dark Mode', () => {
  it('should apply dark mode variables when html has dark class', async () => {
    // Mock dark mode
    document.documentElement.classList.add('dark');
    
    const wrapper = mount(DefaultNavbar);
    const navbar = wrapper.find('.default-navbar');
    
    // 验证 CSS 变量 (需配合 getComputedStyle 或 style 属性检查)
    // 注意: JSDOM 可能无法完全计算 CSS 变量继承，主要验证类名和结构
    expect(wrapper.classes()).toContain('default-wrapper');
    expect(navbar.attributes('class')).toContain('lay-navbar');
  });
});
```
