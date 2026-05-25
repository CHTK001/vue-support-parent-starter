<template>
  <section class="loki-labels-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="header-title">
          <ElIcon><PriceTag /></ElIcon>
          标签浏览
        </h2>
        <p class="header-desc">浏览 Loki 中的所有标签及其值，快速构建 LogQL 查询</p>
      </div>
      <div class="header-actions">
        <ElInput
          v-model="searchText"
          placeholder="搜索标签…"
          clearable
          size="default"
          class="search-input"
        >
          <template #prefix><ElIcon><Search /></ElIcon></template>
        </ElInput>
        <ElButton
          :icon="RefreshRight"
          :loading="loading"
          @click="loadLabels"
        >
          刷新
        </ElButton>
      </div>
    </div>

    <!-- 未连接提示 -->
    <ElAlert
      v-if="!connectionId"
      title="未连接 Loki"
      description="请先在日志查询页面连接 Loki 服务"
      type="warning"
      show-icon
      :closable="false"
      class="connection-alert"
    />

    <!-- 加载状态 -->
    <div v-if="loading && !labels.length" class="loading-center">
      <ElIcon class="is-loading" :size="32"><Loading /></ElIcon>
      <p>加载标签中…</p>
    </div>

    <!-- 标签卡片网格 -->
    <div v-else-if="labels.length" class="labels-grid">
      <div
        v-for="label in filteredLabels"
        :key="label"
        class="label-card"
        :class="{ 'is-expanded': expandedLabel === label }"
        @click="toggleLabel(label)"
      >
        <div class="label-card__header">
          <div class="label-name">
            <ElIcon :size="16"><PriceTag /></ElIcon>
            <span>{{ label }}</span>
          </div>
          <div class="label-actions">
            <ElTag size="small" type="info">
              {{ valueCounts[label] ?? '…' }} 个值
            </ElTag>
            <ElButton
              text
              size="small"
              :icon="CopyDocument"
              @click.stop="copyLabel(label)"
            />
          </div>
        </div>

        <!-- 展开的值列表 -->
        <ElCollapseTransition>
          <div v-if="expandedLabel === label" class="label-card__values">
            <div v-if="valuesLoading[label]" class="values-loading">
              <ElIcon class="is-loading"><Loading /></ElIcon>
            </div>
            <div v-else-if="labelValuesMap[label]?.length" class="values-list">
              <div
                v-for="val in labelValuesMap[label]"
                :key="val"
                class="value-chip"
                @click.stop
              >
                <span class="value-text">{{ val }}</span>
                <div class="value-actions">
                  <ElTooltip content="复制 LogQL">
                    <ElButton
                      text
                      size="small"
                      :icon="CopyDocument"
                      @click="copyLogql(label, val)"
                    />
                  </ElTooltip>
                  <ElTooltip content="查询该标签值">
                    <ElButton
                      text
                      size="small"
                      :icon="Search"
                      @click="queryLabel(label, val)"
                    />
                  </ElTooltip>
                </div>
              </div>
            </div>
            <ElEmpty v-else :image-size="40" description="无值" />
          </div>
        </ElCollapseTransition>
      </div>
    </div>

    <ElEmpty v-else description="暂无标签" :image-size="60" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  RefreshRight,
  PriceTag,
  CopyDocument,
  Loading,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  fetchLokiLabels,
  fetchLokiLabelValues,
} from "../../api/loki";

const router = useRouter();

// 连接
const connectionId = ref(localStorage.getItem("loki_connection_id") || "");
const loading = ref(false);
const labels = ref([]);
const searchText = ref("");
const expandedLabel = ref("");
const labelValuesMap = ref({});
const valuesLoading = ref({});
const valueCounts = ref({});

const filteredLabels = computed(() => {
  if (!searchText.value) return labels.value;
  const s = searchText.value.toLowerCase();
  return labels.value.filter((l) => l.toLowerCase().includes(s));
});

onMounted(() => {
  if (connectionId.value) loadLabels();
});

async function loadLabels() {
  if (!connectionId.value) return;
  loading.value = true;
  try {
    const res = await fetchLokiLabels(connectionId.value);
    if (res.code === "00000" || res.code === 200) {
      labels.value = res.data || [];
    }
  } catch {
    // 忽略错误
  } finally {
    loading.value = false;
  }
}

async function toggleLabel(label) {
  if (expandedLabel.value === label) {
    expandedLabel.value = "";
    return;
  }
  expandedLabel.value = label;
  if (!labelValuesMap.value[label]) {
    await loadLabelValues(label);
  }
}

async function loadLabelValues(label) {
  if (!connectionId.value) return;
  valuesLoading.value[label] = true;
  try {
    const res = await fetchLokiLabelValues(connectionId.value, label);
    if (res.code === "00000" || res.code === 200) {
      const vals = res.data || [];
      labelValuesMap.value[label] = vals;
      valueCounts.value[label] = vals.length;
    }
  } catch {
    // ignore
  } finally {
    valuesLoading.value[label] = false;
  }
}

function copyLabel(label) {
  navigator.clipboard.writeText(label);
  ElMessage.success(`已复制标签: ${label}`);
}

function copyLogql(label, value) {
  const q = `{${label}="${value}"}`;
  navigator.clipboard.writeText(q);
  ElMessage.success(`已复制 LogQL: ${q}`);
}

function queryLabel(label, value) {
  const q = `{${label}="${value}"}`;
  localStorage.setItem("loki_logql", q);
  router.push("/loki/log-query");
}
</script>

<style scoped>
.loki-labels-page {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 24px;
  background: var(--el-fill-color-darker);
  border-radius: 16px;
  border: 1px solid var(--el-color-primary-light-8);
  gap: 16px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary-light-5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-content p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.search-input {
  width: 240px;
}

.connection-alert {
  margin-bottom: 20px;
  border-radius: 12px;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--el-text-color-placeholder);
  gap: 16px;
}

.labels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.label-card {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.label-card:hover {
  border-color: var(--el-color-primary-light-7);
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.label-card.is-expanded {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 20px var(--el-color-primary-light-9);
}

.label-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.label-name .el-icon {
  color: var(--el-color-primary-light-3);
}

.label-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-card__values {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-light);
}

.values-loading {
  display: flex;
  justify-content: center;
  padding: 20px;
  color: var(--el-text-color-placeholder);
}

.values-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.value-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  font-size: 13px;
  font-family: "SF Mono", "Fira Code", monospace;
  transition: background 0.2s;
}

.value-chip:hover {
  background: var(--el-color-primary-light-9);
}

.value-text {
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.value-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
</style>
