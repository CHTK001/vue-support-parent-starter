<template>
  <div class="cow">
    <!-- 加载中 -->
    <div v-if="loading" class="cow__state" aria-busy="true">
      <el-icon class="cow__state-icon" :size="20"><Loading /></el-icon>
      <span class="cow__state-text">加载中…</span>
    </div>

    <!-- 加载失败：这是真故障（接口不通），给重试有意义 -->
    <div v-else-if="errorText" class="cow__state cow__state--error" role="alert">
      <el-icon :size="20"><WarningFilled /></el-icon>
      <span class="cow__state-text">{{ errorText }}</span>
      <ReButton link type="primary" @click="load">重试</ReButton>
    </div>

    <!-- 正常 -->
    <div v-else class="cow__grid">
      <div v-for="s in stats" :key="s.label" class="cow__tile">
        <div class="cow__tile-head">
          <el-icon :size="16" class="cow__tile-icon">
            <component :is="s.icon" />
          </el-icon>
          <span class="cow__tile-label">{{ s.label }}</span>
        </div>
        <div class="cow__tile-value">{{ s.value }}</div>
      </div>
      <p v-if="loadFailed" class="cow__partial">
        部分数据获取失败：{{ loadFailed }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts" name="CollectOverviewWidget">
/**
 * 采集概览 widget（由 @pages/collect 贡献给 home 仪表板）
 *
 * <p>这是「模块自带系统组件」的样板：组件本体住在业务包里、只依赖公开 API，
 * 由 {@code pages/collect/src/widgets/index.ts} 登记进 home 的 widget 注册表，
 * app 侧在 {@code main.ts} 用 {@code .widgets(...)} 接线。home 与 widget 之间
 * 没有任何反向依赖。</p>
 *
 * <p>两个统计口径刻意做成互相独立：一个接口失败不应让整张卡片变成错误态，
 * 因此单块失败只降级为「—」并在底部列出失败项。</p>
 */
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { Connection, Loading, Timer, WarningFilled } from "@element-plus/icons-vue";
import { fetchRunningCount, listFlows } from "../api/collectApi";
import type { WidgetItem } from "@repo/theme/koi/views/home/types";

const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));

defineProps<{ widget: WidgetItem }>();

/** 流程总数；null = 该项尚未取到（接口失败），用「—」占位而不是显示 0 */
const flowCount = ref<number | null>(null);
/** 运行中任务数；同上 */
const runningCount = ref<number | null>(null);
/** 首次加载中（用于区分「还没开始」与「加载完了」） */
const loading = ref(true);
/** 整体失败：两个接口都挂了，卡片退化为错误态 */
const errorText = ref("");
/** 部分失败：至少一个接口成功，单独提示失败项 */
const loadFailed = ref("");

const stats = computed(() => [
  { label: "采集流程", value: flowCount.value ?? "—", icon: Connection },
  { label: "运行中任务", value: runningCount.value ?? "—", icon: Timer },
]);

async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  loadFailed.value = "";
  // 并发取，任一失败只降级单项
  const [flowRes, runRes] = await Promise.allSettled([listFlows(), fetchRunningCount()]);

  const failed: string[] = [];
  if (flowRes.status === "fulfilled") {
    flowCount.value = flowRes.value.length;
  } else {
    flowCount.value = null;
    failed.push("流程列表");
  }
  if (runRes.status === "fulfilled") {
    runningCount.value = runRes.value;
  } else {
    runningCount.value = null;
    failed.push("运行中任务数");
  }

  loading.value = false;
  // 两项全失败才升级为错误态；只失败一项时保持可用并列出失败项
  if (failed.length === 2) {
    errorText.value = "概览数据获取失败";
  } else if (failed.length === 1) {
    loadFailed.value = failed[0];
  }
}

onMounted(load);
</script>

<style lang="scss" scoped>
.cow {
  height: 100%;
  min-height: 0;
}

.cow__state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.cow__state--error {
  flex-direction: row;
  color: var(--el-color-danger);
}

.cow__state-icon {
  color: var(--el-color-primary);
  animation: cow-spin 1.2s linear infinite;
}

.cow__grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px;
}

.cow__tile {
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

.cow__tile-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cow__tile-icon {
  color: var(--el-color-primary);
}

.cow__tile-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cow__tile-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.cow__partial {
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

@keyframes cow-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
