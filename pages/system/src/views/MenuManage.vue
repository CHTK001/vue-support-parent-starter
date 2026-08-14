<script setup lang="ts">
/**
 * 菜单管理页面 —— 完整复刻 KOI-ADMIN 目标站（http://39.107.143.109/system/menu）
 *
 * 布局（与目标站完全一致）：
 *   - 左栏（300px）：菜单树卡片（搜索 + 统计 + 树 + 右键菜单）
 *   - 右栏：menu-workspace 上下两行
 *       · 上部：菜单详情卡片（hero 详情头 + el-descriptions 描述列表）
 *       · 下部：按钮权限卡片（按钮权限表格）
 *   - 新增 / 编辑：KoiDialog 风格弹窗（820x620，三区表单）
 *
 * 字段说明：目标站使用简写字段（menuName / name / auth / isVisible ...），
 * 后端为 sysMenuXxx，通过 toVM / toEntity 双向映射。
 */
import { computed, nextTick, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  Refresh,
  Search,
  Edit,
  MoreFilled,
} from "@element-plus/icons-vue";
import { listMenuTree, saveMenu, updateMenu, deleteMenu } from "../api/systemApi";
import type { SysMenu } from "../api/types";

/** 目标站菜单类型标签 */
const typeLabels: Record<number, string> = {
  0: "菜单",
  1: "iframe",
  2: "外链",
  3: "按钮",
};

/** 目标站菜单类型选项（菜单类型字典） */
const typeOptions = [
  { label: "目录", value: 1 },
  { label: "菜单", value: 2 },
  { label: "外链", value: 3 },
  { label: "iframe", value: 4 },
];

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
  linkUrl?: string;       // 外链地址
  activeMenu?: string;    // 选中路由
  isVisible?: number;     // 1显示 0隐藏
  isKeepAlive?: number;   // 1缓存 0不缓存
  isExpanded?: number;    // 1展开 0折叠
  isFull?: number;        // 1全屏 0不全屏
  isNewTab?: number;      // 1新标签 0当前页
  isHideTab?: number;     // 1隐藏 0显示
  isFixed?: number;       // 1固钉 0否
  menuStatus?: number;    // 1启用 0禁用
  children?: MenuVM[];
}

function toVM(m: SysMenu): MenuVM {
  return {
    menuId: m.sysMenuId,
    parentId: m.sysMenuPid ?? 0,
    menuType: m.sysMenuType,
    menuName: m.sysMenuTitle,
    name: m.sysMenuName,
    path: m.sysMenuPath,
    auth: m.sysMenuPerm,
    icon: m.sysMenuIcon,
    sort: m.sysMenuSort,
    component: m.sysMenuComponent,
    linkUrl: m.sysMenuFrameSrc,
    activeMenu: m.sysMenuActivePath,
    isVisible: m.sysMenuHidden === 1 ? 0 : 1,
    isKeepAlive: m.sysMenuKeepAlive,
    isExpanded: m.sysMenuShowParent,
    isHideTab: m.sysMenuHiddenTag,
    isFixed: m.sysMenuFixedTag,
    menuStatus: 1,
    children: m.children?.map(toVM),
  };
}

function toEntity(v: MenuVM): SysMenu {
  return {
    sysMenuId: v.menuId,
    sysMenuPid: v.parentId,
    sysMenuType: v.menuType,
    sysMenuTitle: v.menuName,
    sysMenuName: v.name,
    sysMenuPath: v.path,
    sysMenuPerm: v.auth,
    sysMenuIcon: v.icon,
    sysMenuSort: v.sort,
    sysMenuComponent: v.component,
    sysMenuFrameSrc: v.linkUrl,
    sysMenuActivePath: v.activeMenu,
    sysMenuHidden: v.isVisible === 1 ? 0 : 1,
    sysMenuKeepAlive: v.isKeepAlive,
    sysMenuShowParent: v.isExpanded,
    sysMenuHiddenTag: v.isHideTab,
    sysMenuFixedTag: v.isFixed,
    sysMenuEngine: 0,
    sysMenuHome: 0,
  };
}

/* ================== 数据 ================== */
const list = ref<MenuVM[]>([]);
const loading = ref(false);

/** 树配置 */
const treeProps = { children: "children", label: "menuName" };

/** 搜索关键字 */
const keyword = ref("");
/** 过滤后的树 */
const filteredTree = computed<MenuVM[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return list.value;
  const filterTree = (nodes: MenuVM[]): MenuVM[] =>
    nodes
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

/** 统计 */
const stats = computed(() => {
  const all = flattenTree(list.value);
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

/** 树节点动态类（目标站 tn()） */
function nodeClass(data: MenuVM): Record<string, boolean> {
  return {
    "is-disabled": String(data.menuStatus) === "0",
    "is-hidden": String(data.isVisible) === "0" && String(data.menuStatus) === "1",
    "is-link": data.menuType === 3 && String(data.menuStatus) === "1",
    "is-iframe": data.menuType === 4,
  };
}

/** 是否外链 */
function isLink(m?: MenuVM | null): boolean {
  return m?.menuType === 3;
}

/** 是否菜单类型（可维护按钮权限） */
const isMenuTypeNode = computed<boolean>(() => current.value != null && current.value.menuType === 2);

/** 节点点击：加载详情 + 按钮权限 */
async function onNodeClick(data: MenuVM) {
  current.value = data;
  // 按钮权限 = 子节点中 menuType=3 的节点
  buttonPerms.value = (data.children ?? []).filter((c) => c.menuType === 3);
}

/* ================== 弹窗 ================== */
const dialogVisible = ref(false);
const dialogTitle = ref("新增菜单节点");
const saving = ref(false);
const form = ref<MenuVM>({});
const formRef = ref();

/** 新增 */
function handleAdd(parent?: MenuVM) {
  const t = parent?.menuType ?? 2;
  dialogTitle.value = "新增菜单节点";
  form.value = {
    parentId: parent?.menuId ?? 0,
    menuType: t === 3 ? 3 : t,
    icon: "",
    isVisible: 1,
    menuStatus: 1,
    sort: 0,
    isKeepAlive: 0,
    isExpanded: 0,
    isFull: 0,
    isNewTab: 0,
    isHideTab: 0,
    isFixed: 0,
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

/** 是否显示路由配置（菜单类型） */
const showRouteSection = computed<boolean>(() => form.value.menuType === 2);
/** 非按钮显示图标字段 */
const showIconField = computed<boolean>(() => Number(form.value.menuType) < 3);
/** 外链地址字段（外链/iframe） */
const showLinkField = computed<boolean>(() => form.value.menuType === 3 || form.value.menuType === 4);
/** 页面路径（菜单类型） */
const showComponentField = computed<boolean>(() => form.value.menuType === 2);

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
  if (c.menuType === 1 || c.menuType === 2) {
    items.push({ label: "展开状态", value: c.isExpanded === 1 ? "展开" : "折叠" });
  }
  if (c.menuType === 2) {
    items.push({ label: "页面缓存", value: c.isKeepAlive === 1 ? "缓存" : "不缓存" });
  }
  items.push({ label: "外链地址", value: c.linkUrl ?? "-" });
  items.push({ label: "选中路由", value: c.activeMenu ?? "-" });
  if (c.menuType === 2) {
    items.push({ label: "是否全屏", value: c.isFull === 1 ? "全屏" : "不全屏" });
    items.push({ label: "是否新标签", value: c.isNewTab === 1 ? "新标签打开" : "当前页打开" });
    items.push({ label: "标签隐藏", value: c.isHideTab === 1 ? "隐藏" : "显示" });
  }
  items.push({ label: "显示排序", value: String(c.sort ?? 0) });
  return items;
});

onMounted(loadList);
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
        </div>

        <div class="menu-tree-toolbar">
          <el-input v-model="keyword" placeholder="搜索菜单名称" clearable :prefix-icon="Search" @keyup.enter="refresh" />
          <div class="menu-tree-stats">
            <div class="menu-tree-stat"><strong>{{ stats.total }}</strong><span>节点</span></div>
            <div class="menu-tree-stat"><strong>{{ stats.directory }}</strong><span>目录</span></div>
            <div class="menu-tree-stat"><strong>{{ stats.page }}</strong><span>菜单</span></div>
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
            highlight-current
            :current-node-key="current?.menuId"
            @node-click="onNodeClick"
            @node-contextmenu="onNodeContextmenu"
          >
            <template #default="{ data }">
              <div class="menu-tree-node" :class="nodeClass(data)">
                <span class="menu-tree-node__icon">
                  <ReIcon :name="data.icon" :size="14" />
                </span>
                <div class="menu-tree-node__main">
                  <span class="menu-tree-node__name">{{ data.menuName }}</span>
                  <span class="menu-tree-node__path">{{ data.path || '未配置路由' }}</span>
                </div>
                <div class="menu-tree-node__badges">
                  <el-tag v-if="data.menuType === 3" size="small" type="warning" effect="light">按钮</el-tag>
                  <el-tag v-else-if="data.menuType === 4" size="small" type="success" effect="light">iframe</el-tag>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
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
                      <el-tag size="small" effect="light">{{ typeLabels[current.menuType ?? 0] ?? '-' }}</el-tag>
                      <el-tag size="small" :type="current.menuStatus === 1 ? 'success' : 'danger'" effect="plain">
                        {{ current.menuStatus === 1 ? '启用' : '禁用' }}
                      </el-tag>
                      <el-tag size="small" :type="current.isVisible === 1 ? 'primary' : 'warning'" effect="plain">
                        {{ current.isVisible === 1 ? '显示' : '隐藏' }}
                      </el-tag>
                      <el-tag v-if="current.isKeepAlive === 1" size="small" type="primary" effect="plain">缓存</el-tag>
                      <el-tag v-if="current.menuType === 4" size="small" type="success" effect="plain">iframe</el-tag>
                    </div>
                  </div>
                  <div class="menu-detail-hero__info">
                    <span><em>路由</em><strong>{{ current.path || '-' }}</strong></span>
                    <span><em>权限</em><strong>{{ current.auth || '-' }}</strong></span>
                    <span><em>按钮</em><strong>{{ buttonPerms.length }} 个</strong></span>
                  </div>
                </div>
              </div>

              <!-- 描述列表 -->
              <el-descriptions class="menu-descriptions" :column="2" border>
                <el-descriptions-item v-for="item in detailItems" :key="item.label" :label="item.label">
                  {{ item.value }}
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
            <div class="menu-action-group">
              <el-tag size="small" effect="plain">{{ buttonPerms.length }} 项</el-tag>
              <el-tooltip content="新增按钮权限" placement="top">
                <el-button type="primary" icon="Plus" circle plain :disabled="!isMenuTypeNode" @click="handleAddButton" />
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
            <el-table v-else :data="buttonPerms" class="menu-button-table" border stripe empty-text="暂无数据">
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
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="820px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="menu-form-shell">
        <div class="menu-form-intro">
          <div class="menu-form-intro__main">
            <strong>{{ dialogTitle }}</strong>
            <span>配置会同步影响路由、侧栏展示和权限鉴权。</span>
          </div>
          <span class="menu-form-intro__badge">{{ form.menuType === 3 ? '按钮权限' : typeLabels[form.menuType ?? 0] ?? '菜单' }}</span>
        </div>

        <el-form ref="formRef" class="menu-form" :model="form" label-width="92px" status-icon>
          <!-- 基础信息 -->
          <section class="menu-form-section">
            <div class="menu-form-section__title">基础信息</div>
            <el-row :gutter="16">
              <el-col :sm="24" :xs="24">
                <el-form-item label="菜单上级" prop="parentId">
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
                <el-form-item label="菜单类型" prop="menuType">
                  <el-radio-group v-model="form.menuType" class="menu-type-group">
                    <el-radio v-for="o in typeOptions" :key="o.value" :value="o.value" border>
                      {{ o.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col v-if="showIconField" :sm="12" :xs="24">
                <el-form-item label="菜单图标" prop="icon">
                  <ReIconSelect v-model="form.icon" width="100%" />
                </el-form-item>
              </el-col>
              <el-col :sm="showIconField ? 12 : 16" :xs="24">
                <el-form-item label="菜单名称" prop="menuName">
                  <el-input v-model="form.menuName" placeholder="请输入菜单名称" maxlength="128" show-word-limit clearable />
                </el-form-item>
              </el-col>
              <el-col :sm="8" :xs="24">
                <el-form-item label="显示排序" prop="sort">
                  <el-input-number v-model="form.sort" class="w-full" :min="1" clearable />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <!-- 路由配置 -->
          <section v-if="showRouteSection" class="menu-form-section">
            <div class="menu-form-section__title">路由配置</div>
            <el-row :gutter="16">
              <el-col :sm="12" :xs="24">
                <el-form-item label="路由名称" prop="name">
                  <div class="menu-form-help-field">
                    <el-tooltip content="路由名称必须全局唯一，对应 Vue Router 的 name 及页面缓存[例如：userPage]" placement="top">
                      <el-icon><MoreFilled /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.name" placeholder="例如: userPage[唯一]" maxlength="32" show-word-limit clearable />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :sm="12" :xs="24">
                <el-form-item label="路由Path" prop="path">
                  <div class="menu-form-help-field">
                    <el-tooltip content="菜单 path 必须以斜杠开头" placement="top">
                      <el-icon><MoreFilled /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.path" placeholder="例如：/system/user[唯一]" maxlength="32" show-word-limit clearable />
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="showComponentField" :sm="12" :xs="24">
                <el-form-item label="页面路径" prop="component">
                  <div class="menu-form-help-field">
                    <el-tooltip content="对应 views 目录下的页面文件路径，无需斜杠开头[例如：system/user/index]" placement="top">
                      <el-icon><MoreFilled /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.component" placeholder="system/user/index" maxlength="64" show-word-limit clearable />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :sm="showComponentField ? 12 : 24" :xs="24">
                <el-form-item label="选中路由" prop="activeMenu">
                  <div class="menu-form-help-field">
                    <el-tooltip content="隐藏页或详情页访问时，指定侧栏高亮的路由" placement="top">
                      <el-icon><MoreFilled /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.activeMenu" placeholder="留空则高亮当前路由" clearable />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <!-- 外链地址 -->
          <section v-if="showLinkField" class="menu-form-section">
            <div class="menu-form-section__title">外链配置</div>
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="外链地址" prop="linkUrl">
                  <div class="menu-form-help-field">
                    <el-tooltip content="填写后该菜单将作为外链跳转，需以 http(s):// 开头" placement="top">
                      <el-icon><MoreFilled /></el-icon>
                    </el-tooltip>
                    <el-input v-model="form.linkUrl" placeholder="请输入外链地址" clearable />
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
                <el-form-item label="权限字符" prop="auth">
                  <el-input v-model="form.auth" placeholder="格式：模块:资源:操作，如 sys:user:save" maxlength="128" show-word-limit clearable />
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
                <el-form-item label="是否展开" prop="isExpanded">
                  <el-radio-group v-model="form.isExpanded">
                    <el-radio :value="1">展开</el-radio>
                    <el-radio :value="0">折叠</el-radio>
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
        </el-form>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
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
  display: grid;
  grid-template-rows: minmax(280px, 1fr) minmax(220px, 0.82fr);
  min-width: 0;
  min-height: 0;
  gap: 12px;
}

.koi-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
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
  border-radius: 8px;
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

/* ==================== 操作按钮（目标站：圆角正方形） ==================== */
.menu-action-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.menu-action-group :deep(.el-button.is-circle) {
  border-radius: 8px;
  width: 30px;
  height: 30px;
  margin-left: 0;
  padding: 0;
}
.menu-action-group :deep(.el-tag) {
  border-radius: 8px;
  height: 28px;
  padding: 0 9px;
  line-height: 26px;
}

/* ==================== 菜单树 ==================== */
.menu-tree-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 12px;
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
  border-radius: 8px;
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
.menu-tree :deep(.el-tree-node__content) {
  height: 40px;
  border-radius: 8px;
  padding-right: 8px;
}
.menu-tree :deep(.el-tree-node__content:hover) {
  background: var(--el-fill-color-light);
}
.menu-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--el-color-primary-light-9);
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
  border-radius: 8px;
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

/* ==================== 菜单详情 ==================== */
.menu-detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 12px;
}
.menu-detail-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  border-radius: 8px;
}
.menu-detail-hero__icon {
  width: 40px;
  height: 40px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
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
.menu-descriptions :deep(.el-descriptions__label) {
  width: 108px;
  color: var(--el-text-color-secondary);
}

/* ==================== 按钮权限 ==================== */
.menu-button-table {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  overflow: auto;
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
  border-radius: 8px;
  text-align: center;
}
.menu-button-placeholder__icon {
  width: 42px;
  height: 42px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
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
  border-radius: 8px;
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
  border-radius: 8px;
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
  border-radius: 8px;
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
  border-radius: 8px;
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
  border-radius: 8px;
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
.menu-form-section__title::before {
  content: "";
  background: var(--el-color-primary);
  border-radius: 4px;
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
</style>
