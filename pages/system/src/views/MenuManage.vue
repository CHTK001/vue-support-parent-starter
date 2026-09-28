<script setup lang="ts">
/**
 * 菜单管理页面 —— 参考主流后台菜单管理风格实现
 *
 * 布局（与设计方案一致）：
 *   - 左栏（300px）：菜单树卡片（搜索 + 统计 + 树 + 右键菜单）
 *   - 右栏：menu-workspace 上下两行
 *       · 上部：菜单详情卡片（hero 详情头 + el-descriptions 描述列表）
 *       · 下部：按钮权限卡片（按钮权限表格）
 *   - 新增 / 编辑：KoiDialog 风格弹窗（820x620，三区表单）
 *
 * 字段说明：目标站使用简写字段（menuName / name / auth / isVisible ...），
 * 后端为 sysMenuXxx，通过 toVM / toEntity 双向映射。
 */
import { computed, nextTick, onMounted, ref, watch, defineAsyncComponent } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  Refresh,
  Search,
  Edit,
  MoreFilled,
  Warning,
  Rank,
  Files,
} from "@element-plus/icons-vue";
import { listMenuTree, saveMenu, updateMenu, deleteMenu, batchSaveMenuButtons, batchDeleteMenuButtons } from "../api/systemApi";
// (http 直连已迁移为 systemApi 具名函数，此处不再引入)
import type { SysMenu } from "../api/types";

/**
 * 异步加载 ReIcon（与工程其他页面一致）。
 * 注意 `m.default` 本身已是异步组件，**不能**写成 `m.default()`：
 * 该调用会抛 "m.default is not a function"，图标位会静默空白。
 */
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default));

/** 目标站菜单类型标签（1目录 2菜单 3按钮） */
const typeLabels: Record<number, string> = {
  1: "目录",
  2: "菜单",
  3: "按钮",
};

/** 目标站菜单类型选项（菜单类型字典） */
const typeOptions = [
  { label: "目录", value: 1 },
  { label: "菜单", value: 2 },
  { label: "按钮", value: 3 },
];

/** 徽标类型选项 */
const tagTypeOptions = [
  { label: "danger", value: "danger" },
  { label: "success", value: "success" },
  { label: "info", value: "info" },
  { label: "warning", value: "warning" },
  { label: "primary", value: "primary" },
];

/**
 * 动态显示条件类型选项
 *
 * <p>与后端 `MenuShowType` 枚举一一对应，未识别的值后端会退化为 ALWAYS（恒显示）。</p>
 */
const showTypeOptions = [
  { label: "始终显示", value: "ALWAYS" },
  { label: "类存在时显示", value: "CLASS" },
  { label: "SpEL 表达式为真时显示", value: "SPEL" },
  { label: "功能开关闭联", value: "SWITCH" },
  { label: "配置属性为真时显示", value: "PROPERTY" },
];

/** 条件值输入框 placeholder，随条件类型变化；返回空串表示该类型不需要条件值 */
const showValuePlaceholder = computed<string>(() => {
  switch (form.value.showType) {
    case "CLASS":
      return "类全名，如 com.chua.starter.job.JobSchedulerApplication";
    case "SPEL":
      return "SpEL 表达式，可用 #env 读配置，如 #env.getProperty('plugin.job.enable') == 'true'";
    case "PROPERTY":
      return "Spring 配置键，如 plugin.job.console.enable";
    default:
      return "";
  }
});

/** 徽标类型颜色映射 */
const tagTypeColor: Record<string, string> = {  danger: "var(--el-color-danger)",
  success: "var(--el-color-success)",
  info: "var(--el-color-info)",
  warning: "var(--el-color-warning)",
  primary: "var(--el-color-primary)",
};

/* ================== 字段映射 ================== */

/** 后端 SysMenu → 目标站视图模型 */
interface MenuVM {
  menuId?: number;
  parentId?: number;
  menuType?: number;
  menuName?: string;      // 节点标题
  name?: string;          // 路由名称
  path?: string;          // 路由地址
  auth?: string;          // 权限字符
  icon?: string;
  sort?: number;
  component?: string;     // 页面路径
  linkUrl?: string;       // iframe/外链 地址
  linkMode?: string;      // 承载方式: component普通页面 / iframe内嵌 / link外链跳转
  activeMenu?: string;    // 选中路由
  isVisible?: number;     // 1显示 0隐藏
  isRemind?: number;      // 1脱离菜单控制(只注册路由) 0作为菜单处理
  position?: string;      // 菜单位置: standard标准(侧边栏) top顶部(顶栏按钮, 强制脱离且不可改)
  isKeepAlive?: number;   // 1缓存 0不缓存
  isExpanded?: number;    // 单子菜单时父级显示方式: 0显示父级 1隐藏父级(子菜单直接显示)
  isFull?: number;        // 1全屏 0不全屏
  isNewTab?: number;      // 1新标签 0当前页
  isHideTab?: number;     // 1隐藏 0显示
  isFixed?: number;       // 1固钉 0否
  menuStatus?: number;    // 1启用 0禁用
  isTag?: number;         // 菜单徽标: 1开启 0关闭
  tagType?: string;       // 徽标类型: danger/success/info/warning/primary
  tagName?: string;       // 徽标名称(留空显示圆点)
  showType?: string;      // 动态显示条件类型: ALWAYS/CLASS/SPEL/SWITCH/PROPERTY
  showValue?: string;     // 条件值: 类全名 / SpEL表达式 / 配置键
  showSwitch?: number;    // 开关型条件放行值: 1放行 0隐藏
  showKey?: string;       // 开关型条件联动的功能键(统一策略配置 type=FEATURE 的 biz_key)
  children?: MenuVM[];
}

function toVM(m: SysMenu): MenuVM {
  // 用户后端类型: 0菜单 1iframe 2外链 3按钮 → 目标站: 1目录 2菜单 3按钮
  // 目录按结构判定（与后端 SysMenuServiceImpl 的 directoryIds、分配权限弹窗同一规则）：
  // 被「非按钮且未脱离菜单控制」的子节点引用为父级即目录，与 path/component 是否填写无关。
  // 外链 = linkUrl(frameSrc) 非空; iframe = perm 含 iframe
  const isIframe = (m.sysMenuPerm ?? "").includes("iframe");
  const isLink = Boolean(m.sysMenuFrameSrc?.trim());
  // 承载方式以后端 sysMenuType 为准：0普通 1iframe 2外链（按钮 type=3 单独处理）
  let linkMode = "component";
  if (m.sysMenuType === 1) linkMode = "iframe";
  else if (m.sysMenuType === 2) linkMode = "link";
  const isDirectory = (m.children ?? []).some(
    (child) => child.sysMenuType !== 3 && child.sysMenuRemind !== 1
  );
  let menuType: number;
  if (m.sysMenuType === 3) {
    menuType = 3;
  } else if (m.sysMenuType === 1 || m.sysMenuType === 2 || isLink || isIframe) {
    menuType = 2;
  } else if (m.sysMenuType === 0 && isDirectory) {
    menuType = 1;
  } else {
    menuType = 2;
  }
  return {
    menuId: m.sysMenuId,
    parentId: m.sysMenuPid ?? 0,
    menuType,
    menuName: m.sysMenuTitle,
    name: m.sysMenuName,
    path: m.sysMenuPath,
    auth: m.sysMenuPerm,
    icon: m.sysMenuIcon,
    sort: m.sysMenuSort,
    component: m.sysMenuComponent,
    linkUrl: m.sysMenuFrameSrc,
    linkMode,
    activeMenu: m.sysMenuActivePath,
    isVisible: m.sysMenuHidden === 1 ? 0 : 1,
    isRemind: m.sysMenuRemind ?? 0,
    position: m.sysMenuPosition === "top" ? "top" : "standard",
    isKeepAlive: m.sysMenuKeepAlive,
    // 未配置(NULL)时后端按「隐藏父级」处理，子菜单直接显示
    isExpanded: m.sysMenuShowParent ?? 1,
    isHideTab: m.sysMenuHiddenTag,
    isFixed: m.sysMenuFixedTag,
    isTag: m.sysMenuIsTag ?? 0,
    tagType: m.sysMenuTagType ?? "danger",
    tagName: m.sysMenuTagName,
    showType: m.sysMenuShowType ?? "ALWAYS",
    showValue: m.sysMenuShowValue,
    showSwitch: m.sysMenuShowSwitch ?? 1,
    showKey: m.sysMenuShowKey,
    menuStatus: 1,
    children: m.children?.map(toVM),
  };
}

function toEntity(v: MenuVM): SysMenu {
  return {
    sysMenuId: v.menuId,
    sysMenuPid: v.parentId,
    sysMenuTitle: v.menuName,
    sysMenuName: v.name,
    sysMenuPath: v.path,
    sysMenuPerm: v.auth,
    sysMenuIcon: v.icon,
    sysMenuSort: v.sort,
    sysMenuComponent: v.component,
    // 仅 iframe/外链 承载时下发地址；普通页面不下发，避免被误判为外链
    sysMenuFrameSrc: v.linkMode === "component" ? undefined : v.linkUrl,
    sysMenuActivePath: v.activeMenu,
    sysMenuHidden: v.isVisible === 1 ? 0 : 1,
    sysMenuRemind: (v.position === "top" ? 1 : v.isRemind) ?? 0,
    sysMenuPosition: v.position === "top" ? "top" : "standard",
    sysMenuKeepAlive: v.isKeepAlive,
    sysMenuShowParent: v.isExpanded,
    sysMenuHiddenTag: v.isHideTab,
    sysMenuFixedTag: v.isFixed,
    sysMenuIsTag: v.isTag,
    sysMenuTagType: v.tagType,
    sysMenuTagName: v.tagName,
    // 动态显示条件：类型与值原样下发，判定在后端 MenuVisibilityEvaluator
    sysMenuShowType: v.showType ?? "ALWAYS",
    sysMenuShowValue: v.showValue,
    sysMenuShowSwitch: v.showSwitch ?? 1,
    sysMenuShowKey: v.showKey,
    // 后端类型：0普通菜单 1iframe 2外链 3按钮
    sysMenuType:
      v.menuType === 3
        ? 3
        : v.linkMode === "iframe"
          ? 1
          : v.linkMode === "link"
            ? 2
            : 0,
    sysMenuEngine: 0,
    sysMenuHome: 0,
  };
}

/* ================== 数据 ================== */
const list = ref<MenuVM[]>([]);
const loading = ref(false);

/** 树配置 */
const treeProps = { children: "children", label: "menuName" };

/** 过滤掉按钮节点（目标站树只展示目录+菜单，按钮在右侧独立维护） */
function stripButtons(nodes: MenuVM[]): MenuVM[] {
  return nodes
    .filter((n) => n.menuType !== 3)
    .map((n) => ({ ...n, children: n.children?.length ? stripButtons(n.children) : [] }));
}

/** 搜索关键字 */
const keyword = ref("");
/** 过滤后的树（不含按钮节点） */
const filteredTree = computed<MenuVM[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return stripButtons(list.value);
  const filterTree = (nodes: MenuVM[]): MenuVM[] =>
    nodes
      .filter((n) => n.menuType !== 3)
      .map((n) => {
        const self = (n.menuName ?? "").toLowerCase().includes(kw) || (n.name ?? "").toLowerCase().includes(kw) || (n.path ?? "").toLowerCase().includes(kw);
        const kids = n.children?.length ? filterTree(n.children) : [];
        if (self || kids.length) return { ...n, children: kids };
        return null;
      })
      .filter(Boolean) as MenuVM[];
  return filterTree(list.value);
});

/** 当前选中节点（详情） */
const current = ref<MenuVM | null>(null);
/** 当前选中节点的按钮权限 */
const buttonPerms = ref<MenuVM[]>([]);

/** 统计（不含按钮） */
const stats = computed(() => {
  const all = flattenTree(stripButtons(list.value));
  return {
    total: all.length,
    directory: all.filter((n) => n.menuType === 1).length,
    page: all.filter((n) => n.menuType === 2).length,
  };
});

function flattenTree(tree: MenuVM[]): MenuVM[] {
  const result: MenuVM[] = [];
  const walk = (nodes: MenuVM[]) => {
    nodes.forEach((n) => {
      result.push(n);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(tree);
  return result;
}

/** 树展开 key */
const expandedKeys = ref<number[]>([]);
function collectAllKeys(nodes: MenuVM[]): number[] {
  const keys: number[] = [];
  const walk = (arr: MenuVM[]) => {
    arr.forEach((n) => {
      if (n.menuId != null) keys.push(n.menuId);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
}

/* ================== 加载 ================== */
async function loadList() {
  loading.value = true;
  try {
    const res = await listMenuTree();
    list.value = ((res?.data ?? []) as SysMenu[]).map(toVM);
    expandedKeys.value = collectAllKeys(list.value);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "菜单列表加载失败");
  } finally {
    loading.value = false;
  }
}

function refresh() {
  loadList();
}

/** 上移 / 下移：与相邻兄弟节点交换 sysMenuSort */
const moving = ref(false);
async function handleMove(dir: "up" | "down") {
  if (!current.value?.menuId) return;
  const curId = current.value.menuId;
  function findSiblings(nodes: MenuVM[]): MenuVM[] | null {
    if (nodes.some((n) => n.menuId === curId)) return nodes;
    for (const n of nodes) {
      if (n.children?.length) {
        const hit = findSiblings(n.children);
        if (hit) return hit;
      }
    }
    return null;
  }
  const siblings = findSiblings(list.value);
  if (!siblings || siblings.length < 2) {
    ElMessage.warning(dir === "up" ? "已是第一项" : "已是最后一项");
    return;
  }
  const sorted = [...siblings].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const idx = sorted.findIndex((n) => n.menuId === curId);
  const target = dir === "up" ? sorted[idx - 1] : sorted[idx + 1];
  if (!target) {
    ElMessage.warning(dir === "up" ? "已是第一项" : "已是最后一项");
    return;
  }
  moving.value = true;
  try {
    const mySort = current.value.sort ?? 0;
    const targetSort = target.sort ?? 0;
    await updateMenu({ ...toEntity(current.value), sysMenuSort: targetSort });
    await updateMenu({ ...toEntity(target), sysMenuSort: mySort });
    ElMessage.success(dir === "up" ? "已上移" : "已下移");
    await loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "排序调整失败");
  } finally {
    moving.value = false;
  }
}

/** 树节点动态类（目标站 tn()） */
function nodeClass(data: MenuVM): Record<string, boolean> {
  return {
    "is-disabled": String(data.menuStatus) === "0",
    "is-hidden": String(data.isVisible) === "0" && String(data.menuStatus) === "1",
    "is-link": isLink(data) && String(data.menuStatus) === "1",
    "is-iframe": isIframe(data),
  };
}

/** 是否外链（linkUrl 非空） */
function isLink(m?: MenuVM | null): boolean {
  return Boolean(m?.linkUrl?.trim());
}

/** 是否 iframe（auth 含 iframe） */
function isIframe(m?: MenuVM | null): boolean {
  return Boolean((m?.auth ?? "").includes("iframe"));
}

/** 是否菜单类型（可维护按钮权限，目标站 menuType===2） */
const isMenuTypeNode = computed<boolean>(() => current.value != null && current.value.menuType === 2);

/** 节点点击：加载详情 + 按钮权限 */
async function onNodeClick(data: MenuVM) {
  current.value = data;
  // 按钮权限 = 原始数据(list 含按钮)中该节点的子节点 menuType=3
  const full = data.menuId != null ? findById(list.value, data.menuId) : null;
  buttonPerms.value = (full?.children ?? []).filter((c) => c.menuType === 3);
}

/* ================== 左侧树拖拽（el-tree 内置，手柄触发） ================== */
const menuTreeRef = ref();
const treeDragSaving = ref(false);

/**
 * 仅允许从节点前的拖拽手柄发起拖拽。
 * capture 阶段拦截：非手柄区域的 dragstart 直接取消，避免误拖文字/图标。
 */
function onTreeDragStartCapture(e: DragEvent) {
  const target = e.target as HTMLElement | null;
  if (!target?.closest(".menu-tree-node__drag-handle")) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/** 允许被拖拽的节点：非按钮节点 */
function allowTreeDrag(node: any): boolean {
  return node?.data?.menuType !== 3;
}

/** 允许放置的位置：prev / inner / next 均支持，但禁止拖入自身子孙（避免成环） */
function allowTreeDrop(draggingNode: any, dropNode: any, _type: string): boolean {
  let p = dropNode;
  while (p) {
    if (p.data?.menuId != null && p.data.menuId === draggingNode?.data?.menuId) return false;
    p = p.parent;
  }
  return true;
}

/**
 * 拖拽完成：el-tree 内部节点顺序已更新。
 * - inner：拖入节点成为 dropNode 子级（pid = dropNode.menuId）
 * - prev/next：与 dropNode 同级（pid = dropNode 父级 menuId）
 * 按目标容器当前显示顺序重排 sort，并仅更新有变化的节点。
 */
async function onNodeDrop(draggingNode: any, dropNode: any, dropType: string) {
  const draggingData = draggingNode?.data as MenuVM;
  let newPid = 0;
  let targetContainer: any[] = [];
  if (dropType === "inner") {
    newPid = dropNode?.data?.menuId ?? 0;
    targetContainer = dropNode?.childNodes ?? [];
  } else {
    newPid = dropNode?.parent?.data?.menuId ?? 0;
    targetContainer = dropNode?.parent?.childNodes ?? [];
  }
  // 收集目标容器内按新顺序需要更新的节点（pid 或 sort 有变化）
  const updates: SysMenu[] = [];
  targetContainer.forEach((n: any, idx: number) => {
    const d = n.data as MenuVM;
    const newSort = (idx + 1) * 10;
    const pid = n.parent?.data?.menuId ?? 0;
    if (d.menuId === draggingData?.menuId || d.sort !== newSort || d.parentId !== pid) {
      updates.push({ ...toEntity(d), sysMenuPid: pid, sysMenuSort: newSort });
    }
  });
  treeDragSaving.value = true;
  try {
    for (const u of updates) {
      // eslint-disable-next-line no-await-in-loop
      await updateMenu(u);
    }
    ElMessage.success("菜单层级/排序已更新");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "拖拽更新失败，已恢复原顺序");
  } finally {
    treeDragSaving.value = false;
    await loadList(); // 无论成功失败，重新拉取保证显示与库一致
    if (draggingData?.menuId != null) {
      const hit = findById(list.value, draggingData.menuId);
      if (hit) onNodeClick(hit);
    }
  }
}

/* ================== 弹窗 ================== */
const dialogVisible = ref(false);
const dialogTitle = ref("新增菜单节点");
const saving = ref(false);
const form = ref<MenuVM>({});
const formRef = ref();

// 顶部菜单强制脱离菜单控制(remind=true)，且不允许修改
watch(
  () => form.value.position,
  (position) => {
    if (position === "top") {
      form.value.isRemind = 1;
    }
  }
);

/** 表单校验规则（目标站 Ln，必填字段红色星号） */
const formRules = {
  parentId: [{ required: true, message: "请选择上级菜单", trigger: "blur" }],
  menuType: [{ required: true, message: "请选择菜单类型", trigger: "blur" }],
  menuName: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  name: [{ required: true, message: "请输入路由name", trigger: "blur" }],
  path: [
    { required: true, message: "请输入菜单path", trigger: "blur" },
    { validator: (_r: unknown, v: string, cb: (e?: Error) => void) => { /^\/[a-zA-Z0-9:]+(\/[a-zA-Z0-9:]+)*$/.test(v) ? cb() : cb(new Error("菜单Path必须斜杠开头")); }, trigger: "blur" },
  ],
  component: [{ validator: (_r: unknown, v: string, cb: (e?: Error) => void) => {
    const need = form.value.menuType === 2 && form.value.linkMode === "component";
    need && !v?.trim() ? cb(new Error("请输入页面路径")) : cb();
  }, trigger: "blur" }],
  linkUrl: [{ validator: (_r: unknown, v: string, cb: (e?: Error) => void) => {
    const f = form.value;
    if (f.menuType !== 2 || f.linkMode === "component") return cb();
    if (!v?.trim()) return cb(new Error("请输入地址"));
    if (!/^https?:\/\/.+/.test(v.trim())) return cb(new Error("地址需以 http:// 或 https:// 开头"));
    cb();
  }, trigger: "blur" }],
  icon: [{ required: true, message: "请选择目录/菜单图标", trigger: "blur" }],
  auth: [{ validator: (_r: unknown, v: string, cb: (e?: Error) => void) => { form.value.menuType === 3 && !v ? cb(new Error("请输入权限字符")) : cb(); }, trigger: "blur" }],
  sort: [{ required: true, message: "请输入排序号", trigger: "blur" }],
};

/** 新增 */
function handleAdd(parent?: MenuVM) {
  const t = parent?.menuType ?? 2;
  dialogTitle.value = "新增菜单节点";
  form.value = {
    parentId: parent?.menuId ?? 0,
    menuType: t === 3 ? 3 : t,
    icon: "",
    linkMode: "component",
    component: "",
    linkUrl: "",
    activeMenu: "",
    isVisible: 1,
    isRemind: 0,
    position: "standard",
    menuStatus: 1,
    sort: 0,
    isKeepAlive: 0,
    isExpanded: 1,
    isFull: 0,
    isNewTab: 0,
    isHideTab: 0,
    isFixed: 0,
    isTag: 0,
    tagType: "danger",
    tagName: undefined,
    showType: "ALWAYS",
    showValue: undefined,
    showSwitch: 1,
    showKey: undefined,
  };
  dialogVisible.value = true;
}

/** 编辑 */
function handleEdit(node?: MenuVM) {
  const target = node ?? current.value;
  if (!target?.menuId) {
    ElMessage.warning("请先选择菜单");
    return;
  }
  dialogTitle.value = "编辑菜单配置";
  form.value = JSON.parse(JSON.stringify(target));
  dialogVisible.value = true;
}

/** 保存 */
async function handleSubmit() {
  if (!form.value.menuName || !form.value.name) {
    ElMessage.warning("请输入菜单名称和路由名称");
    return;
  }
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    const entity = toEntity(form.value);
    if (form.value.menuId) {
      await updateMenu(entity);
      ElMessage.success("修改成功");
    } else {
      await saveMenu(entity);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    await loadList();
    if (form.value.menuId) {
      const hit = findById(list.value, form.value.menuId);
      if (hit) onNodeClick(hit);
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

function findById(nodes: MenuVM[], id: number): MenuVM | null {
  for (const n of nodes) {
    if (n.menuId === id) return n;
    if (n.children?.length) {
      const hit = findById(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

/** 删除 */
async function handleDelete(node?: MenuVM) {
  const target = node ?? current.value;
  if (!target?.menuId) {
    ElMessage.warning("请先选择菜单");
    return;
  }
  if (target.children?.length) {
    ElMessage.warning("存在子菜单，请先删除子菜单");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除「${target.menuName}」？`, "提示", { type: "warning" });
  } catch {
    return;
  }
  await deleteMenu(target.menuId);
  ElMessage.success("删除成功");
  if (current.value?.menuId === target.menuId) {
    current.value = null;
    buttonPerms.value = [];
  }
  loadList();
}

/** 新增按钮权限（需选中菜单类型节点） */
function handleAddButton() {
  if (!current.value?.menuId) {
    ElMessage.warning("请先选择菜单");
    return;
  }
  if (String(current.value.menuType) !== "2") {
    ElMessage.warning("请选择菜单类型节点");
    return;
  }
  dialogTitle.value = "新增按钮权限";
  form.value = {
    parentId: current.value.menuId,
    menuType: 3,
    icon: "",
    isVisible: 0,
    menuStatus: 1,
    sort: 0,
  };
  dialogVisible.value = true;
}

/** 编辑按钮权限 */
function handleEditButton(row: MenuVM) {
  dialogTitle.value = "编辑按钮权限";
  form.value = JSON.parse(JSON.stringify(row));
  dialogVisible.value = true;
}

/* ================== 按钮权限批量管理 ================== */
/** 表格多选选中的按钮 */
const selectedButtons = ref<MenuVM[]>([]);
function onButtonSelectionChange(rows: MenuVM[]) {
  selectedButtons.value = rows;
}

/** 批量新增按钮弹窗 */
const batchDialogVisible = ref(false);
const batchSaving = ref(false);
interface BatchButtonRow { menuName: string; auth: string; sort: number }
const batchRows = ref<BatchButtonRow[]>([{ menuName: "", auth: "", sort: 0 }]);

function handleOpenBatchAdd() {
  if (!current.value?.menuId) {
    ElMessage.warning("请先选择菜单");
    return;
  }
  if (String(current.value.menuType) !== "2") {
    ElMessage.warning("请选择菜单类型节点");
    return;
  }
  batchRows.value = [{ menuName: "", auth: "", sort: 0 }];
  batchDialogVisible.value = true;
}

function addBatchRow() {
  batchRows.value.push({ menuName: "", auth: "", sort: (batchRows.value.length + 1) * 10 });
}

function removeBatchRow(idx: number) {
  batchRows.value.splice(idx, 1);
}

/** 批量保存按钮 */
async function handleBatchSubmit() {
  const valid = batchRows.value.filter((r) => r.menuName.trim());
  if (!valid.length) {
    ElMessage.warning("请至少填写一个按钮名称");
    return;
  }
  batchSaving.value = true;
  try {
    const items = valid.map((r) => ({
      sysMenuPid: current.value!.menuId,
      sysMenuTitle: r.menuName,
      sysMenuName: r.menuName,
      sysMenuPerm: r.auth,
      sysMenuType: 3,
      sysMenuSort: r.sort,
      sysMenuHidden: 0,
    }));
    await batchSaveMenuButtons(items as Record<string, unknown>[]);
    ElMessage.success(`已批量新增 ${items.length} 个按钮`);
    batchDialogVisible.value = false;
    await loadList();
    if (current.value?.menuId) {
      const hit = findById(list.value, current.value.menuId);
      if (hit) onNodeClick(hit);
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量保存失败");
  } finally {
    batchSaving.value = false;
  }
}

/** 批量删除按钮 */
async function handleBatchDeleteButtons() {
  if (!selectedButtons.value.length) {
    ElMessage.warning("请先勾选要删除的按钮");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedButtons.value.length} 个按钮？`, "提示", { type: "warning" });
  } catch {
    return;
  }
  try {
    const ids = selectedButtons.value.map((b) => b.menuId).filter(Boolean) as number[];
    await batchDeleteMenuButtons(ids);
    ElMessage.success("已批量删除");
    await loadList();
    if (current.value?.menuId) {
      const hit = findById(list.value, current.value.menuId);
      if (hit) onNodeClick(hit);
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量删除失败");
  }
}

/** 树右键菜单 */
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextNode = ref<MenuVM | null>(null);

function onNodeContextmenu(e: MouseEvent, data: MenuVM) {
  e.preventDefault();
  e.stopPropagation();
  onNodeClick(data);
  contextNode.value = data;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuVisible.value = true;
}

function onContextMenuSelect(action: string) {
  contextMenuVisible.value = false;
  if (!contextNode.value) return;
  if (action === "add") handleAdd(contextNode.value);
  else if (action === "update") handleEdit(contextNode.value);
  else if (action === "delete") handleDelete(contextNode.value);
  else if (action === "refresh") refresh();
}

/* ================== 详情 descriptions ================== */

/** 非按钮显示图标字段（目标站 menuType<3） */
const showIconField = computed<boolean>(() => Number(form.value.menuType) < 3);
/** 普通页面：显示组件路径（承载方式=component） */
const showComponentField = computed<boolean>(
  () => form.value.menuType === 2 && form.value.linkMode === "component"
);
/** iframe / 外链：显示地址输入（承载方式≠component） */
const showLinkField = computed<boolean>(
  () => form.value.menuType === 2 && form.value.linkMode !== "component"
);
/** 是否 iframe 承载（用于地址标签/提示文案） */
const isIframeLinkMode = computed<boolean>(() => form.value.linkMode === "iframe");

/** 详情 descriptions 字段（选中节点后展示） */
const detailItems = computed(() => {
  const c = current.value;
  if (!c) return [];
  const items: Array<{ label: string; value: string }> = [
    { label: "菜单名称", value: c.menuName ?? "-" },
    { label: "菜单类型", value: typeLabels[c.menuType ?? 0] ?? "-" },
    { label: "路由名称", value: c.name ?? "-" },
    { label: "路由地址", value: c.path ?? "-" },
  ];
  if (c.menuType === 2) items.push({ label: "组件路径", value: c.component ?? "-" });
  items.push({ label: "权限字符", value: c.auth ?? "-" });
  if (c.showType && c.showType !== "ALWAYS") {
    const label =
      showTypeOptions.find((o) => o.value === c.showType)?.label ?? c.showType;
    let value = c.showValue ?? "-";
    if (c.showType === "SWITCH") {
      value = c.showKey
        ? `功能键 ${c.showKey}（${c.showSwitch === 0 ? "隐藏" : "放行"}）`
        : c.showSwitch === 0
          ? "隐藏"
          : "放行";
    }
    items.push({ label: "显示条件", value: `${label}：${value}` });
  }
  if (c.menuType === 1 || c.menuType === 2) {
    items.push({ label: "单子菜单时父级", value: c.isExpanded === 1 ? "隐藏父级(子菜单直接显示)" : "显示父级" });
  }
  if (c.menuType === 2) {
    items.push({ label: "页面缓存", value: c.isKeepAlive === 1 ? "缓存" : "不缓存" });
    items.push({ label: "菜单控制", value: c.isRemind === 1 ? "脱离菜单(仅路由)" : "作为菜单" });
  }
  items.push({ label: "外链地址", value: c.linkUrl ?? "-" });
  items.push({ label: "选中路由", value: c.activeMenu ?? "-" });
  if (c.menuType === 2) {
    items.push({ label: "是否全屏", value: c.isFull === 1 ? "全屏" : "不全屏" });
    items.push({ label: "是否新标签", value: c.isNewTab === 1 ? "新标签打开" : "当前页打开" });
    items.push({ label: "标签隐藏", value: c.isHideTab === 1 ? "隐藏" : "显示" });
  }
  items.push({ label: "显示排序", value: String(c.sort ?? 0) });
  items.push({ label: "菜单徽标", value: c.isTag === 1 ? (c.tagName || (c.tagType ?? "danger")) : "无" });
  return items;
});

onMounted(() => {
  loadList();
  document.addEventListener("click", () => {
    contextMenuVisible.value = false;
  });
});
</script>

<template>
  <div class="menu-page">
    <!-- ==================== 左栏：菜单树（300px） ==================== -->
    <div class="menu-tree-card koi-card h-full flex flex-col">
      <div class="koi-card__body">
        <div class="menu-panel-header">
          <div class="menu-panel-title">
            <span class="menu-panel-title__icon">
              <el-icon><MoreFilled /></el-icon>
            </span>
            <div>
              <div class="menu-panel-title__text">菜单管理</div>
              <div class="menu-panel-title__desc">维护目录、菜单与权限入口</div>
            </div>
          </div>
          <div class="menu-action-group">
            <el-tooltip content="新增" placement="top">
              <el-button type="primary" icon="Plus" circle plain @click="handleAdd()" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="danger" icon="Delete" circle plain @click="handleDelete()" />
            </el-tooltip>
            <el-tooltip content="刷新" placement="top">
              <el-button type="info" icon="Refresh" circle plain @click="refresh" />
            </el-tooltip>
          </div>

          <div class="menu-tree-toolbar">
            <el-input v-model="keyword" placeholder="搜索菜单名称" clearable :prefix-icon="Search" />
            <div class="menu-tree-stats">
              <div class="menu-tree-stat"><strong>{{ stats.total }}</strong><span>节点</span></div>
              <div class="menu-tree-stat"><strong>{{ stats.directory }}</strong><span>目录</span></div>
              <div class="menu-tree-stat"><strong>{{ stats.page }}</strong><span>菜单</span></div>
            </div>
          </div>
        </div>

        <div v-loading="loading" class="menu-tree-wrap">
          <el-tree
            ref="menuTreeRef"
            class="menu-tree"
            :data="filteredTree"
            node-key="menuId"
            :props="treeProps"
            :default-expand-all="true"
            :default-expanded-keys="expandedKeys"
            :expand-on-click-node="false"
            draggable
            :allow-drag="allowTreeDrag"
            :allow-drop="allowTreeDrop"
            highlight-current
            :current-node-key="current?.menuId"
            @dragstart.capture="onTreeDragStartCapture"
            @node-click="onNodeClick"
            @node-contextmenu="onNodeContextmenu"
            @node-drop="onNodeDrop"
          >
            <template #default="{ data }">
              <div class="menu-tree-node" :class="nodeClass(data)">
                <span class="menu-tree-node__drag-handle" title="拖拽调整排序/层级">
                  <el-icon><Rank /></el-icon>
                </span>
                <span class="menu-tree-node__icon">
                  <ReIcon :name="data.icon" :size="14" />
                </span>
                <div class="menu-tree-node__main">
                  <span class="menu-tree-node__name">{{ data.menuName }}</span>
                  <span class="menu-tree-node__path">{{ data.path || '未配置路由' }}</span>
                </div>
                <div class="menu-tree-node__badges">
                  <template v-if="data.isTag === 1">
                    <el-tag
                      v-if="data.tagName"
                      
                      :type="(data.tagType as any) || 'primary'"
                      effect="light"
                      round
                      disable-transitions
                      class="menu-tree-node__menu-badge"
                    >
                      {{ data.tagName }}
                    </el-tag>
                    <span
                      v-else
                      class="menu-tree-node__badge-dot"
                      :style="{ background: tagTypeColor[data.tagType ?? 'primary'] ?? tagTypeColor.primary }"
                    />
                  </template>
                  <el-tag v-if="data.menuType === 3"  type="warning" effect="light">按钮</el-tag>
                  <el-tag v-else-if="isLink(data)"  type="primary" effect="light">外链</el-tag>
                  <el-tag v-else-if="isIframe(data)"  type="success" effect="light">iframe</el-tag>
                </div>
              </div>
            </template>
          </el-tree>

          <!--
            树空态：el-tree 数据为空时只留一片白，用户不知道下一步该做什么。
            「后端确实没有」与「搜索没匹配上」分开措辞，避免把筛选问题误报成数据问题。
            复用已有的 refresh（内部就是 loadList）与 handleAdd，不新增脚本函数。
            page-empty 系列样式在 pages/system/src/styles/system-page.css 全局提供，本页不重复定义。
          -->
          <div v-if="!loading && !filteredTree.length" class="menu-tree-empty">
            <div class="page-empty">
              <span class="page-empty__icon">
                <ReIcon :name="list.length ? 'Search' : 'Menu'" :size="22" />
              </span>
              <span class="page-empty__title">
                {{ list.length ? '没有匹配的菜单' : '还没有菜单项' }}
              </span>
              <span class="page-empty__desc">
                {{ list.length
                  ? '换个关键字再试，或刷新重新拉取菜单树。'
                  : '先建一个顶级目录，再用它挂载下级菜单；菜单下的按钮权限在右侧维护。' }}
              </span>
              <span class="page-empty__actions">
                <ReButton v-if="!list.length" type="primary" icon="Plus" @click="handleAdd()">
                  新增顶级菜单
                </ReButton>
                <ReButton icon="Refresh" @click="refresh">刷新</ReButton>
              </span>
            </div>
          </div>
        </div>

        <!-- 树节点右键菜单 -->
        <teleport to="body">
          <div
            v-if="contextMenuVisible"
            class="menu-context-menu"
            :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
            @click.stop
          >
            <!-- 右键菜单项是 div 模拟按钮：补 role / tabindex / 回车空格，键盘也能用 -->
            <div
              class="menu-context-menu__item"
              role="menuitem"
              tabindex="0"
              @click="onContextMenuSelect('add')"
              @keydown.enter="onContextMenuSelect('add')"
              @keydown.space.prevent="onContextMenuSelect('add')"
            >
              <el-icon><Plus /></el-icon><span>新增</span>
            </div>
            <div
              class="menu-context-menu__item"
              role="menuitem"
              tabindex="0"
              @click="onContextMenuSelect('update')"
              @keydown.enter="onContextMenuSelect('update')"
              @keydown.space.prevent="onContextMenuSelect('update')"
            >
              <el-icon><Edit /></el-icon><span>编辑</span>
            </div>
            <div
              class="menu-context-menu__item menu-context-menu__item--danger"
              role="menuitem"
              tabindex="0"
              @click="onContextMenuSelect('delete')"
              @keydown.enter="onContextMenuSelect('delete')"
              @keydown.space.prevent="onContextMenuSelect('delete')"
            >
              <el-icon><Delete /></el-icon><span>删除</span>
            </div>
            <div class="menu-context-menu__divider" />
            <div
              class="menu-context-menu__item"
              role="menuitem"
              tabindex="0"
              @click="onContextMenuSelect('refresh')"
              @keydown.enter="onContextMenuSelect('refresh')"
              @keydown.space.prevent="onContextMenuSelect('refresh')"
            >
              <el-icon><Refresh /></el-icon><span>刷新</span>
            </div>
          </div>
        </teleport>
      </div>
    </div>

    <!-- ==================== 右栏 ==================== -->
    <div class="menu-workspace">
      <!-- 菜单详情卡片 -->
      <div class="menu-detail-card koi-card">
        <div class="koi-card__body">
          <div class="menu-panel-header">
            <div class="menu-panel-title">
              <span class="menu-panel-title__icon is-detail">
                <el-icon><Edit /></el-icon>
              </span>
              <div>
                <div class="menu-panel-title__text">菜单详情</div>
                <div class="menu-panel-title__desc">{{ current ? current.menuName : '请选择左侧菜单查看配置' }}</div>
              </div>
            </div>
            <div v-if="current" class="menu-action-group">
              <el-tooltip content="上移" placement="top"><el-button type="primary" icon="ArrowUp" circle plain @click="handleMove('up')" /></el-tooltip>
              <el-tooltip content="下移" placement="top"><el-button type="primary" icon="ArrowDown" circle plain @click="handleMove('down')" /></el-tooltip>
              <el-tooltip content="新增子菜单" placement="top">
                <el-button type="primary" icon="Plus" circle plain @click="handleAdd(current)" />
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <el-button type="success" icon="Edit" circle plain @click="handleEdit()" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" icon="Delete" circle plain @click="handleDelete()" />
              </el-tooltip>
              <el-tooltip content="刷新" placement="top">
                <el-button type="info" icon="Refresh" circle plain @click="refresh" />
              </el-tooltip>
            </div>
          </div>

          <div v-loading="loading" class="menu-detail-body">
            <!-- 未选中时占位 -->
            <el-empty v-if="!current" description="请选择菜单查看配置" :image-size="120" />
            <template v-else>
              <!-- Hero 详情头 -->
              <div class="menu-detail-hero">
                <span class="menu-detail-hero__icon" :class="nodeClass(current)">
                  <ReIcon :name="current.icon" :size="18" />
                </span>
                <div class="menu-detail-hero__main">
                  <div class="menu-detail-hero__top">
                    <span class="menu-detail-hero__title">{{ current.menuName }}</span>
                    <div class="menu-detail-hero__meta">
                      <el-tag  effect="light">{{ typeLabels[current.menuType ?? 0] ?? '-' }}</el-tag>
                      <el-tag  :type="current.menuStatus === 1 ? 'success' : 'danger'" effect="plain">
                        {{ current.menuStatus === 1 ? '启用' : '禁用' }}
                      </el-tag>
                      <el-tag  :type="current.isVisible === 1 ? 'primary' : 'warning'" effect="plain">
                        {{ current.isVisible === 1 ? '显示' : '隐藏' }}
                      </el-tag>
                      <el-tag v-if="current.isRemind === 1"  type="warning" effect="plain">脱离菜单</el-tag>
                      <el-tag v-if="current.isKeepAlive === 1"  type="primary" effect="plain">缓存</el-tag>
                      <el-tag v-if="isLink(current)"  type="primary" effect="plain">外链</el-tag>
                      <el-tag v-if="isIframe(current)"  type="success" effect="plain">iframe</el-tag>
                      <template v-if="current.isTag === 1">
                        <el-tag
                          v-if="current.tagName"
                          
                          :type="(current.tagType as any) || 'primary'"
                          effect="light"
                          round
                          disable-transitions
                        >
                          {{ current.tagName }}
                        </el-tag>
                        <span
                          v-else
                          class="menu-detail-hero__badge-dot"
                          :style="{ background: tagTypeColor[current.tagType ?? 'primary'] ?? tagTypeColor.primary }"
                        />
                      </template>
                    </div>
                  </div>
                  <div class="menu-detail-hero__info">
                    <span><em>路由</em><strong>{{ current.path || '-' }}</strong></span>
                    <span><em>权限</em><strong>{{ current.auth || '-' }}</strong></span>
                    <span><em>按钮</em><strong>{{ buttonPerms.length }} 个</strong></span>
                  </div>
                </div>
                <div class="menu-detail-hero__actions">
                  <el-switch
                    v-model="current.menuStatus"
                    active-text="启用"
                    inactive-text="停用"
                    :active-value="1"
                    :inactive-value="0"
                    inline-prompt
                  />
                </div>
              </div>

              <!-- 描述列表 -->
              <el-descriptions class="menu-descriptions" :column="2" border>
                <el-descriptions-item v-for="item in detailItems" :key="item.label" :label="item.label">
                  <template v-if="item.label === '菜单徽标' && current?.isTag === 1">
                    <span v-if="current.tagName" class="menu-badge-preview" :style="{ background: tagTypeColor[current.tagType ?? 'danger'] ?? tagTypeColor.danger }">
                      {{ current.tagName }}
                    </span>
                    <span v-else class="menu-badge-dot" :style="{ background: tagTypeColor[current.tagType ?? 'danger'] ?? tagTypeColor.danger }" />
                  </template>
                  <template v-else>
                    {{ item.value }}
                  </template>
                </el-descriptions-item>
              </el-descriptions>
            </template>
          </div>
        </div>
      </div>

      <!-- 按钮权限卡片 -->
      <div class="menu-button-card koi-card">
        <div class="koi-card__body">
          <div class="menu-panel-header">
            <div class="menu-panel-title">
              <span class="menu-panel-title__icon is-button">
                <el-icon><MoreFilled /></el-icon>
              </span>
              <div>
                <div class="menu-panel-title__text">按钮权限</div>
                <div class="menu-panel-title__desc">{{ current && current.menuType === 2 ? '当前菜单下的按钮级权限' : '仅菜单类型可维护按钮权限' }}</div>
              </div>
            </div>
            <div class="menu-action-group menu-button-toolbar">
              <el-tag  effect="plain">{{ buttonPerms.length }} 项</el-tag>
              <el-tooltip content="新增按钮" placement="top">
                <el-button type="primary" icon="Plus" circle plain :disabled="!isMenuTypeNode" @click="handleAddButton" />
              </el-tooltip>
              <el-tooltip content="批量新增" placement="top">
                <el-button type="primary" icon="Files" circle plain :disabled="!isMenuTypeNode" @click="handleOpenBatchAdd" />
              </el-tooltip>
              <el-tooltip :content="selectedButtons.length ? `批量删除(${selectedButtons.length})` : '批量删除'" placement="top">
                <el-button type="danger" icon="Delete" circle plain :disabled="!selectedButtons.length" @click="handleBatchDeleteButtons" />
              </el-tooltip>
              <el-tooltip content="刷新" placement="top">
                <el-button type="info" icon="Refresh" circle plain :disabled="!isMenuTypeNode" @click="refresh" />
              </el-tooltip>
            </div>
          </div>

          <div class="menu-button-table">
            <!-- 未选中菜单类型节点时占位 -->
            <div v-if="!isMenuTypeNode" class="menu-button-placeholder">
              <span class="menu-button-placeholder__icon">
                <el-icon :size="20"><MoreFilled /></el-icon>
              </span>
              <div class="menu-button-placeholder__content">
                <strong>仅菜单类型可维护按钮权限</strong>
                <em>请选择左侧菜单类型节点，随后可新增、编辑和刷新按钮级权限。</em>
              </div>
            </div>
            <!-- 按钮权限表格 -->
            <el-table v-else :data="buttonPerms" class="menu-button-table" border stripe empty-text="暂无数据" @selection-change="onButtonSelectionChange">
              <!--
                按钮权限空态：el-table 默认只写一句「暂无数据」，
                换成可操作版本，直接把「新建按钮权限」的出口放在空位上。
              -->
              <template #empty>
                <div class="page-empty">
                  <span class="page-empty__icon"><ReIcon name="Lock" :size="22" /></span>
                  <span class="page-empty__title">该菜单还没有按钮权限</span>
                  <span class="page-empty__desc">按钮权限用于细粒度控制页面上的操作入口，如新增、编辑、删除。</span>
                  <span class="page-empty__actions">
                    <ReButton type="primary" icon="Plus" @click="handleAddButton">新增按钮权限</ReButton>
                  </span>
                </div>
              </template>
              <el-table-column type="selection" width="44" align="center" />
              <el-table-column type="index" label="序号" width="70px" align="center" />
              <el-table-column label="按钮名称" prop="menuName" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="button-name-cell">
                    <span class="button-name-cell__icon">
                      <ReIcon :name="row.icon" :size="14" />
                    </span>
                    <div class="button-name-cell__content">
                      <strong>{{ row.menuName || '-' }}</strong>
                      <em>{{ row.auth }}</em>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="权限字符" prop="auth" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag effect="plain" type="info">{{ row.auth }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" prop="menuStatus" width="120px" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.menuStatus"
                    active-text="启用"
                    inactive-text="停用"
                    :active-value="1"
                    :inactive-value="0"
                    inline-prompt
                  />
                </template>
              </el-table-column>
              <el-table-column label="创建时间" prop="createTime" width="180px" align="center" />
              <el-table-column label="操作" align="center" width="130" fixed="right">
                <template #default="{ row }">
                  <div class="menu-table-actions">
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" icon="Edit" circle plain @click="handleEditButton(row)" />
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button type="danger" icon="Delete" circle plain @click="handleDelete(row)" />
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 新增 / 编辑 弹窗 ==================== -->
    <ReDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
      :confirm-loading="saving"
      @confirm="handleSubmit"
      @cancel="dialogVisible = false"
    >
      <div class="menu-form-shell">
        <div class="menu-form-intro">
          <div class="menu-form-intro__main">
            <strong>{{ dialogTitle }}</strong>
            <span>配置会同步影响路由、侧栏展示和权限鉴权。</span>
          </div>
          <span class="menu-form-intro__badge">{{ form.menuType === 3 ? '按钮权限' : typeLabels[form.menuType ?? 0] ?? '菜单' }}</span>
        </div>

        <el-form ref="formRef" class="menu-form" :model="form" :rules="formRules" label-width="110px" status-icon>
          <!-- 基础信息 -->
          <section class="menu-form-section">
            <div class="menu-form-section__title">基础信息</div>
            <el-row :gutter="16">
              <el-col :sm="24" :xs="24">
                <el-form-item label="菜单上级" prop="parentId" required>
                  <el-tree-select
                    v-model="form.parentId"
                    :data="list"
                    :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
                    check-strictly
                    clearable
                    filterable
                    placeholder="请选择菜单上级"
                    class="w-full"
                  />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :xs="24">
                <el-form-item label="菜单类型" prop="menuType" required>
                  <el-radio-group v-model="form.menuType" class="menu-type-group">
                    <el-radio v-for="o in typeOptions" :key="o.value" :value="o.value" border>
                      {{ o.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col v-if="showIconField" :sm="12" :xs="24">
                <el-form-item label="菜单图标" prop="icon" required>
                  <ReIconSelect v-model="form.icon" width="100%" />
                </el-form-item>
              </el-col>
              <el-col :sm="showIconField ? 12 : 16" :xs="24">
                <el-form-item label="菜单名称" prop="menuName" required>
                  <el-input v-model="form.menuName" placeholder="请输入菜单名称" maxlength="128" show-word-limit clearable />
                </el-form-item>
              </el-col>
              <el-col :sm="8" :xs="24">
                <el-form-item label="显示排序" prop="sort" required>
                  <el-input-number v-model="form.sort" class="w-full" :min="1" clearable />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <!-- 路由配置 -->
          <section class="menu-form-section">
            <div class="menu-form-section__title">路由配置</div>
            <el-row :gutter="16">
              <el-col :sm="12" :xs="24">
                <el-form-item label="路由名称" prop="name" required>
                  <div class="menu-form-help-field">
                    <el-tooltip content="路由名称必须全局唯一，对应 Vue Router 的 name 及页面缓存[例如：userPage]" placement="top">
                      <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.name" placeholder="例如: userPage[唯一]" maxlength="32" show-word-limit clearable />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="路由Path" prop="path" required>
                  <div class="menu-form-help-field">
                    <el-tooltip content="菜单 path 必须以斜杠开头" placement="top">
                      <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.path" placeholder="例如：/system/user[唯一]" maxlength="32" show-word-limit clearable />
                  </div>
                </el-form-item>
              </el-col>
              <!-- 承载方式（仅菜单类型） -->
              <el-col v-if="form.menuType === 2" :span="24">
                <el-form-item label="承载方式">
                  <el-radio-group v-model="form.linkMode">
                    <el-radio-button value="component">普通页面</el-radio-button>
                    <el-radio-button value="iframe">iframe 内嵌</el-radio-button>
                    <el-radio-button value="link">外链跳转</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col v-if="showComponentField" :sm="12" :xs="24">
                <el-form-item label="页面路径" prop="component" required>
                  <div class="menu-form-help-field">
                    <el-tooltip content="对应 views 目录下的页面文件路径，无需斜杠开头[例如：system/user/index]" placement="top">
                      <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.component" placeholder="system/user/index" maxlength="64" show-word-limit clearable />
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="showComponentField" :sm="12" :xs="24">
                <el-form-item label="选中路由" prop="activeMenu">
                  <div class="menu-form-help-field">
                    <el-tooltip content="隐藏页或详情页访问时，指定侧栏高亮的路由" placement="top">
                      <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.activeMenu" placeholder="留空则高亮当前路由" clearable />
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="showLinkField" :span="24">
                <el-form-item :label="isIframeLinkMode ? 'iframe 地址' : '外链地址'" prop="linkUrl" required>
                  <div class="menu-form-help-field">
                    <el-tooltip
                      :content="isIframeLinkMode
                        ? '在系统内以 iframe 方式嵌入的页面地址，需以 http:// 或 https:// 开头'
                        : '点击菜单后新开窗口跳转的外链地址，需以 http:// 或 https:// 开头'"
                      placement="top"
                    >
                      <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-input
                      v-model="form.linkUrl"
                      :placeholder="isIframeLinkMode
                        ? '请输入 iframe 地址，如 https://example.com/page'
                        : '请输入外链地址，如 https://example.com'"
                      maxlength="256"
                      show-word-limit
                      clearable
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <!-- 权限与状态 -->
          <section class="menu-form-section">
            <div class="menu-form-section__title">权限与状态</div>
            <el-row :gutter="16">
              <el-col :sm="12" :xs="24">
                <el-form-item label="权限字符" prop="auth" :required="form.menuType === 3">
                  <el-input v-model="form.auth" placeholder="如 system:user:add，留空自动生成" maxlength="128" show-word-limit clearable />
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="是否显示" prop="isVisible">
                  <el-radio-group v-model="form.isVisible">
                    <el-radio :value="1">显示</el-radio>
                    <el-radio :value="0">隐藏</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="菜单位置" prop="position">
                  <el-radio-group v-model="form.position">
                    <el-radio value="standard">标准</el-radio>
                    <el-radio value="top">顶部</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="菜单控制" prop="isRemind">
                  <el-radio-group v-model="form.isRemind" :disabled="form.position === 'top'">
                    <el-radio :value="0">作为菜单</el-radio>
                    <el-radio :value="1">脱离菜单</el-radio>
                  </el-radio-group>
                  <span v-if="form.position === 'top'" class="menu-position-tip">顶部菜单默认脱离(remind=true)，不可修改</span>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="是否缓存" prop="isKeepAlive">
                  <el-radio-group v-model="form.isKeepAlive">
                    <el-radio :value="1">缓存</el-radio>
                    <el-radio :value="0">不缓存</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="是否全屏" prop="isFull">
                  <el-radio-group v-model="form.isFull">
                    <el-radio :value="1">全屏</el-radio>
                    <el-radio :value="0">不全屏</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="是否新标签" prop="isNewTab">
                  <el-radio-group v-model="form.isNewTab">
                    <el-radio :value="1">新标签打开</el-radio>
                    <el-radio :value="0">当前页打开</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="标签隐藏" prop="isHideTab">
                  <el-radio-group v-model="form.isHideTab">
                    <el-radio :value="1">隐藏</el-radio>
                    <el-radio :value="0">显示</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="单子菜单时父级" prop="isExpanded">
                  <el-radio-group v-model="form.isExpanded">
                    <el-radio :value="0">显示父级</el-radio>
                    <el-radio :value="1">隐藏父级(子菜单直接显示)</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="是否固钉" prop="isFixed">
                  <el-radio-group v-model="form.isFixed">
                    <el-radio :value="1">是</el-radio>
                    <el-radio :value="0">否</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <!-- 动态显示条件：决定这条菜单在什么情况下才出现在用户菜单树里 -->
          <section class="menu-form-section">
            <div class="menu-form-section__title">动态显示条件</div>
            <el-alert
              type="info"
              :closable="false"
              show-icon
              class="menu-form-hint"
              title="条件只在该菜单未配置时生效；条件求值出错时按放行处理，不会让菜单整片消失。"
            />
            <el-row :gutter="16">
              <el-col :sm="12" :xs="24">
                <el-form-item label="条件类型" prop="showType">
                  <el-select v-model="form.showType" class="w-full" placeholder="请选择条件类型">
                    <el-option
                      v-for="o in showTypeOptions"
                      :key="o.value"
                      :label="o.label"
                      :value="o.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item
                  v-if="form.showType === 'SWITCH'"
                  label="放行开关"
                  prop="showSwitch"
                >
                  <el-radio-group v-model="form.showSwitch">
                    <el-radio :value="1">放行</el-radio>
                    <el-radio :value="0">隐藏</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item
                  v-else-if="showValuePlaceholder"
                  label="条件值"
                  prop="showValue"
                >
                  <ReInput
                    v-model="form.showValue"
                    :placeholder="showValuePlaceholder"
                    clearable
                  />
                </el-form-item>
                <el-form-item v-else label="条件值" prop="showValue">
                  <span class="menu-form-tip">当前类型无需条件值</span>
                </el-form-item>
              </el-col>
              <el-col v-if="form.showType === 'SWITCH'" :sm="12" :xs="24">
                <el-form-item label="联动功能键" prop="showKey">
                  <ReInput
                    v-model="form.showKey"
                    placeholder="统一策略配置中 type=FEATURE 的业务键，留空则用上方放行开关"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <!-- 菜单徽标（独立区块，不与「权限与状态」混放） -->
          <section class="menu-form-section">
            <div class="menu-form-section__title">菜单徽标</div>
            <el-row :gutter="16">
              <el-col :sm="12" :xs="24">
                <el-form-item label="开启徽标" prop="isTag">
                  <ReSwitch
                    layout="square"
                    v-model="form.isTag"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="开启"
                    inactive-text="关闭"
                    inline-prompt
                  />
                </el-form-item>
              </el-col>
              <el-col v-if="form.isTag === 1" :sm="12" :xs="24">
                <el-form-item label="徽标类型" prop="tagType">
                  <el-select v-model="form.tagType" placeholder="请选择徽标类型" class="w-full">
                    <el-option v-for="o in tagTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="form.isTag === 1" :sm="24" :xs="24">
                <el-form-item label="徽标名称">
                  <el-input
                    v-model="form.tagName"
                    placeholder="留空则显示圆点徽标；填写后显示文字徽标，如 New"
                    maxlength="20"
                    show-word-limit
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>
        </el-form>
      </div>
    </ReDialog>

    <!-- 批量新增按钮弹窗 -->
    <ReDialog
      v-model="batchDialogVisible"
      title="批量新增按钮"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
      compact
      :confirm-loading="batchSaving"
      @confirm="handleBatchSubmit"
      @cancel="batchDialogVisible = false"
    >
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
        将为当前选中菜单批量创建按钮权限（菜单类型为按钮），权限标识建议填写如 system:user:add。
      </el-alert>
      <el-table :data="batchRows" border  style="width: 100%">
        <el-table-column label="#" width="60" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link :icon="Delete" @click="removeBatchRow($index)" />
          </template>
        </el-table-column>
        <el-table-column label="按钮名称" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.menuName" placeholder="如：新增" />
          </template>
        </el-table-column>
        <el-table-column label="权限标识" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.auth" placeholder="如 system:user:add" />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="110">
          <template #default="{ row }">
            <el-input-number v-model="row.sort" :min="0" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>
      </el-table>
      <el-button type="primary" plain icon="Plus" style="margin-top: 10px" @click="addBatchRow">添加一行</el-button>
    </ReDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "MenuManage",
});
</script>

<style scoped lang="scss">
/* ==================== 布局 ==================== */
.menu-page {
  display: flex;
  flex-direction: row;
  gap: 0;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

/* 左栏：菜单树（与目标站一致 300px） */
.menu-tree-card {
  width: 300px;
  flex-shrink: 0;
  min-width: 0;
  min-height: 0;
}

/* 右栏：详情 + 按钮权限（上下两行） */
.menu-workspace {
  flex: 1;
  padding-left: 6px;
  display: grid;
  grid-template-rows: minmax(280px, 1fr) minmax(220px, 0.82fr);
  min-width: 0;
  min-height: 0;
  gap: 12px;
}

.koi-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px 魔法值 → --el-radius-md（8px 档） */
  border-radius: var(--el-radius-md, 8px);
  min-height: 0;
  overflow: hidden;
}
.koi-card__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px 16px;
  min-height: 0;
  box-sizing: border-box;
}
.menu-tree-card .koi-card__body,
.menu-detail-card .koi-card__body,
.menu-button-card .koi-card__body {
  min-height: 0;
}
.h-full {
  height: 100%;
}
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}

/* ==================== 面板标题 ==================== */
.menu-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.menu-tree-card .menu-panel-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.menu-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.menu-panel-title__icon {
  width: 34px;
  height: 34px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.menu-panel-title__icon.is-detail {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-7);
}
.menu-panel-title__icon.is-button {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
}
.menu-panel-title__text {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}
.menu-panel-title__desc {
  max-width: 360px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
}

/* ==================== 操作按钮（目标站：圆角正方形 + 靠右） ==================== */
.menu-action-group {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.menu-tree-card .menu-action-group {
  align-self: flex-end;
}
.menu-action-group :deep(.el-button.is-circle) {
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  width: 30px;
  height: 30px;
  margin-left: 0;
  padding: 0;
}
.menu-action-group :deep(.el-tag) {
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  height: 28px;
  padding: 0 9px;
  line-height: 26px;
}

/* 按钮权限卡片工具栏：图标+tip，空间不足时整齐换行 */
.menu-button-toolbar {
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 6px;
}
.menu-button-toolbar :deep(.el-button) {
  margin-left: 0;
}

.menu-context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 120px;
  padding: 4px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  /* 原 rgba(0, 0, 0, 0.12) → --el-box-shadow-light：跟随主题的浮层阴影，
     暗色下不会变成一团黑。这是浮层（popover）不是卡片，属于允许的浮起反馈。 */
  box-shadow: var(--el-box-shadow-light);
}
.menu-context-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  /* 原 6px 魔法值 → --el-radius-sm */
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  outline: none;
  transition: background var(--el-transition-duration-fast, 0.2s);
}
.menu-context-menu__item:hover {
  background: var(--el-fill-color-light);
}
/* 键盘可达：右键菜单项也能用 Tab 走到并看清焦点 */
.menu-context-menu__item:focus-visible {
  background: var(--el-fill-color-light);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.menu-context-menu__item--danger {
  color: var(--el-color-danger);
}
.menu-context-menu__divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--el-border-color-lighter);
}

/* ==================== 菜单树 ==================== */
.menu-tree-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 12px;
  width: 100%;
}
.menu-tree-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.menu-tree-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
}
.menu-tree-stat strong {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
}
.menu-tree-stat span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.menu-tree-wrap {
  flex: 1;
  min-height: 0;
  padding-right: 2px;
  overflow: auto;
}
/* 树空态：撑满可视区并垂直居中，避免空态贴在顶部像没加载出来 */
.menu-tree-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px 4px;
}
.menu-tree :deep(.el-tree-node__content) {
  height: 40px;
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  padding-right: 8px;
  user-select: none;
  /* 节点整行可点（node-click），必须给手型光标 */
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.menu-tree :deep(.el-tree-node__content:hover) {
  background: var(--el-fill-color-light);
}
/* 键盘可达：Tab 到节点上时给焦点环；el-tree 用 tabindex 管理 roving 焦点 */
.menu-tree :deep(.el-tree-node__content:focus-visible) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
/* 展开 / 收起箭头：可点区域同样要手型光标 + 焦点环 */
.menu-tree :deep(.el-tree-node__expand-icon) {
  cursor: pointer;
  border-radius: var(--el-radius-xs, 4px);
  color: var(--el-text-color-secondary);
}
.menu-tree :deep(.el-tree-node__expand-icon:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.menu-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--el-color-primary-light-9);
}
.menu-tree-node__drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 24px;
  margin-right: 2px;
  color: var(--el-text-color-placeholder);
  cursor: grab;
  flex-shrink: 0;
}
.menu-tree-node__drag-handle:active {
  cursor: grabbing;
  color: var(--el-color-primary);
}
.menu-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.menu-tree-node__icon {
  width: 28px;
  height: 28px;
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.menu-tree-node__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
  min-width: 0;
}
.menu-tree-node__name,
.menu-tree-node__path {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.menu-tree-node__name {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}
.menu-tree-node__path {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.menu-tree-node__badges {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.menu-tree-node__menu-badge {
  font-weight: 600;
}
.menu-tree-node__badge-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  /* 原 50% → --el-radius-full（圆形点） */
  border-radius: var(--el-radius-full, 9999px);
}

/* ==================== 菜单详情 ==================== */
.menu-detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 6px;
}
.menu-detail-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 10px 14px;
  margin-bottom: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  border-radius: var(--el-radius-xl, 16px);
}
.menu-detail-hero__icon {
  width: 40px;
  height: 40px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}
.menu-detail-hero__main {
  flex: 1;
  min-width: 0;
}
.menu-detail-hero__top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.menu-detail-hero__title {
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  overflow: hidden;
}
.menu-detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 6px;
}
.menu-detail-hero__badge-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  align-self: center;
  /* 原 50% → --el-radius-full（圆形点） */
  border-radius: var(--el-radius-full, 9999px);
}
.menu-detail-hero__info {
  display: grid;
  grid-template-columns: minmax(120px, 0.9fr) minmax(140px, 1fr) 72px;
  gap: 10px;
  margin-top: 8px;
}
.menu-detail-hero__info span {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.menu-detail-hero__info em {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  font-size: 12px;
  font-style: normal;
}
.menu-detail-hero__info strong {
  min-width: 0;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
}
.menu-detail-hero__actions {
  flex-shrink: 0;
}
.menu-descriptions :deep(.el-descriptions__label) {
  width: 108px;
  color: var(--el-text-color-secondary);
}
.menu-badge-preview {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  /* 原 #fff → --el-color-white */
  color: var(--el-color-white);
  /* 原 11px 魔法值 → --el-radius-md（8px 档） */
  border-radius: var(--el-radius-md, 8px);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
.menu-badge-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  /* 原 50% → --el-radius-full（圆形点） */
  border-radius: var(--el-radius-full, 9999px);
}

/* ==================== 按钮权限 ==================== */
.menu-button-table {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  overflow: auto;
}
/*
  表格外壳：本页没有 ReTable，按 el-table 本体加边框 + 圆角 + focus-within 变色。
  类选择器升到 (0,2,0) 是为了压过 el-table--border 自带的 border，避免双层边框；
  koi 规约：卡片与表格都不加投影，区域层次靠边框表达。
*/
.menu-button-table.el-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  overflow: hidden;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.menu-button-table.el-table:focus-within {
  border-color: var(--el-color-primary-light-5);
}
.menu-button-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 0;
  padding: 22px;
  border: 1px dashed var(--el-border-color);
  background: var(--el-fill-color-lighter);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  text-align: center;
}
.menu-button-placeholder__icon {
  width: 42px;
  height: 42px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}
.menu-button-placeholder__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.menu-button-placeholder__content strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}
.menu-button-placeholder__content em {
  max-width: 360px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
}
.button-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.button-name-cell__icon {
  width: 30px;
  height: 30px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.button-name-cell__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
  min-width: 0;
}
.button-name-cell__content strong,
.button-name-cell__content em {
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  overflow: hidden;
}
.button-name-cell__content strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}
.button-name-cell__content em {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-style: normal;
}
.menu-table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.menu-table-actions :deep(.el-button.is-circle) {
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  width: 28px;
  height: 28px;
  margin-left: 0;
  padding: 0;
}

/* ==================== 弹窗表单 ==================== */
.menu-form-shell {
  padding: 0 2px 2px;
}
.menu-form-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  min-height: 58px;
  margin-bottom: 10px;
  padding: 10px 12px 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
}
.menu-form-intro__main {
  min-width: 0;
}
.menu-form-intro__main strong,
.menu-form-intro__main span {
  display: block;
}
.menu-form-intro__main strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
}
.menu-form-intro__main span {
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  font-size: 12px;
}
.menu-form-intro__badge {
  min-width: 58px;
  height: 28px;
  color: var(--el-color-primary);
  white-space: nowrap;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
.menu-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.menu-form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.menu-form :deep(.el-input__wrapper),
.menu-form :deep(.el-select__wrapper),
.menu-form :deep(.el-input-number) {
  width: 100%;
}
.menu-form-section {
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  /* 原 8px 魔法值 → --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  margin-bottom: 10px;
  padding: 12px 14px 0;
}
.menu-form-section__title {
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}
.menu-form-hint {
  margin-bottom: 12px;
}
.menu-form-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.menu-form-section__title::before {
  content: "";
  background: var(--el-color-primary);
  /* 原 4px 魔法值 → --el-radius-xs */
  border-radius: var(--el-radius-xs, 4px);
  width: 4px;
  height: 14px;
  display: inline-block;
}
.menu-form-help-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.menu-form-help-field > .el-icon {
  color: var(--el-color-warning);
  flex-shrink: 0;
}
.menu-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .menu-page {
    flex-direction: column;
  }
  .menu-tree-card {
    width: 100%;
    flex-shrink: 1;
  }
  .menu-workspace {
    grid-template-rows: minmax(240px, 1fr) minmax(200px, 0.8fr);
  }
}

/* 尊重系统「减少动态效果」偏好：把本页新增/沿用的过渡一并关掉 */
@media (prefers-reduced-motion: reduce) {
  .menu-context-menu__item,
  .menu-button-table.el-table,
  .menu-tree :deep(.el-tree-node__content) {
    transition: none;
  }
}
</style>
