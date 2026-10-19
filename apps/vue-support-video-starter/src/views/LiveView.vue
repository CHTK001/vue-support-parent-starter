<script setup lang="ts">
/**
 * 直播页 —— 央视 / 卫视 / 特色频道在线直播（第二版）
 *
 * 结构：分组切换药丸 + 剧场播放器 + 频道选台列表。
 * 交互：分组过滤、选台即播、候选源自动回退、加载骨架、错误空态与重试。
 * 数据：liveApi（后端 LiveChannelController，HLS 经后端代理）。
 *
 * 路由：/live 直播全部；/live/cctv 仅央视（cctvOnly）。
 */
import { computed, onMounted, ref, watch } from "vue";
import { VideoCamera, Refresh } from "@element-plus/icons-vue";
import { fetchLiveChannels, fetchLiveGroups, livePlayUrl } from "@/api/liveApi";
import type { LiveChannel, LiveGroup } from "@/types/live";
import VdPlayer from "@/components/VdPlayer.vue";

const props = withDefaults(defineProps<{ cctvOnly?: boolean }>(), { cctvOnly: false });

/* ── 状态 ─────────────────────────────────── */
const loading = ref(true);
const error = ref("");
const groups = ref<LiveGroup[]>([]);
const channels = ref<LiveChannel[]>([]);
const activeGroup = ref("");
const selected = ref<LiveChannel | null>(null);
/** 当前候选源下标（源失败时自增回退） */
const srcIndex = ref(0);
const playerError = ref("");

/** 当前分组下的频道 */
const visibleChannels = computed(() =>
  channels.value.filter((c) => !activeGroup.value || c.group === activeGroup.value),
);

/** 当前播放地址（经后端代理） */
const playUrl = computed(() => (selected.value ? livePlayUrl(selected.value.id, srcIndex.value) : ""));

/** 候选源展示文案 */
const sourceLabel = computed(() => {
  const total = selected.value?.sources?.length ?? 0;
  return total > 1 ? `线路 ${srcIndex.value + 1}/${total}` : "";
});

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  playerError.value = "";
  try {
    const [groupList, channelList] = await Promise.all([
      fetchLiveGroups(),
      fetchLiveChannels(props.cctvOnly ? { cctv: true } : {}),
    ]);
    groups.value = props.cctvOnly ? groupList.filter((g) => g.cctv) : groupList;
    channels.value = channelList;
    activeGroup.value = groups.value[0]?.id ?? "";
    selectFirst();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "直播数据加载失败，请确认后端服务已启动";
    groups.value = [];
    channels.value = [];
    selected.value = null;
  } finally {
    loading.value = false;
  }
}

/** 选中当前分组首个频道 */
function selectFirst() {
  selected.value = visibleChannels.value[0] ?? null;
  srcIndex.value = 0;
  playerError.value = "";
}

function selectChannel(channel: LiveChannel) {
  selected.value = channel;
  srcIndex.value = 0;
  playerError.value = "";
}

/** 播放失败：优先切换下一路候选源，全部失败再提示 */
function onPlayerError(msg: string) {
  const total = selected.value?.sources?.length ?? 0;
  if (srcIndex.value + 1 < total) {
    srcIndex.value += 1;
    playerError.value = "";
    return;
  }
  playerError.value = msg || "该频道暂不可用，请稍后重试或切换频道";
}

watch(activeGroup, () => {
  if (!visibleChannels.value.some((c) => c.id === selected.value?.id)) {
    selectFirst();
  }
});

onMounted(() => void load());
</script>

<template>
  <div class="vd-page vdl-page">
    <!-- 页头 -->
    <header class="vd-header">
      <div>
        <h1>{{ cctvOnly ? "CCTV 直播" : "电视直播" }}</h1>
        <p class="vd-subtitle">
          {{ cctvOnly ? "央视各频道 24 小时在线直播" : "央视 · 卫视 · 特色频道在线直播" }}
          <template v-if="channels.length"> · 共 {{ channels.length }} 个频道</template>
        </p>
      </div>
    </header>

    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vds-load-error">
      <el-empty :description="error">
        <el-button type="primary" :icon="Refresh" @click="load">重试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- 分组切换 -->
      <div v-if="groups.length" class="vd-pills vdl-groups" role="tablist" aria-label="直播分组">
        <button
          v-for="g in groups"
          :key="g.id"
          type="button"
          role="tab"
          class="vd-pill"
          :class="{ 'is-active': activeGroup === g.id }"
          :aria-selected="activeGroup === g.id"
          @click="activeGroup = g.id"
        >
          {{ g.label }}
          <span class="vd-pill-count">{{ g.count }}</span>
        </button>
      </div>

      <div class="vdl-layout">
        <!-- 播放器 -->
        <section class="vdl-player-col" aria-label="直播播放器">
          <div
            v-if="loading"
            class="vd-theater vd-poster-skeleton"
            style="aspect-ratio: 16/9"
            aria-busy="true"
          />
          <div v-else-if="!selected" class="vd-empty">
            <el-empty description="该分组暂无可用频道" />
          </div>
          <template v-else>
            <div class="vd-theater vdl-theater">
              <VdPlayer :url="playUrl" :autoplay="true" @error="onPlayerError" />
            </div>
            <div class="vdl-now-playing">
              <span class="vdl-live-dot" aria-hidden="true" />
              <span class="vdl-live-label">直播中</span>
              <span class="vdl-channel-name">{{ selected.name }}</span>
              <span v-if="sourceLabel" class="vdl-source">{{ sourceLabel }}</span>
            </div>
            <p v-if="playerError" class="vdl-player-error">{{ playerError }}</p>
          </template>
        </section>

        <!-- 选台列表 -->
        <aside class="vdl-channel-col" aria-label="频道列表">
          <h3 class="vdl-channel-title">选台</h3>
          <div v-if="loading" class="vdl-channel-skeleton" aria-busy="true">
            <span v-for="i in 8" :key="i" class="vdl-skeleton-item" />
          </div>
          <div v-else class="vdl-channel-grid">
            <button
              v-for="c in visibleChannels"
              :key="c.id"
              type="button"
              class="vdl-channel"
              :class="{ 'is-active': selected?.id === c.id }"
              :aria-pressed="selected?.id === c.id"
              @click="selectChannel(c)"
            >
              <span class="vdl-channel-badge" aria-hidden="true">LIVE</span>
              <span class="vdl-channel-label" :title="c.name">{{ c.name }}</span>
            </button>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vdl-page {
  /* 直播页用更宽的播放区 */
  max-width: var(--vd-page-max);
}

.vdl-groups {
  margin-bottom: 22px;
  flex-wrap: wrap;
}

/* ── 布局 ───────────────────────────────── */
.vdl-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.vdl-theater {
  position: relative;
}

.vdl-now-playing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdl-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vd-live);
  box-shadow: 0 0 10px color-mix(in srgb, var(--vd-live) 80%, transparent);
  animation: vdl-pulse 1.4s ease-in-out infinite;
}

@keyframes vdl-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.78);
  }
}

.vdl-live-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--vd-live);
  border: 1px solid color-mix(in srgb, var(--vd-live) 45%, transparent);
  border-radius: var(--vd-radius-xs);
  padding: 1px 6px;
}

.vdl-source {
  font-size: 12px;
  font-weight: 400;
  color: var(--vd-text-muted);
}

.vdl-player-error {
  margin: 10px 0 0;
  font-size: 13px;
  color: color-mix(in srgb, var(--vd-live) 62%, var(--vd-text));
}

/* ── 选台列表 ───────────────────────────── */
.vdl-channel-col {
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-lg);
  padding: 18px;
}

.vdl-channel-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.vdl-channel-title::before {
  content: "";
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--vd-primary-strong), var(--vd-secondary));
}

.vdl-channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.vdl-channel {
  position: relative;
  border: 1px solid var(--vd-border);
  background: var(--vd-surface);
  color: var(--vd-text);
  font-family: inherit;
  font-size: 13px;
  padding: 14px 10px;
  border-radius: var(--vd-radius-sm);
  cursor: pointer;
  text-align: center;
  overflow: hidden;
  transition:
    border-color var(--vd-fast) var(--vd-ease),
    background var(--vd-fast) var(--vd-ease),
    color var(--vd-fast) var(--vd-ease);
}

.vdl-channel:hover {
  border-color: color-mix(in srgb, var(--vd-primary) 60%, transparent);
  background: var(--vd-surface-hover);
}

.vdl-channel:focus-visible {
  outline: 2px solid var(--vd-primary-strong);
  outline-offset: 1px;
}

.vdl-channel.is-active {
  border-color: color-mix(in srgb, var(--vd-primary) 70%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--vd-primary) 24%, transparent),
    color-mix(in srgb, var(--vd-secondary) 18%, transparent)
  );
  color: var(--vd-primary-strong);
  font-weight: 600;
}

.vdl-channel-badge {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--vd-live);
}

.vdl-channel-label {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 骨架 ───────────────────────────────── */
.vdl-channel-skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.vdl-skeleton-item {
  height: 46px;
  border-radius: var(--vd-radius-sm);
  background: linear-gradient(
    100deg,
    var(--vd-surface) 30%,
    var(--vd-surface-hover) 50%,
    var(--vd-surface) 70%
  );
  background-size: 200% 100%;
  animation: vd-skeleton 1.5s infinite;
}

@media (max-width: 900px) {
  .vdl-layout {
    grid-template-columns: 1fr;
  }
  .vdl-channel-grid {
    max-height: 320px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vdl-channel,
  .vdl-live-dot {
    transition: none;
    animation: none;
  }
  .vdl-skeleton-item {
    animation: none;
    background: var(--vd-surface-hover);
  }
}
</style>
