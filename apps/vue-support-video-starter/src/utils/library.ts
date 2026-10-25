/**
 * 本地片库：收藏 / 观看历史
 *
 * 本项目后端没有用户体系，收藏与历史全部落在浏览器 localStorage，
 * 不上传、不需要登录。两个列表都用模块级 ref 暴露，
 * 任何组件读同一份数据，增删后同页立即刷新。
 */
import { ref } from "vue";

import type { VideoInfo } from "@/types/video";

const FAV_KEY = "vd.library.favorites.v1";
const HIS_KEY = "vd.library.history.v1";

/** 历史最多保留条数 */
export const HISTORY_LIMIT = 120;

/** 历史条目 = 影片快照 + 最近观看时间 */
export interface HistoryItem extends VideoInfo {
  watchedAt: number;
}

function readList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* 隐私模式或配额不足时忽略，不影响页面使用 */
  }
}

/** 只留卡片要用的字段，避免 localStorage 被长简介撑满 */
function snapshot(v: VideoInfo): VideoInfo {
  return {
    id: v.id,
    name: v.name,
    cover: v.cover,
    videoType: v.videoType,
    year: v.year,
    score: v.score,
    district: v.district,
    tags: v.tags?.slice(0, 3),
    continueInfo: v.continueInfo,
  };
}

export const favorites = ref<VideoInfo[]>(readList<VideoInfo>(FAV_KEY));
export const history = ref<HistoryItem[]>(readList<HistoryItem>(HIS_KEY));

export function isFavorite(id: string): boolean {
  return favorites.value.some((item) => item.id === id);
}

/** 切换收藏，返回切换后的状态（true = 现在已收藏） */
export function toggleFavorite(v: VideoInfo): boolean {
  const existed = isFavorite(v.id);
  favorites.value = existed
    ? favorites.value.filter((item) => item.id !== v.id)
    : [snapshot(v), ...favorites.value];
  writeList(FAV_KEY, favorites.value);
  return !existed;
}

export function removeFavorite(id: string) {
  favorites.value = favorites.value.filter((item) => item.id !== id);
  writeList(FAV_KEY, favorites.value);
}

export function clearFavorites() {
  favorites.value = [];
  writeList(FAV_KEY, favorites.value);
}

/** 记录一次观看：同一条目只保留最近一次，置顶 */
export function pushHistory(v: VideoInfo) {
  if (!v.id) return;
  const entry: HistoryItem = { ...snapshot(v), watchedAt: Date.now() };
  history.value = [entry, ...history.value.filter((item) => item.id !== v.id)].slice(
    0,
    HISTORY_LIMIT,
  );
  writeList(HIS_KEY, history.value);
}

export function removeHistory(id: string) {
  history.value = history.value.filter((item) => item.id !== id);
  writeList(HIS_KEY, history.value);
}

export function clearHistory() {
  history.value = [];
  writeList(HIS_KEY, history.value);
}

/** 观看时间：今天 HH:mm / 昨天 HH:mm / MM-DD HH:mm */
export function formatWatchedAt(ts: number): string {
  const date = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (days <= 0) return `今天 ${hm}`;
  if (days === 1) return `昨天 ${hm}`;
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${hm}`;
}
