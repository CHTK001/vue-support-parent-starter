<script setup lang="ts">
/**
 * 直播页 —— 央视 / 卫视 / 特色频道在线直播（第三版 · 参照站配色）
 *
 * 结构：分组标签 + 剧场播放器 + 频道选台列表。
 * 交互：分组过滤、选台即播、候选源自动回退、加载骨架、错误空态与重试。
 * 数据：liveApi（后端 LiveChannelController，HLS 经后端代理）。
 *
 * 路由：/live 直播全部；/live/cctv 仅央视（cctvOnly）。
 */
import { computed, onMounted, ref, watch } from "vue";
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
  <div class="vd-page">
    <!-- 分组标签 -->
    <div v-if="groups.length" class="vdl-groups" role="tablist" aria-label="直播分组">
      <button
        v-for="g in groups"
        :key="g.id"
        type="button"
        role="tab"
        class="vd-chip"
        :class="{ 'is-active': activeGroup === g.id }"
        :aria-selected="activeGroup === g.id"
        @click="activeGroup = g.id"
      >
        {{ g.label }}<span v-if="g.count" class="vd-chip-count">({{ g.count }})</span>
      </button>
      <span class="vdl-count">
        {{ cctvOnly ? "CCTV 直播" : "电视直播" }} · 共 {{ channels.length }} 个频道
      </span>
    </div>

    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vd-empty">
      <el-empty :description="error">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <div class="vdl-layout">
        <!-- 播放器 -->
        <section class="vdl-player-col" aria-label="直播播放器">
          <div v-if="loading" class="vdl-theater vd-poster-skeleton" aria-busy="true" />
          <div v-else-if="!selected" class="vd-empty">
            <el-empty description="该分组暂无可用频道" />
          </div>
          <template v-else>
            <div class="vdl-theater">
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
          <div v-if="loading" class="vdl-channel-grid" aria-busy="true">
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
              <span class="vdl-channel-label" :title="c.name">{{ c.name }}</span>
            </button>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── 分组标签 ───────────────────────────── */
.vdl-groups {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin: 16px 0 8px;
}

.vdl-count {
  margin-left: auto;
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

/* ── 布局 ───────────────────────────────── */
.vdl-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
  margin-top: 12px;
}

.vdl-theater {
  aspect-ratio: 16 / 9;
  max-height: var(--vd-player-h);
  background: #000;
  border-radius: var(--vd-radius);
  overflow: hidden;
}

.vdl-now-playing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--vd-text);
}

.vdl-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
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
  color: #ef4444;
  border: 1px solid rgb(239 68 68 / 45%);
  border-radius: var(--vd-radius-xs);
  padding: 1px 6px;
}

.vdl-source {
  font-size: 13px;
  font-weight: 400;
  color: var(--vd-text-2);
}

.vdl-player-error {
  margin: 10px 0 0;
  font-size: 14px;
  color: #ef4444;
}

/* ── 选台列表（浅灰圆角容器） ────────────── */
.vdl-channel-col {
  background: var(--vd-surface);
  border-radius: 8px;
  padding: 15px;
}

.vdl-channel-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--vd-text);
}

.vdl-channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 520px;
  overflow-y: auto;
}

.vdl-channel {
  border: 1px solid var(--vd-border);
  background: var(--vd-bg);
  color: var(--vd-text);
  font-family: inherit;
  font-size: 14px;
  padding: 10px 8px;
  border-radius: var(--vd-radius);
  cursor: pointer;
  text-align: center;
  transition:
    background var(--vd-fast) var(--vd-ease),
    border-color var(--vd-fast) var(--vd-ease),
    color var(--vd-fast) var(--vd-ease);
}

.vdl-channel:hover {
  border-color: var(--vd-primary);
  color: var(--vd-primary);
}

.vdl-channel:focus-visible {
  outline: 2px solid var(--vd-primary);
  outline-offset: 1px;
}

.vdl-channel.is-active {
  background: var(--vd-primary);
  border-color: var(--vd-primary);
  color: #fff;
  font-weight: 600;
}

.vdl-channel-label {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 骨架 ───────────────────────────────── */
.vdl-skeleton-item {
  height: 40px;
  border-radius: var(--vd-radius);
  background: #ececec;
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
  }
}
</style>
