<script setup lang="ts">
/**
 * 设备组织 —— 厂商侧的组织架构树。
 *
 * 数据来自 device-starter 的 `GET /api/device/org/tree`，返回**扁平**的
 * `List<DeviceOrganization>`（id / parentId / name / path / vendor），不含 children。
 * 因此本页按 parentId 在前端建树——设备工作台 DeviceView 是把该扁平列表直接
 * 赋给 el-tree 的，层级并不能真正嵌套，这里不做同样处理。
 *
 * `POST /api/device/org/sync` 触发向厂商侧同步组织，本页提供该入口。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import deviceApi from "@pages/device/src/api/deviceApi";

/** 与后端 DeviceOrganization 实体字段一一对应 */
interface DeviceOrganization {
  deviceOrganizationId: string;
  deviceOrganizationParentId?: string;
  deviceOrganizationName: string;
  deviceOrganizationPath?: string;
  deviceOrganizationVendor?: string;
}

/** 前端树节点：在实体字段外补 children 与可搜索的扁平文本 */
interface OrgTreeNode {
  deviceOrganizationId: string;
  deviceOrganizationName: string;
  deviceOrganizationVendor?: string;
  deviceOrganizationPath?: string;
  /** 子树内所有名称拼成的检索串（含自身），供 el-tree filter 匹配 */
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

/** 各厂商的节点数概览 */
const vendorSummary = computed(() => {
  const m = new Map<string, number>();
  orgs.value.forEach((o) => {
    const v = o.deviceOrganizationVendor || "未知厂商";
    m.set(v, (m.get(v) || 0) + 1);
  });
  return [...m.entries()].map(([vendor, count]) => ({ vendor, count }));
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

/** 拉取组织树 */
async function fetchTree() {
  loading.value = true;
  loadError.value = "";
  try {
    orgs.value = (await deviceApi.getOrgTree()) || [];
    tree.value = buildTree(orgs.value);
    if (keyword.value) treeRef.value?.filter(keyword.value);
  } catch (e) {
    orgs.value = [];
    tree.value = [];
    loadError.value = e instanceof Error ? e.message : String(e);
    ElMessage.error(`组织架构加载失败：${loadError.value}`);
  } finally {
    loading.value = false;
  }
}

/** 触发厂商侧组织同步 */
async function onSync() {
  syncing.value = true;
  try {
    await deviceApi.syncOrg();
    ElMessage.success("组织同步已触发");
    await fetchTree();
  } catch (e) {
    ElMessage.error(`组织同步失败：${e instanceof Error ? e.message : e}`);
  } finally {
    syncing.value = false;
  }
}

onMounted(fetchTree);
</script>

<template>
  <div class="dor">
    <div class="page-header">
      <div>
        <h1 class="page-title">设备组织</h1>
        <p class="page-desc">厂商侧组织架构 · 共 {{ orgs.length }} 个组织节点</p>
      </div>
      <div class="page-actions">
        <el-button :loading="syncing" @click="onSync">同步组织</el-button>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>加载失败：{{ loadError }}</span>
      <el-button size="small" @click="fetchTree">重试</el-button>
    </div>

    <div v-if="vendorSummary.length" class="vendor-row">
      <el-tag v-for="v in vendorSummary" :key="v.vendor" type="info" effect="plain">
        {{ v.vendor }} · {{ v.count }}
      </el-tag>
    </div>

    <div class="as-panel">
      <div class="tree-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索组织"
          clearable
          :prefix-icon="'Search'"
          style="max-width: 260px"
          @input="(v: string) => treeRef?.filter(v)"
        />
      </div>

      <el-tree
        ref="treeRef"
        v-loading="loading"
        :data="tree"
        :props="TREE_PROPS"
        node-key="deviceOrganizationId"
        :filter-node-method="(n: OrgTreeNode, v: string) => !!n.searchText?.includes(v)"
        default-expand-all
        :expand-on-click-node="false"
        empty-text="暂无组织节点"
      >
        <template #default="{ data }">
          <span class="node">
            <span class="node-name">{{ data.deviceOrganizationName }}</span>
            <el-tag v-if="data.deviceOrganizationVendor" size="small" type="info" effect="plain">
              {{ data.deviceOrganizationVendor }}
            </el-tag>
            <span v-if="data.deviceOrganizationPath" class="node-path">
              {{ data.deviceOrganizationPath }}
            </span>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}

.page-desc {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 13px;
}

.vendor-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tree-bar {
  margin-bottom: 12px;
}

.node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-name {
  font-weight: 500;
}

.node-path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>