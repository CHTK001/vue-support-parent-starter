## 7. 分屏终端工作台区域拖拽重排序

`ScRealScreenWorkbench` 使用 `ReSplitLayout` 作为面板容器，全部新增能力收在组件内，后端零增量：

- **拖拽手柄**：每个面板的页签栏左侧有一个拖拽手柄（`panel-drag-handle`，三灰点，hover 变品牌色，光标 `grab` / `grabbing`）。
- **拖拽客体**：是**整块面板或它所在分组**（不是页签）—— 页面面板 → 单面板移动；嵌套 split 里的小面板 → 带着它的分组一起走，大小比不拆开、嵌套不消失。
- **落点规则**（同分割组里子节点重排序）：
  - 落在另一块区域的标签栏 → 插到目标面板左侧 / 上方（`movePanel(sourceId, targetId, 'before')`）；
  - 落在另一块区域的内容区 → 左/上为前，右/下为后，正中为前；
  - 语法等价于 `A | B | C` 把 B 拖到 A 左侧 → `B | A | C`；`A | v(B | C)` 把 B 拖到 A 左侧 → `v(B | C) | A`。
- **效果**：只改变分割组子节点的顺序与它绑定的大小比（移哪块、哪块的大小就不变），不创建新面板，不销毁已有连接。拖回自己 / 拖到不存在的 id → 无操作。
- **实现在 `packages/ui`**：`useLayout.movePanel`（找最近共同祖先、锚点、排序 + 大小相对传动） + `LayoutPanel`（拖拽手柄 + 打标签 + 落点分发 + 注入 `movePanel`） + `ReSplitLayout`（提供 `movePanel` 供给）。业务侧工作台不做额外对接。
- **片段下发**：二次关连不受影响 — `ScTerminalSidePanel` 双击片段仍走 `onSnippetCommand` → `ScSshDirectViewer.sendCommands`；RDP/VNC 终端不能键入，仍用 `message.warning` 弹提示手动粘贴。

> _hold_：面板是在浏览器窗口里渲染的 iframe 画面，不可能"拖出窗口"（那是自由画布的交互想象），所以 VS Code 式的手感只由拖拽手柄 → 目标区域的标签栏/内容区 实现，松开即完成排序，布局的 `change` 事件把最新树抛给业务侧持久化（`ms_server_config` + localStorage 兜底）。