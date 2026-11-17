<script setup lang="ts">
/**
 * 租户服务分配弹窗组件
 *
 * 通过 v-model:visible 控制显隐，props 传入目标租户。
 * 服务、价格规格、已绑定项在打开时加载，选中采用行内复选框（ReTable 本地数据模式）。
 *
 * 一行 = 一次订阅：选服务、选时长规格、填实收金额。
 * 不传到期时间时由后端按规格周期推算（续费是叠加，不是覆盖）。
 * 收款方式当前只有线下（OFFLINE），支付渠道暂不接入，只记账。
 */
import { message } from "@repo/core";
import { ref, watch } from "vue";

import { bindTenantService, getTenant, listForService, listForServicePlan } from "../../api/systemApi";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { SysService, SysServicePlan, SysTenant } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const props = defineProps<{
  /** 目标租户 */
  tenant: SysTenant;
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

/** 服务行：携带本地选中标记、所选规格、实收金额与收款备注 */
type ServiceRow = SysService & {
  _checked?: boolean;
  _validTime?: string;
  _planId?: number;
  _payAmount?: number | null;
  _payRemark?: string;
  /** 该服务可选规格 */
  _plans?: SysServicePlan[];
};

const services = ref<ServiceRow[]>([]);

const loading = ref(false);

const saving = ref(false);

/** 规格按服务分组，一次请求拿全，避免每个服务各请求一次 */
function groupPlans(plans: SysServicePlan[]) {
  const map = new Map<number, SysServicePlan[]>();
  for (const plan of plans) {
    if (plan.sysServiceId == null) continue;
    const list = map.get(plan.sysServiceId) ?? [];
    list.push(plan);
    map.set(plan.sysServiceId, list);
  }
  return map;
}

/** 规格的展示文案：名称 + 周期 + 价格 */
function planLabel(plan: SysServicePlan) {
  const unitText: Record<string, string> = { DAY: "天", MONTH: "个月", YEAR: "年" };
  const unit = unitText[plan.sysServicePlanUnit ?? "MONTH"] ?? (plan.sysServicePlanUnit || "个月");
  const quantity = plan.sysServicePlanQuantity ?? 1;
  const price = plan.sysServicePlanPrice ?? 0;
  return `${plan.sysServicePlanName || "默认"}（${quantity}${unit} / ¥${price}）`;
}

/** 选中规格时把售价带进实收金额，管理员可再手改（如打折） */
function handlePlanChange(row: ServiceRow, planId?: number) {
  row._planId = planId;
  const plan = (row._plans ?? []).find((item) => item.sysServicePlanId === planId);
  if (plan) {
    row._payAmount = plan.sysServicePlanPrice ?? 0;
  }
}

/** 打开弹窗时加载服务与已绑定项 */
watch(
  () => visible.value,
  async (open) => {
    if (!open) {
      return;
    }
    loading.value = true;
    try {
      const [serviceRes, planRes, detailRes] = await Promise.all([
        listForService(),
        listForServicePlan(),
        getTenant(props.tenant.sysTenantId ?? ""),
      ]);
      const planMap = groupPlans(planRes?.data ?? []);
      const list = serviceRes?.data ?? [];
      const bound = detailRes?.data?.sysTenantService ?? [];
      services.value = list.map((item) => {
        const hit = bound.find((b) => b.sysServiceId === item.sysServiceId);
        const plans = planMap.get(item.sysServiceId ?? -1) ?? [];
        return {
          ...item,
          _plans: plans,
          _checked: !!hit,
          _validTime: hit?.sysTenantServiceValidTime,
          _planId: hit?.sysTenantServicePlanId ?? plans[0]?.sysServicePlanId,
          _payAmount: hit?.sysTenantServicePayAmount ?? plans[0]?.sysServicePlanPrice ?? null,
          _payRemark: hit?.sysTenantServicePayRemark,
        };
      });
    } catch (e) {
      message.error((e as Error)?.message ?? "加载服务失败");
    } finally {
      loading.value = false;
    }
  },
);

/** 提交绑定并推送 */
async function handleSubmit() {
  const selected = services.value.filter((item) => item._checked);
  saving.value = true;
  try {
    await bindTenantService({
      sysTenantId: props.tenant.sysTenantId,
      serviceBindItems: selected.map((item) => ({
        sysServiceId: item.sysServiceId,
        validTime: item._validTime || undefined,
        sysServicePlanId: item._planId,
        payAmount: item._payAmount ?? undefined,
        payChannel: "OFFLINE",
        payRemark: item._payRemark,
      })),
    });
    message.success("订阅已保存，已推送菜单重置");
    visible.value = false;
    emit("success");
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/** 列定义 */
const columns: ReTableColumn[] = [
  { prop: "_checked", label: "选择", width: 60, slot: "select", align: "center" },
  { prop: "sysServiceName", label: "服务", width: 140 },
  { prop: "_planId", label: "时长规格", width: 210, slot: "plan" },
  { prop: "_validTime", label: "到期时间", width: 150, slot: "validTime" },
  { prop: "_payAmount", label: "实收金额", width: 130, slot: "payAmount" },
  { prop: "_payRemark", label: "收款备注", minWidth: 140, slot: "payRemark" },
];
</script>

<template>
  <ReDialog v-model="visible" :title="`分配服务 - ${tenant.sysTenantName}`" width="960px" destroy-on-close>
    <p class="mb-3 text-sm text-[--el-text-color-secondary]">
      一个服务按所选规格计算时长，不填到期时间时由规格周期推算（续费叠加到现有到期日）。
      收款走线下，金额只记账，暂不接支付渠道。
    </p>
    <ReTable
      :data="services"
      :columns="columns"
      row-key="sysServiceId"
      v-loading="loading"
      max-height="420"
      class="rounded border border-solid border-[--el-border-color-lighter]"
    >
      <template #select="{ row }">
        <el-checkbox v-model="row._checked" />
      </template>
      <template #plan="{ row }">
        <el-select
          :model-value="row._planId"
          size="small"
          placeholder="选择规格"
          class="!w-48"
          :disabled="!row._checked"
          @update:model-value="(v: number) => handlePlanChange(row, v)"
        >
          <el-option
            v-for="plan in row._plans"
            :key="plan.sysServicePlanId"
            :label="planLabel(plan)"
            :value="plan.sysServicePlanId ?? 0"
          />
        </el-select>
      </template>
      <template #validTime="{ row }">
        <el-date-picker
          v-model="row._validTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="按规格推算"
          size="small"
          class="!w-32"
        />
      </template>
      <template #payAmount="{ row }">
        <el-input-number
          v-model="row._payAmount"
          :min="0"
          :precision="2"
          :controls="false"
          size="small"
          class="!w-28"
          placeholder="实收"
        />
      </template>
      <template #payRemark="{ row }">
        <el-input v-model="row._payRemark" size="small" placeholder="流水号/发票号" />
      </template>
    </ReTable>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">保存并推送</el-button>
    </template>
  </ReDialog>
</template>
