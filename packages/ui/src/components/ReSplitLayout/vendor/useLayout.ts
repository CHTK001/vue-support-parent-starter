/**
 * 分栏布局内核（内联自 reactive-layout@1.0.2，MIT）。
 *
 * <p>内联原因：上游只发 TS + `.vue` 源码、没有构建产物，应用侧 vite 预构建无法解析，
 * 而本仓库规定不改 vite 配置。内联后既没有运行时依赖，也能把面板配色对接到项目主题。</p>
 *
 * <p>相比上游仅做两处调整：`PanelTab.panelType` 改为可选（本项目不用页签类型图标），
 * 以及导出 `findPanelById` 供业务侧查询。</p>
 *
 * <p>新增 `movePanel`：支持把同一分割组里的块（面板或嵌套分组）拖动重排序，
 * 让 `A | B | C` 在拖到 A 左侧后变成 `B | A | C` — 它就是本机的全屏终端
 * 可像 VS Code 一样随意调换区域顺序的能力。</p>
 */
import { ref, watch } from 'vue';

export interface PanelTab {
  id: string;
  /** 页签类型标记（可选，业务侧自定义用途） */
  panelType?: string;
  label: string;
  closable?: boolean;
}

export interface PanelNode {
  type: 'panel';
  id: string;
  tabs: PanelTab[];
  activeTabId: string;
}

export interface SplitNode {
  type: 'split';
  direction: 'horizontal' | 'vertical';
  children: LayoutNode[];
  sizes: number[];
}

export type LayoutNode = SplitNode | PanelNode;

let nextPanelId = 1;
function genPanelId(): string {
  return `panel-${nextPanelId++}`;
}

function findPanelById(node: LayoutNode, id: string): PanelNode | null {
  if (node.type === 'panel') return node.id === id ? node : null;
  for (const child of node.children) {
    const found = findPanelById(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(
  root: SplitNode,
  targetId: string,
): { parent: SplitNode; index: number } | null {
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (child.type === 'panel' && child.id === targetId) {
      return { parent: root, index: i };
    }
    if (child.type === 'split') {
      const result = findParent(child, targetId);
      if (result) return result;
    }
  }
  return null;
}

function findTabOwner(node: LayoutNode, tabId: string): PanelNode | null {
  if (node.type === 'panel') {
    return node.tabs.some((t) => t.id === tabId) ? node : null;
  }
  for (const child of node.children) {
    const found = findTabOwner(child, tabId);
    if (found) return found;
  }
  return null;
}

/** 判断节点子树（含嵌套 split）是否包含指定面板 */
function containsPanel(node: LayoutNode, id: string): boolean {
  if (node.type === 'panel') return node.id === id;
  return node.children.some((child) => containsPanel(child, id));
}

/**
 * 找到包含 panelId 的面板所在分割组的直子节点下标；找不到返回 -1。
 *
 * <p>如果面板嵌套在分割组里，返回的锚点是包含着它的那一整块（split 节点），
 * 拖动时整块分组一起移动，避免拆开嵌套结构。</p>
 */
function findPanelLocationIndex(split: SplitNode, panelId: string): number {
  for (let i = 0; i < split.children.length; i++) {
    const child = split.children[i];
    if (child.type === 'panel') {
      if (child.id === panelId) return i;
    } else if (containsPanel(child, panelId)) {
      return i;
    }
  }
  return -1;
}

/** 两个面板的最近（最深）共同祖先分割：只有在同一组里拖出来才能重新排序 */
function findCommonAncestor(root: SplitNode, sourceId: string, targetId: string): SplitNode | null {
  let hit: SplitNode | null = null;
  function walk(node: LayoutNode): void {
    if (node.type === 'panel') return;
    const hasSource = node.children.some((child) => containsPanel(child, sourceId));
    const hasTarget = node.children.some((child) => containsPanel(child, targetId));
    if (hasSource && hasTarget) hit = node;  // 越往深越更新，最终留下最近的祖先
    for (const child of node.children) walk(child);
  }
  walk(root);
  return hit;
}



function cleanupTree(root: SplitNode): void {
  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = root.children[i];
    if (child.type === 'panel' && child.tabs.length === 0) {
      root.children.splice(i, 1);
      root.sizes.splice(i, 1);
    } else if (child.type === 'split') {
      cleanupTree(child);
      if (child.children.length === 0) {
        root.children.splice(i, 1);
        root.sizes.splice(i, 1);
      } else if (child.children.length === 1) {
        root.children[i] = child.children[0];
      }
    }
  }
  if (root.sizes.length > 0) {
    const total = root.sizes.reduce((a, b) => a + b, 0);
    if (total > 0) {
      root.sizes = root.sizes.map((s) => (s / total) * 100);
    }
  }
}

export interface UseLayoutOptions {
  defaultLayout: SplitNode;
  storageKey?: string;
}

export function useLayout(options: UseLayoutOptions) {
  const { defaultLayout, storageKey } = options;

  function loadLayout(): SplitNode {
    if (typeof window === 'undefined' || !storageKey) return defaultLayout;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.type === 'split') return parsed;
      }
    } catch {
      // ignore
    }
    return defaultLayout;
  }

  const layout = ref<SplitNode>(loadLayout());

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  function persistLayout() {
    if (typeof window === 'undefined' || !storageKey) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(layout.value));
    }, 500);
  }

  watch(layout, persistLayout, { deep: true });

  function moveTab(tabId: string, fromPanelId: string, toPanelId: string, insertIndex?: number) {
    const root = layout.value;
    const fromPanel = findPanelById(root, fromPanelId);
    const toPanel = findPanelById(root, toPanelId);
    if (!fromPanel || !toPanel) return;

    const tabIndex = fromPanel.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;

    if (fromPanelId === toPanelId) {
      if (insertIndex === undefined) return;
      let targetIdx = insertIndex;
      if (tabIndex < targetIdx) targetIdx--;
      if (tabIndex === targetIdx) return;
      const [tab] = fromPanel.tabs.splice(tabIndex, 1);
      fromPanel.tabs.splice(targetIdx, 0, tab);
      layout.value = { ...root };
      return;
    }

    const [tab] = fromPanel.tabs.splice(tabIndex, 1);

    if (fromPanel.activeTabId === tabId) {
      fromPanel.activeTabId = fromPanel.tabs[0]?.id ?? '';
    }

    const idx = insertIndex !== undefined ? insertIndex : toPanel.tabs.length;
    toPanel.tabs.splice(idx, 0, tab);
    toPanel.activeTabId = tab.id;

    cleanupTree(root);
    layout.value = { ...root };
  }

  /**
   * 把整块区域拖动重排序（A | B | C 把 B 拖到 A 左侧 → B | A | C）。
   *
   * <p>与页签拆分不同：页签拆分会创建新面板，这里是同一分割组里子节点的
   * 顺序变更。大小比 / 嵌套分组全部保留，只移动锚点节点，所以拖完的区域拥有
   * 完整的大小和结构，不是「清空重开」。</p>
   *
   * @param sourceId 被拖动面板的 id
   * @param targetId 接收拖动的目标面板的 id
   * @param position 'before' 插到目标左侧/上方，'after' 插到右侧/下方
   */
  function movePanel(sourceId: string, targetId: string, position: 'before' | 'after'): void {
    const root = layout.value;
    const common = findCommonAncestor(root, sourceId, targetId);
    if (!common) return;
    const sourceIndex = findPanelLocationIndex(common, sourceId);
    const targetIndex = findPanelLocationIndex(common, targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
    if (sourceId === targetId) return;

    const { children, sizes } = common;
    const moved = children.splice(sourceIndex, 1)[0];
    const size = sizes.splice(sourceIndex, 1)[0];
    // 取出源节点后，目标（如果在其右侧）自然前移一位，再算插入位置
    const afterRemove = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'before' ? afterRemove : afterRemove + 1;
    children.splice(insertIndex, 0, moved);
    sizes.splice(insertIndex, 0, size);
    layout.value = { ...root };
  }

  function splitPanel(
    targetPanelId: string,
    direction: 'horizontal' | 'vertical',
    tabId: string,
    position: 'before' | 'after',
  ) {
    const root = layout.value;
    const sourcePanel = findTabOwner(root, tabId);
    if (!sourcePanel) return;

    const tabIndex = sourcePanel.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;
    const [tab] = sourcePanel.tabs.splice(tabIndex, 1);

    if (sourcePanel.activeTabId === tabId) {
      sourcePanel.activeTabId = sourcePanel.tabs[0]?.id ?? '';
    }

    const newPanel: PanelNode = {
      type: 'panel',
      id: genPanelId(),
      tabs: [tab],
      activeTabId: tab.id,
    };

    const parentInfo = findParent(root, targetPanelId);
    if (!parentInfo) return;

    const { parent, index } = parentInfo;
    const targetNode = parent.children[index];

    if (parent.direction === direction) {
      const insertIdx = position === 'before' ? index : index + 1;
      parent.children.splice(insertIdx, 0, newPanel);
      const targetSize = parent.sizes[index];
      parent.sizes[index] = targetSize / 2;
      parent.sizes.splice(insertIdx, 0, targetSize / 2);
    } else {
      const newSplit: SplitNode = {
        type: 'split',
        direction,
        children: position === 'before' ? [newPanel, targetNode] : [targetNode, newPanel],
        sizes: [50, 50],
      };
      parent.children[index] = newSplit;
    }

    cleanupTree(root);
    layout.value = { ...root };
  }

  function addTab(nearTabId: string, tab: PanelTab, activate = true) {
    const root = layout.value;
    const panel = findTabOwner(root, nearTabId);
    if (!panel) return;
    if (panel.tabs.some((t) => t.id === tab.id)) {
      if (activate) panel.activeTabId = tab.id;
      layout.value = { ...root };
      return;
    }
    panel.tabs.push(tab);
    if (activate) panel.activeTabId = tab.id;
    layout.value = { ...root };
  }

  function removeTab(tabId: string) {
    const root = layout.value;
    const panel = findTabOwner(root, tabId);
    if (!panel) return;
    const idx = panel.tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    panel.tabs.splice(idx, 1);
    if (panel.activeTabId === tabId) {
      panel.activeTabId = panel.tabs[Math.min(idx, panel.tabs.length - 1)]?.id ?? '';
    }
    cleanupTree(root);
    layout.value = { ...root };
  }

  function updateSizesForSplit(split: SplitNode, newSizes: number[]) {
    split.sizes = newSizes;
    persistLayout();
  }

  function resetLayout() {
    layout.value = JSON.parse(JSON.stringify(defaultLayout)) as SplitNode;
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.removeItem(storageKey);
    }
  }

  return {
    layout,
    moveTab,
    addTab,
    removeTab,
    splitPanel,
    movePanel,
    updateSizesForSplit,
    resetLayout,
    findPanelById: (id: string) => findPanelById(layout.value, id),
  };
}
