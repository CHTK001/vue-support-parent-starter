<script setup lang="ts">
/**
 * 服务管理页
 *
 * 平台侧维护「服务」：服务的名称/编码只描述能力，
 * 真正卖什么由价格规格（月付/季付/年付）决定，卖给谁能用哪些菜单/按钮由配置树决定。
 *
 * 一个服务 = 名称编码 + 多档规格 + 菜单/按钮配置。
 * 规格改价不影响已售订阅（订阅侧存的是快照）。
 */
import { message } from "@repo/core";
import { computed, nextTick, onMounted, ref } from "vue";
import {
  deleteService,
  deleteServicePlan,
  expireTenantServices,
  listForServicePlan,
  pageForMenu,
  pageForService,
  saveService,
  saveServicePlan,
  updateService,
  updateServicePlan,
  updateServicePlanStatus,
  updateServiceStatus,
} from "@pages/system/api/systemApi";
import type { SysMenu, SysService, SysServiceStats, SysServicePlan } from "@pages/system/api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import ReStatCard from "@repo/ui/re-stat-card";
import { Goods, CircleCheck, CircleClose } from "@element-plus/icons-vue";
import { serviceStats } from "@pages/system/api/systemApi";

const tableRef = ref();

const query = ref<{
  page: number;
  pageSize: number;
  sysServiceName?: string;
  sysServiceCode?: string;
  sysServiceStatus?: number;
}>({ page: 1, pageSize: 10 });

async function loadServices({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForService({
    page,
    pageSize,
    sysServiceName: (params.sysServiceName as string) || undefined,
    sysServiceCode: (params.sysServiceCode as string) || undefined,
    sysServiceStatus:
      params.sysServiceStatus === "" || params.sysServiceStatus === undefined
        ? undefined
        : Number(params.sysServiceStatus),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const searchFilters = computed(() => [
  { key: "sysServiceName", label: "服务名称", type: "input" as const, placeholder: "请输入" },
  { key: "sysServiceCode", label: "服务编码", type: "input" as const, placeholder: "请输入" },
  {
    key: "sysServiceStatus", label: "状态", type: "select" as const, placeholder: "请选择",
    options: [
      { label: "启用", value: 0 },
      { label: "禁用", value: 1 },
    ],
  },
]);

/** 服务统计卡；新增/编辑/启停/删除后刷新 */
const serviceStat = ref<SysServiceStats>({});

async function loadServiceStats() {
  try {
    const res = await serviceStats();
    serviceStat.value = res?.data ?? {};
  } catch (e) {
    console.warn("[service] 统计加载失败", e);
  }
}

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const activeTab = ref("basic");
const form = ref<SysService>({ sysServiceStatus: 0, sysServiceSort: 0 });
const statusLoading = ref<number | "">("");
const deleteLoading = ref<number | "">("");
const expiring = ref(false);

/* ---------------- 价格规格 ---------------- */

/** 规格行：persisted 用于判断该走新增还是更新 */
type PlanRow = SysServicePlan & { _persisted?: boolean };

const plans = ref<PlanRow[]>([]);
/** 本次删除的已持久化规格ID，保存时统一提交 */
const removedPlanIds = ref<number[]>([]);
const plansLoading = ref(false);

/* ---------------- 菜单/按钮配置 ---------------- */

type MenuNode = SysMenu & { children: MenuNode[] };

const menuTree = ref<MenuNode[]>([]);
const menuLoading = ref(false);
const menuTreeRef = ref();
/** 全部节点ID，用于 setCheckedKeys 前过滤脏ID */
const menuIdSet = ref<Set<number>>(new Set());

function buildMenuTree(list: SysMenu[]): MenuNode[] {
  const map = new Map<number, MenuNode>();
  for (const item of list) {
    if (item.sysMenuId == null) continue;
    map.set(item.sysMenuId, { ...item, children: [] });
  }
  const roots: MenuNode[] = [];
  for (const node of map.values()) {
    const parent = node.sysMenuPid == null ? undefined : map.get(node.sysMenuPid);
    if (parent && parent.sysMenuId !== node.sysMenuId) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortTree = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => (a.sysMenuSort ?? 0) - (b.sysMenuSort ?? 0));
    nodes.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);
  return roots;
}

async function loadMenuTree() {
  if (menuTree.value.length) {
    // 树已缓存：页签懒加载下每次打开弹窗都要重新回填，否则沿用上次的勾选
    await nextTick();
    fillCheckedKeys();
    return;
  }
  menuLoading.value = true;
  try {
    // 一次取全量扁平菜单（含按钮 type=3），前端自己组树
    const res = await pageForMenu({ page: 1, pageSize: 1000 });
    const list = (res?.data?.data ?? []) as SysMenu[];
    menuIdSet.value = new Set(list.map((item) => item.sysMenuId).filter((id): id is number => id != null));
    menuTree.value = buildMenuTree(list);
    // 树要渲染完才有实例可回填已选节点
    await nextTick();
    fillCheckedKeys();
  } catch (e) {
    message.error((e as Error)?.message ?? "加载菜单失败");
  } finally {
    menuLoading.value = false;
  }
}

function menuLabel(node: MenuNode) {
  return node.sysMenuTitle || node.sysMenuName || `菜单${node.sysMenuId}`;
}

function menuTypeText(node: MenuNode) {
  if (node.sysMenuType === 3) return "按钮";
  if (node.sysMenuType === 1) return "iframe";
  if (node.sysMenuType === 2) return "外链";
  return "菜单";
}

/* ---------------- 规格操作 ---------------- */

function addPlan() {
  plans.value.push({
    sysServicePlanUnit: "MONTH",
    sysServicePlanQuantity: 1,
    sysServicePlanPrice: 0,
    sysServicePlanStatus: 0,
    sysServicePlanSort: plans.value.length,
    _persisted: false,
  });
}

function removePlan(index: number) {
  const row = plans.value[index];
  if (row?._persisted && row.sysServicePlanId != null) {
    removedPlanIds.value.push(row.sysServicePlanId);
  }
  plans.value.splice(index, 1);
}

/* ---------------- 弹窗 ---------------- */

function handleAdd() {
  isEdit.value = false;
  activeTab.value = "basic";
  form.value = { sysServiceStatus: 0, sysServiceSort: 0, sysServiceMenuIds: [] };
  plans.value = [];
  removedPlanIds.value = [];
  dialogVisible.value = true;
  loadMenuTree();
  nextTick(() => fillCheckedKeys());
}

async function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  activeTab.value = "basic";
  form.value = { ...(row as unknown as SysService) };
  plans.value = [];
  removedPlanIds.value = [];
  dialogVisible.value = true;
  loadMenuTree();
  nextTick(() => fillCheckedKeys());
  plansLoading.value = true;
  try {
    const res = await listForServicePlan(form.value.sysServiceId);
    plans.value = (res?.data ?? []).map((item) => ({ ...item, _persisted: true }));
  } catch (e) {
    message.error((e as Error)?.message ?? "加载价格规格失败");
  } finally {
    plansLoading.value = false;
  }
}

function reload() {
  query.value = { ...query.value, page: 1 };
  tableRef.value?.reload();
}

/** 页签切到配置树时回填勾选：懒加载页签在首次渲染后才拿得到树实例 */
function handleTabChange(name: string | number) {
  if (String(name) !== "menus") return;
  nextTick(() => nextTick(() => fillCheckedKeys()));
}

/** 收集配置树选中的节点：全选 + 半选父级，保证租户侧拿到完整导航层级 */
function collectMenuIds(): number[] {
  const tree = menuTreeRef.value;
  if (!tree) return form.value.sysServiceMenuIds ?? [];
  const checked: number[] = tree.getCheckedKeys(false) ?? [];
  const halfChecked: number[] = tree.getHalfCheckedKeys() ?? [];
  return [...new Set([...checked, ...halfChecked])];
}

async function submitPlans(sysServiceId: number) {
  for (const plan of plans.value) {
    const payload: SysServicePlan = {
      ...plan,
      sysServiceId,
      sysServicePlanId: plan._persisted ? plan.sysServicePlanId : undefined,
    };
    if (plan._persisted) {
      await updateServicePlan(payload);
    } else {
      await saveServicePlan(payload);
    }
  }
  for (const planId of removedPlanIds.value) {
    await deleteServicePlan(planId);
  }
}

async function handleSubmit() {
  if (!form.value.sysServiceName) {
    message.warning("请输入服务名称");
    return;
  }
  if (!form.value.sysServiceCode) {
    message.warning("请输入服务编码");
    return;
  }
  if (plans.value.some((plan) => !plan.sysServicePlanName)) {
    message.warning("价格规格的名称不能为空");
    return;
  }
  saving.value = true;
  try {
    form.value.sysServiceMenuIds = collectMenuIds();
    let sysServiceId = form.value.sysServiceId;
    if (isEdit.value) {
      await updateService(form.value);
    } else {
      const res = await saveService(form.value);
      sysServiceId = res?.data?.sysServiceId;
    }
    if (sysServiceId != null) {
      await submitPlans(sysServiceId);
    }
    message.success(isEdit.value ? "服务已更新" : "服务已新增");
    dialogVisible.value = false;
    tableRef.value?.reload();
    void loadServiceStats();
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: Record<string, unknown>) {
  const service = row as unknown as SysService;
  if (!service.sysServiceId) return;
  const next = service.sysServiceStatus === 0 ? 1 : 0;
  const action = next === 1 ? "禁用" : "启用";
  try {
    await message.confirm(`确认${action}服务「${service.sysServiceName}」？`, "提示", `确认${action}`);
  } catch {
    return;
  }
  statusLoading.value = service.sysServiceId;
  try {
    await updateServiceStatus(service.sysServiceId, next);
    message.success(`${action}成功`);
    tableRef.value?.reload();
    void loadServiceStats();
  } catch (e) {
    message.error((e as Error)?.message ?? `${action}失败`);
  } finally {
    statusLoading.value = "";
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const service = row as unknown as SysService;
  if (!service.sysServiceId) return;
  try {
    await message.confirm(
      `确认删除服务「${service.sysServiceName}」？已分配给租户的服务会同时失效。`,
      "提示",
      "确定删除",
    );
  } catch {
    return;
  }
  deleteLoading.value = service.sysServiceId;
  try {
    await deleteService(service.sysServiceId);
    message.success("删除成功");
    tableRef.value?.reload();
    void loadServiceStats();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = "";
  }
}

async function handlePlanStatus(plan: PlanRow) {
  if (plan.sysServicePlanId == null) return;
  const next = plan.sysServicePlanStatus === 0 ? 1 : 0;
  try {
    await updateServicePlanStatus(plan.sysServicePlanId, next);
    plan.sysServicePlanStatus = next;
    message.success(next === 1 ? "已停售" : "已启用");
  } catch (e) {
    message.error((e as Error)?.message ?? "操作失败");
  }
}

/** 与定时任务同一段逻辑：删过期绑定 + 重写租户库服务目录 + 重推菜单 */
async function handleExpire() {
  expiring.value = true;
  try {
    const res = await expireTenantServices();
    const count = res?.data ?? 0;
    if (count > 0) {
      message.success(`已清理 ${count} 条到期订阅`);
    } else {
      message.info("没有到期的服务订阅");
    }
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "清理到期订阅失败");
  } finally {
    expiring.value = false;
  }
}

/** 编辑时把已有配置回填到树上：多选框只认仍存在的节点 */
function fillCheckedKeys() {
  const tree = menuTreeRef.value;
  if (!tree) return;
  const ids = (form.value.sysServiceMenuIds ?? []).filter((id) => menuIdSet.value.has(id));
  tree.setCheckedKeys(ids, false);
}

const columns: ReTableColumn[] = [
  { prop: "sysServiceName", label: "服务名称", minWidth: 150 },
  { prop: "sysServiceCode", label: "服务编码", width: 150 },
  { prop: "sysServiceDesc", label: "描述", minWidth: 180 },
  { prop: "sysServiceSort", label: "排序", width: 70, align: "center" },
  { prop: "sysServiceStatus", label: "状态", width: 90, slot: "status", align: "center" },
  { prop: "action", label: "操作", width: 170, slot: "action", fixed: "right" },
];

onMounted(() => {
  void loadServiceStats();
  tableRef.value?.reload();
});
</script>

<template>
  <div class="system-page">
    <div class="tenant-stat-row">
      <ReStatCard
        size="compact"
        title="服务总数"
        :value="serviceStat.total ?? 0"
        desc="全部服务产品"
        :icon="Goods"
        icon-color="var(--el-color-primary)"
      />
      <ReStatCard
        size="compact"
        title="启用中"
        :value="serviceStat.enabled ?? 0"
        desc="可被订阅"
        :icon="CircleCheck"
        icon-color="var(--el-color-success)"
      />
      <ReStatCard
        size="compact"
        title="已停用"
        :value="serviceStat.disabled ?? 0"
        desc="暂停售卖"
        :icon="CircleClose"
        icon-color="var(--el-color-danger)"
      />
    </div>

    <ReTable
      ref="tableRef"
      table-id="tenant-service-manage"
      :loader="loadServices"
      :columns="columns"
      :pagination="true"
      :params="{}"
      row-key="sysServiceId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
      v-model:search-model="query"
    >
      <template #toolbar>
        <ReButton type="primary" icon="Plus" v-admin @click="handleAdd">新增服务</ReButton>
        <ReButton icon="Clock" :loading="expiring" v-admin @click="handleExpire">清理到期订阅</ReButton>
      </template>
      <template #status="{ row }">
        <ReTag :type="row.sysServiceStatus === 0 ? 'success' : 'danger'" effect="plain" dot>
          {{ row.sysServiceStatus === 0 ? "启用" : "禁用" }}
        </ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" tip="编辑" v-admin @click="handleEdit(row)" />
        <ReButton
          layout="square"
          :type="row.sysServiceStatus === 0 ? 'warning' : 'success'"
          :icon="row.sysServiceStatus === 0 ? 'Stop' : 'CircleCheck'"
          :tip="row.sysServiceStatus === 0 ? '禁用' : '启用'"
          v-admin
          :loading="statusLoading === row.sysServiceId"
          @click="handleStatusChange(row)"
        />
        <ReButton
          layout="square"
          type="danger"
          icon="Delete"
          tip="删除"
          v-admin
          :loading="deleteLoading === row.sysServiceId"
          @click="handleDelete(row)"
        />
      </template>
    </ReTable>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑服务' : '新增服务'"
      width="900"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :footer-hidden="false"
      @ok="handleSubmit"
    >
      <el-tabs v-model="activeTab" class="service-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="基本信息" name="basic">
          <el-form label-width="100px" :model="form">
            <el-form-item label="服务名称" required>
              <ReInput layout="modern" v-model="form.sysServiceName" placeholder="请输入服务名称" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="服务编码" required>
              <ReInput layout="modern" v-model="form.sysServiceCode" placeholder="请输入服务编码（唯一）" maxlength="100" show-word-limit />
            </el-form-item>
            <el-form-item label="描述">
              <ReInput layout="modern" v-model="form.sysServiceDesc" placeholder="请输入服务描述" maxlength="500" show-word-limit />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="form.sysServiceSort" :min="0" :max="9999" />
            </el-form-item>
            <el-form-item label="状态">
              <el-switch
                :model-value="form.sysServiceStatus === 0"
                active-text="启用"
                inactive-text="禁用"
                @update:model-value="(v: string | number | boolean) => (form.sysServiceStatus = v ? 0 : 1)"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="价格规格" name="plans" lazy>
          <div class="plan-tip">
            同一服务按不同时长分别定价；租户订阅时选一档，价格会快照进订阅，之后调价不影响已售订单。
          </div>
          <div v-loading="plansLoading" class="plan-list">
            <div v-for="(plan, index) in plans" :key="plan.sysServicePlanId ?? `new-${index}`" class="plan-row">
              <el-input v-model="plan.sysServicePlanName" placeholder="规格名 如 月付" class="plan-name" />
              <el-input-number v-model="plan.sysServicePlanQuantity" :min="1" :max="999" :controls="false" class="plan-qty" />
              <el-select v-model="plan.sysServicePlanUnit" class="plan-unit">
                <el-option label="天" value="DAY" />
                <el-option label="月" value="MONTH" />
                <el-option label="年" value="YEAR" />
              </el-select>
              <el-input-number v-model="plan.sysServicePlanPrice" :min="0" :precision="2" :controls="false" placeholder="售价" class="plan-price" />
              <el-input-number v-model="plan.sysServicePlanOriginPrice" :min="0" :precision="2" :controls="false" placeholder="划线价" class="plan-price" />
              <el-input-number v-model="plan.sysServicePlanSort" :min="0" :controls="false" placeholder="排序" class="plan-sort" />
              <el-button
                size="small"
                :type="plan.sysServicePlanStatus === 0 ? 'warning' : 'success'"
                plain
                :disabled="plan.sysServicePlanId == null"
                @click="handlePlanStatus(plan)"
              >
                {{ plan.sysServicePlanStatus === 0 ? "停售" : "启用" }}
              </el-button>
              <el-button size="small" type="danger" plain @click="removePlan(index)">删除</el-button>
            </div>
            <div v-if="!plans.length && !plansLoading" class="plan-empty">
              还没有价格规格。没有规格时无法按周期推算到期日，订阅只能手填到期时间。
            </div>
          </div>
          <ReButton icon="Plus" class="mt-3" @click="addPlan">添加规格</ReButton>
        </el-tab-pane>

        <el-tab-pane label="菜单与按钮" name="menus" lazy>
          <div class="plan-tip">
            勾选这个服务包含的菜单；按钮（类型=按钮）单独勾选后才会随服务下发给租户。
          </div>
          <div v-loading="menuLoading" class="menu-tree">
            <el-tree
              ref="menuTreeRef"
              :data="menuTree"
              node-key="sysMenuId"
              show-checkbox
              :default-expand-all="false"
              :props="{ label: 'sysMenuTitle', children: 'children' }"
            >
              <template #default="{ data }">
                <span class="menu-node">
                  <span class="menu-node__label">{{ menuLabel(data) }}</span>
                  <ReTag :type="data.sysMenuType === 3 ? 'warning' : 'info'" effect="plain">
                    {{ menuTypeText(data) }}
                  </ReTag>
                </span>
              </template>
            </el-tree>
            <div v-if="!menuTree.length && !menuLoading" class="plan-empty">没有可配置的菜单</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: 100%;
  box-sizing: border-box;
}

/* 顶部统计卡：响应式网格，紧凑卡片与表格共用一条页面主列 */
.tenant-stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  flex: none;
}

.plan-tip {
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.plan-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
.plan-name {
  width: 140px;
}
.plan-qty {
  width: 70px;
}
.plan-unit {
  width: 80px;
}
.plan-price {
  width: 110px;
}
.plan-sort {
  width: 60px;
}
.plan-empty {
  padding: 24px 0;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.menu-tree {
  max-height: 380px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
.menu-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.menu-node__label {
  color: var(--el-text-color-primary);
}
</style>
