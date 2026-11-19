<script setup lang="ts">
/**
 * 头像挂件
 *
 * <p>放在任何 {@code position: relative} 的头像容器里，渲染当前佩戴的 avatar 槽饰品。
 * 未佩戴、未拥有或已过期时什么都不输出（不占位、不触发请求）。</p>
 *
 * <p>动效由目录项的 {@code effect} 决定；{@code prefers-reduced-motion: reduce}
 * 下全部静止，只保留一层静态阴影。</p>
 */
import { computed } from "vue";
import { isOrnamentExpired, isOrnamentOwned, ornamentWear, resolveOrnamentUrl } from "./store";
import type { Ornament } from "./types";

const props = withDefaults(
  defineProps<{
    /** 字号（px），决定挂件大小 */
    size?: number;
    /** 相对头像锚点角的外扩距离（px） */
    offset?: number;
    /** 指定预览项（试戴弹层用）；缺省渲染当前佩戴 */
    item?: Ornament | null;
  }>(),
  { size: 14, offset: 2 },
);

const item = computed(() => props.item ?? ornamentWear.avatar);

const visible = computed(() => {
  const current = item.value;
  if (!current || isOrnamentExpired(current)) return false;
  // 试戴预览（显式传入 item）不做拥有校验，未领取的也要能先看效果
  if (props.item) return true;
  return isOrnamentOwned(current);
});

const effectClass = computed(() => {
  const effect = item.value?.effect;
  return effect && effect !== "none" ? `is-${effect}` : "";
});

/** 锚点定位：默认右上，可按目录项落到四角 */
const badgeStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {
    fontSize: `${props.size}px`,
    color: item.value?.color || "#fff",
  };
  const off = `${-props.offset}px`;
  switch (item.value?.anchor) {
    case "top-left":
      style.top = off;
      style.left = off;
      break;
    case "bottom-right":
      style.bottom = off;
      style.right = off;
      break;
    case "bottom-left":
      style.bottom = off;
      style.left = off;
      break;
    default:
      style.top = off;
      style.right = off;
  }
  return style;
});

const imageSrc = computed(() => (item.value?.image ? resolveOrnamentUrl(item.value.image) : undefined));
</script>

<template>
  <span v-if="visible" class="orn-badge" :class="effectClass" :style="badgeStyle" aria-hidden="true">
    <img v-if="imageSrc" :src="imageSrc" alt="" />
    <template v-else>{{ item?.glyph || "★" }}</template>
  </span>
</template>

<style scoped>
.orn-badge {
  position: absolute;
  z-index: 3;
  line-height: 1;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  user-select: none;
}

.orn-badge img {
  display: block;
  width: 1em;
  height: 1em;
  object-fit: contain;
}

/* 动效：默认静止，只有目录项显式声明才播 */
.orn-badge.is-pulse {
  animation: orn-pulse 2.4s ease-in-out infinite;
}

.orn-badge.is-spin {
  animation: orn-spin 3.6s linear infinite;
}

.orn-badge.is-glow {
  animation: orn-glow 2.8s ease-in-out infinite;
}

@keyframes orn-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.14);
  }
}

@keyframes orn-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orn-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 2px currentColor);
  }

  50% {
    filter: drop-shadow(0 0 7px currentColor);
  }
}

/* 减少动态：全部静止，保留静态阴影保证可辨识 */
@media (prefers-reduced-motion: reduce) {
  .orn-badge {
    animation: none !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }

  .orn-badge.is-glow {
    filter: drop-shadow(0 0 3px currentColor);
  }
}
</style>
