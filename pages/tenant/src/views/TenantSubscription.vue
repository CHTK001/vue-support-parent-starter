<script setup lang="ts">
/**
 * 租户订阅页
 *
 * 订阅账本：谁买了什么服务、买的哪档规格、到期时间、实收多少、走的什么收款方式。
 * 录入订阅 = 管理员在后台直接登记 + 线下收款记账；不接支付渠道，
 * 只把金额与收款方式落库，便于事后对账。
 *
 * 订阅到期后由后端定时任务清理，页面上的「清理到期订阅」用于立即执行同一段逻辑。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import {
  expireTenantServices,
  listForService,
  listForTenant,
  pageForSubscription,
} from "@pages/system/api/systemApi";
import type { SysService, SysTenant, SysTenantService } from "@pages/system/api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import TenantServiceBindDialog from "@pages/system/views/components/TenantServiceBindDialog.vue";

const tableRef = ref();
const tenants = ref<SysTenant[]>([]);
const services = ref<SysService[]>([]);
const selectedTenantId = ref<string>("");
const bindVisible = ref(false);
const bindTenant = ref<SysTenant>({});
const expiring = ref(false);

const query = ref<{ page: number; pageSize: number; sysTenantId?: string; sysServiceId?: number }>({
  page: 1,
  pageSize: 10,
});

const searchFilters = computed(() => [
  {
    key: "sysTenantId",
    label: "租户",
    type: "select" as const,
    placeholder: "全部租户",
    options: tenants.value.map((tenant) => ({
      label: tenant.sysTenantName || tenant.sysTenantCode || tenant.sysTenantId,
      value: tenant.sysTenantId,
    })),
  },
  {
    key: "sysServiceId",
    label: "服务",
    type: "select" as const,
    placeholder: "全部服务",
    options: services.value.map((service) => ({
      label: service.sysServiceName,
      value: service.sysServiceId,
    })),
  },
]);

/** 当前已加载行（本页），用于「本页实收合计」 */
const pageRows = ref<SysTenantService[]>([]);

/** 本页金额合计：分页接口没有后台汇总，只统计当前页已加载的行并如实标注范围 */
const pageAmountTotal = computed(() =>
  pageRows.value.reduce((sum, row) => sum + (Number(row.sysTenantServicePayAmount) || 0), 0),
);

async function loadSubscriptions({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForSubscription({
    page,
    pageSize,
    sysTenantId: (params.sysTenantId as string) || undefined,
    sysServiceId: (params.sysServiceId as number) || undefined,
  });
  pageRows.value = (res?.data?.data ?? []) as SysTenantService[];
  return { total: res?.data?.total ?? 0, data: pageRows.value as unknown as Record<string, unknown>[] };
}

const payChannelText: Record<string, string> = {
  OFFLINE: "线下收款",
  ONLINE: "线上支付",
  FREE: "赠送",
};

function channelText(channel?: string) {
  if (!channel) return "线下收款";
  return payChannelText[channel] ?? channel;
}

/** 到期状态：超过 30 天视为正常；30 天内视为临期；已到期前端仍展示，后端清理任务会随后处理 */
function deadlineState(validTime?: string): { type: "success" | "warning" | "danger" | "info"; text: string } {
  if (!validTime) return { type: "info", text: "长期有效" };
  const time = new Date(String(validTime).replace(/-/g, "/")).getTime();
  if (Number.isNaN(time)) return { type: "info", text: String(validTime) };
  const now = Date.now();
  const days = Math.ceil((time - now) / 86_400_000);
  if (days < 0) return { type: "danger", text: `已过期 ${Math.abs(days)} 天` };
  if (days <= 30) return { type: "warning", text: `临期 ${days} 天` };
  return { type: "success", text: "正常" };
}

/** 选中租户后打开录入弹窗：弹窗内是「该租户的完整订阅清单」 */
async function openBind() {
  if (!selectedTenantId.value) {
    message.warning("请先选择租户");
    return;
  }
  const tenant = tenants.value.find((item) => item.sysTenantId === selectedTenantId.value);
  if (!tenant) {
    message.warning("租户不存在，请刷新后重试");
    return;
  }
  bindTenant.value = tenant;
  bindVisible.value = true;
}

/** 行内「续费/配置」：直接对该租户打开清单 */
function openBindForRow(row: Record<string, unknown>) {
  const subscription = row as unknown as SysTenantService;
  const tenant = tenants.value.find((item) => item.sysTenantId === subscription.sysTenantId);
  if (!tenant) {
    message.warning("租户信息未加载，请刷新后重试");
    return;
  }
  bindTenant.value = tenant;
  bindVisible.value = true;
}

function handleSuccess() {
  tableRef.value?.reload();
  void loadSubscriptionServiceOptions();
}

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
  { prop: "sysTenantName", label: "租户", minWidth: 130 },
  { prop: "sysServiceName", label: "服务", minWidth: 130 },
  { prop: "sysTenantServicePlanName", label: "规格", width: 120 },
  { prop: "sysTenantServiceValidTime", label: "到期时间", width: 120, slot: "validTime" },
  { prop: "sysTenantServicePayAmount", label: "实收金额", width: 110, slot: "payAmount" },
  { prop: "sysTenantServicePayChannel", label: "收款方式", width: 110, slot: "channel" },
  { prop: "sysTenantServicePayTime", label: "收款时间", width: 160 },
  { prop: "sysTenantServicePayRemark", label: "备注", minWidth: 140 },
  { prop: "action", label: "操作", width: 100, slot: "action", fixed: "right" },
];

onMounted(async () => {
  try {
    const res = await listForTenant();
    tenants.value = res?.data ?? [];
  } catch (e) {
    message.error((e as Error)?.message ?? "加载租户列表失败");
  }
  tableRef.value?.reload();
});
</script>

<template>
  <div class="system-page">
    <ReTable
      ref="tableRef"
      table-id="tenant-subscription"
      :loader="loadSubscriptions"
      :columns="columns"
      :pagination="true"
      :params="{}"
      row-key="sysTenantServiceId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
      v-model:search-model="query"
    >
      <template #toolbar>
        <el-select v-model="selectedTenantId" placeholder="选择租户" clearable filterable class="!w-52">
          <el-option
            v-for="tenant in tenants"
            :key="tenant.sysTenantId"
            :label="tenant.sysTenantName || tenant.sysTenantCode || tenant.sysTenantId"
            :value="tenant.sysTenantId ?? ''"
          />
        </el-select>
        <ReButton type="primary" icon="Plus" v-admin @click="openBind">录入订阅</ReButton>
        <ReButton icon="Clock" :loading="expiring" v-admin @click="handleExpire">清理到期订阅</ReButton>
      </template>
      <template #validTime="{ row }">
        {{ row.sysTenantServiceValidTime || "长期有效" }}
      </template>
      <template #payAmount="{ row }">
        <span v-if="row.sysTenantServicePayAmount != null">¥{{ row.sysTenantServicePayAmount }}</span>
        <span v-else class="text-[--el-text-color-secondary]">未记账</span>
      </template>
      <template #channel="{ row }">
        <ReTag :type="row.sysTenantServicePayChannel === 'ONLINE' ? 'primary' : 'info'" effect="plain">
          {{ channelText(row.sysTenantServicePayChannel) }}
        </ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" tip="续费/配置" v-admin @click="openBindForRow(row)" />
      </template>
    </ReTable>

    <TenantServiceBindDialog v-model:visible="bindVisible" :tenant="bindTenant" @success="handleSuccess" />
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
</style>
