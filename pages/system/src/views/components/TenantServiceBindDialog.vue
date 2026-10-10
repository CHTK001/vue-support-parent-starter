<script setup lang="ts">
/**
 * 租户服务分配弹窗组件
 *
 * 通过 v-model:visible 控制显隐，props 传入目标租户。
 * 服务列表与已绑定项在打开时加载，选中采用行内复选框（ReTable 本地数据模式）。
 * 绑定成功后由后端按订阅重新计算菜单并全量推送给租户端。
 */
import { message } from "@repo/core";
import { ref, watch } from "vue";

import { bindTenantService, getTenant, listForService } from "../../api/systemApi";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { SysService, SysTenant } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const props = defineProps<{
  /** 目标租户 */
  tenant: SysTenant;
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

/** 服务列表（携带本地选中标记 _checked 与到期时间 _validTime） */
type ServiceRow = SysService & { _checked?: boolean; _validTime?: string };

const services = ref<ServiceRow[]>([]);

const loading = ref(false);

/** 打开弹窗时加载服务并回填已绑定项 */
watch(
  () => visible.value,
  async (open) => {
    if (!open) {
      return;
    }
    loading.value = true;
    try {
      const [serviceRes, detailRes] = await Promise.all([listForService(), getTenant(props.tenant.sysTenantId ?? "")]);
      const list = serviceRes?.data ?? [];
      const bound = detailRes?.data?.sysTenantService ?? [];
      services.value = list.map((item) => {
        const hit = bound.find((b) => b.sysServiceId === item.sysServiceId);
        return { ...item, _checked: !!hit, _validTime: hit?.sysTenantServiceValidTime };
      });
    } finally {
      loading.value = false;
    }
  },
);

/** 提交绑定并推送 */
async function handleSubmit() {
  const selected = services.value.filter((item) => item._checked);
  await bindTenantService({
    sysTenantId: props.tenant.sysTenantId,
    serviceBindItems: selected.map((item) => ({
      sysServiceId: item.sysServiceId,
      validTime: item._validTime,
    })),
  });
  message.success("服务绑定成功，已推送菜单重置");
  visible.value = false;
  emit("success");
}

/** 列定义 */
const columns: ReTableColumn[] = [
  { prop: "_checked", label: "选择", width: 70, slot: "select", align: "center" },
  { prop: "sysServiceName", label: "服务名称", minWidth: 140 },
  { prop: "sysServiceCode", label: "编码", width: 110 },
  { prop: "_validTime", label: "到期时间", width: 170, slot: "validTime" },
];
</script>

<template>
  <ReDialog v-model="visible" :title="`分配服务 - ${tenant.sysTenantName}`" width="600px" destroy-on-close>
    <p class="mb-3 text-sm text-[--el-text-color-secondary]">
      绑定服务后自动按订阅重新计算菜单并全量推送给租户端（租户端不可自行维护菜单，只能被分配）
    </p>
    <ReTable
      :data="services"
      :columns="columns"
      row-key="sysServiceId"
      v-loading="loading"
      max-height="360"
      class="rounded border border-solid border-[--el-border-color-lighter]"
    >
      <template #select="{ row }">
        <el-checkbox v-model="row._checked" />
      </template>
      <template #validTime="{ row }">
        <el-date-picker
          v-model="row._validTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="长期有效"
          class="!w-36"
        />
      </template>
    </ReTable>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存并推送</el-button>
    </template>
  </ReDialog>
</template>
