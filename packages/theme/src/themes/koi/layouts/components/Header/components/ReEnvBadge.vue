<template>
  <el-tooltip placement="bottom" :show-after="200">
    <template #content>
      <div class="koi-env-badge__tip">
        <div>{{ t("header.envBadge.mode") }}：{{ modeLabel }}</div>
        <div>{{ t("header.envBadge.backend") }}：{{ backendLabel }}</div>
        <div v-if="appTitle">{{ appTitle }}</div>
      </div>
    </template>
    <span
      class="koi-env-badge"
      :class="`is-${tone}`"
      :aria-label="`${modeLabel} · ${backendLabel}`"
    >
      <span class="koi-env-badge__dot" aria-hidden="true"></span>
      <span class="koi-env-badge__text">{{ displayLabel }}</span>
    </span>
  </el-tooltip>
</template>

<script setup lang="ts">
/**
 * 顶栏环境徽标（DEV / TEST / PROD + 后端地址）
 *
 * <p>存在的理由不是"好看"，而是消灭一类静默故障：本项目多个后端实例
 * （8081 / 8112 / 8787）跑的是同一份包，dev 代理指错目标时**没有任何报错**——
 * 页面能开、接口 200、数据真实，但你测的是别人的代码。vite.config.ts 里已经有
 * 启动期自检把这件事打到控制台，这里把它变成顶栏一直可见的一枚徽标。</p>
 *
 * <p>仅在 app.yaml `other.toolbar.items` 显式列出 `envBadge` 时渲染
 * （见 headerItems.ts 的 HEADER_EXTRA_ITEMS），存量应用不受影响。</p>
 *
 * <p>options：
 * <ul>
 *   <li>{@code label}：覆盖模式文案（如 "预发"）</li>
 *   <li>{@code showHost}：是否在徽标里显示后端 host（默认 true）</li>
 * </ul></p>
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";

const props = defineProps<{
  /** 来自 app.yaml items[].options */
  options?: Record<string, unknown>;
}>();

const { t } = useI18n();

/** 构建模式：vite 注入，非 vite 环境（如单测）回退 production */
const MODE: string =
  (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE ?? "production";

/** 模式档位 → 语义色 */
const tone = computed<"success" | "info" | "warning">(() => {
  if (MODE === "production") return "warning";
  if (MODE === "test" || MODE === "staging") return "info";
  return "success";
});

/** 模式文案（options.label 优先） */
const modeLabel = computed(() => {
  const custom = props.options?.label;
  if (typeof custom === "string" && custom.trim()) return custom.trim();
  if (MODE === "production") return t("header.envBadge.prod");
  if (MODE === "test" || MODE === "staging") return t("header.envBadge.test");
  return t("header.envBadge.dev");
});

/** 后端地址：空 / "/" / "./" 都表示与前端同源（走反代或网关） */
const backendLabel = computed(() => {
  const base = String(getConfig().http?.baseUrl ?? "").trim();
  if (!base || base === "/" || base === "./") return t("header.envBadge.sameOrigin");
  try {
    return new URL(base, window.location.origin).host;
  } catch {
    return base;
  }
});

const appTitle = computed(() => String(getConfig().app?.title ?? "").trim());

const showHost = computed(() => props.options?.showHost !== false);

const displayLabel = computed(() =>
  showHost.value ? `${modeLabel.value} · ${backendLabel.value}` : modeLabel.value,
);
</script>

<style lang="scss" scoped>
.koi-env-badge {
  display: inline-flex;
  flex-shrink: 0;
  gap: 5px;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 11px;
}

.koi-env-badge__dot {
  width: 6px;
  height: 6px;
  background: currentcolor;
  border-radius: 50%;
}

.koi-env-badge__text {
  /* 长 host 在窄屏上先截断文本，别去挤别人 */
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 语义色：生产用 warning（提醒"你在动线上"），测试 info，开发 success */
.koi-env-badge.is-warning {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 32%, transparent);
}

.koi-env-badge.is-info {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 32%, transparent);
}

.koi-env-badge.is-success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-success) 32%, transparent);
}

.koi-env-badge__tip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.5;
}

/* 动效降级：不做动画，这条只是不引入新的动效 */
@media (prefers-reduced-motion: reduce) {
  .koi-env-badge {
    transition: none;
  }
}
</style>
