<template>
  <PanelPage title="能力模型清单" subtitle="按能力分组展示系统全部本地与云端模型" :loading="loading">
    <template #actions>
      <ReButton layout="square" type="primary" size="small" plain icon="Refresh" @click="loadData">刷新</ReButton>
    </template>

    <el-empty v-if="!loading && capabilityGroups.length === 0" description="暂无模型数据" />

    <div v-else class="catalog-body">
      <!-- 能力筛选标签 -->
      <div class="catalog-filter">
        <el-radio-group v-model="activeCapability" size="small" @change="onCapabilityChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="cap in capabilityNames" :key="cap" :value="cap">{{ cap }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 能力分组卡片 -->
      <div v-if="!activeCapability" class="catalog-grid">
        <el-card v-for="group in capabilityGroups" :key="group.name" class="catalog-card" shadow="never">
          <template #header>
            <div class="catalog-card__head">
              <span class="catalog-card__name">{{ group.name }}</span>
              <el-tag size="small" effect="plain">{{ group.models.length }}</el-tag>
            </div>
          </template>
          <div class="catalog-card__body">
            <el-tag
              v-for="model in group.models"
              :key="model"
              class="catalog-model-tag"
              size="small"
              effect="plain"
              type="info"
            >
              {{ model }}
            </el-tag>
            <span v-if="group.models.length === 0" class="catalog-card__empty">暂无模型</span>
          </div>
        </el-card>
      </div>

      <!-- 单能力模型列表 -->
      <div v-else class="catalog-single">
        <div class="catalog-single__head">
          <span class="catalog-single__title">能力：{{ activeCapability }}</span>
          <el-tag size="small" effect="plain">{{ activeModels.length }}</el-tag>
        </div>
        <el-table :data="activeModels.map((m) => ({ model: m }))" size="small" :empty-text="'该能力下暂无模型'">
          <el-table-column prop="model" label="模型 ID" min-width="260">
            <template #default="{ row }">
              <span class="mono-text">{{ row.model }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 能力模型清单面板
 * 调用 /api/ai/v2/ai/models/* 接口按能力展示全部模型（本地 + 云端）。
 */
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { modelCatalogApi, type CapabilityModels } from '../../api';
import PanelPage from '../PanelPage.vue';
import ReButton from '@repo/ui/re-button';

defineProps<{ id?: string }>();

const loading = ref(false);
const allModels = ref<CapabilityModels>({});
const capabilityNames = ref<string[]>([]);
const activeCapability = ref('');

/** 能力分组列表 */
const capabilityGroups = computed(() =>
  (capabilityNames.value || []).map((name) => ({
    name,
    models: allModels.value[name] || [],
  })),
);

/** 当前选中能力的模型列表 */
const activeModels = computed(() =>
  activeCapability.value ? allModels.value[activeCapability.value] || [] : [],
);

const onCapabilityChange = (val: string | number | boolean | undefined) => {
  activeCapability.value = String(val ?? '');
};

const loadData = async () => {
  loading.value = true;
  try {
    const [cap, names] = await Promise.all([
      modelCatalogApi.capabilities(),
      modelCatalogApi.capabilityNames(),
    ]);
    allModels.value = cap && typeof cap === 'object' ? cap : {};
    capabilityNames.value = Array.isArray(names) ? names : [];
  } catch (e: any) {
    ElMessage.error('加载模型清单失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.catalog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.catalog-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.catalog-card {
  border-radius: var(--ai-radius-md);
  border: 1px solid var(--ai-card-border);
}
.catalog-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #fafafa;
}
.catalog-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.catalog-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-text-primary);
  font-family: monospace;
}
.catalog-card__body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
}
.catalog-model-tag {
  font-family: monospace;
  max-width: 100%;
}
.catalog-card__empty {
  font-size: 13px;
  color: var(--ai-text-muted);
}

.catalog-single__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.catalog-single__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-text-primary);
  font-family: monospace;
}
.mono-text {
  font-family: monospace;
  font-size: 12px;
  color: var(--ai-text-primary);
}
</style>
