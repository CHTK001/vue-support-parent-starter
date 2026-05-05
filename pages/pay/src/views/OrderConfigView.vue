<template>
  <PmPageShell page-class="config-page">
    <template v-if="isAdmin">
      <PmSurface
        eyebrow="Partition Control"
        title="订单配置管理"
        description="只有超管和管理员可见，用于维护订单/流水分表策略、自动建表和主表迁移窗口。"
      >
        <template #actions>
          <ScButton :icon="RefreshRight" @click="loadConfigs">刷新</ScButton>
        </template>
      </PmSurface>

      <PmStatGrid>
        <PmStatCard label="配置项" :hint="'当前支持订单主表和交易流水主表两类策略。'">
          <template #value>{{ configs.length }}</template>
        </PmStatCard>
        <PmStatCard label="自动建表" :hint="'按计划预创建未来分区表。'">
          <template #value>{{ enabledCreateCount }}</template>
        </PmStatCard>
        <PmStatCard label="自动迁移" :hint="'按迁移窗口把主表历史数据转移到分表。'">
          <template #value>{{ enabledMigrateCount }}</template>
        </PmStatCard>
      </PmStatGrid>

      <PmPanel title="分表策略" description="使用卡片编辑，不再把参数铺成一整张杂乱大表。">
        <div class="pm-config-grid">
          <ScCard v-for="item in configs" :key="item.businessType" shadow="never" class="pm-config-card">
            <template #header>
              <div class="pm-config-card__header">
                <div>
                  <strong>{{ item.businessType === "ORDER" ? "订单主表" : "交易流水主表" }}</strong>
                  <p>{{ item.sourceTable }} -> {{ item.partitionPrefix }}_YYYYMM</p>
                </div>
                <ScButton type="primary" text @click="previewConfig(item.businessType)">预览</ScButton>
              </div>
            </template>

            <div class="pm-switch-grid">
              <ScSwitch v-model="item.autoCreateEnabled" layout="card" active-text="自动建表开启" inactive-text="自动建表关闭" />
              <ScSwitch v-model="item.autoMigrateEnabled" layout="card" active-text="自动迁移开启" inactive-text="自动迁移关闭" />
              <ScSwitch v-model="item.keepSourceData" layout="card" active-text="主表数据保留" inactive-text="迁移后删除主表数据" />
            </div>

            <div class="pm-form-grid">
              <el-form-item label="分表粒度"><ScSelect v-model="item.partitionGranularity"><ScOption label="按月" value="MONTH" /><ScOption label="按天" value="DAY" /></ScSelect></el-form-item>
              <el-form-item label="保留天数"><el-input-number v-model="item.retentionDays" :min="1" :max="3650" /></el-form-item>
              <el-form-item label="提前建表天数"><el-input-number v-model="item.createAheadDays" :min="0" :max="365" /></el-form-item>
              <el-form-item label="迁移阈值天数"><el-input-number v-model="item.migrateBeforeDays" :min="1" :max="3650" /></el-form-item>
              <el-form-item label="创建任务Key"><el-input v-model="item.createTaskKey" readonly /></el-form-item>
              <el-form-item label="迁移任务Key"><el-input v-model="item.migrateTaskKey" readonly /></el-form-item>
              <el-form-item label="备注" class="pm-form-span-2"><el-input v-model="item.remark" type="textarea" :rows="3" placeholder="记录策略说明，例如按月分表、半年迁移" /></el-form-item>
            </div>

            <div class="pm-config-card__footer">
              <ScButton :loading="savingType === item.businessType" type="primary" @click="saveConfig(item)">保存配置</ScButton>
            </div>
          </ScCard>
        </div>
      </PmPanel>

      <ScDialog v-model="previewVisible" title="分表预览" width="640px">
        <div v-if="preview" class="pm-preview-grid">
          <div class="pm-note"><strong>源表：</strong>{{ preview.sourceTable }}</div>
          <div class="pm-note"><strong>下一个分表：</strong>{{ preview.nextPartitionTable }}</div>
          <div class="pm-note"><strong>迁移目标表：</strong>{{ preview.migrateTargetTable }}</div>
          <div class="pm-note"><strong>迁移阈值时间：</strong>{{ preview.migrateBeforeTime || "-" }}</div>
        </div>
      </ScDialog>
    </template>

    <div v-else class="pm-empty">
      当前账号不是超管或管理员，不能查看订单配置管理。
    </div>
  </PmPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { getOrderPartitionConfigs, getOrderPartitionPreview, updateOrderPartitionConfig } from "../api/payment";
import type { OrderPartitionConfig, OrderPartitionPreview } from "../types/payment";
import { usePaymentRoleGuard } from "../composables/usePaymentRoleGuard";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmPanel from "../components/layout/PmPanel.vue";

const { isAdmin } = usePaymentRoleGuard();
const configs = ref<OrderPartitionConfig[]>([]);
const preview = ref<OrderPartitionPreview | null>(null);
const previewVisible = ref(false);
const savingType = ref("");

const enabledCreateCount = computed(() => configs.value.filter((item) => item.autoCreateEnabled).length);
const enabledMigrateCount = computed(() => configs.value.filter((item) => item.autoMigrateEnabled).length);

async function loadConfigs() {
  if (!isAdmin) return;
  const res = await getOrderPartitionConfigs();
  configs.value = res.data || [];
}

async function previewConfig(businessType: string) {
  const res = await getOrderPartitionPreview(businessType);
  preview.value = res.data;
  previewVisible.value = true;
}

async function saveConfig(item: OrderPartitionConfig) {
  savingType.value = item.businessType;
  try {
    await updateOrderPartitionConfig(item.businessType, item);
    ElMessage.success("配置已保存");
    await loadConfigs();
  } finally {
    savingType.value = "";
  }
}

onMounted(loadConfigs);
</script>

<style scoped>
.config-page {
  background: linear-gradient(180deg, #f8f5fc 0%, #faf8fd 180px, #fcfbfd 100%);
}
</style>
