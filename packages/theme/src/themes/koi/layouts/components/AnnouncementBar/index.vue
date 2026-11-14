<script setup lang="ts">
/**
 * 全局公告条组件
 *
 * 从已注入的公告接口（见 announcementApi 注册表）获取当前用户可见的活跃公告，
 * 按 position 分组渲染。缓存 5 分钟到 localStorage，减少重复请求。
 * 支持关闭单条公告（关闭后当天不再显示）。
 *
 * 依赖方向：本组件不直接 import @pages/*；未注入实现时静默不请求。
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { getConfig } from "@repo/config";
import { ArrowDown, ArrowUp, Close } from "@element-plus/icons-vue";
import useUserStore from "@repo/pinia/modules/user";
import { getAnnouncementApi } from "../../../../../announcementApi";

interface Announcement {
  sysAnnouncementId: number;
  sysAnnouncementTitle: string;
  sysAnnouncementContent: string;
  sysAnnouncementLevel: string;
  sysAnnouncementPosition: string;
  sysAnnouncementTargetUrl: string;
}

const CACHE_TTL = 5 * 60 * 1000;
const FAIL_CACHE_TTL = 30 * 1000;

// 当前登录用户标识：缓存 / 关闭标记都按用户隔离，避免同一浏览器切换账号后串号。
const userStore = useUserStore();
const userKey = computed(() => {
  const info = (userStore.userInfo || {}) as Record<string, unknown>;
  const id = info.userId ?? info.sysUserId ?? userStore.username;
  return id === undefined || id === "" ? "anonymous" : String(id);
});
const cacheKey = computed(() => `announcement-active-cache:${userKey.value}`);
const failCacheKey = computed(() => `announcement-active-fail-cache:${userKey.value}`);
const dismissPrefix = computed(() => `announcement-dismiss:${userKey.value}:`);

/**
 * 模块级单例：按用户隔离的并发请求 Promise，
 * 避免 fixed-top 与 default 两个实例重复请求同一接口。
 */
const inflights = new Map<string, Promise<Announcement[]>>();
/** 模块级内存缓存（成功 5 分钟），按用户隔离 */
const memCaches = new Map<string, { list: Announcement[]; timestamp: number }>();

const props = withDefaults(defineProps<{
  /** 显示的公告位置，空表示显示所有 */
  position?: string;
  /** 加载方式：single-仅挂载时加载一次（默认） / timed-定时轮询 */
  loadMode?: "single" | "timed";
  /** timed 模式下轮询间隔（毫秒），默认 5 分钟 */
  interval?: number;
  /** 折叠态最多显示几条（超出部分收进「展开全部」），默认 3 */
  max?: number;
}>(), {
  position: "",
  loadMode: "single",
  interval: 300000,
  max: 3,
});

const announcements = ref<Announcement[]>([]);
/** 是否展开「全部公告」（折叠态只留 max 条，避免公告墙把页面挤没） */
const expanded = ref(false);

/**
 * 条目指纹：同一标题/等级/位置/正文/跳转的公告视为同一条。
 *
 * <p>后端 {@code /v2/announcement/active} 在「同一条公告被重复发布」或历史数据
 * 重复初始化时会把同标题的多行一起返回（实测「V2.0发布」×4、「安全提醒」×4），
 * 前端按指纹收成一条，否则公告条会整屏堆同一条内容。</p>
 */
function announceSignature(a: Announcement): string {
  return [a.sysAnnouncementLevel, a.sysAnnouncementPosition, a.sysAnnouncementTitle, a.sysAnnouncementContent, a.sysAnnouncementTargetUrl]
    .map((v) => String(v ?? ""))
    .join("\u0000");
}

/**
 * 规范化：按 id 去重（同一行被重复推送/重复渲染），再按内容指纹去重
 * （不同 id 的重复数据）。顺序保持后端返回顺序（后端按发布时间倒序）。
 */
function normalize(list: Announcement[] | null | undefined): Announcement[] {
  const seenIds = new Set<string>();
  const seenSig = new Set<string>();
  const out: Announcement[] = [];
  for (const a of list ?? []) {
    if (!a) continue;
    const id = a.sysAnnouncementId;
    if (id !== undefined && id !== null && String(id) !== "") {
      const key = String(id);
      if (seenIds.has(key)) continue;
      seenIds.add(key);
    }
    const sig = announceSignature(a);
    if (seenSig.has(sig)) continue;
    seenSig.add(sig);
    out.push(a);
  }
  return out;
}

// 显隐开关（app.yaml other.toolbar.announcement，缺省显示）。
// 后端未实现平台公告接口的独立应用关掉它，可避免 403 被 http 拦截器判为会话失效。
// 兼容两种写法：`announcement: false` 与 `announcement: { enable: false }`
// （后者与其它能力开关一致，历史 yaml 里两种都出现过）。
const enabled = computed(() => {
  const raw = getConfig().other?.toolbar?.announcement as unknown;
  if (raw === false) return false;
  if (raw && typeof raw === "object" && (raw as { enable?: unknown }).enable === false) return false;
  return true;
});

/** 当前 position 下去重后的公告 */
const filtered = computed(() => {
  const list = announcements.value;
  if (!props.position) return list;
  return list.filter((a) => a.sysAnnouncementPosition === props.position);
});

/** 折叠态实际渲染的条目 */
const shown = computed(() => {
  const list = filtered.value;
  const max = Math.max(0, props.max);
  if (expanded.value || !max || list.length <= max) return list;
  return list.slice(0, max);
});

/** 被折叠掉的条数（0 表示不需要展开器） */
const hiddenCount = computed(() => filtered.value.length - shown.value.length);

// 列表刷新后回到折叠态：展开态跨轮询保留会让「收起来」失效
watch(
  () => filtered.value.map((a) => a.sysAnnouncementId).join(","),
  () => {
    if (expanded.value && filtered.value.length <= Math.max(0, props.max)) expanded.value = false;
  },
);

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
    const raw = localStorage.getItem(cacheKey.value);
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
    localStorage.setItem(cacheKey.value, JSON.stringify({ list, timestamp: Date.now() }));
  } catch {
    /* ignore */
  }
}

/** 读取失败缓存（持久化到 sessionStorage，HMR 不丢失） */
function readFailCache(): boolean {
  try {
    const raw = sessionStorage.getItem(failCacheKey.value);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Date.now() - ts < FAIL_CACHE_TTL;
  } catch {
    return false;
  }
}

/** 写入失败缓存 */
function writeFailCache() {
  try {
    sessionStorage.setItem(failCacheKey.value, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function isDismissed(id: number): boolean {
  try {
    const key = dismissPrefix.value + id;
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
    localStorage.setItem(dismissPrefix.value + id, String(Date.now()));
    announcements.value = announcements.value.filter((a) => a.sysAnnouncementId !== id);
  } catch {
    /* ignore */
  }
  // 主动关闭即视为已读，上报服务端（best-effort）
  reportRead(id);
}

/** 上报单条公告已读到服务端（best-effort，失败静默；本地关闭逻辑不受影响） */
async function reportRead(id: number) {
  try {
    const api = getAnnouncementApi();
    if (!api) return;
    await api.markAnnouncementRead(id);
  } catch {
    /* ignore */
  }
}

/** 批量上报已读（公告已展示给当前用户，视为已读） */
function reportReads(list: Announcement[]) {
  list.forEach((a) => {
    if (a.sysAnnouncementId) reportRead(a.sysAnnouncementId);
  });
}

async function fetchAnnouncements(force = false) {
  // 应用未注入公告实现（后端无该模块或未引入 @pages/system）：静默跳过，不发请求
  if (!getAnnouncementApi()) return;
  const uk = userKey.value;
  // 失败短缓存（sessionStorage 持久化，HMR 不丢失）：后端异常期间不重复请求
  if (!force && readFailCache()) return;
  // 内存成功缓存（timed 轮询用 force=true 强制刷新）
  const mem = memCaches.get(uk);
  if (!force && mem && Date.now() - mem.timestamp < CACHE_TTL) {
    announcements.value = normalize(mem.list).filter((a) => !isDismissed(a.sysAnnouncementId));
    return;
  }
  // localStorage 成功缓存
  if (!force) {
    const cached = readCache();
    if (cached) {
      memCaches.set(uk, { list: cached, timestamp: Date.now() });
      announcements.value = normalize(cached).filter((a) => !isDismissed(a.sysAnnouncementId));
      return;
    }
  }

  // 单例去重：同一用户的多个实例 / 并发挂载只发一次请求
  let inflight = inflights.get(uk);
  if (!inflight) {
    inflight = (async () => {
      const api = getAnnouncementApi();
      if (!api) {
        return [] as Announcement[];
      }
      const res = await api.getActiveAnnouncements();
      // 去重在写入缓存之前做：缓存里存的是去重结果，避免老缓存把重复项带回来
      const list = normalize((res?.data ?? []) as Announcement[]);
      writeCache(list);
      memCaches.set(uk, { list, timestamp: Date.now() });
      // 请求成功，清除失败缓存
      try { sessionStorage.removeItem(failCacheKey.value); } catch { /* ignore */ }
      // 公告已展示给当前用户，上报已读（best-effort）
      reportReads(list);
      return list;
    })().catch((error) => {
      // 失败也短缓存（持久化到 sessionStorage），防止异常期间反复轰炸后端
      writeFailCache();
      throw error;
    }).finally(() => {
      inflights.delete(uk);
    });
    inflights.set(uk, inflight);
  }

  try {
    const list = await inflight;
    announcements.value = list.filter((a) => !isDismissed(a.sysAnnouncementId));
  } catch {
    /* 静默失败 */
  }
}

onMounted(() => {
  if (!enabled.value) return;
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
  <div v-if="filtered.length" class="announcement-bar" :class="{ 'is-expanded': expanded }">
    <div
      v-for="item in shown"
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
    <div v-if="hiddenCount > 0 || expanded" class="announcement-more">
      <button type="button" class="announcement-more-btn" @click="expanded = !expanded">
        <el-icon :size="12"><ArrowUp v-if="expanded" /><ArrowDown v-else /></el-icon>
        <span>{{ expanded ? "收起" : `还有 ${hiddenCount} 条` }}</span>
      </button>
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

/* 展开态限高滚动：公告再多也不把页面挤走 */
.announcement-bar.is-expanded {
  max-height: 40vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.announcement-more {
  display: flex;
  justify-content: center;
  padding: 2px 0 4px;
  background: var(--el-fill-color-light);
}

.announcement-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  padding: 2px 10px;
  border-radius: 999px;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1.5;
  cursor: pointer;
  transition: background 0.2s;
}

.announcement-more-btn:hover {
  background: var(--el-color-primary-light-9);
}
</style>