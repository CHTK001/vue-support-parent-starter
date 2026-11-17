<template>
  <div class="chow">
    <!-- 加载中 -->
    <div v-if="loading" class="chow__state" aria-busy="true">
      <el-icon class="chow__state-icon" :size="20"><Loading /></el-icon>
      <span class="chow__state-text">加载中…</span>
    </div>

    <!-- 加载失败：这是真故障（接口不通），给重试有意义 -->
    <div v-else-if="errorText" class="chow__state chow__state--error" role="alert">
      <el-icon :size="20"><WarningFilled /></el-icon>
      <span class="chow__state-text">{{ errorText }}</span>
      <ReButton link type="primary" @click="load">重试</ReButton>
    </div>

    <!-- 正常 -->
    <div v-else class="chow__grid">
      <div v-for="s in stats" :key="s.label" class="chow__tile">
        <div class="chow__tile-head">
          <el-icon :size="16" class="chow__tile-icon">
            <component :is="s.icon" />
          </el-icon>
          <span class="chow__tile-label">{{ s.label }}</span>
        </div>
        <div class="chow__tile-value">{{ s.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ChannelOverviewWidget">
/**
 * 渠道概览 widget（由 @pages/channel 贡献给 home 仪表板）
 *
 * <p>模块自带「系统组件」：组件本体住在业务包里、只依赖本包公开 API
 * （{@link channelApi.list}），由 {@code pages/channel/src/widgets/channelWidgets.ts}
 * 登记进 home 的 widget 注册表，app 侧在 {@code main.ts} 用 {@code .widgets(...)}
 * 接线。home 与 widget 之间没有任何反向依赖。</p>
 *
 * <p>四个口径全部来自 <b>同一次</b> {@code GET /api/channels}，不额外发请求；
 * 接口失败整卡退化为错误态并给重试（单接口不存在「部分失败」）。</p>
 */
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { CircleCheck, Connection, Cpu, Link, Loading, WarningFilled } from "@element-plus/icons-vue";
import { channelApi } from "../channelApi";
import type { WidgetItem } from "@repo/theme/koi/views/home/types.ts";

const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));

defineProps<{ widget: WidgetItem }>();

/** 渠道总数 */
const totalCount = ref<number | null>(null);
/** 启用渠道数（enabled 缺省视为启用，与渠道页口径一致：显式 false 才算停用） */
const enabledCount = ref<number | null>(null);
/** 已绑定账号连接数（各渠道 connections 求和） */
const connectionCount = ref<number | null>(null);
/** 渠道模型清单条数（各渠道 models 求和） */
const modelCount = ref<number | null>(null);
/** 首次加载中 */
const loading = ref(true);
/** 整体失败：接口挂了，卡片退化为错误态 */
const errorText = ref("");

const stats = computed(() => [
  { label: "渠道总数", value: totalCount.value ?? "—", icon: Connection },
  { label: "启用渠道", value: enabledCount.value ?? "—", icon: CircleCheck },
  { label: "已绑定连接", value: connectionCount.value ?? "—", icon: Link },
  { label: "模型清单", value: modelCount.value ?? "—", icon: Cpu },
]);

async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  try {
    const channels = (await channelApi.list()) ?? [];
    totalCount.value = channels.length;
    enabledCount.value = channels.filter((c) => c.enabled !== false).length;
    connectionCount.value = channels.reduce((n, c) => n + (c.connections?.length ?? 0), 0);
    modelCount.value = channels.reduce((n, c) => n + (c.models?.length ?? 0), 0);
  } catch {
    totalCount.value = null;
    enabledCount.value = null;
    connectionCount.value = null;
    modelCount.value = null;
    errorText.value = "渠道概览数据获取失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style lang="scss" scoped>
.chow {
  height: 100%;
  min-height: 0;
}

.chow__state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.chow__state--error {
  flex-direction: row;
  color: var(--el-color-danger);
}

.chow__state-icon {
  color: var(--el-color-primary);
  animation: chow-spin 1.2s linear infinite;
}

.chow__grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  padding: 4px;
}

.chow__tile {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.chow__tile-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chow__tile-icon {
  color: var(--el-color-primary);
}

.chow__tile-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chow__tile-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

@keyframes chow-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
