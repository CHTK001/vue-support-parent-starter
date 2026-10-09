<template>
  <div class="nge">
    <div class="nge-head">
      <div class="nge-head-left">
        <ReIcon name="Connection" :size="16" class="nge-icon" />
        <span class="nge-title">{{ dashboardName || "Nginx 看板" }}</span>
      </div>
      <div class="nge-head-right">
        <span class="nge-time">{{ updatedAt }}</span>
        <button class="nge-refresh" type="button" data-testid="nge-btn-refresh" title="刷新全部卡片" @click="refreshAll">
          <ReIcon name="Refresh" :size="14" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="nge-center">看板加载中…</div>
    <div v-else-if="error" class="nge-center nge-error">{{ error }}</div>
    <div v-else-if="!widgets.length" class="nge-center">看板暂无卡片</div>

    <div v-else class="nge-grid">
      <div
        v-for="cell in cells"
        :key="`${cell.id}-${refreshKey}`"
        class="nge-cell"
        :style="{
          gridColumn: `${cell.x + 1} / span ${cell.w}`,
          gridRow: `${cell.y + 1} / span ${cell.h}`,
        }"
      >
        <NgxCardRenderer :widget="cell.widget" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="NginxEmbedView">
/**
 * Nginx 看板嵌入页（公开只读）。
 *
 * <p>路径 {@code /nginx/embed/:token}，免登录访问（部署侧需把该路由与后端
 * {@code /ms/monitor/nginx/dashboard/embed/**} 加入白名单）。数据经令牌查询接口获取，
 * 不复用控制台登录态；页面自身可由任意系统 iframe 嵌入。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, provide, ref } from "vue";
import { useRoute } from "vue-router";
import ReIcon from "@repo/ui/re-icon";
import NgxCardRenderer from "../../components/console/nginx/NgxCardRenderer.vue";
import { parseNgxLayout, NGX_CTX_KEY } from "../../components/console/nginx/ngxTypes";
import type { NgxWidgetItem, NgxLayoutState } from "../../components/console/nginx/ngxTypes";
import { createNgxEmbedContext, fetchEmbedNginxDashboard } from "../../api/nginx/api";

const route = useRoute();
const token = computed(() => String(route.params.token || ""));

const loading = ref(true);
const error = ref("");
const layout = ref<NgxLayoutState>({ version: 1, widgets: [], grid: [] });
const dashboardName = ref("");
const updatedAt = ref("");

provide(
  NGX_CTX_KEY,
  createNgxEmbedContext(token.value)
);

const widgets = computed<NgxWidgetItem[]>(() => layout.value.widgets);

/** 把网格坐标换算成 CSS Grid 定位（只渲染 grid 与 widgets 都存在的卡片） */
const cells = computed(() => {
  const byId = new Map(layout.value.widgets.map(w => [w.id, w]));
  return layout.value.grid
    .filter(g => byId.has(g.i))
    .map(g => ({ ...g, id: g.i, widget: byId.get(g.i)! }));
});

const refreshKey = ref(0);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    if (!token.value) {
      throw new Error("缺少嵌入令牌");
    }
    const dashboard = await fetchEmbedNginxDashboard(token.value);
    dashboardName.value = dashboard?.name || "";
    layout.value = parseNgxLayout(dashboard?.config);
    updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  } catch (e) {
    error.value = `看板加载失败：${(e as Error)?.message ?? e}`;
  } finally {
    loading.value = false;
  }
}

/** 刷新全部：靠 key 强制重建卡片（每张卡自带定时器与刷新按钮，无需逐个通知） */
function refreshAll(): void {
  refreshKey.value += 1;
  updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

onMounted(() => {
  void load();
});
</script>

<style scoped lang="scss">
.nge {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--bg-fill);
  box-sizing: border-box;
}

.nge-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  flex-shrink: 0;
}

.nge-head-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.nge-icon {
  color: #009639;
  flex-shrink: 0;
}

.nge-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nge-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nge-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.nge-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
    color: var(--brand-500);
  }
}

.nge-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 56px;
  gap: 6px;
  flex: 1;
  min-height: 0;
}

.nge-cell {
  min-width: 0;
  min-height: 0;
}

.nge-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 48px 0;
}

.nge-error {
  color: var(--status-error);
}
</style>
