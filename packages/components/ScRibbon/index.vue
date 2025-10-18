<template>
  <div v-if="variant === 'corner'" class="sc-ribbon-corner" :class="cornerClass" :style="cornerStyle">
    <span class="sc-ribbon-corner__content">
      <IconifyIconOnline v-if="icon" :icon="icon" class="sc-ribbon__icon" />
      <slot>{{ text }}</slot>
    </span>
  </div>

  <div v-else-if="variant === 'diagonal'" class="sc-ribbon-diagonal" :class="cornerClass" :style="diagonalStyle">
    <span class="sc-ribbon-diagonal__content">
      <IconifyIconOnline v-if="icon" :icon="icon" class="sc-ribbon__icon" />
      <slot>{{ text }}</slot>
    </span>
  </div>

  <div v-else-if="variant === 'banner'" class="sc-ribbon-banner" :class="bannerClass" :style="bannerStyle">
    <IconifyIconOnline v-if="icon" :icon="icon" class="sc-ribbon__icon" />
    <slot>{{ text }}</slot>
  </div>

  <div v-else-if="variant === 'badge'" class="sc-ribbon-badge" :style="badgeStyle">
    <IconifyIconOnline v-if="icon" :icon="icon" class="sc-ribbon__icon" />
    <slot>{{ text }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text?: string;
  icon?: string; // Iconify icon name
  color?: string; // CSS color or var
  variant?: 'corner' | 'diagonal' | 'banner' | 'badge';
  position?: 'lt' | 'rt' | 'lb' | 'rb';
  size?: 'sm' | 'md' | 'lg';
  width?: string; // for banners
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  icon: '',
  color: 'var(--app-primary)',
  variant: 'badge',
  position: 'lt',
  size: 'md',
  width: '100%'
});

const sizeMap = {
  sm: { pad: '2px 6px', font: '12px', tail: 5 },
  md: { pad: '3px 10px', font: '13px', tail: 6 },
  lg: { pad: '5px 14px', font: '14px', tail: 7 }
} as const;

const cornerClass = computed(() => `pos-${props.position} size-${props.size}`);
const bannerClass = computed(() => `size-${props.size}`);

const cornerStyle = computed(() => ({
  '--sc-ribbon-color': props.color,
  '--sc-ribbon-pad': sizeMap[props.size].pad,
  '--sc-ribbon-font': sizeMap[props.size].font,
  '--sc-ribbon-tail': `${sizeMap[props.size].tail}px`
}) as any);

const diagonalStyle = cornerStyle;

const bannerStyle = computed(() => ({
  '--sc-ribbon-color': props.color,
  '--sc-ribbon-pad': sizeMap[props.size].pad,
  '--sc-ribbon-font': sizeMap[props.size].font,
  width: props.width
}) as any);

const badgeStyle = computed(() => ({
  '--sc-ribbon-color': props.color,
  '--sc-ribbon-pad': sizeMap[props.size].pad,
  '--sc-ribbon-font': sizeMap[props.size].font
}) as any);
</script>

<style scoped>
/* Common */
.sc-ribbon__icon { margin-right: 4px; }

/* 1) Corner ribbon (beautified corner label) */
.sc-ribbon-corner {
  --_c: var(--sc-ribbon-color);
  position: absolute;
  z-index: 2;
  pointer-events: none;
}
.sc-ribbon-corner.pos-lt { top: 10px; left: 10px; }
.sc-ribbon-corner.pos-rt { top: 10px; right: 10px; }
.sc-ribbon-corner.pos-lb { bottom: 10px; left: 10px; }
.sc-ribbon-corner.pos-rb { bottom: 10px; right: 10px; }
.sc-ribbon-corner__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--sc-ribbon-pad);
  padding-inline: 10px 14px;
  font-size: var(--sc-ribbon-font);
  color: #fff;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 45%),
    var(--_c);
  border-radius: 999px;
  box-shadow:
    0 2px 6px rgba(0,0,0,0.15),
    0 1px 0 rgba(255,255,255,0.35) inset,
    0 -1px 0 rgba(0,0,0,0.08) inset;
  line-height: 1;
  pointer-events: auto;
}
/* Corner tails */
.sc-ribbon-corner.pos-lt .sc-ribbon-corner__content::after,
.sc-ribbon-corner.pos-lb .sc-ribbon-corner__content::after,
.sc-ribbon-corner.pos-rt .sc-ribbon-corner__content::after,
.sc-ribbon-corner.pos-rb .sc-ribbon-corner__content::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 0; height: 0;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,0.12));
}
.sc-ribbon-corner.pos-lt .sc-ribbon-corner__content::after,
.sc-ribbon-corner.pos-lb .sc-ribbon-corner__content::after {
  right: -8px;
  border-left: 8px solid var(--_c);
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
}
.sc-ribbon-corner.pos-rt .sc-ribbon-corner__content::after,
.sc-ribbon-corner.pos-rb .sc-ribbon-corner__content::after {
  left: -8px;
  border-right: 8px solid var(--_c);
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
}
/* small crease */
.sc-ribbon-corner__content::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 6px; height: 6px;
  background: rgba(255,255,255,0.35);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.2) inset;
  border-radius: 1px;
  opacity: 0.7;
}

/* 2) Diagonal ribbon (beautified across-corner) */
.sc-ribbon-diagonal {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 2;
}
.sc-ribbon-diagonal.pos-lt .sc-ribbon-diagonal__content,
.sc-ribbon-diagonal.pos-rt .sc-ribbon-diagonal__content,
.sc-ribbon-diagonal.pos-lb .sc-ribbon-diagonal__content,
.sc-ribbon-diagonal.pos-rb .sc-ribbon-diagonal__content {
  --_c: var(--sc-ribbon-color);
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 45%),
    var(--_c);
  color: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.25);
  text-shadow: 0 1px 0 rgba(0,0,0,0.15);
}
/* LT */
.sc-ribbon-diagonal.pos-lt .sc-ribbon-diagonal__content {
  top: 10px; left: -32px;
  transform: rotate(-45deg);
}
/* RT */
.sc-ribbon-diagonal.pos-rt .sc-ribbon-diagonal__content {
  top: 10px; right: -32px;
  transform: rotate(45deg);
}
/* LB */
.sc-ribbon-diagonal.pos-lb .sc-ribbon-diagonal__content {
  bottom: 10px; left: -32px;
  transform: rotate(45deg);
}
/* RB */
.sc-ribbon-diagonal.pos-rb .sc-ribbon-diagonal__content {
  bottom: 10px; right: -32px;
  transform: rotate(-45deg);
}

/* 3) Banner ribbon (beautified horizontal strip) */
.sc-ribbon-banner {
  --_c: var(--sc-ribbon-color);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: var(--sc-ribbon-pad);
  padding-inline: 16px;
  font-size: var(--sc-ribbon-font);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 45%),
    var(--_c);
  color: #fff;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}
.sc-ribbon-banner::before,
.sc-ribbon-banner::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 0; height: 0;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,0.12));
}
.sc-ribbon-banner::before {
  left: -10px;
  border-right: 10px solid var(--_c);
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
}
.sc-ribbon-banner::after {
  right: -10px;
  border-left: 10px solid var(--_c);
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
}
.sc-ribbon-banner.size-sm { top: 8px; }
.sc-ribbon-banner.size-md { top: 12px; }
.sc-ribbon-banner.size-lg { top: 16px; }

/* 4) Badge ribbon (beautified ribbon) */
.sc-ribbon-badge {
  --_c: var(--sc-ribbon-color);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--sc-ribbon-pad);
  padding-right: calc(var(--sc-ribbon-pad) + 8px); /* 给尾巴留空间 */
  font-size: var(--sc-ribbon-font);
  color: #fff;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 45%),
    var(--_c);
  border-radius: 999px;
  box-shadow:
    0 2px 6px rgba(0,0,0,0.15),
    0 1px 0 rgba(255,255,255,0.35) inset,
    0 -1px 0 rgba(0,0,0,0.08) inset;
  line-height: 1;
}
/* 右侧三角形尾巴 */
.sc-ribbon-badge::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -8px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid var(--_c);
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,0.12));
}
/* 左侧折痕（小方块旋转制造折叠效果） */
.sc-ribbon-badge::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 6px;
  height: 6px;
  background: rgba(255,255,255,0.35);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.2) inset;
  border-radius: 1px;
  opacity: 0.7;
}
/* 调整图标与文字的对齐与阴影 */
.sc-ribbon-badge .sc-ribbon__icon {
  filter: drop-shadow(0 1px 0 rgba(255,255,255,0.15));
}
</style>
