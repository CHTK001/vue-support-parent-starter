<template>
  <div class="dsow">
    <!-- 加载中 -->
    <div v-if="loading" class="dsow__state" aria-busy="true">
      <el-icon class="dsow__state-icon" :size="20"><Loading /></el-icon>
      <span class="dsow__state-text">加载中…</span>
    </div>

    <!-- 加载失败：这是真故障（接口不通），给重试有意义 -->
    <div v-else-if="errorText" class="dsow__state dsow__state--error" role="alert">
      <el-icon :size="20"><WarningFilled /></el-icon>
      <span class="dsow__state-text">{{ errorText }}</span>
      <ReButton link type="primary" @click="load">重试</ReButton>
    </div>

    <!-- 正常 -->
    <div v-else class="dsow__grid">
      <div v-for="s in stats" :key="s.label" class="dsow__tile">
        <div class="dsow__tile-head">
          <el-icon :size="16" class="dsow__tile-icon">
            <component :is="s.icon" />
          </el-icon>
          <span class="dsow__tile-label">{{ s.label }}</span>
        </div>
        <div class="dsow__tile-value">{{ s.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DatasourceOverviewWidget">
/**
 * 数据源概览 widget（由 @pages/datasource 贡献给 home 仪表板）
 *
 * <p>模块自带「系统组件」：组件本体住在业务包里、只依赖本包公开 API
 * （{@link fetchDataSources}），由 {@code pages/datasource/src/widgets/datasourceWidgets.ts}
 * 登记进 home 的 widget 注册表，app 侧在 {@code main.ts} 用 {@code .widgets(...)}
 * 接线。home 与 widget 之间没有任何反向依赖。</p>
 *
 * <p>三个口径全部来自 <b>同一次</b> 台账列表请求，不额外发请求；「接入类型」按
 * 返回行的 {@code type} 去重统计，不依赖单独的类型字典接口。接口失败整卡退化为
 * 错误态并给重试。</p>
 */
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { CircleCheck, Coin, Collection, Loading, WarningFilled } from "@element-plus/icons-vue";
import { fetchDataSources } from "../api";
import type { WidgetItem } from "@repo/theme/koi/views/home/types.ts";

const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));

defineProps<{ widget: WidgetItem }>();

/** 数据源总数 */
const totalCount = ref<number | null>(null);
/** 启用中数量（status=1；0 停用，缺省不计入启用） */
const enabledCount = ref<number | null>(null);
/** 接入类型数（按 type 去重） */
const typeCount = ref<number | null>(null);
/** 首次加载中 */
const loading = ref(true);
/** 整体失败：接口挂了，卡片退化为错误态 */
const errorText = ref("");

const stats = computed(() => [
  { label: "数据源总数", value: totalCount.value ?? "—", icon: Coin },
  { label: "启用中", value: enabledCount.value ?? "—", icon: CircleCheck },
  { label: "接入类型", value: typeCount.value ?? "—", icon: Collection },
]);

async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  try {
    const rows = (await fetchDataSources()) ?? [];
    totalCount.value = rows.length;
    enabledCount.value = rows.filter((d) => d.status === 1).length;
    typeCount.value = new Set(rows.map((d) => d.type).filter(Boolean)).size;
  } catch {
    totalCount.value = null;
    enabledCount.value = null;
    typeCount.value = null;
    errorText.value = "数据源概览数据获取失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style lang="scss" scoped>
.dsow {
  height: 100%;
  min-height: 0;
}

.dsow__state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.dsow__state--error {
  flex-direction: row;
  color: var(--el-color-danger);
}

.dsow__state-icon {
  color: var(--el-color-primary);
  animation: dsow-spin 1.2s linear infinite;
}

.dsow__grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px;
}

.dsow__tile {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.dsow__tile-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dsow__tile-icon {
  color: var(--el-color-primary);
}

.dsow__tile-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dsow__tile-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

@keyframes dsow-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
