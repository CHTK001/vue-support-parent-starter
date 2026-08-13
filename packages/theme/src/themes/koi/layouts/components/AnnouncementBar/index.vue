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
const DISMISS_PREFIX = "announcement-dismiss-";

const props = withDefaults(defineProps<{
  /** 显示的公告位置，空表示显示所有 */
  position?: string;
}>(), {
  position: "",
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

async function fetchAnnouncements() {
  const cached = readCache();
  if (cached) {
    announcements.value = cached.filter((a) => !isDismissed(a.sysAnnouncementId));
    return;
  }

  try {
    const { getActiveAnnouncements } = await import("@pages/system/api/announcementApi");
    const res = await getActiveAnnouncements();
    const list = (res?.data ?? []) as Announcement[];
    writeCache(list);
    announcements.value = list.filter((a) => !isDismissed(a.sysAnnouncementId));
  } catch {
    /* 静默失败 */
  }
}

onMounted(() => {
  fetchAnnouncements();
  timer = setInterval(fetchAnnouncements, 300000);
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