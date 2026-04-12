<template>
  <section class="payment-page config-page">
    <template v-if="isAdmin">
      <header class="payment-surface">
        <div>
          <p class="payment-surface__eyebrow">Partition Control</p>
          <h1 class="payment-surface__title">订单配置管理</h1>
          <p class="payment-surface__desc">只有超管和管理员可见，用于维护订单/流水分表策略、自动建表和主表迁移窗口。</p>
        </div>
        <div class="payment-surface__actions">
          <el-button :icon="RefreshRight" @click="loadConfigs">刷新</el-button>
        </div>
      </header>

      <section class="payment-stat-grid">
        <article class="payment-stat">
          <span class="payment-stat__label">配置项</span>
          <strong class="payment-stat__value">{{ configs.length }}</strong>
          <span class="payment-stat__hint">当前支持订单主表和交易流水主表两类策略。</span>
        </article>
        <article class="payment-stat">
          <span class="payment-stat__label">自动建表</span>
          <strong class="payment-stat__value">{{ enabledCreateCount }}</strong>
          <span class="payment-stat__hint">按计划预创建未来分区表。</span>
        </article>
        <article class="payment-stat">
          <span class="payment-stat__label">自动迁移</span>
          <strong class="payment-stat__value">{{ enabledMigrateCount }}</strong>
          <span class="payment-stat__hint">按迁移窗口把主表历史数据转移到分表。</span>
        </article>
      </section>

      <section class="payment-panel">
        <div class="payment-panel__head">
          <div>
            <p class="payment-panel__eyebrow">Config Cards</p>
            <h2 class="payment-panel__title">分表策略</h2>
            <p class="payment-panel__desc">使用卡片编辑，不再把参数铺成一整张杂乱大表。</p>
          </div>
        </div>

        <div class="config-grid">
          <el-card v-for="item in configs" :key="item.businessType" shadow="never" class="config-card">
            <template #header>
              <div class="config-card__header">
                <div>
                  <strong>{{ item.businessType === "ORDER" ? "订单主表" : "交易流水主表" }}</strong>
                  <p>{{ item.sourceTable }} -> {{ item.partitionPrefix }}_YYYYMM</p>
                </div>
                <el-button type="primary" text @click="previewConfig(item.businessType)">预览</el-button>
              </div>
            </template>

            <div class="setting-switch-grid">
              <ScSwitch v-model="item.autoCreateEnabled" layout="card" active-text="自动建表开启" inactive-text="自动建表关闭" />
              <ScSwitch v-model="item.autoMigrateEnabled" layout="card" active-text="自动迁移开启" inactive-text="自动迁移关闭" />
              <ScSwitch v-model="item.keepSourceData" layout="card" active-text="主表数据保留" inactive-text="迁移后删除主表数据" />
            </div>

            <div class="payment-form-grid">
              <el-form-item label="分表粒度"><el-select v-model="item.partitionGranularity"><el-option label="按月" value="MONTH" /><el-option label="按天" value="DAY" /></el-select></el-form-item>
              <el-form-item label="保留天数"><el-input-number v-model="item.retentionDays" :min="1" :max="3650" /></el-form-item>
              <el-form-item label="提前建表天数"><el-input-number v-model="item.createAheadDays" :min="0" :max="365" /></el-form-item>
              <el-form-item label="迁移阈值天数"><el-input-number v-model="item.migrateBeforeDays" :min="1" :max="3650" /></el-form-item>
              <el-form-item label="创建任务Key"><el-input v-model="item.createTaskKey" readonly /></el-form-item>
              <el-form-item label="迁移任务Key"><el-input v-model="item.migrateTaskKey" readonly /></el-form-item>
              <el-form-item label="备注" class="payment-form-span-2"><el-input v-model="item.remark" type="textarea" :rows="3" placeholder="记录策略说明，例如按月分表、半年迁移" /></el-form-item>
            </div>

            <div class="config-card__footer">
              <el-button :loading="savingType === item.businessType" type="primary" @click="saveConfig(item)">保存配置</el-button>
            </div>
          </el-card>
        </div>
      </section>

      <el-dialog v-model="previewVisible" title="分表预览" width="640px">
        <div v-if="preview" class="preview-grid">
          <div class="payment-note"><strong>源表：</strong>{{ preview.sourceTable }}</div>
          <div class="payment-note"><strong>下一个分表：</strong>{{ preview.nextPartitionTable }}</div>
          <div class="payment-note"><strong>迁移目标表：</strong>{{ preview.migrateTargetTable }}</div>
          <div class="payment-note"><strong>迁移阈值时间：</strong>{{ preview.migrateBeforeTime || "-" }}</div>
        </div>
      </el-dialog>
    </template>

    <section v-else class="payment-empty">
      当前账号不是超管或管理员，不能查看订单配置管理。
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { getOrderPartitionConfigs, getOrderPartitionPreview, updateOrderPartitionConfig } from "../api/payment";
import type { OrderPartitionConfig, OrderPartitionPreview } from "../types/payment";
import { hasAdminRole, readUserRoles } from "./support/paymentView";

const configs = ref<OrderPartitionConfig[]>([]);
const preview = ref<OrderPartitionPreview | null>(null);
const previewVisible = ref(false);
const savingType = ref("");
const roles = readUserRoles();
const isAdmin = hasAdminRole(roles);

const enabledCreateCount = computed(() => configs.value.filter((item) => item.autoCreateEnabled).length);
const enabledMigrateCount = computed(() => configs.value.filter((item) => item.autoMigrateEnabled).length);

async function loadConfigs() {
  if (!isAdmin) {
    return;
  }
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
@import "./support/payment-page.css";

.config-page { background: linear-gradient(180deg, #f8f5fc 0%, #faf8fd 180px, #fcfbfd 100%); }
.config-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.config-card { border-radius: 22px; border: 1px solid rgba(205, 216, 222, 0.96); }
.config-card__header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.config-card__header p { margin: 8px 0 0; color: #667085; }
.config-card__footer { display: flex; justify-content: flex-end; margin-top: 12px; }
.preview-grid { display: grid; gap: 12px; }

@media (max-width: 1100px) { .config-grid { grid-template-columns: 1fr; } }
</style>
