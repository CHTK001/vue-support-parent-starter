<script setup lang="ts">
/**
 * IP 黑白名单页面
 *
 * 顶部 Tab 切换白/黑名单，分页查询 + 新增/编辑/删除 + 状态切换 + IP 归属地查询。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Search, Refresh, LocationInformation } from "@element-plus/icons-vue";
import { pageForIp, saveIp, updateIp, deleteIp, lookupIp } from "../api/systemApi";
import type { SysIpBlackwhite } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/** 当前 Tab：0 白名单 1 黑名单 */
const activeTab = ref<0 | 1>(0);

const query = ref<{
  page: number;
  pageSize: number;
  sysIpIp?: string;
  sysIpStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

async function loadIps({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForIp({
    page,
    pageSize,
    sysIpType: activeTab.value,
    sysIpIp: (params.sysIpIp as string) || undefined,
    sysIpStatus: params.sysIpStatus === "" || params.sysIpStatus === undefined ? undefined : (params.sysIpStatus as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();
const statusLoading = ref<number>(0);
const deleteLoading = ref<number>(0);

function handleTabChange() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/* ============ 归属地查询 ============ */
const locationMap = ref<Record<string, string>>({});

async function handleLookup(row: Record<string, unknown>) {
  const ip = row as unknown as SysIpBlackwhite;
  const addr = locationMap.value[ip.sysIpIp ?? ""];
  if (addr) {
    ElMessageBox.alert(addr, `归属地 - ${ip.sysIpIp}`, { confirmButtonText: "确定" });
    return;
  }
  try {
    const res = await lookupIp(ip.sysIpIp ?? "");
    locationMap.value[ip.sysIpIp ?? ""] = res?.data ?? "未知";
    ElMessageBox.alert(res?.data ?? "未知", `归属地 - ${ip.sysIpIp}`, { confirmButtonText: "确定" });
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "归属地查询失败");
  }
}

/* ============ 新增 / 编辑 ============ */
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysIpBlackwhite>({});

function handleAdd() {
  isEdit.value = false;
  form.value = { sysIpType: activeTab.value, sysIpStatus: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysIpBlackwhite) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysIpIp) {
    ElMessage.warning("请输入 IP 地址 / 网段");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateIp(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveIp(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/* ============ 删除 ============ */
async function handleDelete(row: Record<string, unknown>) {
  const ip = row as unknown as SysIpBlackwhite;
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除 IP「${ip.sysIpIp}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  deleteLoading.value = ip.sysIpId!;
  try {
    await deleteIp(ip.sysIpId!);
    ElMessage.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

/* ============ 状态切换 ============ */
async function handleStatus(row: Record<string, unknown>) {
  const ip = row as unknown as SysIpBlackwhite;
  if (statusLoading.value) return;
  statusLoading.value = ip.sysIpId!;
  try {
    await updateIp({ ...ip, sysIpStatus: ip.sysIpStatus === 0 ? 1 : 0 });
    ElMessage.success(ip.sysIpStatus === 0 ? "已禁用" : "已启用");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    statusLoading.value = 0;
  }
}

const columns: ReTableColumn[] = [
  { prop: "sysIpIp", label: "IP 地址 / 网段", minWidth: 180 },
  { prop: "sysIpType", label: "类型", width: 100, slot: "type", align: "center" },
  { prop: "sysIpStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysIpRemark", label: "备注", minWidth: 160, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 240, slot: "action", fixed: "right" },
];

onMounted(() => {
  tableRef.value?.reload();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <el-tabs v-model="activeTab" class="ip-tabs" @tab-change="handleTabChange">
        <el-tab-pane :label="`白名单`" :name="0" />
        <el-tab-pane :label="`黑名单`" :name="1" />
      </el-tabs>

      <ReSearch :is-expanded="true" filter-mode="data" :add-text="activeTab === 0 ? '新增白名单' : '新增黑名单'" @add="handleAdd">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysIpIp"
            placeholder="IP 地址 / 网段"
            clearable
            class="!w-56"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysIpStatus"
            placeholder="状态"
            clearable
            class="!w-32"
            :data="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-ip"
        :loader="loadIps"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysIpId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
      >
        <template #type="{ row }">
          <ReTag :type="row.sysIpType === 0 ? 'success' : 'danger'" effect="plain" size="small">
            {{ row.sysIpType === 0 ? '白名单' : '黑名单' }}
          </ReTag>
        </template>
        <template #status="{ row }">
          <ReSwitch
            layout="modern"
            :model-value="row.sysIpStatus === 0"
            :disabled="statusLoading === row.sysIpId"
            @update:model-value="() => handleStatus(row)"
          />
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="info" :icon="LocationInformation" v-admin @click="handleLookup(row)">归属地</ReButton>
          <ReButton layout="square" type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="square" type="danger" icon="Delete" v-admin :loading="deleteLoading === row.sysIpId" @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑 IP' : (activeTab === 0 ? '新增白名单' : '新增黑名单')"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="IP 地址" required>
          <ReInput layout="modern" v-model="form.sysIpIp" placeholder="单个 IP 或 CIDR，如 192.168.1.0/24" maxlength="64" />
        </el-form-item>
        <el-form-item label="类型">
          <el-segmented
            v-model="form.sysIpType"
            :options="[
              { label: '白名单', value: 0 },
              { label: '黑名单', value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented
            v-model="form.sysIpStatus"
            :options="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysIpRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
.ip-tabs {
  margin-bottom: 4px;
}
</style>
