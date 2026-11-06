<script setup lang="ts">
/**
 * 服务目录面板
 *
 * 平台侧维护「服务」：租户分配菜单/模块时以服务为单位订阅。
 * 这里是服务的增删改查与启停；分配动作在租户列表的「分配服务」里完成。
 *
 * 服务到期后，租户库里的服务记录由后端到期任务清理，
 * 面板上的「清理到期订阅」按钮用于立即执行同一段逻辑（验收/排障）。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteService,
  expireTenantServices,
  pageForService,
  saveService,
  updateService,
  updateServiceStatus,
} from "../../api/systemApi";
import type { SysService } from "../../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

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

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysService>({ sysServiceStatus: 0, sysServiceSort: 0 });
const statusLoading = ref<number | "">("");
const deleteLoading = ref<number | "">("");
const expiring = ref(false);

function handleAdd() {
  isEdit.value = false;
  form.value = { sysServiceStatus: 0, sysServiceSort: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysService) };
  dialogVisible.value = true;
}

function reload() {
  query.value = { ...query.value, page: 1 };
  tableRef.value?.reload();
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
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateService(form.value);
      message.success("服务已更新");
    } else {
      await saveService(form.value);
      message.success("服务已新增");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
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
    await ElMessageBox.confirm(`确认${action}服务「${service.sysServiceName}」？`, "提示", {
      type: "warning",
      confirmButtonText: `确认${action}`,
    });
  } catch {
    return;
  }
  statusLoading.value = service.sysServiceId;
  try {
    await updateServiceStatus(service.sysServiceId, next);
    message.success(`${action}成功`);
    tableRef.value?.reload();
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
    await ElMessageBox.confirm(
      `确认删除服务「${service.sysServiceName}」？已分配给租户的服务会同时失效。`,
      "提示",
      { type: "warning", confirmButtonText: "确定删除" },
    );
  } catch {
    return;
  }
  deleteLoading.value = service.sysServiceId;
  try {
    await deleteService(service.sysServiceId);
    message.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = "";
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

const columns: ReTableColumn[] = [
  { prop: "sysServiceName", label: "服务名称", minWidth: 150 },
  { prop: "sysServiceCode", label: "服务编码", width: 160 },
  { prop: "sysServiceDesc", label: "描述", minWidth: 180 },
  { prop: "sysServiceSort", label: "排序", width: 80, align: "center" },
  { prop: "sysServiceStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "action", label: "操作", width: 170, slot: "action", fixed: "right" },
];

onMounted(() => {
  tableRef.value?.reload();
});
</script>

<template>
  <ReTable
    ref="tableRef"
    table-id="system-service-catalog"
    :loader="loadServices"
    :columns="columns"
    :pagination="true"
    :params="{}"
    row-key="sysServiceId"
    v-model:page="query.page"
    v-model:page-size="query.pageSize"
    :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
    :search-gap="16"
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
    width="560"
    :close-on-click-modal="false"
    destroy-on-close
    layout="modern"
    compact
    :confirm-loading="saving"
    :footer-hidden="false"
    @ok="handleSubmit"
  >
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
  </ReDialog>
</template>
