<template>
  <div :class="ribbonClass" :style="ribbonStyle">
    <span :class="`${variantPrefix}__content`">
      <IconifyIconOnline v-if="icon" :icon="icon" class="sc-ribbon__icon" />
      <slot>{{ text }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

interface Props {
  text?: string;
  icon?: string;
  color?: string;
  variant?:
    | "corner"
    | "diagonal"
    | "banner"
    | "badge"
    | "folded"
    | "bookmark"
    | "tag"
    | "hanging"
    | "sash"
    | "shield"
    | "wave"
    | "arrow"
    | "circle"
    | "star"
    | "hexagon"
    | "starburst"
    | "double"
    | "trapezoid"
    | "pennant"
    | "swoosh";
  position?: "lt" | "rt" | "lb" | "rb" | "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: "",
  icon: "",
  color: "#409eff",
  variant: "badge",
  position: "lt",
  size: "md",
  width: "100%"
});

const sizeMap = {
  sm: { pad: "4px 8px", font: "12px", gap: "4px" },
  md: { pad: "6px 12px", font: "13px", gap: "6px" },
  lg: { pad: "8px 16px", font: "14px", gap: "8px" }
} as const;

const variantPrefix = computed(() => `sc-ribbon-${props.variant}`);

const ribbonClass = computed(() => {
  const classes = [variantPrefix.value];

  // 添加位置类
  if (["corner", "diagonal", "folded", "bookmark", "tag", "sash", "arrow", "pennant", "swoosh"].includes(props.variant)) {
    classes.push(`pos-${props.position}`);
  }

  // 添加尺寸类
  classes.push(`size-${props.size}`);

  return classes.join(" ");
});

const ribbonStyle = computed(() => {
  const styles: Record<string, string> = {
    "--sc-ribbon-color": props.color,
    "--sc-ribbon-pad": sizeMap[props.size].pad,
    "--sc-ribbon-font": sizeMap[props.size].font,
    "--sc-ribbon-gap": sizeMap[props.size].gap
  };

  if (["banner", "hanging", "wave", "trapezoid", "double"].includes(props.variant)) {
    styles.width = props.width;
  }

  return styles;
});
</script>

<style scoped>
/* ===== Common ===== */
.sc-ribbon__icon {
  margin-right: 4px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

/* ===== 1. Corner Ribbon (角标) ===== */
.sc-ribbon-corner {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-corner.pos-lt {
  top: 12px;
  left: 12px;
}
.sc-ribbon-corner.pos-rt {
  top: 12px;
  right: 12px;
}
.sc-ribbon-corner.pos-lb {
  bottom: 12px;
  left: 12px;
}
.sc-ribbon-corner.pos-rb {
  bottom: 12px;
  right: 12px;
}

.sc-ribbon-corner__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  border-radius: 6px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.3) inset;
  line-height: 1;
  pointer-events: auto;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.sc-ribbon-corner__content::before {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.sc-ribbon-corner.pos-lt __content::before {
  top: 4px;
  left: 4px;
}
.sc-ribbon-corner.pos-rt .sc-ribbon-corner__content::before {
  top: 4px;
  right: 4px;
}
.sc-ribbon-corner.pos-lb .sc-ribbon-corner__content::before {
  bottom: 4px;
  left: 4px;
}
.sc-ribbon-corner.pos-rb .sc-ribbon-corner__content::before {
  bottom: 4px;
  right: 4px;
}

/* ===== 2. Diagonal Ribbon (对角线) ===== */
.sc-ribbon-diagonal {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}

.sc-ribbon-diagonal__content {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-inline: 40px;
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.sc-ribbon-diagonal.pos-lt .sc-ribbon-diagonal__content {
  top: 20px;
  left: -40px;
  transform: rotate(-45deg);
}

.sc-ribbon-diagonal.pos-rt .sc-ribbon-diagonal__content {
  top: 20px;
  right: -40px;
  transform: rotate(45deg);
}

.sc-ribbon-diagonal.pos-lb .sc-ribbon-diagonal__content {
  bottom: 20px;
  left: -40px;
  transform: rotate(45deg);
}

.sc-ribbon-diagonal.pos-rb .sc-ribbon-diagonal__content {
  bottom: 20px;
  right: -40px;
  transform: rotate(-45deg);
}

/* ===== 3. Banner Ribbon (横幅) ===== */
.sc-ribbon-banner {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: var(--sc-ribbon-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 10;
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%);
}

.sc-ribbon-banner.size-sm {
  top: 8px;
}
.sc-ribbon-banner.size-md {
  top: 12px;
}
.sc-ribbon-banner.size-lg {
  top: 16px;
}

/* ===== 4. Badge Ribbon (徽章) ===== */
.sc-ribbon-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-right: 14px;
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 90%, black) 100%);
  border-radius: 4px 0 0 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.sc-ribbon-badge::after {
  content: "";
  position: absolute;
  right: -8px;
  top: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 50% 8px 50% 0;
  border-color: transparent var(--sc-ribbon-color) transparent transparent;
  filter: brightness(0.9);
}

/* ===== 5. Folded Ribbon (折叠绸带) ===== */
.sc-ribbon-folded {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-folded.pos-lt {
  top: 0;
  left: 0;
}
.sc-ribbon-folded.pos-rt {
  top: 0;
  right: 0;
}
.sc-ribbon-folded.pos-lb {
  bottom: 0;
  left: 0;
}
.sc-ribbon-folded.pos-rb {
  bottom: 0;
  right: 0;
}

.sc-ribbon-folded__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-bottom: calc(var(--sc-ribbon-pad) + 6px);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: var(--sc-ribbon-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

/* 折痕效果 */
.sc-ribbon-folded__content::before {
  content: "";
  position: absolute;
  bottom: 0;
  width: 0;
  height: 0;
  border-style: solid;
}

.sc-ribbon-folded.pos-lt .sc-ribbon-folded__content,
.sc-ribbon-folded.pos-lb .sc-ribbon-folded__content {
  border-radius: 0 8px 8px 0;
}

.sc-ribbon-folded.pos-rt .sc-ribbon-folded__content,
.sc-ribbon-folded.pos-rb .sc-ribbon-folded__content {
  border-radius: 8px 0 0 8px;
}

.sc-ribbon-folded.pos-lt .sc-ribbon-folded__content::before,
.sc-ribbon-folded.pos-lb .sc-ribbon-folded__content::before {
  left: 0;
  border-width: 6px 0 0 8px;
  border-color: transparent transparent transparent color-mix(in srgb, var(--sc-ribbon-color) 60%, black);
}

.sc-ribbon-folded.pos-rt .sc-ribbon-folded__content::before,
.sc-ribbon-folded.pos-rb .sc-ribbon-folded__content::before {
  right: 0;
  border-width: 6px 8px 0 0;
  border-color: transparent color-mix(in srgb, var(--sc-ribbon-color) 60%, black) transparent transparent;
}

/* ===== 6. Bookmark Ribbon (书签) ===== */
.sc-ribbon-bookmark {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-bookmark.pos-lt {
  top: 0;
  left: 12px;
}
.sc-ribbon-bookmark.pos-rt {
  top: 0;
  right: 12px;
}

.sc-ribbon-bookmark__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-bottom: calc(var(--sc-ribbon-pad) + 8px);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(180deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), 50% 100%, 0 calc(100% - 12px));
}

/* ===== 7. Tag Ribbon (标签) ===== */
.sc-ribbon-tag {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-tag.pos-lt {
  top: 12px;
  left: -8px;
}
.sc-ribbon-tag.pos-rt {
  top: 12px;
  right: -8px;
}

.sc-ribbon-tag__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: var(--sc-ribbon-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

.sc-ribbon-tag.pos-lt .sc-ribbon-tag__content {
  padding-left: 12px;
  border-radius: 0 4px 4px 0;
}

.sc-ribbon-tag.pos-rt .sc-ribbon-tag__content {
  padding-right: 12px;
  border-radius: 4px 0 0 4px;
}

.sc-ribbon-tag__content::before {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.sc-ribbon-tag.pos-lt .sc-ribbon-tag__content::before {
  left: 4px;
}

.sc-ribbon-tag.pos-rt .sc-ribbon-tag__content::before {
  right: 4px;
}

/* ===== 8. Hanging Ribbon (悬挂) ===== */
.sc-ribbon-hanging {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(180deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 90%, black) 100%);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.sc-ribbon-hanging__content {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
}

/* 悬挂绳子效果 */
.sc-ribbon-hanging::before,
.sc-ribbon-hanging::after {
  content: "";
  position: absolute;
  top: -10px;
  width: 2px;
  height: 10px;
  background: color-mix(in srgb, var(--sc-ribbon-color) 60%, black);
}

.sc-ribbon-hanging::before {
  left: 20%;
}

.sc-ribbon-hanging::after {
  right: 20%;
}

/* ===== 9. Sash Ribbon (斜绶带) ===== */
.sc-ribbon-sash {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  inset: 0;
  overflow: hidden;
}

.sc-ribbon-sash__content {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-inline: 60px;
  font-size: var(--sc-ribbon-font);
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 80%, black) 100%);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

.sc-ribbon-sash.pos-lt .sc-ribbon-sash__content {
  top: 30%;
  left: -25%;
  transform: rotate(-45deg);
  width: 150%;
}

.sc-ribbon-sash.pos-rt .sc-ribbon-sash__content {
  top: 30%;
  right: -25%;
  transform: rotate(45deg);
  width: 150%;
}

/* ===== 10. Shield Ribbon (盾牌) ===== */
.sc-ribbon-shield {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-bottom: calc(var(--sc-ribbon-pad) + 4px);
  font-size: var(--sc-ribbon-font);
  font-weight: 700;
  color: #fff;
  background: linear-gradient(180deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
  min-width: 60px;
}

.sc-ribbon-shield__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

/* ===== 11. Wave Ribbon (波浪) ===== */
.sc-ribbon-wave {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: var(--sc-ribbon-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 10;
  clip-path: polygon(
    0% 20%,
    5% 5%,
    10% 0%,
    15% 5%,
    20% 15%,
    25% 20%,
    30% 15%,
    35% 5%,
    40% 0%,
    45% 5%,
    50% 15%,
    55% 20%,
    60% 15%,
    65% 5%,
    70% 0%,
    75% 5%,
    80% 15%,
    85% 20%,
    90% 15%,
    95% 5%,
    100% 0%,
    100% 80%,
    95% 95%,
    90% 100%,
    85% 95%,
    80% 85%,
    75% 80%,
    70% 85%,
    65% 95%,
    60% 100%,
    55% 95%,
    50% 85%,
    45% 80%,
    40% 85%,
    35% 95%,
    30% 100%,
    25% 95%,
    20% 85%,
    15% 80%,
    10% 85%,
    5% 95%,
    0% 100%
  );
}

.sc-ribbon-wave.size-sm {
  top: 8px;
}
.sc-ribbon-wave.size-md {
  top: 12px;
}
.sc-ribbon-wave.size-lg {
  top: 16px;
}

/* ===== 12. Arrow Ribbon (箭头) ===== */
.sc-ribbon-arrow {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-arrow.pos-lt {
  top: 12px;
  left: 0;
}
.sc-ribbon-arrow.pos-rt {
  top: 12px;
  right: 0;
}

.sc-ribbon-arrow__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-right: 20px;
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: var(--sc-ribbon-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
}

.sc-ribbon-arrow.pos-rt .sc-ribbon-arrow__content {
  padding-left: 20px;
  padding-right: var(--sc-ribbon-pad);
  clip-path: polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%);
}

/* ===== 13. Circle Ribbon (圆形) ===== */
.sc-ribbon-circle {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 60px;
  height: 60px;
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 700;
  color: #fff;
  background: radial-gradient(circle, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 80%, black) 100%);
  border-radius: 50%;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.sc-ribbon-circle.size-sm {
  width: 50px;
  height: 50px;
}
.sc-ribbon-circle.size-lg {
  width: 70px;
  height: 70px;
}

.sc-ribbon-circle__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

/* ===== 14. Star Ribbon (星形) ===== */
.sc-ribbon-star {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  width: 70px;
  height: 70px;
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.sc-ribbon-star.size-sm {
  width: 60px;
  height: 60px;
}
.sc-ribbon-star.size-lg {
  width: 80px;
  height: 80px;
}

.sc-ribbon-star__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

/* ===== 15. Hexagon Ribbon (六边形) ===== */
.sc-ribbon-hexagon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  width: 70px;
  height: 70px;
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

.sc-ribbon-hexagon.size-sm {
  width: 60px;
  height: 60px;
}
.sc-ribbon-hexagon.size-lg {
  width: 80px;
  height: 80px;
}

.sc-ribbon-hexagon__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

/* ===== 16. Starburst Ribbon (爆炸星) ===== */
.sc-ribbon-starburst {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  width: 80px;
  height: 80px;
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 700;
  color: #fff;
  background: radial-gradient(circle, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 80%, black) 100%);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  clip-path: polygon(50% 0%, 55% 30%, 85% 20%, 65% 45%, 90% 70%, 55% 60%, 60% 95%, 50% 65%, 40% 95%, 45% 60%, 10% 70%, 35% 45%, 15% 20%, 45% 30%);
  animation: starburst-pulse 2s ease-in-out infinite;
}

@keyframes starburst-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.sc-ribbon-starburst.size-sm {
  width: 70px;
  height: 70px;
}
.sc-ribbon-starburst.size-lg {
  width: 90px;
  height: 90px;
}

.sc-ribbon-starburst__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

/* ===== 17. Double Ribbon (双层) ===== */
.sc-ribbon-double {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

.sc-ribbon-double.size-sm {
  top: 8px;
}
.sc-ribbon-double.size-md {
  top: 12px;
}
.sc-ribbon-double.size-lg {
  top: 16px;
}

.sc-ribbon-double__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: var(--sc-ribbon-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%);
}

.sc-ribbon-double__content::after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 4px;
  background: color-mix(in srgb, var(--sc-ribbon-color) 60%, black);
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ===== 18. Trapezoid Ribbon (梯形) ===== */
.sc-ribbon-trapezoid {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-inline: 24px;
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(180deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 10;
  clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
}

.sc-ribbon-trapezoid.size-sm {
  top: 8px;
}
.sc-ribbon-trapezoid.size-md {
  top: 12px;
}
.sc-ribbon-trapezoid.size-lg {
  top: 16px;
}

/* ===== 19. Pennant Ribbon (三角旗) ===== */
.sc-ribbon-pennant {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-pennant.pos-lt {
  top: 0;
  left: 12px;
}
.sc-ribbon-pennant.pos-rt {
  top: 0;
  right: 12px;
}

.sc-ribbon-pennant__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-top: calc(var(--sc-ribbon-pad) + 4px);
  padding-bottom: calc(var(--sc-ribbon-pad) + 12px);
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(180deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 85%, black) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);
}

/* ===== 20. Swoosh Ribbon (飘带) ===== */
.sc-ribbon-swoosh {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.sc-ribbon-swoosh.pos-lt {
  top: 20px;
  left: -10px;
}
.sc-ribbon-swoosh.pos-rt {
  top: 20px;
  right: -10px;
}

.sc-ribbon-swoosh__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--sc-ribbon-gap);
  padding: var(--sc-ribbon-pad);
  padding-inline: 16px;
  font-size: var(--sc-ribbon-font);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--sc-ribbon-color) 0%, color-mix(in srgb, var(--sc-ribbon-color) 80%, black) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  border-radius: 20px 4px 20px 4px;
  transform: rotate(-5deg);
}

.sc-ribbon-swoosh.pos-rt .sc-ribbon-swoosh__content {
  transform: rotate(5deg);
  border-radius: 4px 20px 4px 20px;
}

.sc-ribbon-swoosh__content::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 8px;
  width: 12px;
  height: 4px;
  background: color-mix(in srgb, var(--sc-ribbon-color) 70%, black);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sc-ribbon-diagonal__content,
  .sc-ribbon-sash__content {
    font-size: 11px;
    padding-inline: 30px;
  }

  .sc-ribbon-circle,
  .sc-ribbon-star,
  .sc-ribbon-hexagon {
    transform: scale(0.85);
  }
}
</style>
