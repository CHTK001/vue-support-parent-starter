<template>
  <div class="aiow">
    <!-- 加载中 -->
    <div v-if="loading" class="aiow__state" aria-busy="true">
      <el-icon class="aiow__state-icon" :size="20"><Loading /></el-icon>
      <span class="aiow__state-text">加载中…</span>
    </div>

    <!-- 加载失败：这是真故障（接口不通），给重试有意义 -->
    <div v-else-if="errorText" class="aiow__state aiow__state--error" role="alert">
      <el-icon :size="20"><WarningFilled /></el-icon>
      <span class="aiow__state-text">{{ errorText }}</span>
      <ReButton link type="primary" @click="load">重试</ReButton>
    </div>

    <!-- 正常 -->
    <div v-else class="aiow__grid">
      <div v-for="s in stats" :key="s.label" class="aiow__tile">
        <div class="aiow__tile-head">
          <el-icon :size="16" class="aiow__tile-icon">
            <component :is="s.icon" />
          </el-icon>
          <span class="aiow__tile-label">{{ s.label }}</span>
        </div>
        <div class="aiow__tile-value">{{ s.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AiModelOverviewWidget">
/**
 * 模型服务概览 widget（由 @pages/ai 贡献给 home 仪表板）
 *
 * <p>模块自带「系统组件」：组件本体住在业务包里、只依赖本包公开 API
 * （{@code modelApi.fetchModels()}），由
 * {@code pages/ai/src/widgets/aiWidgets.ts} 登记进 home 的 widget 注册表，
 * app 侧在 {@code main.ts} 用 {@code .widgets(...)} 接线。home 与 widget 之间
 * 没有任何反向依赖。</p>
 *
 * <p>三个口径全部来自 <b>同一次</b> {@code GET /api/providers?enabled_only=0}
 * （与模型管理页同一数据源；{@code /v2/models/all} 在现网后端已无 GET 映射），
 * 不额外发请求；接口失败整卡退化为错误态并给重试。</p>
 */
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { CircleCheck, Collection, Cpu, Loading, MagicStick, WarningFilled } from "@element-plus/icons-vue";
import { modelApi } from "@/services/modules/model.api";
import type { WidgetItem } from "@repo/theme/koi/views/home/types.ts";

const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));

defineProps<{ widget: WidgetItem }>();

/** 供应商总数 */
const providerCount = ref<number | null>(null);
/** 启用供应商数（isActive） */
const activeCount = ref<number | null>(null);
/** 模型总数（各供应商 models 求和） */
const modelCount = ref<number | null>(null);
/** 首次加载中 */
const loading = ref(true);
/** 整体失败：接口挂了，卡片退化为错误态 */
const errorText = ref("");

const stats = computed(() => [
  { label: "供应商", value: providerCount.value ?? "—", icon: Collection },
  { label: "启用供应商", value: activeCount.value ?? "—", icon: CircleCheck },
  { label: "模型总数", value: modelCount.value ?? "—", icon: Cpu },
]);

async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  try {
    const page = await modelApi.fetchModels();
    // /api/providers 行的启用字段是 enabled；兼容旧 /models/all 形状的 isActive
    const providers = (page?.items ?? []) as unknown as Array<{
      isActive?: boolean;
      enabled?: boolean;
      models?: unknown[];
    }>;
    providerCount.value = providers.length;
    activeCount.value = providers.filter((p) => p.isActive ?? p.enabled !== false).length;
    modelCount.value = providers.reduce((n, p) => n + (p.models?.length ?? 0), 0);
  } catch {
    providerCount.value = null;
    activeCount.value = null;
    modelCount.value = null;
    errorText.value = "模型服务概览数据获取失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style lang="scss" scoped>
.aiow {
  height: 100%;
  min-height: 0;
}

.aiow__state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.aiow__state--error {
  flex-direction: row;
  color: var(--el-color-danger);
}

.aiow__state-icon {
  color: var(--el-color-primary);
  animation: aiow-spin 1.2s linear infinite;
}

.aiow__grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px;
}

.aiow__tile {
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

.aiow__tile-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aiow__tile-icon {
  color: var(--el-color-primary);
}

.aiow__tile-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.aiow__tile-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

@keyframes aiow-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
