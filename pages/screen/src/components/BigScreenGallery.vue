<!--
  BigScreenGallery —— 可视化大屏展厅

  <p>左侧屏目录（注册表驱动，内置七屏 + 模块贡献屏），右侧观测台舞台。
  屏幕文档按需拼装并缓存（Promise 级去重），切换屏即换 srcdoc。
  舞台支持一键全屏（requestFullscreen）。</p>

  @since 4.0.0.52
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
// 内置七屏自注册：本组件是注册表的唯一消费方，深导入（宿主只引 src/routes）
// 不会经过包根 index.ts，必须在这里显式求值 builtin，否则目录为空。
import "../builtin";
import { getBigScreenRegistrations } from "../registry";
import type { BigScreenRegistration } from "../types";
import BigScreenFrame from "./BigScreenFrame.vue";

/** 分类中文名（与 three-screen-lab buildlib 的 CATEGORIES 一致） */
const CATEGORY_LABELS: Record<string, string> = {
  "3d": "3D 数字孪生",
  geo: "地理可视化",
  operations: "运营监测",
};

const screens = getBigScreenRegistrations();
const activeId = ref(screens[0]?.id ?? "");
const active = computed(
  () => screens.find((screen) => screen.id === activeId.value) ?? screens[0],
);

/** 当前屏的拼装文档（srcdoc） */
const doc = shallowRef<string | null>(null);
const loading = ref(false);
const loadError = ref("");
let loadToken = 0;

/** 文档缓存：每屏只拼装一次（Promise 级去重，并发切换安全） */
const docCache = new Map<string, Promise<string>>();

function documentOf(screen: BigScreenRegistration): Promise<string> {
  if (!screen.document) {
    return Promise.reject(new Error(`[bigscreen] 屏 "${screen.id}" 未提供 document 工厂`));
  }
  let cached = docCache.get(screen.id);
  if (!cached) {
    cached = Promise.resolve(screen.document());
    docCache.set(screen.id, cached);
  }
  return cached;
}

watch(
  activeId,
  async (id) => {
    const screen = screens.find((item) => item.id === id);
    if (!screen) return;
    const token = ++loadToken;
    loading.value = true;
    loadError.value = "";
    try {
      const html = await documentOf(screen);
      if (token === loadToken) doc.value = html;
    } catch (error) {
      console.error("[bigscreen] 大屏文档拼装失败：", error);
      if (token === loadToken) {
        doc.value = null;
        loadError.value = error instanceof Error ? error.message : String(error);
      }
    } finally {
      if (token === loadToken) loading.value = false;
    }
  },
  { immediate: true },
);

// ── 全屏 ──────────────────────────────────────────────────────────
const stageEl = ref<HTMLElement | null>(null);
const fullscreen = ref(false);

function toggleFullscreen(): void {
  const el = stageEl.value;
  if (!el) return;
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void el.requestFullscreen?.();
  }
}

function syncFullscreen(): void {
  fullscreen.value = Boolean(document.fullscreenElement);
}

onMounted(() => document.addEventListener("fullscreenchange", syncFullscreen));
onBeforeUnmount(() => document.removeEventListener("fullscreenchange", syncFullscreen));
</script>

<template>
  <div class="bs-gallery">
    <header class="bs-gallery__head">
      <div class="bs-gallery__heading">
        <h2 class="bs-gallery__title">可视化大屏展厅</h2>
        <p class="bs-gallery__sub">
          three-screen-lab 七屏 · 观测台舞台原样呈现
          <span v-if="active" class="bs-gallery__meta">
            {{ active.width }}×{{ active.height }} · {{ CATEGORY_LABELS[active.category] ?? active.category }}
          </span>
        </p>
      </div>
      <button
        type="button"
        class="bs-gallery__fullscreen"
        :aria-pressed="fullscreen"
        @click="toggleFullscreen"
      >
        {{ fullscreen ? "退出全屏" : "全屏" }}
      </button>
    </header>

    <div class="bs-gallery__body">
      <nav class="bs-gallery__rail" aria-label="大屏目录">
        <button
          v-for="screen in screens"
          :key="screen.id"
          type="button"
          class="bs-gallery__card"
          :class="{ 'is-active': screen.id === activeId }"
          :aria-pressed="screen.id === activeId"
          @click="activeId = screen.id"
        >
          <img class="bs-gallery__thumb" :src="screen.preview" :alt="screen.title" loading="lazy" />
          <span class="bs-gallery__card-body">
            <span class="bs-gallery__card-title">{{ screen.title }}</span>
            <span class="bs-gallery__card-label">{{ screen.label }}</span>
            <span class="bs-gallery__card-tags">
              <i v-for="tag in screen.tags" :key="tag">{{ tag }}</i>
            </span>
          </span>
        </button>
      </nav>

      <section ref="stageEl" class="bs-gallery__stage">
        <template v-if="active">
          <BigScreenFrame
            :doc="doc"
            :width="active.width"
            :height="active.height"
            :loading="loading"
          />
          <p v-if="loadError" class="bs-gallery__error" role="alert">大屏拼装失败：{{ loadError }}</p>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bs-gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 42rem;
  padding: 1.25rem;
  border-radius: 16px;
  background:
    radial-gradient(1200px 500px at 20% -10%, rgba(56, 189, 248, 0.08), transparent 60%),
    radial-gradient(900px 420px at 90% 0%, rgba(129, 140, 248, 0.07), transparent 55%),
    #070b14;
  color: #e2e8f0;
}

.bs-gallery__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.bs-gallery__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.bs-gallery__sub {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.bs-gallery__meta {
  margin-left: 0.75rem;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(148, 163, 184, 0.25);
}

.bs-gallery__fullscreen {
  padding: 0.45rem 1rem;
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.08);
  color: #7dd3fc;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.bs-gallery__fullscreen:hover {
  background: rgba(56, 189, 248, 0.16);
}

.bs-gallery__body {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.bs-gallery__rail {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 15rem;
  flex-shrink: 0;
  max-height: 46rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.bs-gallery__card {
  display: flex;
  gap: 0.65rem;
  padding: 0.55rem;
  text-align: left;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  color: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.bs-gallery__card:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.bs-gallery__card.is-active {
  border-color: rgba(56, 189, 248, 0.65);
  background: rgba(56, 189, 248, 0.1);
}

.bs-gallery__thumb {
  width: 3.4rem;
  height: 2.4rem;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: #0b1220;
}

.bs-gallery__card-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.bs-gallery__card-title {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
}

.bs-gallery__card-label {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  color: #64748b;
}

.bs-gallery__card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.bs-gallery__card-tags i {
  font-style: normal;
  font-size: 0.62rem;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
}

.bs-gallery__stage {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.bs-gallery__error {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #fca5a5;
}

@media (max-width: 960px) {
  .bs-gallery__body {
    flex-direction: column;
  }

  .bs-gallery__rail {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    max-height: none;
  }

  .bs-gallery__card {
    min-width: 14rem;
  }
}
</style>
