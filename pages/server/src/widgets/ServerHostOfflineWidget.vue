<template>
  <div class="shw">
    <div v-if="!widget.hideTitle" class="shw__header">
      <div class="shw__title">
        <el-icon class="shw__title-icon"><Warning /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <span class="shw__count" :title="`${total} 台离线的主机`">{{ total }} 台离线</span>
    </div>

    <div class="shw__body" v-loading="loading">
      <div v-if="error" class="shw__error">
        <el-icon :size="28"><InfoFilled /></el-icon>
        <span>暂无数据</span>
        <button type="button" class="shw__retry" @click="load">重新加载</button>
      </div>
      <div v-else-if="!hosts.length" class="shw__empty">
        <el-icon :size="28"><Check /> </el-icon>
        <span>当前无离线主机</span>
      </div>
      <div v-else class="shw__list">
        <div v-for="row in hosts" :key="row.id" class="shw__host">
          <div class="shw__host-head">
            <el-tag type="danger" effect="plain" size="small">离线</el-tag>
            <span class="shw__host-name">{{ row.serverHostName }}</span>
            <span class="shw__host-addr">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span>
          </div>
          <div class="shw__host-meta">
            <span class="shw__host-status" :title="row.serverHostOnline === 1 ? '在线' : '离线'">
              <span class="shw__host-dot" :class="row.serverHostOnline === 1 ? 'shw__host-dot--online' : 'shw__host-dot--offline'"></span>
              {{ row.serverHostOnline === 1 ? '在线' : '离线' }}
            </span>
            <span class="shw__host-os">{{ osLabel(row.serverHostOsType) }}</span>
            <span v-if="hostTags(row).length" class="shw__host-tags">{{ hostTags(row).join(' ') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ServerHostOfflineWidget">
/**
 * 离线主机列表（home 仪表板小部件）
 *
 * 贡献自 {@code @pages/server}，由宿主 app 在 {@code main.ts} 里通过
 * {@code defineWidgetContribution(serverWidgets)} 登记，所以它在面板里排在
 * 内置 widget 与采集侧 widget 之后，且未启用主机资产管理页的 app 会把它渲染成
 * 占位卡片（保留位置，切回能用的 app 即复原）。
 *
 * <p>数据源 {@code queryHosts({ status: 0 })}（/ms/server/host?status=0）承诺返回
 * 全部离线主机，前端只需负责展示。</p>
 */
import { Check, CircleCloseFilled, InfoFilled, Warning } from "@element-plus/icons-vue";
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type { WidgetItem } from "@repo/theme/koi/views/home/types.ts";
import { queryHosts } from "../api";

defineProps<{ widget: WidgetItem }>();

/** 主机行：前端只消费展示需要的字段，不碰私有/敏感字段 */
interface HostRow {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  serverHostTags?: string;
  serverHostOnline: number;
}

const loading = ref(true);
const error = ref(false);
const hosts = reactive<HostRow[]>([]);

const total = ref(0);

const REFRESH_INTERVAL = 60_000;

let interval: number | undefined;

/** 主机行 */

/** 标签解析：从 JSON 数组字符串拆成展示列表 */
function hostTags(row: HostRow): string[] {
  if (!row.serverHostTags) return [];
  try {
    const arr = JSON.parse(row.serverHostTags);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [row.serverHostTags || ""];
  }
}

/** 系统类型透传：后端给什么返回什么，不做翻译（避免猜层） */
function osLabel(v?: string): string {
  return v ?? "未知";
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = false;
  try {
    const rows = await queryHosts({ status: 0 });
    hosts.length = 0;
    hosts.push(...(rows ?? []));
    total.value = hosts.length;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  interval = window.setInterval(() => load(), REFRESH_INTERVAL);
});

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>

<style lang="scss" scoped>
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.shw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}
.shw__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px 8px; }
.shw__title { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.shw__title-icon { flex-shrink: 0; color: var(--el-color-warning); }
.shw__count { flex-shrink: 0; font-size: 12px; font-weight: 500; color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); padding: 4px 10px; border-radius: var(--el-radius-full, 9999px); }

.shw__body { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: auto; padding: 0 16px 16px; }

.shw__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; font-size: 13px; color: var(--el-text-color-disabled); }

.shw__list { display: flex; flex-direction: column; gap: 8px; }

.shw__host {
  display: flex; flex-direction: column; gap: 6px; padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
}
.shw__host-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.shw__host-name { display: inline-block; min-width: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shw__host-addr { display: inline-block; font-size: 12px; color: var(--el-text-color-tertiary); }
.shw__host-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--el-text-color-secondary); }
.shw__host-status { display: inline-flex; align-items: center; gap: 4px; }
.shw__host-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.shw__host-dot--offline { background: var(--status-offline); }
.shw__host-dot--online { background: var(--status-online); }
.shw__host-os { color: var(--el-text-color-tertiary); }
.shw__host-tags { display: inline-flex; gap: 4px; }
</style>
