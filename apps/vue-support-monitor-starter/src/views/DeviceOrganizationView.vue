<script setup lang="ts">
/**
 * 设备组织 —— 厂商侧的组织架构树。
 *
 * 数据来自 device-starter 的 `GET /api/device/org/tree`，返回**扁平**的
 * `List<DeviceOrganization>`（id / parentId / name / path / vendor），不含 children，
 * 故本页按 parentId 在前端建树——设备工作台 DeviceView 是把该扁平列表直接赋给
 * el-tree 的，层级并不能真正嵌套，这里不做同样处理。
 *
 * `POST /api/device/org/sync` 触发向厂商侧同步组织。
 *
 * 视觉与布局对齐「代理管理」（ProxyView）：无顶部 hero、4 张紧凑 ReStatCard、
 * 筛选与操作合并成一行、树卡吃满剩余高度、统一 --el-* 变量。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";

import { Connection, OfficeBuilding, Position, Share } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import deviceApi from "@pages/device/src/api/deviceApi";

/** 与后端 DeviceOrganization 实体字段一一对应 */
interface DeviceOrganization {
  deviceOrganizationId: string;
  deviceOrganizationParentId?: string;
  deviceOrganizationName: string;
  deviceOrganizationPath?: string;
  deviceOrganizationVendor?: string;
}

/** 前端树节点：补 children 与可检索的扁平文本 */
interface OrgTreeNode {
  deviceOrganizationId: string;
  deviceOrganizationName: string;
  deviceOrganizationVendor?: string;
  deviceOrganizationPath?: string;
  searchText: string;
  children?: OrgTreeNode[];
}

/** el-tree 的 props 约定：children 键与 label 键 */
const TREE_PROPS = { children: "children", label: "deviceOrganizationName" };

const orgs = ref<DeviceOrganization[]>([]);
const tree = ref<OrgTreeNode[]>([]);
const loading = ref(false);
const syncing = ref(false);
const loadError = ref("");

const keyword = ref("");
const treeRef = ref<{ filter: (v: string) => void } | null>(null);

/** 各厂商节点数 */
const vendorSummary = computed(() => {
  const m = new Map<string, number>();
  orgs.value.forEach((o) => {
    const v = o.deviceOrganizationVendor || "未知厂商";
    m.set(v, (m.get(v) || 0) + 1);
  });
  return [...m.entries()].map(([vendor, count]) => ({ vendor, count }));
});

/** 根节点数（parentId 指向不存在节点者计入，与建树口径一致） */
const rootCount = computed(() => tree.value.length);

/** 最大深度（单层为 1） */
const maxDepth = computed(() => {
  const depth = (n: OrgTreeNode): number =>
    1 + (n.children?.length ? Math.max(...n.children.map(depth)) : 0);
  return tree.value.length ? Math.max(...tree.value.map(depth)) : 0;
});

const kpis = computed(() => [
  {
    key: "total",
    title: "组织节点",
    value: orgs.value.length,
    desc: `根节点 ${rootCount.value} 个`,
    icon: OfficeBuilding,
    iconColor: "var(--el-color-primary)",
  },
  {
    key: "vendor",
    title: "接入厂商",
    value: vendorSummary.value.length,
    desc: vendorSummary.value.map((v) => v.vendor).join(" / ") || "—",
    icon: Share,
    iconColor: "var(--el-color-info)",
  },
  {
    key: "depth",
    title: "最大层级",
    value: maxDepth.value,
    desc: "根节点记为第 1 层",
    icon: Connection,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
  {
    key: "leaf",
    title: "末级节点",
    value: leafCount.value,
    desc: "无下级的组织",
    icon: Position,
    iconColor: "var(--el-color-success)",
  },
]);

/** 末级节点数 */
const leafCount = computed(() => {
  let n = 0;
  const walk = (list: OrgTreeNode[]) => {
    list.forEach((x) => {
      if (x.children?.length) walk(x.children);
      else n += 1;
    });
  };
  walk(tree.value);
  return n;
});

/** 扁平列表 → 树。parentId 指向不存在的节点（厂商侧脏数据）时挂到根，避免整支丢失 */
function buildTree(list: DeviceOrganization[]): OrgTreeNode[] {
  const nodes = new Map<string, OrgTreeNode>();
  list.forEach((o) => {
    nodes.set(o.deviceOrganizationId, {
      deviceOrganizationId: o.deviceOrganizationId,
      deviceOrganizationName: o.deviceOrganizationName || o.deviceOrganizationId,
      deviceOrganizationVendor: o.deviceOrganizationVendor,
      deviceOrganizationPath: o.deviceOrganizationPath,
      searchText: "",
      children: [],
    });
  });

  const roots: OrgTreeNode[] = [];
  list.forEach((o) => {
    const node = nodes.get(o.deviceOrganizationId)!;
    const parent = o.deviceOrganizationParentId ? nodes.get(o.deviceOrganizationParentId) : undefined;
    if (parent && parent !== node) parent.children!.push(node);
    else roots.push(node);
  });

  // 自底向上累加 searchText，使父节点的 filter 也能命中子节点名称
  const collect = (n: OrgTreeNode): string => {
    const kids = (n.children || []).map(collect).join(" ");
    n.searchText = `${n.deviceOrganizationName} ${kids}`;
    return n.searchText;
  };
  roots.forEach(collect);

  return roots;
}

async function fetchTree(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    orgs.value = (await deviceApi.getOrgTree()) || [];
    tree.value = buildTree(orgs.value);
    if (keyword.value) treeRef.value?.filter(keyword.value);
  } catch (e: unknown) {
    orgs.value = [];
    tree.value = [];
    loadError.value = (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e));
    message.error(`组织架构加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

/** 触发厂商侧组织同步 */
async function onSync(): Promise<void> {
  syncing.value = true;
  try {
    await deviceApi.syncOrg();
    message.success("组织同步已触发");
    await fetchTree();
  } catch (e: unknown) {
    message.error(`组织同步失败：${(e as { msg?: string })?.msg || e}`);
  } finally {
    syncing.value = false;
  }
}

onMounted(fetchTree);
</script>

<template>
  <div class="dor">
    <!-- KPI 卡：组织节点 / 接入厂商 / 最大层级 / 末级节点 -->
    <section class="dor-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 筛选与操作合并成一行：组织搜索 + 厂商概览 + 查询 + 图标操作组（同步/刷新/清空搜索） -->
    <section class="dor-panel dor-filter">
      <div class="dor-field dor-field--search">
        <ReInput
          v-model="keyword"
          placeholder="搜索组织名称..."
          clearable
          prefix-icon="Search"
          @input="(v: string) => treeRef?.filter(v)"
        />
      </div>
      <div class="dor-vendors">
        <ReTag v-for="v in vendorSummary" :key="v.vendor" type="info" size="small">
          {{ v.vendor }} · {{ v.count }}
        </ReTag>
        <span v-if="!vendorSummary.length" class="dor-filter__meta">暂无厂商数据</span>
      </div>
      <span class="dor-filter__meta">{{ orgs.length }} 个节点</span>
      <ReButton icon="Search" :show-text="true" type="primary" :loading="loading" @click="fetchTree">
        查询
      </ReButton>
      <div class="dor-toolbar-ops">
        <ReButton
          icon="Refresh"
          layout="square"
          type="primary"
          tip="从厂商侧同步组织架构"
          :loading="syncing"
          @click="onSync"
        />
        <ReButton icon="RefreshRight" layout="square" tip="重新加载" :loading="loading" @click="fetchTree" />
        <ReButton icon="Delete" layout="square" tip="清空搜索条件" @click="keyword = ''; treeRef?.filter('')" />
      </div>
    </section>

    <div v-if="loadError" class="dor-error">
      <span>{{ loadError }}</span>
      <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchTree" />
    </div>

    <!-- 树卡：flex:1 + min-height:0 吃满剩余高度，树体内部滚动 -->
    <section class="dor-panel dor-tree-card">
      <div v-if="!loading && !tree.length" class="dor-empty">
        <ReEmpty description="暂无组织节点，可点击「同步组织」向厂商侧拉取" :image-size="80" />
      </div>
      <el-tree
        v-else
        ref="treeRef"
        v-loading="loading"
        class="dor-tree"
        :data="tree"
        :props="TREE_PROPS"
        node-key="deviceOrganizationId"
        :filter-node-method="(n: OrgTreeNode, v: string) => !!n.searchText?.includes(v)"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ data }">
          <span class="dor-node">
            <span class="dor-node__name">{{ data.deviceOrganizationName }}</span>
            <ReTag v-if="data.deviceOrganizationVendor" type="info" size="small">
              {{ data.deviceOrganizationVendor }}
            </ReTag>
            <span v-if="data.deviceOrganizationPath" class="dor-node__path">
              {{ data.deviceOrganizationPath }}
            </span>
          </span>
        </template>
      </el-tree>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dor {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

.dor-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dor-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dor-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}
.dor-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.dor-field--search {
  width: 280px;
}
.dor-field--search :deep(.el-input) {
  width: 100%;
}
.dor-vendors {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dor-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .dor-field--search {
    width: 100%;
  }
  .dor-filter__meta {
    margin-left: 0;
  }
  .dor-toolbar-ops {
    padding-left: 0;
    border-left: none;
  }
}

.dor-error {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: var(--el-radius-base, 8px);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 13px;
}

.dor-tree-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
}
.dor-empty {
  flex: 1;
  display: grid;
  place-items: center;
}
.dor-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.dor-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dor-node__name {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}
.dor-node__path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>