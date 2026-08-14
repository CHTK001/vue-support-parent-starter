<script setup lang="ts">
/**
 * 全局公告条组件
 *
 * 从后端获取当前用户可见的活跃公告列表，按 position 分组渲染。
 * 缓存 5 分钟到 localStorage，减少重复请求。
 * 支持关闭单条公告（关闭后当天不再显示）。
 */
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Close } from "@element-plus/icons-vue";

interface Announcement {
  sysAnnouncementId: number;
  sysAnnouncementTitle: string;
  sysAnnouncementContent: string;
  sysAnnouncementLevel: string;
  sysAnnouncementPosition: string;
  sysAnnouncementTargetUrl: string;
}

const CACHE_KEY = "announcement-active-cache";
const CACHE_TTL = 5 * 60 * 1000;
/** 请求失败时的短缓存，避免后端异常时重复轰炸 */
const FAIL_CACHE_KEY = "announcement-active-fail-cache";
const FAIL_CACHE_TTL = 30 * 1000;
const DISMISS_PREFIX = "announcement-dismiss-";

/**
 * 模块级单例：并发/多次挂载共享同一个请求 Promise，
 * 避免 fixed-top 与 default 两个实例重复请求同一接口。
 */
let inflight: Promise<SysAnnouncement[]> | null = null;
/** 模块级内存缓存（成功 5 分钟） */
let memCache: { list: SysAnnouncement[]; timestamp: number } | null = null;
/** 模块级失败缓存（30 秒） */
let memFailCache: { timestamp: number } | null = null;

const props = withDefaults(defineProps<{
  /** 显示的公告位置，空表示显示所有 */
  position?: string;
  /** 加载方式：single-仅挂载时加载一次（默认） / timed-定时轮询 */
  loadMode?: "single" | "timed";
  /** timed 模式下轮询间隔（毫秒），默认 5 分钟 */
  interval?: number;
}>(), {
  position: "",
  loadMode: "single",
  interval: 300000,
});

const announcements = ref<Announcement[]>([]);

const filtered = computed(() => {
  if (!props.position) return announcements.value;
  return announcements.value.filter((a) => a.sysAnnouncementPosition === props.position);
});

const levelBg: Record<string, string> = {
  info: "var(--el-color-primary-light-8)",
  warning: "var(--el-color-warning-light-8)",
  important: "var(--el-color-danger-light-8)",
  emergency: "var(--el-color-error-light-8)",
};

const levelText: Record<string, string> = {
  info: "var(--el-color-primary)",
  warning: "var(--el-color-warning)",
  important: "var(--el-color-danger)",
  emergency: "var(--el-color-error)",
};

const levelLabel: Record<string, string> = {
  info: "信息",
  warning: "警告",
  important: "重要",
  emergency: "紧急",
};

let timer: ReturnType<typeof setInterval> | null = null;

function readCache(): Announcement[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    return data.list ?? null;
  } catch {
    return null;
  }
}

function writeCache(list: Announcement[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ list, timestamp: Date.now() }));
  } catch {
    /* ignore */
  }
}

function isDismissed(id: number): boolean {
  try {
    const key = DISMISS_PREFIX + id;
    const val = localStorage.getItem(key);
    if (!val) return false;
    const ts = parseInt(val, 10);
    // 关闭后当天不再显示
    return Date.now() - ts < 86400000;
  } catch {
    return false;
  }
}

function dismiss(id: number) {
  try {
    localStorage.setItem(DISMISS_PREFIX + id, String(Date.now()));
    announcements.value = announcements.value.filter((a) => a.sysAnnouncementId !== id);
  } catch {
    /* ignore */
  }
}

async function fetchAnnouncements(force = false) {
  // 失败短缓存：后端异常期间不重复请求
  if (!force && memFailCache && Date.now() - memFailCache.timestamp < FAIL_CACHE_TTL) return;
  // 内存成功缓存（timed 轮询用 force=true 强制刷新）
  if (!force && memCache && Date.now() - memCache.timestamp < CACHE_TTL) {
    announcements.value = memCache.list.filter((a) => !isDismissed(a.sysAnnouncementId));
    return;
  }
  // localStorage 成功缓存
  if (!force) {
    const cached = readCache();
    if (cached) {
      memCache = { list: cached, timestamp: Date.now() };
      announcements.value = cached.filter((a) => !isDismissed(a.sysAnnouncementId));
      return;
    }
  }

  // 单例去重：多个实例 / 并发挂载只发一次请求
  if (!inflight) {
    inflight = (async () => {
      const { getActiveAnnouncements } = await import("@pages/system/api/announcementApi");
      const res = await getActiveAnnouncements();
      const list = (res?.data ?? []) as SysAnnouncement[];
      writeCache(list);
      memCache = { list, timestamp: Date.now() };
      memFailCache = null;
      return list;
    })().catch((error) => {
      // 失败也短缓存，防止异常期间反复轰炸后端
      memFailCache = { timestamp: Date.now() };
      throw error;
    }).finally(() => {
      inflight = null;
    });
  }

  try {
    const list = await inflight;
    announcements.value = list.filter((a) => !isDismissed(a.sysAnnouncementId));
  } catch {
    /* 静默失败 */
  }
}

onMounted(() => {
  fetchAnnouncements();
  // timed 模式才开启定时轮询（后端 @Cacheable 缓存兜底，轮询不压垮数据库）
  if (props.loadMode === "timed") {
    timer = setInterval(() => fetchAnnouncements(true), props.interval);
  }
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div v-if="filtered.length" class="announcement-bar">
    <div
      v-for="item in filtered"
      :key="item.sysAnnouncementId"
      class="announcement-item"
      :style="{ background: levelBg[item.sysAnnouncementLevel] || levelBg.info }"
    >
      <span
        class="announcement-badge"
        :style="{ color: levelText[item.sysAnnouncementLevel] || levelText.info }"
      >
        {{ levelLabel[item.sysAnnouncementLevel] || "信息" }}
      </span>
      <a
        v-if="item.sysAnnouncementTargetUrl"
        :href="item.sysAnnouncementTargetUrl"
        target="_blank"
        class="announcement-link"
      >
        {{ item.sysAnnouncementTitle }}
      </a>
      <span v-else class="announcement-text">{{ item.sysAnnouncementTitle }}</span>
      <el-icon class="announcement-close" :size="14" @click="dismiss(item.sysAnnouncementId)">
        <Close />
      </el-icon>
    </div>
  </div>
</template>

<style scoped>
.announcement-bar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}

.announcement-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 13px;
  transition: background 0.2s;
}

.announcement-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
}

.announcement-text {
  flex: 1;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.announcement-link {
  flex: 1;
  color: var(--el-color-primary);
  text-decoration: none;
  line-height: 1.4;
}

.announcement-link:hover {
  text-decoration: underline;
}

.announcement-close {
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  color: var(--el-text-color-regular);
}

.announcement-close:hover {
  opacity: 1;
}
</style>