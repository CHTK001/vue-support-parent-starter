<template>
  <div class="wp">
    <!-- 当前壁纸：实时预览 + 摘要 -->
    <section class="wp-hero">
      <div class="wp-hero__preview" :class="{ 'is-empty': isDefault }" :style="previewVars">
        <div class="wp-hero__image" :style="previewImageStyle"></div>
        <div class="wp-hero__dim"></div>
        <!-- 迷你界面示意：壁纸是透在侧栏 / 顶栏 / 卡片之下的 -->
        <div class="wp-hero__ghost" aria-hidden="true">
          <span class="wp-hero__ghost-aside"></span>
          <span class="wp-hero__ghost-header"></span>
          <span class="wp-hero__ghost-card wp-hero__ghost-card--a"></span>
          <span class="wp-hero__ghost-card wp-hero__ghost-card--b"></span>
        </div>
        <span v-if="isDefault" class="wp-hero__empty">未使用壁纸</span>
      </div>

      <div class="wp-hero__meta">
        <div class="wp-hero__eyebrow">当前壁纸</div>
        <div class="wp-hero__name">
          <span class="wp-hero__name-text">{{ currentName }}</span>
          <el-tag v-if="!isDefault" size="small" effect="plain">{{ sourceLabel }}</el-tag>
        </div>
        <p class="wp-hero__params">{{ paramsSummary }}</p>
        <el-button v-if="!isDefault" plain size="small" @click="handleReset">恢复默认</el-button>
      </div>
    </section>

    <div class="wp-body">
      <!-- 调节 -->
      <aside class="wp-tune" :class="{ 'is-disabled': isDefault }">
        <div class="wp-tune__head">
          <h4 class="wp-tune__title">调节</h4>
          <el-button v-if="!isDefault" text size="small" class="wp-tune__reset" @click="resetTuning">
            重置参数
          </el-button>
        </div>

        <div class="wp-tune__row">
          <span class="wp-tune__label">不透明度</span>
          <el-slider v-model="opacityPercent" class="wp-tune__slider" :min="10" :max="100" :step="5" :show-tooltip="false" />
          <span class="wp-tune__value">{{ opacityPercent }}%</span>
        </div>
        <div class="wp-tune__row">
          <span class="wp-tune__label">平铺</span>
          <el-select v-model="tile" class="wp-tune__select" size="small" :disabled="!tilingSupported">
            <el-option v-for="option in tileOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </div>
        <p v-if="!tilingSupported && !isDefault" class="wp-tune__hint wp-tune__hint--warn">
          当前壁纸是 CSS 渐变，始终铺满视口，平铺没有视觉效果。
        </p>
        <div class="wp-tune__row">
          <span class="wp-tune__label">模糊</span>
          <el-slider v-model="blurPx" class="wp-tune__slider" :min="0" :max="24" :step="1" :show-tooltip="false" />
          <span class="wp-tune__value">{{ blurPx }}px</span>
        </div>
        <div class="wp-tune__row">
          <span class="wp-tune__label">压暗</span>
          <el-slider v-model="dimPercent" class="wp-tune__slider" :min="0" :max="80" :step="5" :show-tooltip="false" />
          <span class="wp-tune__value">{{ dimPercent }}%</span>
        </div>

        <p class="wp-tune__hint">
          模糊与压暗一起作用于整层壁纸；卡片自身保留 72% 底，不随这里变。
        </p>
      </aside>

      <!-- 壁纸库 -->
      <section class="wp-library">
        <div class="wp-library__bar">
          <el-radio-group v-model="activeFilter" size="small" class="wp-library__filter">
            <el-radio-button label="all">全部 {{ counts.all }}</el-radio-button>
            <el-radio-button label="builtin">内置 {{ counts.builtin }}</el-radio-button>
            <el-radio-button label="online">在线 {{ counts.online }}</el-radio-button>
            <el-radio-button label="mine">我的 {{ counts.mine }}</el-radio-button>
            <el-radio-button label="favorite">收藏 {{ counts.favorite }}</el-radio-button>
          </el-radio-group>
          <el-input v-model="query" class="wp-library__search" size="small" clearable placeholder="搜索壁纸名称">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <p v-if="probingCount > 0" class="wp-library__probing">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在检测在线壁纸（{{ probingCount }} 张）…
        </p>

        <template v-if="activeFilter !== 'mine'">
          <!-- 默认（全部 / 内置里出现，收藏页不混入；和普通壁纸同尺寸） -->
          <div v-if="showDefaultTile" class="wp-grid">
            <button
              type="button"
              class="wp-card wp-card--plain"
              :class="{ 'is-selected': isDefault }"
              @click="handleReset"
            >
              <span class="wp-card__thumb wp-card__thumb--plain"></span>
              <span class="wp-card__name">不开壁纸</span>
              <el-icon v-if="isDefault" class="wp-card__check"><Check /></el-icon>
            </button>
          </div>

          <section v-for="group in builtinGroups" :key="group.title" class="wp-group">
            <h5 class="wp-group__title">{{ group.title }}</h5>
            <div class="wp-grid">
              <div
                v-for="preset in group.items"
                :key="preset.id"
                class="wp-card"
                :class="{ 'is-selected': isPresetSelected(preset) }"
                role="button"
                tabindex="0"
                @click="pickPreset(preset)"
                @keydown.enter.prevent="pickPreset(preset)"
                @keydown.space.prevent="pickPreset(preset)"
              >
                <span class="wp-card__thumb" :style="thumbStyle(preset)"></span>
                <span class="wp-card__name">{{ preset.name }}</span>
                <el-icon v-if="isPresetSelected(preset)" class="wp-card__check"><Check /></el-icon>
                <button
                  type="button"
                  class="wp-card__star"
                  :class="{ 'is-on': isFavorite(preset.id) }"
                  :title="isFavorite(preset.id) ? '取消收藏' : '收藏'"
                  :aria-pressed="isFavorite(preset.id)"
                  @click.stop="toggleFavorite(preset.id)"
                >
                  <el-icon>
                    <StarFilled v-if="isFavorite(preset.id)" />
                    <Star v-else />
                  </el-icon>
                </button>
              </div>
            </div>
          </section>

          <el-empty v-if="!builtinGroups.length" :description="emptyText" :image-size="64" />
          <p v-if="offlineRemoteHidden" class="wp-note">
            在线壁纸需要网络且能实际加载才会显示；当前已离线，联网后自动恢复。
          </p>
        </template>

        <template v-else>
          <input
            ref="fileInputRef"
            class="wp-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileChange"
          />
          <div class="wp-grid">
            <button
              v-if="uploadedWallpapers.length < maxUploads"
              type="button"
              class="wp-card wp-card--add"
              :class="{ 'is-uploading': uploading }"
              :disabled="uploading"
              @click="openFilePicker"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <span class="wp-card__thumb wp-card__thumb--add">
                <el-icon v-if="!uploading" :size="22"><UploadFilled /></el-icon>
                <span v-else class="wp-card__loading">上传中…</span>
              </span>
              <span class="wp-card__name">{{ uploading ? "上传中…" : "上传图片" }}</span>
            </button>

            <div
              v-for="item in visibleUploads"
              :key="item.id"
              class="wp-card wp-card--upload"
              :class="{ 'is-selected': isUploadSelected(item) }"
              role="button"
              tabindex="0"
              @click="pickUploadedWallpaper(item)"
              @keydown.enter="pickUploadedWallpaper(item)"
            >
              <span class="wp-card__thumb">
                <img :src="item.url" :alt="item.name" loading="lazy" />
              </span>
              <span class="wp-card__name">{{ item.name }}</span>
              <el-icon v-if="isUploadSelected(item)" class="wp-card__check"><Check /></el-icon>
              <el-button
                class="wp-card__remove"
                type="danger"
                circle
                size="small"
                text
                title="移除这张图"
                @click.stop="handleRemove(item)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <el-empty v-if="!uploadedWallpapers.length" description="还没有上传过壁纸" :image-size="64" />
          <el-empty
            v-else-if="query.trim() && !visibleUploads.length"
            description="没有匹配的图片"
            :image-size="64"
          />

          <p v-if="uploadedWallpapers.length >= maxUploads" class="wp-note">
            已达到 {{ maxUploads }} 张上限，删除一张后可继续上传。
          </p>

          <p class="wp-note">
            支持 JPG / PNG / WebP，单张不超过 8MB；上传前会先压到 2560px 宽。只收位图，不收 SVG。
            当前 {{ uploadedWallpapers.length }}/{{ maxUploads }} 张。
          </p>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 壁纸设置面板（个人中心「壁纸」页签）
 *
 * <p>布局是「预览 — 调节 — 库」：顶部先给当前壁纸的实时预览（含侧栏/顶栏/卡片的
 * 迷你示意），左侧固定调节，右侧是可筛选、可搜索的壁纸库。</p>
 *
 * <p>选中即生效（整页就是最终效果），参数改动立刻写 CSS 变量；
 * 落盘做防抖，避免拖滑杆时每帧都写一次 localStorage。</p>
 *
 * <p>上传复用框架既有的文件接口 {@code /v2/file/upload}：与换头像同一条路，
 * 只把桶名换成 wallpaper，不新增后端上传端点。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Check, Delete, Loading, Search, Star, StarFilled, UploadFilled } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { msgError, msgSuccess } from "@repo/core";
import { getAccessToken, normalizeUrl } from "@repo/utils";
import { getConfig } from "@repo/config";
import {
  addUploadedWallpaper,
  applyWallpaper,
  createDefaultSetting,
  networkOnline,
  pickPreset,
  pickUploadedWallpaper,
  removeUploadedWallpaper,
  setWallpaperTuning,
  syncWallpaperFromServer,
  uploadedWallpapers,
  WALLPAPER_TILE_MAP,
  wallpaperPresets,
  wallpaperSetting,
  type UploadedWallpaper,
} from "./store";
import type { WallpaperPreset, WallpaperTile } from "./types";

const setting = wallpaperSetting;

/** 上传记录上限，与 store 的 MAX_UPLOADS 保持一致 */
const maxUploads = 12;

// 打开面板时再同步一次：布局挂载那一刻令牌可能还没恢复，这里补一次
onMounted(() => {
  void syncWallpaperFromServer();
});

/**
 * 当前是否暗色主题。
 *
 * <p>直接观察 html.dark，而不是从 global store 取：壁纸面板在 theme 包里，
 * 不静态依赖 @repo/pinia；而真实图层本来就是用 CSS（html.dark）切暗色变体，
 * 这里跟它保持同一个判据，预览才不会和整页效果对不上。</p>
 */
const dark = ref(false);
let darkObserver: MutationObserver | undefined;
onMounted(() => {
  const sync = () => {
    dark.value = document.documentElement.classList.contains("dark");
  };
  sync();
  darkObserver = new MutationObserver(sync);
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});
onBeforeUnmount(() => darkObserver?.disconnect());

const tileOptions: Array<{ label: string; value: WallpaperTile }> = [
  { label: "不重复（铺满）", value: "none" },
  { label: "等比铺满", value: "cover" },
  { label: "等比适应", value: "contain" },
  { label: "双向平铺", value: "repeat" },
  { label: "横向平铺", value: "repeat-x" },
  { label: "纵向平铺", value: "repeat-y" },
];

const isDefault = computed(() => setting.source === "default");

/* ==================== 筛选与搜索 ==================== */

/** 在线壁纸逐张预检结果：id -> 是否真的能加载 */
const remoteOk = ref<Record<string, boolean>>({});
/** 正在探测的 id，避免重复 new Image */
const probing = new Set<string>();
/** 正在探测的张数（给「检测中」提示用，避免用户以为在线壁纸消失了） */
const probingCount = ref(0);
/** 单张探测超时（ms）：超时按不可用处理，不无限等 */
const PROBE_TIMEOUT = 6000;

/* -------------------- 收藏（本地，跨设备不跟随） -------------------- */

const FAVORITE_KEY = "koi:wallpaper:favorites:v1";

function readFavorites(): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(FAVORITE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id) : [];
  } catch {
    return [];
  }
}

const favorites = ref<string[]>(readFavorites());

function isFavorite(id: string): boolean {
  return favorites.value.includes(id);
}

/** 星标切换：本地保存即可，收藏是「这台设备的偏好」，不进服务端配置 */
function toggleFavorite(id: string): void {
  favorites.value = isFavorite(id)
    ? favorites.value.filter((one) => one !== id)
    : [...favorites.value, id];
  try {
    window.localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites.value));
  } catch {
    /* 存不下不影响本次会话 */
  }
}

type WallpaperFilter = "all" | "builtin" | "online" | "mine" | "favorite";

const activeFilter = ref<WallpaperFilter>("all");
const query = ref("");

function matchQuery(name: string): boolean {
  const q = query.value.trim().toLowerCase();
  return !q || name.toLowerCase().includes(q);
}

/** 在线壁纸是否真的可达（离线或探测失败都不算） */
function isOnlineAvailable(preset: WallpaperPreset): boolean {
  return Boolean(preset.remote && networkOnline.value && remoteOk.value[preset.id] === true);
}

const counts = computed(() => {
  const builtin = wallpaperPresets.value.filter((p) => !p.remote).length;
  const online = wallpaperPresets.value.filter((p) => isOnlineAvailable(p)).length;
  // 收藏只算「此刻真能看到的」：内置恒在，在线必须是预检通过的
  const favorite = wallpaperPresets.value.filter(
    (p) => isFavorite(p.id) && (!p.remote || isOnlineAvailable(p)),
  ).length;
  return {
    builtin,
    online,
    favorite,
    mine: uploadedWallpapers.value.length,
    all: builtin + online + uploadedWallpapers.value.length,
  };
});

/** 是否显示「不开壁纸」卡：只在全部 / 内置里，且搜索词要能匹配到 */
const showDefaultTile = computed(
  () =>
    activeFilter.value !== "online" &&
    activeFilter.value !== "mine" &&
    activeFilter.value !== "favorite" &&
    matchQuery("不开壁纸"),
);

/** 当前筛选下的预设分组（保留目录自身的分组名，结构即信息） */
const builtinGroups = computed(() => {
  const map = new Map<string, WallpaperPreset[]>();
  for (const preset of wallpaperPresets.value) {
    if (activeFilter.value === "favorite" && !isFavorite(preset.id)) continue;
    if (preset.remote) {
      if (activeFilter.value === "builtin") continue;
      if (!isOnlineAvailable(preset)) continue;
    } else if (activeFilter.value === "online") {
      continue;
    }
    if (!matchQuery(preset.name)) continue;
    const key = preset.group || "内置";
    const list = map.get(key) ?? [];
    list.push(preset);
    map.set(key, list);
  }
  return Array.from(map, ([title, items]) => ({ title, items }));
});

const visibleUploads = computed(() => uploadedWallpapers.value.filter((item) => matchQuery(item.name)));

const emptyText = computed(() => {
  if (query.value.trim()) return "没有匹配的壁纸";
  if (activeFilter.value === "favorite") return "还没有收藏的壁纸（点卡片右上角的星标）";
  if (activeFilter.value === "online") {
    // 探测中不能说「不可加载」，否则用户会以为这三张没了
    return probingCount.value > 0
      ? "正在检测在线壁纸…"
      : "在线壁纸当前不可加载（需要联网且能真实加载）";
  }
  return "暂无壁纸";
});

/* ==================== 当前壁纸摘要 ==================== */

const currentName = computed(() => {
  if (setting.source === "upload") {
    return uploadedWallpapers.value.find((item) => item.url === setting.url)?.name || "我的图片";
  }
  if (setting.source === "builtin") {
    return wallpaperPresets.value.find((preset) => preset.id === setting.presetId)?.name || "内置壁纸";
  }
  return "不使用壁纸";
});

const sourceLabel = computed(() => {
  if (setting.source === "upload") return "自定义";
  if (setting.source === "builtin") return "内置";
  return "";
});

const currentStyle = computed<Record<string, string>>(() => {
  // 暗色优先用 cssDark：真实图层在 html.dark 下也走 --koi-wallpaper-image-dark
  const css = dark.value ? setting.cssDark || setting.css : setting.css;
  if (css) return { backgroundImage: css };
  if (setting.url) return { backgroundImage: `url("${setting.url}")` };
  return { backgroundImage: "none" };
});

/** CSS 渐变始终铺满视口，平铺对它是空操作 → 只对位图开放平铺 */
const tilingSupported = computed(() => Boolean(setting.url));

/**
 * 预览与真实图层共用同一张平铺映射。
 *
 * <p>之前预览固定 cover，选「双向平铺」时预览毫无变化，用户会以为开关坏了。
 * 渐变不支持平铺，按 cover 渲染，避免预览与真实效果对不上。</p>
 */
const previewImageStyle = computed<Record<string, string>>(() => {
  const tile = tilingSupported.value ? WALLPAPER_TILE_MAP[setting.tile] : WALLPAPER_TILE_MAP.cover;
  return {
    ...currentStyle.value,
    backgroundSize: tile.size,
    backgroundRepeat: tile.repeat,
  };
});

/** 预览用 CSS 变量：让缩略预览和真实页面吃同一套参数 */
const previewVars = computed<Record<string, string>>(() => ({
  "--wp-preview-opacity": String(setting.opacity),
  "--wp-preview-blur": `${setting.blur}px`,
  "--wp-preview-dim": String(setting.dim),
}));

const paramsSummary = computed(() => {
  if (isDefault.value) return "不铺图，页面保持默认底色";
  const tileLabel = tileOptions.find((option) => option.value === setting.tile)?.label || "铺满";
  const opacity = Math.round(setting.opacity * 100);
  const dim = Math.round(setting.dim * 100);
  return `${tileLabel} · 不透明度 ${opacity}% · 模糊 ${Math.round(setting.blur)}px · 压暗 ${dim}%`;
});

/**
 * 预检一张在线壁纸是否真的能加载。
 *
 * <p>只判 navigator.onLine 不够——国内环境访问 Unsplash 经常「在线但超时/被拦」，
 * 那样面板里会是一排加载不出来的缩略图。这里用 Image 预加载做实际可达性判断。</p>
 */
function probeRemote(preset: WallpaperPreset): void {
  if (!preset.url || probing.has(preset.id)) return;
  if (remoteOk.value[preset.id] !== undefined) return;
  probing.add(preset.id);
  probingCount.value += 1;
  let done = false;
  const finish = (ok: boolean) => {
    if (done) return;
    done = true;
    probing.delete(preset.id);
    probingCount.value = Math.max(0, probingCount.value - 1);
    remoteOk.value = { ...remoteOk.value, [preset.id]: ok };
  };
  const image = new Image();
  const timer = window.setTimeout(() => finish(false), PROBE_TIMEOUT);
  image.onload = () => {
    window.clearTimeout(timer);
    finish(true);
  };
  image.onerror = () => {
    window.clearTimeout(timer);
    finish(false);
  };
  image.src = preset.url;
}

// 目录就绪 / 恢复联网时预检；失败过的条目在联网恢复后重试一次
watch(
  [wallpaperPresets, networkOnline],
  ([list, online]) => {
    if (!online) return;
    for (const id of Object.keys(remoteOk.value)) {
      if (!remoteOk.value[id]) delete remoteOk.value[id];
    }
    for (const preset of list) {
      if (preset.remote) probeRemote(preset);
    }
  },
  { immediate: true },
);

/** 是否存在因离线被隐藏的在线壁纸（用于给一行提示） */
const offlineRemoteHidden = computed(
  () => !networkOnline.value && wallpaperPresets.value.some((preset) => preset.remote),
);

/** 缩略图：CSS 预设用渐变（暗色用 cssDark），远程图片用 url */
function thumbStyle(preset: WallpaperPreset): Record<string, string> {
  const css = dark.value ? preset.cssDark || preset.css : preset.css;
  if (css) return { backgroundImage: css };
  if (preset.url) return { backgroundImage: `url("${preset.url}")` };
  return {};
}

/* ==================== 参数绑定 ==================== */

const opacityPercent = computed({
  get: () => Math.round(setting.opacity * 100),
  set: (value: number) => setWallpaperTuning({ opacity: value / 100 }),
});

const blurPx = computed({
  get: () => Math.round(setting.blur),
  set: (value: number) => setWallpaperTuning({ blur: value }),
});

const dimPercent = computed({
  get: () => Math.round(setting.dim * 100),
  set: (value: number) => setWallpaperTuning({ dim: value / 100 }),
});

const tile = computed({
  get: () => setting.tile,
  set: (value: WallpaperTile) => setWallpaperTuning({ tile: value }),
});

/** 把参数恢复成这张壁纸的推荐值（不是回到全局默认，也不换图） */
function resetTuning(): void {
  if (setting.source === "upload") {
    setWallpaperTuning({ tile: "cover", opacity: 1, blur: 0, dim: 0.12 });
    return;
  }
  const preset =
    wallpaperPresets.value.find((one) => one.id === setting.presetId) ||
    wallpaperPresets.value.find((one) => one.remoteId != null && one.remoteId === setting.remotePresetId);
  setWallpaperTuning({
    tile: preset?.tile ?? "none",
    opacity: preset?.opacity ?? 1,
    blur: preset?.blur ?? 0,
    dim: preset?.dim ?? 0,
  });
}

/* ==================== 选中判定 ==================== */

function isPresetSelected(preset: WallpaperPreset): boolean {
  return setting.source === "builtin" && setting.presetId === preset.id;
}
function isUploadSelected(item: UploadedWallpaper): boolean {
  return setting.source === "upload" && setting.url === item.url;
}

/* ==================== 操作 ==================== */

function handleReset(): void {
  applyWallpaper(createDefaultSetting());
}

function handleRemove(item: UploadedWallpaper): void {
  void confirmRemove(item);
}

/** 删除不可撤销，先确认；上传的文件仍留在服务端文件库，只移除记录 */
async function confirmRemove(item: UploadedWallpaper): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `「${item.name}」会从壁纸库移除，已上传的文件仍保留在服务端。`,
      "移除这张壁纸",
      { type: "warning", confirmButtonText: "移除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  removeUploadedWallpaper(item.id);
  msgSuccess("已移除");
}

/* ==================== 上传 ==================== */

const fileInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

/** 允许的类型：只收位图。SVG 等于开放一个内联脚本入口，一律不收 */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
/** 长边上限：再大对壁纸没有意义，还会拖慢首屏 */
const MAX_EDGE = 2560;

const uploadUrl = computed(() => {
  const config = getConfig();
  return normalizeUrl(config?.http?.baseUrl || "", config?.url?.upload || "/v2/file/upload");
});

/** 等比缩到 MAX_EDGE 以内，输出 JPEG；失败时回退原图 */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_EDGE / longest);
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
      bitmap.close?.();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close?.();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

async function uploadFile(file: File): Promise<void> {
  if (!file) return;
  if (!ALLOWED_TYPES.includes(file.type)) {
    msgError("只支持 JPG / PNG / WebP 图片");
    return;
  }
  if (file.size > MAX_BYTES) {
    msgError("图片不能超过 8MB");
    return;
  }

  uploading.value = true;
  try {
    const blob = await compressImage(file);
    const formData = new FormData();
    formData.append("file", new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" }));
    formData.append("fileBucket", "wallpaper");
    formData.append("ossType", "FILESYSTEM");

    const token = getAccessToken();
    const response = await fetch(uploadUrl.value, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`上传失败（HTTP ${response.status}）`);
    }
    const result = await response.json();
    const url: string = result?.data?.url || "";
    if (!url) {
      throw new Error(result?.msg || "上传接口未返回地址");
    }

    const item: UploadedWallpaper = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      name: file.name.replace(/\.[^.]+$/, "").slice(0, 24) || "我的图片",
      createdAt: Date.now(),
    };
    addUploadedWallpaper(item);
    pickUploadedWallpaper(item);
    msgSuccess("壁纸已应用");
  } catch (error) {
    msgError((error as Error)?.message || "上传失败");
  } finally {
    uploading.value = false;
  }
}

function openFilePicker(): void {
  if (uploading.value) return;
  fileInputRef.value?.click();
}

function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) void uploadFile(file);
}

function handleDrop(event: DragEvent): void {
  const file = event.dataTransfer?.files?.[0];
  if (file) void uploadFile(file);
}
</script>

<style lang="scss" scoped>
.wp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ==================== 当前壁纸预览 ==================== */

.wp-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 232px;
  gap: 16px;
  align-items: stretch;
}

.wp-hero__preview {
  position: relative;
  height: 176px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  overflow: hidden;
  isolation: isolate;

  &.is-empty {
    background-image: linear-gradient(
      135deg,
      var(--el-fill-color) 25%,
      var(--el-fill-color-light) 25% 50%,
      var(--el-fill-color) 50% 75%,
      var(--el-fill-color-light) 75%
    );
    background-size: 18px 18px;
  }
}

.wp-hero__image {
  position: absolute;
  inset: calc(var(--wp-preview-blur, 0px) * -2);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: var(--wp-preview-opacity, 1);
  filter: blur(var(--wp-preview-blur, 0px));
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.wp-hero__dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--wp-preview-dim, 0));
  pointer-events: none;
}

/* 迷你界面：让人一眼看出壁纸是透在 chrome 与卡片之下的 */
.wp-hero__ghost {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wp-hero__ghost-aside {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 18%;
  background: color-mix(in srgb, var(--el-bg-color) 58%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--el-border-color) 50%, transparent);
}

.wp-hero__ghost-header {
  position: absolute;
  left: 18%;
  right: 0;
  top: 0;
  height: 16%;
  background: color-mix(in srgb, var(--el-bg-color) 55%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color) 45%, transparent);
}

.wp-hero__ghost-card {
  position: absolute;
  border-radius: 6px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 40%, transparent);
}

.wp-hero__ghost-card--a {
  left: 23%;
  top: 27%;
  width: 33%;
  bottom: 12%;
}

.wp-hero__ghost-card--b {
  left: 59%;
  top: 27%;
  right: 4%;
  bottom: 12%;
}

.wp-hero__empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color) 80%, transparent);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.wp-hero__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  padding: 4px 0;
}

.wp-hero__eyebrow {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--el-text-color-placeholder);
}

.wp-hero__name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.wp-hero__name-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-hero__params {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

/* ==================== 主体：调节 + 库 ==================== */

.wp-body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.wp-tune {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);

  &.is-disabled {
    opacity: 0.45;
    pointer-events: none;
  }
}

.wp-tune__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.wp-tune__title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.wp-tune__reset {
  margin-left: auto;
  padding: 0;
  height: 20px;
  font-size: 12px;
}

.wp-tune__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wp-tune__label {
  flex: none;
  width: 56px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.wp-tune__slider {
  flex: 1;
  min-width: 0;
}

.wp-tune__select {
  flex: 1;
  min-width: 0;
}

.wp-tune__value {
  flex: none;
  width: 44px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.wp-tune__hint {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.wp-tune__hint--warn {
  color: var(--el-color-warning);
}

/* ==================== 壁纸库 ==================== */

.wp-library {
  min-width: 0;
}

.wp-library__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.wp-library__filter {
  flex: none;
}

.wp-library__search {
  flex: 1;
  min-width: 160px;
  max-width: 260px;
  margin-left: auto;
}

.wp-library__probing {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.wp-file-input {
  display: none;
}

.wp-group + .wp-group {
  margin-top: 14px;
}

.wp-group__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
}

.wp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
}

.wp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: inset 0 0 0 1px var(--el-color-primary);
  }
}

.wp-card__thumb {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 6px;
  background-color: var(--el-fill-color);
  background-position: center;
  background-size: cover;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.wp-card__thumb--plain {
  background-image: linear-gradient(
    135deg,
    var(--el-fill-color) 25%,
    var(--el-fill-color-light) 25% 50%,
    var(--el-fill-color) 50% 75%,
    var(--el-fill-color-light) 75%
  );
  background-size: 16px 16px;
}

.wp-card__thumb--add {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-secondary);
}

.wp-card__loading {
  font-size: 12px;
}

.wp-card--add {
  border-style: dashed;

  &:disabled {
    cursor: progress;
    opacity: 0.72;
  }
}

.wp-card__name {
  padding: 0 2px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-card__check {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 2px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
}

/* 收藏星标：预设卡右上角；已收藏常显，未收藏 hover / 触屏常显 */
.wp-card__star {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-bg-color) 74%, transparent);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    color: var(--el-color-warning);
    transform: scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  &.is-on {
    opacity: 1;
    color: var(--el-color-warning);
  }
}

.wp-card:hover .wp-card__star,
.wp-card:focus-within .wp-card__star {
  opacity: 1;
}

.wp-card__remove {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.wp-card--upload:hover .wp-card__remove,
.wp-card--upload:focus-within .wp-card__remove {
  opacity: 1;
}

.wp-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

/* 触屏没有 hover：常显删除与星标，否则无法操作 */
@media (hover: none) {
  .wp-card__remove,
  .wp-card__star {
    opacity: 1;
  }
}

/* 窄窗：预览与调节上下排，库占满宽度 */
@media (max-width: 860px) {
  .wp-hero {
    grid-template-columns: 1fr;
  }

  .wp-hero__preview {
    height: 140px;
  }

  .wp-body {
    grid-template-columns: 1fr;
  }

  .wp-tune {
    position: static;
  }
}
</style>
