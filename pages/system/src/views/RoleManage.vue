<script setup lang="ts">
/**
 * 角色管理页面
 *
 * 角色分页查询 + 增删改查 + 分配菜单权限（drawer 树形勾选）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { message } from "@repo/core";
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from "vue";
import { ElMessageBox, ElTree } from "element-plus";
import {
  UserFilled,
  Plus,
  Edit,
  Delete,
  Search,
  Menu as MenuIcon,
  DocumentCopy,
  Key,
  ArrowDown,
  ArrowUp,
  Select,
  RefreshLeft,
  Check,
  InfoFilled,
} from "@element-plus/icons-vue";
// 统一使用组件引用，保证按钮渲染大小一致
const EditIcon = Edit;
const DeleteIcon = Delete;
/** ReIcon 的 default 已是异步组件，不能当函数调用（`m.default()` 会抛 not a function） */
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default));
/**
 * ReChart 的默认导出是 defineThemeComponent 异步壳，本身已是异步组件；
 * 这里再包一层 defineAsyncComponent，保证「清单」视图下（默认视图）不会去加载图表运行时。
 */
const ReChart = defineAsyncComponent(() => import("@repo/ui/re-chart"));
import type {
  ReChartAtlasData,
  ReChartOrbitData,
  ReChartSelectPayload,
} from "@repo/ui/re-chart";
import {
  pageForRole,
  saveRole,
  updateRole,
  updateRoleDataScope,
  deleteRole,
  getRoleMenu,
  updateRoleMenu,
  listMenuTree,
  listDept,
  pageForUser,
} from "../api/systemApi";
import type { SysDept, SysMenu, SysRole, SysUser } from "../api/types";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const roleStatusOptions = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

const query = ref<{
  page: number;
  pageSize: number;
  sysRoleName?: string;
  sysRoleCode?: string;
  sysRoleStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

/**
 * 搜索区默认收起：指挥台顶部已有 KPI 与视图切换，常驻搜索会把表体压到 3 行。
 * 用户点工具栏的「显示搜索」再展开，筛选逻辑不变。
 */
const searchVisible = ref(false);

async function loadRoles({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForRole({
    page,
    pageSize,
    sysRoleName: (params.sysRoleName as string) || undefined,
    sysRoleCode: (params.sysRoleCode as string) || undefined,
    sysRoleStatus: (params.sysRoleStatus as number) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

const searchFilters = computed(() => [
  { key: 'sysRoleName', label: '角色名称', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysRoleCode', label: '角色编码', type: 'input' as const, placeholder: '请输入' },
  {
    key: 'sysRoleStatus', label: '状态', type: 'select' as const, placeholder: '请选择',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]);

const dialogVisible = ref(false);
const saving = ref(false);
/** sysRoleReadonly 暂未在 types.ts 中声明，本地扩展 */
type RoleForm = SysRole & { sysRoleReadonly?: number };
const form = ref<RoleForm>({});
const isEdit = ref(false);
/** 复制来源角色 ID（用于复制菜单授权） */
const copyFromRoleId = ref<number | null>(null);

function handleAdd() {
  isEdit.value = false;
  copyFromRoleId.value = null;
  form.value = { sysRoleStatus: 1, sysRoleSort: 0, sysRoleReadonly: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: SysRole | Record<string, unknown>) {
  isEdit.value = true;
  copyFromRoleId.value = null;
  form.value = { ...(row as unknown as SysRole) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysRoleName || !form.value.sysRoleCode) {
    message.warning("请输入角色名称和编码");
    return;
  }
  
  // 角色编码校验：去除空格、\\t等符号，只能用字母（大小写都支持）
  const originalCode = form.value.sysRoleCode;
  const cleanedCode = originalCode.replace(/[\s\t\r\n]+/g, "");
  if (cleanedCode !== originalCode) {
    message.warning("角色编码不允许包含空格或制表符");
    return;
  }
  if (!/^[a-zA-Z]+$/.test(cleanedCode)) {
    message.warning("角色编码只能使用字母（大小写都支持），不允许数字和特殊字符");
    return;
  }
  
  // 禁止新建内置角色编码
  const reservedCodes = ["admin", "sa", "superadmin", "super_admin"];
  if (!isEdit.value && reservedCodes.includes(cleanedCode.toLowerCase())) {
    message.warning("该角色编码为系统内置，不允许新建");
    return;
  }
  
  // 自动清理后的编码，统一转成大写存储
  form.value.sysRoleCode = cleanedCode.toUpperCase();
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateRole(form.value);
      message.success("修改成功");
    } else {
      const saved = await saveRole(form.value);
      message.success("新增成功");
      // 复制场景：新角色创建后，把原角色的菜单授权一并复制过来
      if (copyFromRoleId.value != null && saved?.data?.sysRoleId) {
        const srcMenus = await getRoleMenu(copyFromRoleId.value);
        await updateRoleMenu({ roleId: saved.data.sysRoleId, menuId: (srcMenus?.data ?? []) as number[] });
      }
    }
    dialogVisible.value = false;
    refreshAll();
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: SysRole | Record<string, unknown>) {
  const role = row as unknown as SysRole;
  await ElMessageBox.confirm(`确认删除角色「${role.sysRoleName}」？`, "提示", { type: "warning" });
  await deleteRole(role.sysRoleId!);
  message.success("删除成功");
  refreshAll();
}

async function handleStatus(row: SysRole | Record<string, unknown>) {
  const role = row as unknown as SysRole;
  await updateRole({ ...role, sysRoleStatus: role.sysRoleStatus === 1 ? 0 : 1 });
  message.success(role.sysRoleStatus === 1 ? "已启用" : "已停用");
  refreshAll();
}

const permVisible = ref(false);
const permSaving = ref(false);
const menuTree = ref<SysMenu[]>([]);
const checkedMenuIds = ref<number[]>([]);
/** 当前已选菜单/按钮数量（含半选父级时以实际勾选叶子计） */
const checkedCount = ref(0);
const currentRole = ref<SysRole | null>(null);
const menuTreeRef = ref<InstanceType<typeof ElTree>>();
const permSearchText = ref("");
const permTreeExpanded = ref<(string | number)[]>([]);
const activePermTab = ref("menu");

/** 树勾选变化时刷新已选数量 */
function onMenuCheck() {
  const checked = (menuTreeRef.value?.getCheckedKeys() ?? []) as number[];
  checkedCount.value = checked.length;
}

/** 清空已选菜单（二次确认） */
async function handleClearMenu() {
  try {
    await ElMessageBox.confirm("确认清空已选的菜单与按钮？", "提示", { type: "warning" });
  } catch {
    return;
  }
  menuTreeRef.value?.setCheckedKeys([]);
  checkedCount.value = 0;
}

/* ================== 数据权限 ================== */
const dataScopeOptions = [
  { label: "全部数据", value: 1, desc: "可查看所有部门的用户数据" },
  { label: "本部门数据", value: 2, desc: "仅可查看本部门的用户数据" },
  { label: "本部门及以下", value: 3, desc: "可查看本部门及子部门的用户数据" },
  { label: "仅本人数据", value: 4, desc: "仅可查看自己创建的数据" },
  { label: "自定义部门", value: 5, desc: "可查看指定部门及其子部门的数据" },
];
const dataScope = ref(1);
const deptTree = ref<SysDept[]>([]);
const checkedDeptIds = ref<number[]>([]);
const deptTreeRef = ref<InstanceType<typeof ElTree>>();

const filteredMenuTree = computed(() => {
  const q = permSearchText.value.trim().toLowerCase();
  if (!q) return menuTree.value;
  return filterTreeByText(menuTree.value, q);
});

/** 按标题/路由名/路径过滤树（命中节点保留其祖先） */
function filterTreeByText(nodes: SysMenu[], q: string): SysMenu[] {
  const result: SysMenu[] = [];
  nodes.forEach((n) => {
    const hit =
      (n.sysMenuTitle ?? "").toLowerCase().includes(q) ||
      (n.sysMenuName ?? "").toLowerCase().includes(q) ||
      (n.sysMenuPath ?? "").toLowerCase().includes(q);
    const children = n.children?.length ? filterTreeByText(n.children, q) : [];
    if (hit || children.length) {
      result.push({ ...n, children: children.length ? children : undefined });
    }
  });
  return result;
}

/**
 * default-expanded-keys 只在树数据重建时被 store 应用一次，单纯改这个 ref 对已渲染的树无效，
 * 所以展开/收起必须逐节点调 expand()/collapse()，同时把 ref 同步好供下次重建使用。
 */
function setPermTreeExpanded(expanded: boolean) {
  const nodesMap = (
    menuTreeRef.value as unknown as
      | { store?: { nodesMap?: Record<string, { expand?: () => void; collapse?: () => void }> } }
      | undefined
  )?.store?.nodesMap;
  Object.values(nodesMap ?? {}).forEach((node) => (expanded ? node.expand?.() : node.collapse?.()));
  permTreeExpanded.value = expanded ? collectKeys(menuTree.value) : [];
}

function expandAllPermTree() {
  setPermTreeExpanded(true);
}

function collapsePermTree() {
  setPermTreeExpanded(false);
}

function collectKeys(nodes: SysMenu[]): string[] {
  const keys: string[] = [];
  const walk = (arr: SysMenu[]) => {
    arr.forEach((n) => {
      if (n.sysMenuId != null) keys.push(String(n.sysMenuId));
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
}

/** 树中全部节点键 */
function collectAllKeys(nodes: SysMenu[]): number[] {
  const keys: number[] = [];
  const walk = (arr: SysMenu[]) => {
    arr.forEach((n) => {
      if (n.sysMenuId != null) keys.push(n.sysMenuId);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
}

/** 前 depth 层节点键（用于默认展开到菜单层，按钮层保持收起） */
function collectKeysToDepth(nodes: SysMenu[], depth: number): number[] {
  const keys: number[] = [];
  const walk = (arr: SysMenu[], level: number) => {
    if (level > depth) return;
    arr.forEach((n) => {
      if (n.sysMenuId != null) keys.push(n.sysMenuId);
      if (n.children?.length) walk(n.children, level + 1);
    });
  };
  walk(nodes, 1);
  return keys;
}

/** 叶子节点键（无 children 的节点） */
function collectLeafKeys(nodes: SysMenu[]): number[] {
  const keys: number[] = [];
  const walk = (arr: SysMenu[]) => {
    arr.forEach((n) => {
      if (n.children?.length) walk(n.children);
      else if (n.sysMenuId != null) keys.push(n.sysMenuId);
    });
  };
  walk(nodes);
  return keys;
}

/** 节点总数（含按钮），用于「已选 N / 共 M」 */
const totalMenuCount = computed(() => collectAllKeys(menuTree.value).length);

/** 节点类型文案：3 按钮、1 iframe、2 外链，其余按结构区分目录/菜单（与后端 directoryIds、菜单管理同一规则） */
function menuTypeOf(node: SysMenu): string {
  if (node.sysMenuType === 3) return "按钮";
  if (node.sysMenuType === 1) return "iframe";
  if (node.sysMenuType === 2) return "外链";
  return node.children?.some((child) => child.sysMenuType !== 3 && child.sysMenuRemind !== 1) ? "目录" : "菜单";
}

function menuTypeTag(node: SysMenu): "info" | "primary" | "warning" {
  if (node.sysMenuType === 3) return "warning";
  return menuTypeOf(node) === "目录" ? "info" : "primary";
}

/** 全选当前过滤结果 */
function handleCheckAllMenu() {
  menuTreeRef.value?.setCheckedKeys(collectAllKeys(filteredMenuTree.value));
  onMenuCheck();
}

/** 反选当前过滤结果 */
function handleInvertMenu() {
  const current = new Set((menuTreeRef.value?.getCheckedKeys() ?? []) as number[]);
  menuTreeRef.value?.setCheckedKeys(collectAllKeys(filteredMenuTree.value).filter((k) => !current.has(k)));
  onMenuCheck();
}

/** 搜索时自动展开命中分支，清空后回到默认层级 */
watch(permSearchText, () => {
  permTreeExpanded.value = permSearchText.value.trim()
    ? collectAllKeys(filteredMenuTree.value)
    : collectKeysToDepth(menuTree.value, 2);
});

async function openPermDialog(row: SysRole | Record<string, unknown>) {
  const role = row as unknown as SysRole;
  currentRole.value = role;
  permVisible.value = true;
  permSearchText.value = "";
  permTreeExpanded.value = [];
  activePermTab.value = "menu";
  // 初始化数据权限
  dataScope.value = role.sysRoleDataScope ?? 1;
  checkedDeptIds.value = role.sysRoleDataScopeDeptIds
    ? role.sysRoleDataScopeDeptIds.split(",").map(Number).filter(Boolean)
    : [];
  try {
    const [menuRes, checkedRes, deptRes] = await Promise.all([
      listMenuTree(),
      getRoleMenu(role.sysRoleId!),
      listDept(),
    ]);
    menuTree.value = (menuRes?.data ?? []) as SysMenu[];
    // 后端存的是「勾选节点 + 半选父链」，只回填叶子键：
    // 把半选父级直接交给 el-tree 会被级联成全选，连带勾上它未授权的兄弟菜单
    const saved = new Set((checkedRes?.data ?? []) as number[]);
    checkedMenuIds.value = collectLeafKeys(menuTree.value).filter((k) => saved.has(k));
    deptTree.value = (deptRes?.data ?? []) as SysDept[];
    permTreeExpanded.value = collectKeysToDepth(menuTree.value, 2);
    await nextTick();
    onMenuCheck();
  } catch (e) {
    message.error((e as Error)?.message ?? "权限加载失败");
  }
}

async function handleSavePerm() {
  if (!currentRole.value) return;
  permSaving.value = true;
  try {
    const checked = (menuTreeRef.value?.getCheckedKeys() ?? []) as number[];
    // 半选的父级目录/菜单必须一起保存，否则子节点因缺少父链而无法渲染
    const halfChecked = (menuTreeRef.value?.getHalfCheckedKeys() ?? []) as number[];
    // 保存菜单权限
    await updateRoleMenu({ roleId: currentRole.value.sysRoleId, menuId: [...checked, ...halfChecked] });
    // 保存数据权限（走专用接口：只写数据权限两列，管理员即可调整，系统内置角色同样适用）
    const customDeptIds =
      dataScope.value === 5
        ? ((deptTreeRef.value?.getCheckedKeys() as number[]) ?? []).join(",")
        : "";
    await updateRoleDataScope({
      sysRoleId: currentRole.value.sysRoleId,
      sysRoleDataScope: dataScope.value,
      sysRoleDataScopeDeptIds: customDeptIds,
    });
    message.success("权限已更新");
    permVisible.value = false;
    refreshAll();
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    permSaving.value = false;
  }
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/* ================== 角色复制 ================== */
function handleCopy(row: SysRole | Record<string, unknown>) {
  const role = row as unknown as SysRole;
  isEdit.value = false;
  copyFromRoleId.value = role.sysRoleId ?? null;
  // 复制原角色信息，但不带 ID，名称追加 _副本，编码清空由用户填写
  const { sysRoleId, ...rest } = role;
  form.value = {
    ...rest,
    sysRoleName: `${role.sysRoleName ?? ""}_副本`,
    sysRoleCode: "",
  };
  dialogVisible.value = true;
}

/* ================== 角色用户列表 ================== */
const usersDrawerVisible = ref(false);
const usersLoading = ref(false);
const roleUsers = ref<SysUser[]>([]);
const currentRoleName = ref("");

async function openRoleUsers(row: SysRole | Record<string, unknown>) {
  const role = row as unknown as SysRole;
  currentRoleName.value = role.sysRoleName ?? "";
  usersDrawerVisible.value = true;
  usersLoading.value = true;
  try {
    const res = await pageForUser({ page: 1, pageSize: 200, sysRoleId: role.sysRoleId });
    roleUsers.value = (res?.data?.data ?? []) as SysUser[];
  } catch (e) {
    message.error((e as Error)?.message ?? "角色用户加载失败");
    roleUsers.value = [];
  } finally {
    usersLoading.value = false;
  }
}

/* ================== 指挥台：授权态势（真实数据，不造样例） ================== */
/**
 * 口径：
 *  - 星图节点 = 角色（快照取角色分页的前 60 个），节点权重 = 该角色已授权菜单数，
 *    按数据范围聚簇；星图常驻在右侧栏，点节点弹 ReDialog 看角色档案；
 *  - 轨道环 = 已选角色在各一级菜单目录下的授权覆盖率（弧长 = 覆盖比例），
 *    常驻在右侧角色详情下方；
 *
 * 态势数据失败只降级为「暂无可展示」，不影响主列表的增删改查。
 */
interface MenuDir {
  key: string;
  label: string;
  ids: number[];
  total: number;
}

/** 授权态势快照（角色分页大页 + 菜单树 + 逐角色菜单 ID） */
const rolesForChart = ref<SysRole[]>([]);
const menuTreeAll = ref<SysMenu[]>([]);
const roleMenuIds = ref<Record<number, number[]>>({});
const analyticsLoading = ref(false);
/** 已选角色 ID；角色详情、轨道、星图高亮共用这一份 */
const selectedRoleId = ref<number | null>(null);
/** 来自列表行的角色（可能不在快照内，如被筛选后翻页） */
const roleCache = ref<Record<number, SysRole>>({});

/** 可授权项：非按钮、非「只注册路由」的菜单节点 */
function collectGrantableIds(nodes: SysMenu[], acc: number[] = []): number[] {
  nodes.forEach((node) => {
    if (node.sysMenuId != null && node.sysMenuType !== 3 && node.sysMenuRemind !== 1) {
      acc.push(node.sysMenuId);
    }
    if (node.children?.length) collectGrantableIds(node.children, acc);
  });
  return acc;
}

/** 一级菜单目录：菜单树的根节点，列宽 = 该目录下可授权项总数 */
const menuDirs = computed<MenuDir[]>(() =>
  menuTreeAll.value
    .filter((node) => node.sysMenuType !== 3 && node.sysMenuRemind !== 1 && node.sysMenuId != null)
    .map((node) => {
      const ids = collectGrantableIds([node]);
      return {
        key: String(node.sysMenuId),
        label: node.sysMenuTitle || node.sysMenuName || "未命名目录",
        ids,
        total: ids.length,
      };
    })
    .filter((dir) => dir.total > 0),
);

const EMPTY_ID_SET: ReadonlySet<number> = new Set<number>();

/** 全部可授权菜单（所有一级目录的并集），用于覆盖率分母 */
const menuUniverse = computed<ReadonlySet<number>>(() => {
  const set = new Set<number>();
  menuDirs.value.forEach((dir) => dir.ids.forEach((id) => set.add(id)));
  return set;
});

/** 角色 → 已授权菜单集合（只保留可授权项，滤掉半选父链里的非可授权节点） */
const roleAuthSets = computed<Map<number, Set<number>>>(() => {
  const universe = menuUniverse.value;
  const map = new Map<number, Set<number>>();
  Object.entries(roleMenuIds.value).forEach(([id, ids]) => {
    map.set(Number(id), new Set(ids.filter((menuId) => universe.has(menuId))));
  });
  return map;
});

function authSetOf(role: SysRole | null): ReadonlySet<number> {
  if (role?.sysRoleId == null) return EMPTY_ID_SET;
  return roleAuthSets.value.get(role.sysRoleId) ?? EMPTY_ID_SET;
}

function authorizedCount(role: SysRole | null): number {
  return authSetOf(role).size;
}

function dirHitCount(role: SysRole | null, dir: MenuDir): number {
  const set = authSetOf(role);
  return dir.ids.reduce((sum, id) => (set.has(id) ? sum + 1 : sum), 0);
}

const scopeMeta = [
  { key: "scope-all", label: "全部数据", short: "全部" },
  { key: "scope-dept", label: "本部门数据", short: "本部门" },
  { key: "scope-child", label: "本部门及以下", short: "本部门及以下" },
  { key: "scope-self", label: "仅本人数据", short: "仅本人" },
  { key: "scope-custom", label: "自定义部门", short: "自定义" },
];

function scopeOf(role: SysRole | null) {
  const index = Math.min(scopeMeta.length, Math.max(1, role?.sysRoleDataScope ?? 1)) - 1;
  return scopeMeta[index];
}

/** 顶部 KPI：总数 / 启用 / 菜单覆盖 / 平均覆盖率 */
const stats = computed(() => {
  const roles = rolesForChart.value;
  const universe = menuUniverse.value;
  const covered = new Set<number>();
  let ratioSum = 0;
  roles.forEach((role) => {
    const set = authSetOf(role);
    set.forEach((id) => covered.add(id));
    ratioSum += universe.size ? set.size / universe.size : 0;
  });
  return {
    total: roles.length,
    enabled: roles.filter((role) => role.sysRoleStatus === 1).length,
    builtin: roles.filter((role) => role.sysRoleInSystem === 1).length,
    readonly: roles.filter((role) => role.sysRoleReadonly === 1).length,
    coveredMenus: covered.size,
    totalMenus: universe.size,
    avgCoverage: roles.length ? Math.round((ratioSum / roles.length) * 100) : 0,
  };
});

const kpis = computed(() => [
  {
    key: "total",
    label: "角色总数",
    value: String(stats.value.total),
    hint: `${stats.value.enabled} 个启用`,
    fill: stats.value.total ? Math.round((stats.value.enabled / stats.value.total) * 100) : 0,
  },
  {
    key: "menus",
    label: "已覆盖菜单",
    value: String(stats.value.coveredMenus),
    hint: `共 ${stats.value.totalMenus} 项可授权`,
    fill: stats.value.totalMenus
      ? Math.round((stats.value.coveredMenus / stats.value.totalMenus) * 100)
      : 0,
  },
  {
    key: "coverage",
    label: "平均覆盖率",
    value: `${stats.value.avgCoverage}%`,
    hint: "按角色授权菜单占比均值",
    fill: stats.value.avgCoverage,
  },
  {
    key: "protect",
    label: "内置 / 只读",
    value: `${stats.value.builtin} / ${stats.value.readonly}`,
    hint: "内置角色不可删除",
    fill: stats.value.total
      ? Math.round(((stats.value.builtin + stats.value.readonly) / stats.value.total) * 100)
      : 0,
  },
]);

/** 当前选中的角色：优先列表行对象，其次态势快照 */
const selectedRole = computed<SysRole | null>(() => {
  const id = selectedRoleId.value;
  if (id == null) return null;
  return roleCache.value[id] ?? rolesForChart.value.find((role) => role.sysRoleId === id) ?? null;
});

/** 图表聚焦角色：详情选中的角色必须在快照内，否则回落到快照第一个 */
const chartRole = computed<SysRole | null>(() => {
  const id = selectedRoleId.value;
  return rolesForChart.value.find((role) => role.sysRoleId === id) ?? rolesForChart.value[0] ?? null;
});

const sideAuthCount = computed(() => authorizedCount(selectedRole.value));
const sideCoverage = computed(() => {
  const total = stats.value.totalMenus;
  return total ? Math.round((sideAuthCount.value / total) * 100) : 0;
});

/** 星图：角色为星、数据范围为簇、已授权菜单数为权重 */
const atlasData = computed<ReChartAtlasData>(() => ({
  groups: scopeMeta.map((scope) => ({ key: scope.key, label: scope.label })),
  nodes: rolesForChart.value.map((role) => ({
    id: String(role.sysRoleId),
    label: role.sysRoleName || "未命名角色",
    detail: role.sysRoleCode,
    kind: scopeOf(role).key,
    weight: authorizedCount(role),
    state:
      role.sysRoleStatus !== 1 ? "off" : role.sysRoleReadonly === 1 ? "readonly" : "active",
    meta: [scopeOf(role).short],
  })),
  note: `共 ${rolesForChart.value.length} 个角色 · 节点大小 = 已授权菜单数`,
}));

/** 轨道：已选角色在各级目录下的覆盖率 */
const orbitData = computed<ReChartOrbitData>(() => {
  const role = chartRole.value;
  return {
    center: {
      label: role?.sysRoleName || "未选择角色",
      detail: role?.sysRoleCode,
      caption: role ? `${authorizedCount(role)} / ${stats.value.totalMenus} 项授权` : undefined,
    },
    rings: menuDirs.value.map((dir) => {
      const hit = dirHitCount(role, dir);
      return {
        key: dir.key,
        label: dir.label,
        percent: dir.total ? Math.round((hit / dir.total) * 100) : 0,
        value: `${hit} / ${dir.total}`,
      };
    }),
    note: role ? `数据范围：${scopeOf(role).label}` : "在左侧选中角色后查看其权限覆盖",
  };
});

/** 星图弹窗：从工具栏按钮打开，缩放控件在星图内部（AtlasChart 的 zoomable） */
const atlasDialogVisible = ref(false);

function openAtlasDialog() {
  atlasDialogVisible.value = true;
}

/** 星图节点点击：联动右侧详情（弹窗里点完顺手收起） */
function onAtlasSelect(payload: ReChartSelectPayload) {
  if (payload.id == null) return;
  const roleId = Number(payload.id);
  if (!Number.isFinite(roleId)) return;
  selectRole(roleId);
}

function onDialogAtlasSelect(payload: ReChartSelectPayload) {
  onAtlasSelect(payload);
  atlasDialogVisible.value = false;
}

function selectRole(id: number | string) {
  const roleId = Number(id);
  if (!Number.isFinite(roleId)) return;
  selectedRoleId.value = roleId;
}

function onRowClick(row: Record<string, unknown>) {
  const role = row as unknown as SysRole;
  if (role?.sysRoleId != null) {
    roleCache.value[role.sysRoleId] = role;
    selectRole(role.sysRoleId);
  }
}

function deckRowClass({ row }: { row: Record<string, unknown> }): string {
  const role = row as unknown as SysRole;
  return role?.sysRoleId != null && role.sysRoleId === selectedRoleId.value ? "is-picked" : "";
}

/** 逐角色拉菜单：控制并发，避免一次性打 60 个请求被网关限流 */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

/** 授权态势快照：角色大页 + 菜单树 + 逐角色菜单 ID（并发拉取，失败只降级） */
async function loadAnalytics() {
  analyticsLoading.value = true;
  try {
    const [roleRes, menuRes] = await Promise.all([
      pageForRole({ page: 1, pageSize: 200 }),
      listMenuTree(),
    ]);
    // 逐角色取菜单是多请求，快照最多取前 60 个角色，KPI 与图形口径保持一致
    const roles = ((roleRes?.data?.data ?? []) as SysRole[]).slice(0, 60);
    menuTreeAll.value = (menuRes?.data ?? []) as SysMenu[];
    rolesForChart.value = roles;
    const ids = roles
      .map((role) => role.sysRoleId)
      .filter((id): id is number => typeof id === "number");
    const menus = await mapLimit(ids, 6, (id) =>
      getRoleMenu(id)
        .then((res) => (res?.data ?? []) as number[])
        .catch(() => [] as number[]),
    );
    const next: Record<number, number[]> = {};
    ids.forEach((id, index) => {
      next[id] = menus[index] ?? [];
    });
    roleMenuIds.value = next;
    if (selectedRoleId.value == null && ids.length) selectedRoleId.value = ids[0];
  } catch {
    // 态势数据失败不影响主列表；图表各自回落空态
  } finally {
    analyticsLoading.value = false;
  }
}

/** 列表与态势一起刷新（增删改 / 分配权限后保持两处一致） */
function refreshAll() {
  tableRef.value?.reload?.();
  void loadAnalytics();
}

/**
 * 清单列。
 *
 * <p>指挥台的作业区只有 ~660px（右侧常驻详情占了近三分之一），8 列全铺会
 * 让 fixed-right 操作列盖住「系统 / 备注 / 创建时间」，且横向滚动条落在
 * 卡片外看不见。故清单只留「身份 + 状态 + 操作」四列，其余档案字段
 * （排序 / 系统 / 备注 / 创建时间）统一由右侧详情承担 —— 表格是索引，
 * 详情才是档案例。</p>
 *
 * <p>操作列 5 枚方块按钮（分配权限 / 编辑 / 复制 / 用户 / 删除）实测需要
 * 240px，且不留 fixed 也能整列可见，因此不再 fixed。</p>
 */
const columns: ReTableColumn[] = [
  { prop: "sysRoleName", label: "角色名称", minWidth: 170, slot: "roleName" },
  { prop: "sysRoleCode", label: "角色编码", minWidth: 132, showOverflowTooltip: true },
  { prop: "sysRoleStatus", label: "状态", width: 96, slot: "status", align: "center" },
  { prop: "action", label: "操作", width: 234, slot: "action" },
];

/**
 * 角色用户抽屉里的用户列表列（原模板里的 5 个 el-table-column 收敛到这里）。
 *
 * <p>序号列（原 {@code type="index"} label="#" width="60}）由 ReTable 的
 * {@code show-index} 提供，不进列数组；标题均为字面量，用普通常量即可。</p>
 */
const roleUserColumns: ReTableColumn[] = [
  { prop: "sysUserUsername", label: "账号", minWidth: 130, showOverflowTooltip: true },
  { prop: "sysUserNickname", label: "昵称", minWidth: 120, showOverflowTooltip: true },
  { prop: "sysUserPhone", label: "手机号", minWidth: 130 },
  { prop: "status", label: "状态", width: 80, align: "center", slot: "status" },
];

onMounted(() => {
  tableRef.value?.reload();
  void loadAnalytics();
});
</script>

<template>
  <div class="role-deck">
    <section class="deck-kpis" aria-label="角色概览">
      <article v-for="kpi in kpis" :key="kpi.key" class="deck-kpi">
        <span class="deck-kpi__label">{{ kpi.label }}</span>
        <strong class="deck-kpi__value">{{ kpi.value }}</strong>
        <span class="deck-kpi__hint">{{ kpi.hint }}</span>
        <span class="deck-kpi__meter"><i :style="{ width: kpi.fill + '%' }" /></span>
      </article>
    </section>

    <div class="deck-main">
      <section class="deck-work">
        <ReTable
          ref="tableRef"
          table-id="system-role"
          :loader="loadRoles"
          :columns="columns"
          :pagination="true"
          :params="query"
          row-key="sysRoleId"
          v-model:page="query.page"
          v-model:page-size="query.pageSize"
          :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
          v-model:search-visible="searchVisible"
          :search-gap="16"
          v-model:search-model="query"
          :row-class-name="deckRowClass"
          @row-click="onRowClick"
          @search-reset="handleReset"
        >
          <template #toolbar>
            <!-- 工具栏左侧：只留图标 + tip，把横向空间让给表格内容 -->
            <ReButton layout="square" icon="Share" tip="授权星图" @click="openAtlasDialog" />
            <ReButton layout="square" type="primary" icon="Plus" tip="新增角色" @click="handleAdd" />
          </template>
          <!-- A：可操作空态。ReTable 未提供 #empty 时会回落到原生 el-empty，这里提供时接管 -->
          <template #empty>
            <div class="page-empty">
              <span class="page-empty__icon">
                <ReIcon name="UserFilled" size="22" />
              </span>
              <span class="page-empty__title">还没有角色</span>
              <span class="page-empty__desc">角色把「菜单权限 + 数据范围」打包后授予用户，是权限体系的最小单元。</span>
              <span class="page-empty__actions">
                <ReButton type="primary" icon="Plus" @click="handleAdd">新增角色</ReButton>
                <!-- 复用已有 handleReset（清空筛选 + 回到第一页重新拉取），不新增函数 -->
                <ReButton icon="Refresh" @click="handleReset">重置筛选</ReButton>
              </span>
            </div>
          </template>
          <template #roleName="{ row }">
            <div class="flex items-center gap-2">
              <el-icon :size="16" color="var(--el-color-primary)"><UserFilled /></el-icon>
              <span>{{ row.sysRoleName }}</span>
              <ReTag v-if="row.sysRoleInSystem === 1" type="warning" effect="plain" >内置</ReTag>
              <ReTag v-if="row.sysRoleReadonly === 1" type="info" effect="plain" >只读</ReTag>
            </div>
          </template>
          <template #status="{ row }">
            <!-- 内置角色不允许显示切换按钮（连 disabled 状态也不显示，避免误操作） -->
            <!-- B：状态标签统一为 plain + dot（内置角色恒为启用，故用 success 点亮） -->
            <ReTag v-if="row.sysRoleInSystem === 1" type="success" effect="plain" dot>已启用</ReTag>
            <el-switch
              v-else
              :model-value="row.sysRoleStatus === 1"
              @update:model-value="() => handleStatus(row)"
            />
          </template>
          <template #action="{ row }">
            <div class="flex items-center gap-2">
              <ReButton layout="square" type="primary" icon="Key" tip="分配权限" @click="openPermDialog(row)" />
              <ReButton layout="square" type="primary" icon="Edit" tip="编辑" @click="handleEdit(row)" />
              <ReButton layout="square" type="success" icon="DocumentCopy" tip="复制" @click="handleCopy(row)" />
              <ReButton layout="square" type="info" icon="User" tip="用户" @click="openRoleUsers(row)" />
              <ReButton v-if="row.sysRoleInSystem !== 1" layout="square" type="danger" icon="Delete" tip="删除" @click="handleDelete(row)" />
            </div>
          </template>
        </ReTable>
      </section>

      <aside class="deck-side" aria-label="角色详情与授权态势">
        <section class="deck-side__card">
          <template v-if="selectedRole">
            <div class="deck-side__head">
              <div class="deck-side__title">
                <span
                  class="deck-side__dot"
                  :class="selectedRole.sysRoleStatus === 1 ? 'is-on' : 'is-off'"
                  aria-hidden="true"
                />
                <span class="deck-side__name">{{ selectedRole.sysRoleName || "未命名角色" }}</span>
              </div>
              <code class="deck-side__code">{{ selectedRole.sysRoleCode || "-" }}</code>
              <div class="deck-side__tags">
                <ReTag v-if="selectedRole.sysRoleInSystem === 1" type="warning" effect="plain">内置</ReTag>
                <ReTag v-if="selectedRole.sysRoleReadonly === 1" type="info" effect="plain">只读</ReTag>
                <ReTag v-if="selectedRole.sysRoleStatus !== 1" type="danger" effect="plain">已停用</ReTag>
              </div>
            </div>

            <dl class="deck-side__facts">
              <div>
                <dt>数据范围</dt>
                <dd>{{ scopeOf(selectedRole).label }}</dd>
              </div>
              <div>
                <dt>已授权菜单</dt>
                <dd>{{ sideAuthCount }}<small> / {{ stats.totalMenus }}</small></dd>
              </div>
              <div>
                <dt>覆盖率</dt>
                <dd>{{ sideCoverage }}<small>%</small></dd>
              </div>
              <div>
                <dt>排序</dt>
                <dd>{{ selectedRole.sysRoleSort ?? 0 }}</dd>
              </div>
              <div v-if="selectedRole.createTime">
                <dt>创建时间</dt>
                <dd class="is-time">{{ selectedRole.createTime }}</dd>
              </div>
              <div v-if="selectedRole.sysRoleRemark" class="is-wide">
                <dt>备注</dt>
                <dd>{{ selectedRole.sysRoleRemark }}</dd>
              </div>
            </dl>

            <!-- 轨道常驻在详情下方：环长 = 该角色在一级目录下的覆盖率 -->
            <div class="deck-side__orbit">
              <div class="deck-side__orbit-head">
                <span class="deck-side__orbit-title">权限轨道</span>
                <span class="deck-side__orbit-hint">环长 = 目录覆盖率</span>
              </div>
              <ReChart type="orbit" :orbit="orbitData" />
            </div>

            <div class="deck-side__actions">
              <ReButton layout="square" type="primary" icon="Key" tip="分配权限" @click="openPermDialog(selectedRole)" />
              <ReButton layout="square" icon="Edit" tip="编辑" @click="handleEdit(selectedRole)" />
              <ReButton layout="square" icon="User" tip="用户" @click="openRoleUsers(selectedRole)" />
            </div>
          </template>

          <div v-else class="deck-side__placeholder">
            <ReIcon name="UserFilled" size="22" />
            <span>点击左侧任意角色查看授权详情</span>
          </div>
        </section>
      </aside>
    </div>

    <!-- 授权星图：工具栏入口打开大图，缩放控件在星图内部 -->
    <ReDialog
      v-model="atlasDialogVisible"
      title="授权星图"
      width="880"
      layout="modern"
      compact
      destroy-on-close
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <div class="atlas-dialog">
        <p class="atlas-dialog__hint">节点大小 = 已授权菜单数，颜色 = 覆盖率；点击节点选中该角色</p>
        <div class="atlas-dialog__canvas">
          <ReChart
            v-if="rolesForChart.length"
            type="atlas"
            height="100%"
            :zoomable="true"
            :atlas="atlasData"
            @select="onDialogAtlasSelect"
          />
          <div v-else class="atlas-dialog__empty">暂无授权态势数据</div>
        </div>
      </div>
    </ReDialog>

    <!-- 角色编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :footer-hidden="false" @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="角色名称" required>
          <ReInput layout="modern" v-model="form.sysRoleName" placeholder="如：内容管理员" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <ReInput layout="modern" v-model="form.sysRoleCode" placeholder="如：content_admin" :disabled="isEdit" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysRoleSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="form.sysRoleStatus" :options="roleStatusOptions" />
        </el-form-item>
        <el-form-item label="只读角色">
          <el-segmented v-model="form.sysRoleReadonly" :options="[
            { label: '普通角色', value: 0 },
            { label: '只读角色', value: 1 }
          ]" />
          <span v-if="form.sysRoleReadonly === 1" class="readonly-switch__tip">只读角色无法执行任何新增/修改/删除操作</span>
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysRoleRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 分配权限弹窗（菜单权限 + 数据权限） -->
    <ReDialog
      v-model="permVisible"
      :title="`分配权限 - ${currentRole?.sysRoleName ?? ''}`"
      width="760"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="permSaving"
      :footer-hidden="false" @ok="handleSavePerm"
    >
      <el-tabs v-model="activePermTab" class="perm-tabs">
        <!-- 菜单权限 Tab -->
        <el-tab-pane label="菜单权限" name="menu">
          <div class="perm-toolbar">
            <ReInput
              layout="modern"
              v-model="permSearchText"
              placeholder="搜索菜单标题 / 路由名 / 路径"
              clearable
              class="flex-1"
            />
            <el-button-group class="perm-toolbar__ops">
              <el-button  :icon="ArrowDown" @click="expandAllPermTree">展开</el-button>
              <el-button  :icon="ArrowUp" @click="collapsePermTree">收起</el-button>
            </el-button-group>
            <el-button-group class="perm-toolbar__ops">
              <el-button  :icon="Select" @click="handleCheckAllMenu">全选</el-button>
              <el-button  :icon="RefreshLeft" @click="handleInvertMenu">反选</el-button>
            </el-button-group>
            <el-button  type="danger" plain :icon="Delete" @click="handleClearMenu">清空</el-button>
          </div>
          <div class="perm-summary">
            <span class="checked-count">已选 <b>{{ checkedCount }}</b> / 共 {{ totalMenuCount }} 项</span>
            <el-progress
              class="perm-summary__bar"
              :percentage="totalMenuCount ? Math.round((checkedCount / totalMenuCount) * 100) : 0"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
          <el-scrollbar max-height="420px">
            <el-tree
              ref="menuTreeRef"
              :data="filteredMenuTree"
              :props="{ label: 'sysMenuTitle', children: 'children' }"
              node-key="sysMenuId"
              show-checkbox
              :default-checked-keys="checkedMenuIds"
              :default-expanded-keys="permTreeExpanded"
              :expand-on-click-node="false"
              class="perm-tree"
              @check="onMenuCheck"
            >
              <template #default="{ data }">
                <div class="perm-node">
                  <ReIcon v-if="data.sysMenuIcon" :name="data.sysMenuIcon" :size="14" class="perm-node__icon" />
                  <span class="perm-node__title">{{ data.sysMenuTitle }}</span>
                  <ReTag :type="menuTypeTag(data)" effect="plain" >
                    {{ menuTypeOf(data) }}
                  </ReTag>
                  <code v-if="data.sysMenuPerm" class="perm-node__perm">{{ data.sysMenuPerm }}</code>
                  <span v-if="data.children?.length" class="perm-node__count">{{ data.children.length }}</span>
                </div>
              </template>
            </el-tree>
            <el-empty v-if="!filteredMenuTree.length" description="没有匹配的菜单" :image-size="60" />
          </el-scrollbar>
        </el-tab-pane>

        <!-- 数据权限 Tab -->
        <el-tab-pane label="数据权限" name="data">
          <!-- 说明条 -->
          <div class="data-scope-tip">
            <span class="data-scope-tip__icon">
              <el-icon><InfoFilled /></el-icon>
            </span>
            <p class="data-scope-tip__text">
              数据权限控制该角色用户可查看哪些部门的用户数据，取该用户所有角色中最宽松的配置。超级管理员不受限制。
            </p>
          </div>

          <!-- 权限卡片（3 列单选） -->
          <div class="data-scope-cards">
            <label
              v-for="opt in dataScopeOptions"
              :key="opt.value"
              class="data-scope-card"
              :class="{ 'is-active': dataScope === opt.value }"
            >
              <input
                v-model="dataScope"
                class="data-scope-card__radio"
                type="radio"
                :value="opt.value"
              />
              <span class="data-scope-card__head">
                <span class="data-scope-card__dot">
                  <el-icon v-if="dataScope === opt.value" :size="12"><Check /></el-icon>
                </span>
                <span class="data-scope-card__label">{{ opt.label }}</span>
              </span>
              <span class="data-scope-card__desc">{{ opt.desc }}</span>
            </label>
          </div>

          <!-- 自定义部门选择 -->
          <div v-if="dataScope === 5" class="custom-dept">
            <div class="custom-dept__title">选择可访问的部门（含子部门）</div>
            <el-scrollbar max-height="280px" class="custom-dept__tree">
              <el-tree
                ref="deptTreeRef"
                :data="deptTree"
                :props="{ label: 'sysDeptName', children: 'children' }"
                node-key="sysDeptId"
                show-checkbox
                :default-checked-keys="checkedDeptIds"
                :expand-on-click-node="false"
              />
            </el-scrollbar>
          </div>
        </el-tab-pane>
      </el-tabs>
    </ReDialog>

    <!-- 角色用户列表抽屉 -->
    <ReDrawer
      v-model="usersDrawerVisible"
      :title="`拥有该角色的用户 - ${currentRoleName}`"
      size="520"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content>
        <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
             边框/斑马纹样式；pagination=false / toolbar=false —— 无分页、不新增工具栏按钮；
             原 el-table 的 border 走 ReTable 默认（border: true），stripe 走同名 prop；
             type="index" 列换成 show-index（表头 # / 宽 60 / 居中与 ReTable 默认一致）。 -->
        <ReTable
          :loading="usersLoading"
          :data="roleUsers"
          :columns="roleUserColumns"
          engine="element"
          :pagination="false"
          :toolbar="false"
          :layout-table="{ minHeight: 0 }"
          stripe
          show-index
          style="width: 100%"
        >
          <template #col-status="{ row }">
            <!-- B：抽屉里的用户状态同样统一为 ReTag + plain + dot（成功=success，禁用=danger） -->
            <ReTag :type="row.sysUserStatus === 1 ? 'success' : 'danger'" effect="plain" dot>
              {{ row.sysUserStatus === 1 ? '启用' : '禁用' }}
            </ReTag>
          </template>
        </ReTable>
        <p class="mt-3 text-sm text-[--el-text-color-secondary]">共 {{ roleUsers.length }} 个用户</p>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.role-deck {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 0;
  color: var(--text-primary);
}

/* ==================== 指挥台：KPI ==================== */
.deck-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.deck-kpi {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px 15px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-container);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.deck-kpi__label {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}
.deck-kpi__value {
  font-size: 24px;
  font-weight: 650;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.deck-kpi__hint {
  font-size: 11px;
  color: var(--text-secondary);
}
.deck-kpi__meter {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--bg-fill);
}
.deck-kpi__meter i {
  display: block;
  height: 100%;
  background: var(--brand-500);
  transition: width 0.35s ease;
}

/* ==================== 指挥台：主区 ==================== */
.deck-main {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  /* 左：表格；右：角色详情（星图在工具栏弹窗里） */
  grid-template-columns: minmax(0, 1fr) 300px;
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}
.deck-work {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

/* 列表选中行（ReTable 的行在组件内部，需 :deep 穿透） */
:deep(.el-table__row.is-picked > td) {
  background: var(--brand-50);
}
:deep(.vxe-body--row.is-picked) {
  background: var(--brand-50);
}

/* ==================== 指挥台：右侧角色详情 ==================== */
.deck-side {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.deck-side__card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-container);
  box-shadow: var(--shadow-sm);
}
.deck-side__head {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.deck-side__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.deck-side__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.deck-side__dot.is-on {
  background: var(--status-success);
}
.deck-side__dot.is-off {
  background: var(--status-error);
}
.deck-side__name {
  font-size: 15px;
  font-weight: 650;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.deck-side__code {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}
.deck-side__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.deck-side__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.deck-side__facts > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.deck-side__facts > div.is-wide {
  grid-column: 1 / -1;
}
.deck-side__facts dt {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}
.deck-side__facts dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.deck-side__facts dd small {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary);
}
/* 创建时间是长数字串，按 13px 粗体会把两列网格挤到换行，单独降档 */
.deck-side__facts dd.is-time {
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}
/* 轨道：常驻详情下方，用同一套 koi 令牌，不另起皮肤 */
.deck-side__orbit {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
  min-height: 0;
  overflow: hidden;
}
.deck-side__orbit-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.deck-side__orbit-title {
  font-size: 11px;
  font-weight: 650;
  color: var(--text-primary);
}
.deck-side__orbit-hint {
  font-size: 10px;
  color: var(--text-tertiary);
}
/* 侧栏只有 300px：画布收到 140px、图例压成两列，详情 + 轨道一屏放下且不出滚动条 */
.deck-side__orbit :deep(.re-chart-orbit) {
  min-height: 0;
  gap: 4px;
}
.deck-side__orbit :deep(.re-chart-orbit__body) {
  gap: 4px;
}
.deck-side__orbit :deep(.re-chart-orbit__stage) {
  width: 130px;
  min-width: 0;
  margin: 0;
}
/* 圆心只留角色名；编码与总数在上面档案区已有，这里再放会压到内环 */
.deck-side__orbit :deep(.re-chart-orbit__center-detail),
.deck-side__orbit :deep(.re-chart-orbit__center-caption) {
  display: none;
}
.deck-side__orbit :deep(.re-chart-orbit__center-label) {
  font-size: 10.5px;
}
.deck-side__orbit :deep(.re-chart-orbit__legend) {
  min-width: 0;
  max-width: none;
  flex: 1 1 0;
  gap: 2px;
}
.deck-side__orbit :deep(.re-chart-orbit__item) {
  gap: 5px;
  padding: 2px 4px;
}
.deck-side__orbit :deep(.re-chart-orbit__dot) {
  width: 6px;
  height: 6px;
}
.deck-side__orbit :deep(.re-chart-orbit__name) {
  font-size: 10.5px;
}
.deck-side__orbit :deep(.re-chart-orbit__desc),
.deck-side__orbit :deep(.re-chart-orbit__num span) {
  display: none;
}
.deck-side__orbit :deep(.re-chart-orbit__num b) {
  font-size: 11px;
}
/* 数据范围一行在档案区已有，底部说明不再重复 */
.deck-side__orbit :deep(.re-chart-orbit__note) {
  display: none;
}
.deck-side__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  /* 详情卡吃满高度：操作按钮沉到底部 */
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.deck-side__placeholder {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 200px;
  font-size: 12px;
  text-align: center;
  color: var(--text-tertiary);
}

/* 星图弹窗：一句说明 + 固定高度画布（缩放控件在图内） */
.atlas-dialog {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.atlas-dialog__hint {
  margin: 0;
  font-size: 11px;
  color: var(--text-tertiary);
}
.atlas-dialog__canvas {
  display: flex;
  flex-direction: column;
  height: 520px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-container);
}
.atlas-dialog__canvas :deep(.re-chart) {
  flex: 1 1 auto;
  min-height: 0;
}
.atlas-dialog__empty {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

@media (max-width: 1180px) {
  .deck-main {
    grid-template-columns: minmax(0, 1fr);
    /* 窄屏单列：右侧栏落到表格下方，按内容高度走 */
    grid-template-rows: auto;
  }
  .atlas-dialog__canvas {
    height: 420px;
  }
}
@media (max-width: 820px) {
  .deck-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .deck-kpi__meter i {
    transition: none;
  }
}

/* 表格外壳（1px 描边 / 卡片圆角 / 卡片投影 / focus-within 转主色）
   由 ReTable 插件自身提供，本页不再覆盖：
   见 packages/ui ReTable/shared/table-vars.css 与 ReTable.vue 的
   `.re-table` / `.re-table--separated` 规则。 */

.perm-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.checked-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  b {
    color: var(--el-color-primary);
    font-weight: 600;
  }
}

.perm-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  &__bar {
    flex: 1;
    min-width: 60px;
  }
}

.perm-toolbar__ops {
  flex-shrink: 0;
}

.perm-node {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;

  &__icon {
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  &__title {
    flex-shrink: 0;
  }

  &__perm {
    font-family: var(--el-font-family-mono, ui-monospace, monospace);
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-light);
    border-radius: var(--el-radius-xs, 4px);
    padding: 0 5px;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__count {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-md, 8px);
    padding: 0 6px;
    line-height: 16px;
  }
}

.perm-tree {
  :deep(.el-tree-node__content) {
    height: 34px;
    border-radius: var(--el-radius-sm, 6px);
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
  }

  :deep(.el-tree-node__content:hover) {
    background: var(--el-color-primary-light-9);
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: var(--el-color-primary-light-8);
  }
}

.readonly-switch {
  display: flex;
  align-items: center;
  gap: 10px;

  &__tip {
    font-size: 12px;
    color: var(--el-color-warning);
  }
}

/* 行高覆盖块：与上面的 .perm-tree 同选择器，此处只把行高压到 32px（树节点更紧凑） */
.perm-tree {
  :deep(.el-tree-node__content) {
    height: 32px;
  }
}

.perm-tabs {
  :deep(.el-tabs__content) {
    min-height: 400px;
  }
}

/* ==================== 数据权限（卡片式单选） ==================== */
.data-scope-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
}

.data-scope-tip__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  font-size: 16px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.data-scope-tip__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}



.data-scope-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.data-scope-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  cursor: pointer;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}

.data-scope-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.data-scope-card.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

/* E：卡片内的 radio 被视觉隐藏但仍可 Tab 聚焦，
   因此焦点环挂在卡片上（:focus-within），否则键盘用户看不到当前选中的数据范围 */
.data-scope-card:focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.data-scope-card__radio {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.data-scope-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.data-scope-card__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-color-white);
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.data-scope-card.is-active .data-scope-card__dot {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.data-scope-card__label {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.data-scope-card__desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.custom-dept {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }

  &__tree {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-md, 8px);
    padding: 8px;
  }
}

/* 尊重系统「减少动态效果」偏好：本文件自己的过渡统一关掉
   （ReTable 的过渡由插件自带的同名媒体查询处理） */
@media (prefers-reduced-motion: reduce) {
  .perm-tree :deep(.el-tree-node__content),
  .data-scope-card,
  .data-scope-card__dot {
    transition: none;
  }
}
</style>


