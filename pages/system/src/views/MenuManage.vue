<script setup lang="ts">
/**
 * 菜单管理页面（复刻 KOI-ADMIN 菜单页：树 + 详情 + 按钮权限）
 *
 * 布局：
 *   - 上方：菜单树卡片（搜索 + 树形展示，支持右键/操作新增子菜单）
 *   - 下方：左侧「菜单详情」表单卡片 + 右侧「按钮权限」表格卡片
 *
 * 菜单类型：0-菜单 1-iframe 2-外链 3-按钮
 */
import { computed, nextTick, onMounted, ref, watch, defineAsyncComponent } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Refresh,
  Search,
  Folder,
  Document,
  Link,
  Grid,
  MoreFilled,
} from "@element-plus/icons-vue";
import { listMenuTree, saveMenu, updateMenu, deleteMenu } from "../api/systemApi";
import type { SysMenu } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

/** 异步加载 ReIcon（与工程其他页面一致） */
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default()));

const list = ref<SysMenu[]>([]);
const loading = ref(false);
const saving = ref(false);

/** 当前选中的菜单 */
const current = ref<SysMenu | null>(null);
/** 编辑中的表单（基于 current 副本） */
const form = ref<Record<string, any>>({});

const typeMap: Record<number, { label: string; type: string; icon: any }> = {
  0: { label: "菜单", type: "primary", icon: Document },
  1: { label: "iframe", type: "success", icon: Grid },
  2: { label: "外链", type: "info", icon: Link },
  3: { label: "按钮", type: "warning", icon: Folder },
};

const menuTypeOptions = [
  { label: "菜单", value: 0 },
  { label: "iframe", value: 1 },
  { label: "外链", value: 2 },
  { label: "按钮", value: 3 },
];

/** 搜索关键字 */
const keyword = ref("");
/** 过滤后的树 */
const filteredTree = computed<SysMenu[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return list.value;
  const filterTree = (nodes: SysMenu[]): SysMenu[] =>
    nodes
      .map((n) => {
        const self = (n.sysMenuTitle ?? "").toLowerCase().includes(kw) || (n.sysMenuName ?? "").toLowerCase().includes(kw) || (n.sysMenuPath ?? "").toLowerCase().includes(kw);
        const kids = n.children?.length ? filterTree(n.children) : [];
        if (self || kids.length) return { ...n, children: kids };
        return null;
      })
      .filter(Boolean) as SysMenu[];
  return filterTree(list.value);
});

/** 当前菜单下的按钮权限（子节点 type=3） */
const buttonPerms = computed<SysMenu[]>(() => current.value?.children?.filter((c) => c.sysMenuType === 3) ?? []);

/** 当前是否选择了菜单类型节点（可维护按钮权限） */
const isMenuTypeNode = computed<boolean>(() => current.value != null && current.value.sysMenuType === 0);

async function loadList() {
  loading.value = true;
  try {
    const res = await listMenuTree();
    list.value = (res?.data ?? []) as SysMenu[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "菜单列表加载失败");
  } finally {
    loading.value = false;
  }
}

/** 选择树节点 */
function selectNode(node: SysMenu) {
  current.value = node;
  form.value = JSON.parse(JSON.stringify(node));
}

/** 展开/折叠状态 */
const expandedKeys = ref<number[]>([]);

function refresh() {
  loadList();
}

/** 新增根菜单 */
function handleAddRoot() {
  current.value = null;
  form.value = {
    sysMenuPid: 0,
    sysMenuType: 0,
    sysMenuSort: 0,
    sysMenuHidden: 0,
    sysMenuHiddenTag: 0,
    sysMenuFixedTag: 0,
    sysMenuKeepAlive: 0,
    sysMenuShowParent: 0,
    sysMenuEngine: 0,
    sysMenuHome: 0,
  };
}

/** 新增子菜单 */
function handleAddChild(node?: SysMenu) {
  const parent = node ?? current.value;
  current.value = null;
  form.value = {
    sysMenuPid: parent?.sysMenuId ?? 0,
    sysMenuType: 0,
    sysMenuSort: 0,
    sysMenuHidden: 0,
    sysMenuHiddenTag: 0,
    sysMenuFixedTag: 0,
    sysMenuKeepAlive: 0,
    sysMenuShowParent: 0,
    sysMenuEngine: 0,
    sysMenuHome: 0,
  };
}

/** 进入编辑：以当前节点初始化表单 */
function handleEdit() {
  if (!current.value) return;
  form.value = JSON.parse(JSON.stringify(current.value));
}

/** 保存（新增或更新） */
async function handleSubmit() {
  if (!form.value.sysMenuTitle || !form.value.sysMenuName) {
    ElMessage.warning("请输入菜单名称和路由名称");
    return;
  }
  saving.value = true;
  try {
    const id = form.value.sysMenuId;
    if (id) {
      await updateMenu(form.value);
      ElMessage.success("保存成功");
    } else {
      const res = await saveMenu(form.value);
      ElMessage.success("新增成功");
      if (res?.data?.sysMenuId) form.value.sysMenuId = res.data.sysMenuId;
    }
    await loadList();
    // 重新选中当前节点
    selectById(form.value.sysMenuId ?? id);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

function selectById(id?: number) {
  if (!id) return;
  const walk = (nodes: SysMenu[]): SysMenu | null => {
    for (const n of nodes) {
      if (n.sysMenuId === id) return n;
      if (n.children?.length) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  const node = walk(list.value);
  if (node) selectNode(node);
}

async function handleDelete(node?: SysMenu) {
  const menu = node ?? current.value;
  if (!menu?.sysMenuId) return;
  if (menu.children?.length) {
    ElMessage.warning("存在子菜单，请先删除子菜单");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除「${menu.sysMenuTitle}」？`, "提示", { type: "warning" });
  } catch {
    return;
  }
  await deleteMenu(menu.sysMenuId);
  ElMessage.success("删除成功");
  if (current.value?.sysMenuId === menu.sysMenuId) {
    current.value = null;
    form.value = {};
  }
  loadList();
}

/** 新增按钮权限 */
function handleAddButton() {
  if (!isMenuTypeNode.value) return;
  handleAddChild({ sysMenuId: current.value?.sysMenuId } as SysMenu);
  form.value.sysMenuType = 3;
  form.value.sysMenuTitle = "";
  form.value.sysMenuName = "";
  form.value.sysMenuPath = "";
  form.value.sysMenuPerm = "";
  form.value.sysMenuComponent = "";
}

/** 编辑按钮权限：加载到详情表单 */
function handleEditButton(row: SysMenu) {
  handleEdit();
  form.value = { ...JSON.parse(JSON.stringify(row)), sysMenuPid: current.value?.sysMenuId };
}

/** 按钮权限表格列 */
const buttonColumns: ReTableColumn[] = [
  { prop: "sysMenuTitle", label: "按钮名称", minWidth: 140 },
  { prop: "sysMenuPerm", label: "权限字符", minWidth: 180 },
  { prop: "sysMenuSort", label: "排序", width: 70, align: "center" },
  { prop: "sysMenuStatus", label: "状态", width: 90, align: "center" },
  { prop: "action", label: "操作", width: 130, align: "center" },
];

const statusMap: Record<number, { label: string; type: string }> = {
  0: { label: "启用", type: "success" },
  1: { label: "禁用", type: "info" },
};

onMounted(loadList);
</script>

<template>
  <div class="menu-page">
    <div class="menu-workspace">
      <!-- ==================== 菜单树卡片 ==================== -->
      <div class="menu-tree-card koi-card">
        <div class="koi-card__body">
          <div class="menu-panel-header">
            <div class="menu-panel-title">
              <span class="menu-panel-title__icon">
                <el-icon><Grid /></el-icon>
              </span>
              <div class="menu-panel-title__text-wrap">
                <div class="menu-panel-title__text">菜单管理</div>
                <div class="menu-panel-title__desc">维护目录、菜单与权限入口</div>
              </div>
            </div>
            <div class="menu-action-group">
              <el-button type="primary" plain size="small" :icon="Plus" @click="handleAddRoot">新增根菜单</el-button>
              <el-button size="small" :icon="Refresh" circle @click="refresh" />
            </div>
          </div>

          <div class="menu-tree-toolbar">
            <el-input v-model="keyword" placeholder="搜索菜单名称 / 路由 / 路径" size="small" clearable :prefix-icon="Search" />
            <div class="menu-tree-stats">
              <div class="menu-tree-stat"><strong>{{ list.length }}</strong><span>目录与菜单</span></div>
              <div class="menu-tree-stat"><strong>{{ buttonPerms.length }}</strong><span>当前按钮权限</span></div>
              <div class="menu-tree-stat"><strong>{{ current?.sysMenuId ?? '-' }}</strong><span>当前选中</span></div>
            </div>
          </div>

          <div v-loading="loading" class="menu-tree-wrap">
            <el-tree
              class="menu-tree"
              :data="filteredTree"
              node-key="sysMenuId"
              :props="{ label: 'sysMenuTitle', children: 'children' }"
              :expand-on-click-node="false"
              highlight-current
              :current-node-key="current?.sysMenuId"
              @node-click="selectNode"
            >
              <template #default="{ data }">
                <div class="menu-tree-node">
                  <span class="menu-tree-node__icon">
                    <ReIcon :name="data.sysMenuIcon" :size="14" />
                  </span>
                  <div class="menu-tree-node__main">
                    <span class="menu-tree-node__name">{{ data.sysMenuTitle }}</span>
                    <span class="menu-tree-node__path">{{ data.sysMenuPath || '未配置路由' }}</span>
                  </div>
                  <div class="menu-tree-node__badges">
                    <el-tag v-if="data.sysMenuType === 3" size="small" type="warning" effect="light">按钮</el-tag>
                    <el-tag v-else-if="data.sysMenuType === 2" size="small" type="info" effect="light">外链</el-tag>
                    <el-tag v-else-if="data.sysMenuType === 1" size="small" type="success" effect="light">iframe</el-tag>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </div>

      <!-- ==================== 下方：菜单详情 + 按钮权限 ==================== -->
      <div class="menu-workspace__bottom">
        <!-- 菜单详情卡片 -->
        <div class="menu-detail-card koi-card">
          <div class="koi-card__body">
            <div class="menu-panel-header">
              <div class="menu-panel-title">
                <span class="menu-panel-title__icon is-detail">
                  <el-icon><Document /></el-icon>
                </span>
                <div class="menu-panel-title__text-wrap">
                  <div class="menu-panel-title__text">菜单详情</div>
                  <div class="menu-panel-title__desc">编辑选中菜单的配置</div>
                </div>
              </div>
              <div class="menu-action-group">
                <el-button type="primary" size="small" :icon="Plus" :disabled="!current" @click="handleAddChild()">新增子菜单</el-button>
                <el-button size="small" :icon="Edit" :disabled="!current" @click="handleEdit">编辑</el-button>
                <el-button type="danger" size="small" :icon="Delete" :disabled="!current" @click="handleDelete()">删除</el-button>
                <el-button type="success" size="small" :loading="saving" :disabled="!form.sysMenuTitle && !form.sysMenuName" @click="handleSubmit">保存</el-button>
              </div>
            </div>

            <div class="menu-detail-body">
              <!-- 未选择时占位 -->
              <div v-if="!current && !form.sysMenuTitle" class="menu-detail-placeholder">
                <el-icon :size="40" class="menu-detail-placeholder__icon"><MoreFilled /></el-icon>
                <strong>从左侧选择一个菜单查看配置</strong>
                <span>选中节点后即可编辑其路由、权限与展示状态</span>
              </div>

              <template v-else>
                <!-- Hero 详情头 -->
                <div class="menu-detail-hero">
                  <span class="menu-detail-hero__icon">
                    <ReIcon :name="form.sysMenuIcon" :size="18" />
                  </span>
                  <div class="menu-detail-hero__main">
                    <div class="menu-detail-hero__top">
                      <span class="menu-detail-hero__title">{{ form.sysMenuTitle || '未命名' }}</span>
                      <div class="menu-detail-hero__meta">
                        <el-tag size="small" :type="(typeMap[form.sysMenuType]?.type as any) ?? 'info'" effect="light">
                          {{ typeMap[form.sysMenuType]?.label ?? '未知' }}
                        </el-tag>
                        <el-tag size="small" :type="form.sysMenuHidden === 1 ? 'warning' : 'success'" effect="plain">
                          {{ form.sysMenuHidden === 1 ? '隐藏' : '显示' }}
                        </el-tag>
                        <el-tag v-if="form.sysMenuKeepAlive === 1" size="small" type="primary" effect="plain">缓存</el-tag>
                      </div>
                    </div>
                    <div class="menu-detail-hero__info">
                      <span><em>路由</em><strong>{{ form.sysMenuPath || '-' }}</strong></span>
                      <span><em>权限</em><strong>{{ form.sysMenuPerm || '-' }}</strong></span>
                      <span><em>排序</em><strong>{{ form.sysMenuSort ?? '-' }}</strong></span>
                    </div>
                  </div>
                </div>

                <!-- 表单：基础信息 / 路由配置 / 权限与状态 -->
                <div class="menu-form-shell">
                  <div class="menu-form-intro" v-if="form.sysMenuId">
                    <div class="menu-form-intro__main">
                      <strong>正在编辑：{{ form.sysMenuTitle }}</strong>
                      <span>配置会同步影响路由侧栏展示与权限鉴权</span>
                    </div>
                    <span class="menu-form-intro__badge">ID {{ form.sysMenuId }}</span>
                  </div>

                  <el-form class="menu-form" label-width="92px" label-position="right">
                    <!-- 基础信息 -->
                    <div class="menu-form-section">
                      <div class="menu-form-section__title">基础信息</div>
                      <el-form-item label="菜单上级">
                        <el-tree-select
                          v-model="form.sysMenuPid"
                          :data="list"
                          :props="{ value: 'sysMenuId', label: 'sysMenuTitle', children: 'children' }"
                          check-strictly
                          clearable
                          placeholder="不选则为顶级"
                        />
                      </el-form-item>
                      <el-form-item label="菜单类型" required>
                        <el-segmented v-model="form.sysMenuType" :options="menuTypeOptions" class="menu-form__type" />
                      </el-form-item>
                      <el-form-item label="菜单图标">
                        <div class="menu-form-help-field">
                          <ReIconSelect v-model="form.sysMenuIcon" placeholder="选择菜单图标" />
                          <el-icon class="menu-form-help-field__tip"><i class="el-icon-warning-outline" /></el-icon>
                        </div>
                      </el-form-item>
                      <el-form-item label="菜单标题" required>
                        <el-input v-model="form.sysMenuTitle" placeholder="如：用户管理" maxlength="50" show-word-limit />
                      </el-form-item>
                      <el-form-item label="显示排序">
                        <el-input-number v-model="form.sysMenuSort" :min="0" controls-position="right" class="menu-form__sort" />
                      </el-form-item>
                    </div>

                    <!-- 路由配置 -->
                    <div class="menu-form-section">
                      <div class="menu-form-section__title">路由配置</div>
                      <el-form-item label="路由名称" required>
                        <el-input v-model="form.sysMenuName" placeholder="路由 name（全局唯一）" maxlength="50" show-word-limit />
                      </el-form-item>
                      <el-form-item label="路由地址">
                        <el-input v-model="form.sysMenuPath" placeholder="如：/system/user" maxlength="100" show-word-limit />
                      </el-form-item>
                      <el-form-item v-if="form.sysMenuType === 0" label="选中路由">
                        <el-input v-model="form.sysMenuComponent" placeholder="组件路径，如 system/user/index" maxlength="100" show-word-limit />
                      </el-form-item>
                      <el-form-item v-if="form.sysMenuType === 1 || form.sysMenuType === 2" label="外链地址">
                        <el-input v-model="form.sysMenuFrameSrc" placeholder="需以 http(s):// 开头" maxlength="200" show-word-limit />
                      </el-form-item>
                    </div>

                    <!-- 权限与状态 -->
                    <div class="menu-form-section">
                      <div class="menu-form-section__title">权限与状态</div>
                      <el-form-item label="权限字符">
                        <el-input v-model="form.sysMenuPerm" placeholder="格式：模块:资源:操作，如 sys:user:save" maxlength="100" show-word-limit />
                      </el-form-item>
                      <el-form-item label="是否显示">
                        <el-radio-group v-model="form.sysMenuHidden">
                          <el-radio :value="0">显示</el-radio>
                          <el-radio :value="1">隐藏</el-radio>
                        </el-radio-group>
                      </el-form-item>
                      <el-form-item label="是否缓存">
                        <el-radio-group v-model="form.sysMenuKeepAlive">
                          <el-radio :value="0">不缓存</el-radio>
                          <el-radio :value="1">缓存</el-radio>
                        </el-radio-group>
                      </el-form-item>
                      <el-form-item label="是否展开">
                        <el-radio-group v-model="form.sysMenuShowParent">
                          <el-radio :value="0">展开</el-radio>
                          <el-radio :value="1">收起</el-radio>
                        </el-radio-group>
                      </el-form-item>
                      <el-form-item label="是否固钉">
                        <el-radio-group v-model="form.sysMenuFixedTag">
                          <el-radio :value="0">否</el-radio>
                          <el-radio :value="1">是</el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </div>
                  </el-form>
                </div>
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
                  <el-icon><Folder /></el-icon>
                </span>
                <div class="menu-panel-title__text-wrap">
                  <div class="menu-panel-title__text">按钮权限</div>
                  <div class="menu-panel-title__desc">当前菜单下的按钮级权限</div>
                </div>
              </div>
              <div class="menu-action-group">
                <el-button type="warning" size="small" plain :icon="Plus" :disabled="!isMenuTypeNode" @click="handleAddButton">
                  新增按钮权限
                </el-button>
              </div>
            </div>

            <div class="menu-button-table">
              <!-- 未选择菜单类型节点时占位 -->
              <div v-if="!isMenuTypeNode" class="menu-button-placeholder">
                <span class="menu-button-placeholder__icon">
                  <el-icon :size="20"><MoreFilled /></el-icon>
                </span>
                <div class="menu-button-placeholder__content">
                  <strong>请选择左侧菜单类型节点</strong>
                  <em>仅「菜单」类型节点可维护按钮级权限，随后可新增、编辑和刷新按钮权限</em>
                </div>
              </div>
              <!-- 有按钮权限时表格 -->
              <el-table v-else :data="buttonPerms" size="small" :empty-text="'暂无可维护的按钮权限，点击右上角新增'" stripe>
                <el-table-column label="按钮名称" min-width="150">
                  <template #default="{ row }">
                    <div class="button-name-cell">
                      <span class="button-name-cell__icon">
                        <ReIcon :name="row.sysMenuIcon" :size="14" />
                      </span>
                      <div class="button-name-cell__content">
                        <strong>{{ row.sysMenuTitle }}</strong>
                        <em>{{ row.sysMenuPerm || '-' }}</em>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="sysMenuSort" label="排序" width="70" align="center" />
                <el-table-column label="状态" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="(statusMap[row.sysMenuStatus ?? 0]?.type as any) ?? 'success'" effect="plain">
                      {{ statusMap[row.sysMenuStatus ?? 0]?.label ?? '启用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="130" align="center">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleEditButton(row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "MenuManage",
  components: {},
};
</script>

<style scoped lang="scss">
.menu-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.menu-workspace {
  flex: 1;
  display: grid;
  grid-template-rows: minmax(280px, 1fr) minmax(220px, 0.82fr);
  min-width: 0;
  min-height: 0;
  gap: 0;
}

.menu-workspace__bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
  gap: 12px;
  min-height: 0;
  min-width: 0;
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

/* ===== 面板标题 ===== */
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
.menu-panel-title__text-wrap {
  min-width: 0;
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
.menu-action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== 菜单树 ===== */
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

/* ===== 菜单详情 ===== */
.menu-detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 12px;
}
.menu-detail-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  min-height: 220px;
  color: var(--el-text-color-secondary);
  text-align: center;
}
.menu-detail-placeholder__icon {
  color: var(--el-color-primary-light-5);
}
.menu-detail-placeholder strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}
.menu-detail-placeholder span {
  font-size: 12px;
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

/* ===== 表单 ===== */
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
.menu-form__type {
  width: 100%;
}
.menu-form__sort {
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
.menu-form-help-field__tip {
  color: var(--el-color-warning);
}

/* ===== 按钮权限 ===== */
.menu-button-table {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  overflow: auto;
}
.menu-button-placeholder {
  display: flex;
  flex-direction: column;
  flex: 1;
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

.menu-button-table :deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  border-radius: 8px;
}

@media (max-width: 1100px) {
  .menu-workspace__bottom {
    grid-template-columns: 1fr;
  }
}
</style>
