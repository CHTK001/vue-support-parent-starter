<template>
  <div class="wallpaper-panel">
    <div class="wallpaper-panel__head">
      <div class="wallpaper-panel__intro">
        <div class="wallpaper-panel__title">
          我的壁纸
          <el-tag v-if="!isDefault" size="small" effect="plain" class="wallpaper-panel__badge">
            {{ setting.source === "upload" ? "自定义" : "内置" }}
          </el-tag>
        </div>
        <div class="wallpaper-panel__desc">
          壁纸按设备保存；上传的图片存到服务端文件库，换设备需重新选择。
        </div>
      </div>
      <el-button v-if="!isDefault" text type="primary" @click="handleReset">恢复默认</el-button>
    </div>

    <!-- 参数：不透明度 / 平铺 / 模糊 / 暗化 -->
    <div class="wallpaper-tune" :class="{ 'is-disabled': isDefault }">
      <div class="wallpaper-tune__row">
        <span class="wallpaper-tune__label">不透明度</span>
        <el-slider v-model="opacityPercent" class="wallpaper-tune__slider" :min="10" :max="100" :step="5" :show-tooltip="false" />
        <span class="wallpaper-tune__value">{{ opacityPercent }}%</span>
      </div>
      <div class="wallpaper-tune__row">
        <span class="wallpaper-tune__label">平铺方式</span>
        <el-select v-model="tile" class="wallpaper-tune__select" size="small">
          <el-option v-for="option in tileOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </div>
      <div class="wallpaper-tune__row">
        <span class="wallpaper-tune__label">模糊</span>
        <el-slider v-model="blurPx" class="wallpaper-tune__slider" :min="0" :max="24" :step="1" :show-tooltip="false" />
        <span class="wallpaper-tune__value">{{ blurPx }}px</span>
      </div>
      <div class="wallpaper-tune__row">
        <span class="wallpaper-tune__label">压暗</span>
        <el-slider v-model="dimPercent" class="wallpaper-tune__slider" :min="0" :max="80" :step="5" :show-tooltip="false" />
        <span class="wallpaper-tune__value">{{ dimPercent }}%</span>
      </div>
      <div class="wallpaper-tune__hint">
        模糊与压暗会一起作用于整层壁纸，用来把正文对比度拉回来；卡片自身保留 84% 底，不随这里变。
      </div>
    </div>

    <!-- 默认 -->
    <section class="wallpaper-section">
      <h4 class="wallpaper-section__title">默认</h4>
      <button type="button" class="wallpaper-card wallpaper-card--plain" :class="{ 'is-selected': isDefault }" @click="handleReset">
        <span class="wallpaper-card__thumb wallpaper-card__thumb--plain"></span>
        <span class="wallpaper-card__name">不开壁纸</span>
        <el-icon v-if="isDefault" class="wallpaper-card__check"><Check /></el-icon>
      </button>
    </section>

    <!-- 内置 -->
    <section v-for="group in builtinGroups" :key="group.title" class="wallpaper-section">
      <h4 class="wallpaper-section__title">{{ group.title }}</h4>
      <div class="wallpaper-grid">
        <button
          v-for="preset in group.items"
          :key="preset.id"
          type="button"
          class="wallpaper-card"
          :class="{ 'is-selected': isPresetSelected(preset) }"
          @click="pickPreset(preset)"
        >
          <span class="wallpaper-card__thumb" :style="{ backgroundImage: preset.css }"></span>
          <span class="wallpaper-card__name">{{ preset.name }}</span>
          <el-icon v-if="isPresetSelected(preset)" class="wallpaper-card__check"><Check /></el-icon>
        </button>
      </div>
    </section>

    <!-- 我的上传 -->
    <section class="wallpaper-section">
      <h4 class="wallpaper-section__title">
        我的图片
        <span class="wallpaper-section__hint">{{ uploadedWallpapers.length }}/{{ maxUploads }}</span>
      </h4>
      <div class="wallpaper-grid">
        <div
          v-for="item in uploadedWallpapers"
          :key="item.id"
          class="wallpaper-card wallpaper-card--upload"
          :class="{ 'is-selected': isUploadSelected(item) }"
          role="button"
          tabindex="0"
          @click="pickUploadedWallpaper(item)"
          @keydown.enter="pickUploadedWallpaper(item)"
        >
          <span class="wallpaper-card__thumb">
            <img :src="item.url" :alt="item.name" loading="lazy" />
          </span>
          <span class="wallpaper-card__name">{{ item.name }}</span>
          <el-icon v-if="isUploadSelected(item)" class="wallpaper-card__check"><Check /></el-icon>
          <el-button
            class="wallpaper-card__remove"
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

        <label
          v-if="uploadedWallpapers.length < maxUploads"
          class="wallpaper-card wallpaper-card--add"
          :class="{ 'is-uploading': uploading }"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleFileChange" />
          <span class="wallpaper-card__thumb wallpaper-card__thumb--add">
            <el-icon v-if="!uploading" :size="22"><UploadFilled /></el-icon>
            <span v-else class="wallpaper-card__loading">上传中…</span>
          </span>
          <span class="wallpaper-card__name">{{ uploading ? "上传中…" : "上传图片" }}</span>
        </label>
      </div>
      <div class="wallpaper-section__tip">
        支持 JPG / PNG / WebP，单张不超过 8MB；上传前会先压到 2560px 宽。只收位图，不收 SVG。
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 壁纸设置面板
 *
 * <p>个人中心「壁纸」页签使用。选中即生效（整页就是预览），参数改动立刻写变量，
 * 落盘做防抖，避免拖滑杆时每帧都写一次 localStorage。</p>
 *
 * <p>上传复用框架既有的文件接口 {@code /v2/file/upload}：与换头像同一条路，
 * 只把桶名换成 wallpaper，不新增后端上传端点。</p>
 */
import { computed, onMounted, ref } from "vue";
import { Check, Delete, UploadFilled } from "@element-plus/icons-vue";
import { msgError, msgSuccess } from "@repo/core";
import { getAccessToken, normalizeUrl } from "@repo/utils";
import { getConfig } from "@repo/config";
import {
  addUploadedWallpaper,
  applyWallpaper,
  createDefaultSetting,
  pickPreset,
  pickUploadedWallpaper,
  removeUploadedWallpaper,
  setWallpaperTuning,
  syncWallpaperFromServer,
  uploadedWallpapers,
  wallpaperPresets,
  wallpaperSetting,
  type UploadedWallpaper,
} from "./store";
import type { WallpaperPreset, WallpaperTile } from "./types";

const setting = wallpaperSetting;

/** 上传记录上限，与 store 的 MAX_UPLOADS 保持一致 */
const maxUploads = 12;

// 打开面板时再同步一次：布局挂载那一刻令牌可能还没恢复，这里补一次
// （已同步过也不会重复请求：store 内部对进行中的同步去重）
onMounted(() => {
  void syncWallpaperFromServer();
});

const tileOptions: Array<{ label: string; value: WallpaperTile }> = [
  { label: "不重复（铺满）", value: "none" },
  { label: "等比铺满", value: "cover" },
  { label: "等比适应", value: "contain" },
  { label: "双向平铺", value: "repeat" },
  { label: "横向平铺", value: "repeat-x" },
  { label: "纵向平铺", value: "repeat-y" },
];

const isDefault = computed(() => setting.source === "default");

/** 按 group 分组；没有 group 的归到「内置」 */
const builtinGroups = computed(() => {
  const map = new Map<string, WallpaperPreset[]>();
  for (const preset of wallpaperPresets.value) {
    const key = preset.group || "内置";
    const list = map.get(key) ?? [];
    list.push(preset);
    map.set(key, list);
  }
  return Array.from(map, ([title, items]) => ({ title, items }));
});

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
  removeUploadedWallpaper(item.id);
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
.wallpaper-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.wallpaper-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.wallpaper-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wallpaper-panel__badge {
  font-weight: 400;
}

.wallpaper-panel__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

/* ==================== 参数区 ==================== */

.wallpaper-tune {
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

.wallpaper-tune__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wallpaper-tune__label {
  flex: none;
  width: 64px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.wallpaper-tune__slider {
  flex: 1;
  min-width: 0;
}

.wallpaper-tune__select {
  width: 180px;
}

.wallpaper-tune__value {
  flex: none;
  width: 48px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.wallpaper-tune__hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

/* ==================== 列表区 ==================== */

.wallpaper-section__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.wallpaper-section__hint {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.wallpaper-section__tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
}

.wallpaper-card {
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: inset 0 0 0 1px var(--el-color-primary);
  }
}

.wallpaper-card--plain {
  grid-column: span 1;
}

.wallpaper-card__thumb {
  display: block;
  width: 100%;
  height: 72px;
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

.wallpaper-card__thumb--plain {
  background-image: linear-gradient(135deg, var(--el-fill-color) 25%, var(--el-fill-color-light) 25% 50%, var(--el-fill-color) 50% 75%, var(--el-fill-color-light) 75%);
  background-size: 16px 16px;
}

.wallpaper-card__thumb--add {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-secondary);
}

.wallpaper-card__loading {
  font-size: 12px;
}

.wallpaper-card--add {
  border-style: dashed;
}

.wallpaper-card__name {
  padding: 0 2px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-card__check {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
}

.wallpaper-card__remove {
  position: absolute;
  top: 8px;
  left: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.wallpaper-card--upload:hover .wallpaper-card__remove,
.wallpaper-card--upload:focus-within .wallpaper-card__remove {
  opacity: 1;
}

/* 触屏没有 hover：常显删除，否则无法移除 */
@media (hover: none) {
  .wallpaper-card__remove {
    opacity: 1;
  }
}
</style>
