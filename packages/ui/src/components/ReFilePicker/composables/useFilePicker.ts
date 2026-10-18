/**
 * ReFilePicker 状态机。
 *
 * <p>把「加载目录 / 导航与历史 / 过滤排序 / 选中」从视图里拆出来：
 * index.vue 只负责 props→composable→子组件 的接线与确认事件。</p>
 */
import { computed, onBeforeUnmount, ref, type ComputedRef, type Ref } from "vue";
import type {
  FilePickerData,
  FilePickerItem,
  FilePickerListResult,
  FilePickerLoader,
  FilePickerSortKey,
  FilePickerTreeNode,
} from "../types";
import {
  acceptHasDir,
  breadcrumbOf,
  buildAcceptFilter,
  compareItems,
  dedupeItems,
  isRootPath,
  joinPath,
  parentPathOf,
  pathSegments,
  samePath,
  type FilePickerCrumb,
} from "../utils";

export interface UseFilePickerOptions {
  /** 远端加载器（与 data 二选一） */
  loader: () => FilePickerLoader | undefined;
  /** 本地静态数据（与 loader 二选一） */
  data: () => FilePickerData | undefined;
  /** accept 文件类型过滤串（可含 `dir`，表示目录也可选） */
  accept: () => string;
  /** 起始目录 */
  initialPath: () => string;
  /** 目录选择模式 */
  directoryMode: () => boolean;
  /** 多选 */
  multiple: () => boolean;
  /** 最多可选数量（0/undefined = 不限） */
  limit?: () => number;
}

export interface UseFilePickerReturn {
  currentPath: Ref<string>;
  items: Ref<FilePickerItem[]>;
  loading: Ref<boolean>;
  loadError: Ref<string>;
  searchText: Ref<string>;
  selectedItems: Ref<FilePickerItem[]>;
  history: Ref<string[]>;
  sortKey: Ref<FilePickerSortKey>;
  sortAsc: Ref<boolean>;
  /** 键盘导航当前行下标（-1 = 无） */
  activeIndex: Ref<number>;

  breadcrumb: ComputedRef<FilePickerCrumb[]>;
  treeNodes: ComputedRef<FilePickerTreeNode[]>;
  treeDirs: ComputedRef<FilePickerItem[]>;
  parentEntry: ComputedRef<FilePickerItem | null>;
  rows: ComputedRef<FilePickerItem[]>;
  selectedCount: ComputedRef<number>;
  searching: ComputedRef<boolean>;
  canConfirm: ComputedRef<boolean>;
  selectedSummary: ComputedRef<string>;
  /** 选择数量上限（0 = 不限） */
  limit: ComputedRef<number>;
  /** 到达上限时的瞬时提示（空串 = 无提示） */
  limitHint: Ref<string>;
  /** 该条目当前是否可被选中（目录需要 directoryMode 或 accept 含 dir） */
  canSelect: (item: FilePickerItem) => boolean;
  /** 是否已达选择上限 */
  isLimitReached: ComputedRef<boolean>;

  load: (path?: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: (path: string) => Promise<void>;
  navigateTo: (path: string) => void;
  goBack: () => void;
  selectItem: (item: FilePickerItem) => void;
  /** 只选中该项（右键唤起菜单时用，资源管理器语义：右键即改选） */
  selectOnly: (item: FilePickerItem) => void;
  /** 双击/回车；返回 true 表示单选模式下选中了文件、调用方应立刻确认 */
  openItem: (item: FilePickerItem) => boolean;
  clearSelection: () => void;
  toggleSort: (key: FilePickerSortKey) => void;
  sortArrow: (key: FilePickerSortKey) => string;
  isSelected: (item: FilePickerItem) => boolean;
  isCurrentPath: (path: string) => boolean;
  isParentEntry: (item: FilePickerItem) => boolean;
  moveActive: (delta: number) => void;
  /** 回车激活当前行；返回 true 表示已选中单个文件、视图层应立刻确认 */
  activateActive: () => boolean;
  /** 取出并清空当前选中（确认时用） */
  takeSelection: () => FilePickerItem[];
}

export function useFilePicker(options: UseFilePickerOptions): UseFilePickerReturn {
  const currentPath = ref(options.initialPath());
  const items = ref<FilePickerItem[]>([]);
  const loading = ref(false);
  const loadError = ref("");
  const searchText = ref("");
  const selectedItems = ref<FilePickerItem[]>([]);
  const history = ref<string[]>([]);
  const sortKey = ref<FilePickerSortKey>("name");
  const sortAsc = ref(true);
  const activeIndex = ref(-1);
  /** 到达选择上限的瞬时提示（空串 = 不显示） */
  const limitHint = ref("");
  let limitHintTimer: ReturnType<typeof setTimeout> | null = null;

  onBeforeUnmount(() => {
    if (limitHintTimer) clearTimeout(limitHintTimer);
  });

  /** 请求序号：晚到的响应不许覆盖新目录（快速点目录/刷新时的竞态） */
  let loadSeq = 0;

  /* ---------- 数据源解析 ---------- */

  const dataArray = computed<FilePickerItem[]>(() => {
    const raw = options.data();
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return (raw as FilePickerListResult).items ?? [];
  });

  const dataCurrent = computed(() => {
    const raw = options.data();
    return !Array.isArray(raw) && raw ? raw.current ?? "" : "";
  });

  const hasStaticData = computed(() => {
    const raw = options.data();
    return raw !== undefined && raw !== null;
  });

  /** 从扁平静态清单里推断某个目录的直接子项 */
  const staticChildren = (all: FilePickerItem[], path: string): FilePickerItem[] => {
    const baseSegs = pathSegments(path);
    const seen = new Map<string, FilePickerItem>();
    const result: FilePickerItem[] = [];
    for (const origin of all) {
      const key = String(origin.key || origin.name);
      if (samePath(key, path) || (isRootPath(key) && isRootPath(path))) continue;
      const keySegs = pathSegments(key);
      if (keySegs.length <= baseSegs.length) continue;
      const rest = keySegs.slice(baseSegs.length);
      if (rest.length === 1) {
        if (!seen.has(key)) {
          seen.set(key, origin);
          result.push(origin);
        }
        continue;
      }
      const first = rest[0];
      const dirKey = joinPath(path, first);
      if (!seen.has(dirKey)) {
        const child: FilePickerItem = { key: dirKey, name: first, isDir: true };
        seen.set(dirKey, child);
        result.push(child);
      }
    }
    return result;
  };

  const resolveStaticData = (path: string): FilePickerItem[] => {
    if (dataCurrent.value && samePath(dataCurrent.value, path)) return [...dataArray.value];
    return staticChildren(dataArray.value, path);
  };

  const normalizeLoadedResult = (result: unknown): FilePickerItem[] => {
    if (Array.isArray(result)) return result as FilePickerItem[];
    if (result && typeof result === "object") {
      const list = (result as FilePickerListResult | { items?: unknown }).items;
      if (Array.isArray(list)) return list as FilePickerItem[];
    }
    return [];
  };

  /* ---------- 加载 ---------- */

  const load = async (path = currentPath.value): Promise<void> => {
    const seq = ++loadSeq;
    loading.value = true;
    loadError.value = "";
    try {
      let next: FilePickerItem[] = [];
      if (hasStaticData.value) {
        next = resolveStaticData(path);
      } else if (options.loader()) {
        next = normalizeLoadedResult(await options.loader()!(path));
      } else {
        throw new Error("ReFilePicker 必须配置 loader（filesystem-starter/宿主远端接口）或 data（本地 JSON）");
      }
      if (seq !== loadSeq) return;
      items.value = dedupeItems(next);
      activeIndex.value = -1;
    } catch (err) {
      if (seq !== loadSeq) return;
      items.value = [];
      loadError.value = err instanceof Error ? err.message : String(err);
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
  };

  const refresh = () => load(currentPath.value);

  /** 打开弹窗/换起始目录时的整体复位 */
  const reset = async (path: string): Promise<void> => {
    currentPath.value = path;
    selectedItems.value = [];
    history.value = [];
    searchText.value = "";
    sortKey.value = "name";
    sortAsc.value = true;
    activeIndex.value = -1;
    limitHint.value = "";
    await load(path);
  };

  /* ---------- 派生视图 ---------- */

  const breadcrumb = computed(() => breadcrumbOf(currentPath.value));

  const treeNodes = computed<FilePickerTreeNode[]>(() => {
    const nodes: FilePickerTreeNode[] = [{ key: "/", name: "根目录", depth: 0 }];
    breadcrumb.value.slice(1).forEach((crumb, i) => {
      nodes.push({ key: crumb.path, name: crumb.name, depth: i + 1 });
    });
    return nodes;
  });

  const isCurrentPath = (path: string): boolean => samePath(path, currentPath.value);

  const isParentEntry = (item: FilePickerItem): boolean =>
    item.name === ".." || samePath(item.key, parentPathOf(currentPath.value));

  const parentEntry = computed<FilePickerItem | null>(() => {
    if (isRootPath(currentPath.value)) return null;
    const remoteParent = items.value.find((item) => item.name === ".." && item.isDir);
    return remoteParent ?? { key: parentPathOf(currentPath.value), name: "..", isDir: true };
  });

  const treeDirs = computed(() =>
    items.value
      .filter((item) => item.isDir && item.name !== ".." && !isParentEntry(item))
      .slice(0, 30),
  );

  /** 过滤后的行（不含「..」/上级目录、按 accept + 搜索词筛） */
  const rows = computed<FilePickerItem[]>(() => {
    const acceptFilter = buildAcceptFilter(options.accept());
    let list = items.value.filter((item) => !isParentEntry(item) && acceptFilter(item));
    const q = searchText.value.trim().toLowerCase();
    if (q) list = list.filter((item) => item.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => compareItems(a, b, sortKey.value, sortAsc.value));
  });

  const searching = computed(() => searchText.value.trim().length > 0);
  const selectedCount = computed(() => selectedItems.value.length);
  const canConfirm = computed(() =>
    options.multiple() ? selectedCount.value > 0 : selectedCount.value === 1,
  );

  const selectedSummary = computed(() => {
    if (!selectedItems.value.length) return "尚未选择";
    if (options.multiple()) {
      const first = selectedItems.value[0]?.key ?? "";
      return selectedItems.value.length > 1
        ? `${selectedItems.value.length} 项 · ${first}`
        : first;
    }
    return selectedItems.value[0]?.key || selectedItems.value[0]?.name || "";
  });

  /* ---------- 导航 ---------- */

  const navigateTo = (path: string): void => {
    if (samePath(path, currentPath.value)) return;
    history.value.push(currentPath.value);
    currentPath.value = path;
    selectedItems.value = [];
    activeIndex.value = -1;
    void load(path);
  };

  const goBack = (): void => {
    const previous = history.value.pop();
    if (previous === undefined) return;
    currentPath.value = previous;
    selectedItems.value = [];
    activeIndex.value = -1;
    void load(previous);
  };

  /* ---------- 选中 ---------- */

  /** 目录能否被选中：显式 directoryMode，或 accept 里写了 dir */
  const dirSelectable = computed(() => options.directoryMode() || acceptHasDir(options.accept()));

  /** 选择数量上限（0 = 不限） */
  const limit = computed(() => Math.max(0, Math.floor(Number(options.limit?.() ?? 0) || 0)));

  /** 该条目是否可选中（目录默认只能进不能选） */
  const canSelect = (item: FilePickerItem): boolean => !item.isDir || dirSelectable.value;

  const isLimitReached = computed(() => limit.value > 0 && selectedItems.value.length >= limit.value);

  /** 到上限的提示：2.4s 后自动消失（默认不静默丢弃已有选择） */
  const showLimitHint = (): void => {
    limitHint.value = `最多选择 ${limit.value} 项`;
    if (limitHintTimer) clearTimeout(limitHintTimer);
    limitHintTimer = setTimeout(() => {
      limitHint.value = "";
      limitHintTimer = null;
    }, 2400);
  };

  const isSelected = (item: FilePickerItem): boolean =>
    selectedItems.value.some((selected) => selected.key === item.key);

  const toggleSelect = (item: FilePickerItem): void => {
    const idx = selectedItems.value.findIndex((selected) => selected.key === item.key);
    if (idx >= 0) {
      selectedItems.value.splice(idx, 1);
      limitHint.value = "";
      return;
    }
    if (isLimitReached.value) {
      // 上限为 1 时按单选语义直接改选；上限大于 1 时保留已有选择、只提示，
      // 不静默把用户先前选的项顶掉。
      if (limit.value === 1) {
        selectedItems.value = [item];
        return;
      }
      showLimitHint();
      return;
    }
    selectedItems.value.push(item);
  };

  const clearSelection = (): void => {
    selectedItems.value = [];
    limitHint.value = "";
  };

  /** 单击：目录在文件模式下不选中（进目录靠双击/回车）；「..」直接跳转 */
  const selectItem = (item: FilePickerItem): void => {
    if (isParentEntry(item)) {
      navigateTo(item.key);
      return;
    }
    if (!canSelect(item)) return;
    if (options.multiple()) toggleSelect(item);
    else selectedItems.value = [item];
  };

  /** 只选中这一项（右键唤起菜单时用：资源管理器右键即改选） */
  const selectOnly = (item: FilePickerItem): void => {
    if (!canSelect(item)) return;
    selectedItems.value = [item];
    limitHint.value = "";
  };

  /**
   * 双击/回车：目录进入，「..」跳转。
   * @returns 单选模式下选中了一个文件时为 true —— 视图层据此立刻确认（双击即选）
   */
  const openItem = (item: FilePickerItem): boolean => {
    if (isParentEntry(item)) {
      navigateTo(item.key);
      return false;
    }
    if (item.isDir) {
      navigateTo(item.key);
      return false;
    }
    if (!options.multiple()) {
      selectedItems.value = [item];
      return true;
    }
    return false;
  };

  const takeSelection = (): FilePickerItem[] => {
    const picked = [...selectedItems.value];
    selectedItems.value = [];
    return picked;
  };

  /* ---------- 排序 ---------- */

  const toggleSort = (key: FilePickerSortKey): void => {
    if (sortKey.value === key) {
      sortAsc.value = !sortAsc.value;
    } else {
      sortKey.value = key;
      sortAsc.value = true;
    }
  };

  const sortArrow = (key: FilePickerSortKey): string =>
    sortKey.value === key ? (sortAsc.value ? "↑" : "↓") : "";

  /* ---------- 键盘导航 ---------- */

  const moveActive = (delta: number): void => {
    const list = rows.value;
    if (!list.length) return;
    if (activeIndex.value < 0) {
      activeIndex.value = delta > 0 ? 0 : list.length - 1;
      return;
    }
    activeIndex.value = Math.min(list.length - 1, Math.max(0, activeIndex.value + delta));
  };

  const activateActive = (): boolean => {
    const item = rows.value[activeIndex.value];
    if (!item) return false;
    // 目录可选中（directoryMode 或 accept 含 dir）时回车=选中，否则回车=进入
    if (item.isDir && canSelect(item)) {
      selectItem(item);
      return false;
    }
    return openItem(item);
  };

  return {
    currentPath,
    items,
    loading,
    loadError,
    searchText,
    selectedItems,
    history,
    sortKey,
    sortAsc,
    activeIndex,
    breadcrumb,
    treeNodes,
    treeDirs,
    parentEntry,
    rows,
    selectedCount,
    searching,
    canConfirm,
    selectedSummary,
    limit,
    limitHint,
    canSelect,
    isLimitReached,
    load,
    refresh,
    reset,
    navigateTo,
    goBack,
    selectItem,
    selectOnly,
    openItem,
    clearSelection,
    toggleSort,
    sortArrow,
    isSelected,
    isCurrentPath,
    isParentEntry,
    moveActive,
    activateActive,
    takeSelection,
  };
}
