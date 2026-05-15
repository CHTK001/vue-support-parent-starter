<template>
  <PmPageShell page-class="config-page">
    <template #default>
      <PmSurface
        eyebrow="分表控制"
        title="订单配置管理"
        description="用于维护订单/流水分表策略、自动建表和主表迁移窗口。"
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
                <div class="pm-config-card__title-group">
                  <strong>{{ item.businessType === "ORDER" ? "订单主表" : "交易流水主表" }}</strong>
                  <p>{{ item.sourceTable }} → {{ item.partitionPrefix }}_YYYYMM</p>
                </div>
                <div class="pm-config-card__actions">
                  <span :class="['pm-config-card__status-dot', item.autoCreateEnabled || item.autoMigrateEnabled ? 'is-active' : '']" />
                  <ScButton type="primary" text @click="previewConfig(item.businessType)">预览</ScButton>
                </div>
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

  </PmPageShell>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { getOrderPartitionConfigs, getOrderPartitionPreview, updateOrderPartitionConfig } from "../api/payment";
import type { OrderPartitionConfig, OrderPartitionPreview } from "../types/payment";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import { ScButton } from "@repo/components/ScButton";
import { ScCard } from "@repo/components/ScCard";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { ScSelect } from "@repo/components/ScSelect";
import { ScOption } from "@repo/components/ScOption";
import { ScDialog } from "@repo/components/ScDialog";

const configs = ref<OrderPartitionConfig[]>([]);
const preview = ref<OrderPartitionPreview | null>(null);
const previewVisible = ref(false);
const savingType = ref("");

const enabledCreateCount = computed(() => configs.value.filter((item) => item.autoCreateEnabled).length);
const enabledMigrateCount = computed(() => configs.value.filter((item) => item.autoMigrateEnabled).length);

async function loadConfigs() {
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

/* ── 配置卡片 ── */
.pm-config-card {
  background: var(--pm-surface-card, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--pm-border-radius-md, 16px);
  border: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  transition: all 0.3s ease;
}
.pm-config-card:hover {
  border-color: var(--pm-color-brand-light, #eef2ff);
  box-shadow: var(--pm-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
}

.pm-config-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.pm-config-card__title-group strong {
  font-size: 15px;
  color: var(--pm-text-primary, #070b15);
}
.pm-config-card__title-group p {
  margin: 4px 0 0;
  font-size: var(--pm-font-size-sm, 12.5px);
  color: var(--pm-text-muted, #8b97a9);
  font-family: "SF Mono", "Fira Code", monospace;
}

.pm-config-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-config-card__status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: all 0.3s ease;
}
.pm-config-card__status-dot.is-active {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.pm-config-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pm-switch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.pm-config-card__footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--pm-border-color-light, rgba(233, 238, 246, 0.6));
  display: flex;
  justify-content: flex-end;
}

.pm-preview-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
}
.pm-preview-grid .pm-note {
  display: flex;
  gap: 8px;
  font-size: var(--pm-font-size-sm, 12.5px);
  color: var(--pm-text-muted, #8b97a9);
}
.pm-preview-grid .pm-note strong {
  white-space: nowrap;
  color: var(--pm-text-primary, #070b15);
}
</style>
