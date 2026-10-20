<script setup lang="ts">
/**
 * 影片卡片（参照站首页/列表页统一卡片）
 *
 * 版式对齐参照站 `li > .li-img.cover + .li-bottom`：
 *   海报 2:3、圆角 5px，右上角为类型/更新角标，底部为评分与年份，
 *   海报下方是 16px/500 的片名（上内边距 8px）与 13px/#717171 的副信息。
 */
import { computed, ref } from "vue";
import type { VideoInfo } from "@/types/video";

const props = defineProps<{
  item: VideoInfo;
}>();

/** 类型中文名（用于海报角标） */
const TYPE_LABEL: Record<string, string> = {
  movie: "电影",
  tv: "剧集",
  variety: "综艺",
  anime: "动漫",
  documentary: "纪录片",
};

const typeLabel = computed(() => (props.item.videoType ? TYPE_LABEL[props.item.videoType] : undefined));

/** 评分角标（一位小数） */
const scoreText = computed(() =>
  typeof props.item.score === "number" ? props.item.score.toFixed(1) : undefined,
);

/** 副信息：年份 / 地区 / 类型标签 */
const meta = computed(() =>
  [props.item.year, props.item.district, ...(props.item.tags ?? []).slice(0, 3)]
    .filter(Boolean)
    .join(" / "),
);

const broken = ref(false);

/** 封面加载失败时退回占位底 */
function onError() {
  broken.value = true;
}
</script>

<template>
  <router-link class="vd-card" :to="{ name: 'watch', params: { id: item.id } }">
    <div class="vd-poster">
      <img
        v-if="item.cover && !broken"
        :src="item.cover"
        :alt="item.name"
        loading="lazy"
        @error="onError"
      />
      <div v-else class="vd-poster-fallback">暂无封面</div>

      <div class="vd-badges">
        <span v-if="typeLabel" class="vd-badge vd-badge--primary">{{ typeLabel }}</span>
        <span v-if="item.continueInfo" class="vd-badge">{{ item.continueInfo }}</span>
      </div>

      <div v-if="scoreText || item.year" class="vd-ratings">
        <span v-if="scoreText" class="vd-rating vd-rating--score">{{ scoreText }}</span>
        <span v-if="item.year" class="vd-rating vd-rating--second">{{ item.year }}</span>
      </div>
    </div>

    <h3 class="vd-name">{{ item.name }}</h3>
    <p class="vd-meta">{{ meta || "暂无简介" }}</p>
  </router-link>
</template>
