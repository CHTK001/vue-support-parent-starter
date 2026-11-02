<script setup lang="ts">
/**
 * 策略总览页签
 *
 * <p>只读工作区：把「配置 → 限流 → 名单」的生效顺序画成流水线，并给出三条口径说明。
 * 页签本身不持有数据 —— 统计值由父组件的统计卡同一份数据通过 props 传进来，
 * 跳转别的页签也走 emit，父组件才是 {@code activeMainTab} 的唯一持有者。</p>
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { CircleCheck, Setting, Stopwatch, User } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
// ReIcon 不 import：它是主题组件，由 @repo/theme 在应用安装时全局注册
// （见 packages/ui/src/install.ts 的 ReIcon: () => import(...)）。
// 父组件里的 <ReIcon> 同样没有 import，跟随同一套用法。

const { t } = useI18n();

/** 统计值：与父组件顶部四张统计卡同源 */
const props = defineProps<{
  loading: boolean;
  hotReloadTotal: number;
  rateTotal: number;
  rateEnabled: number;
  /**
   * 全局限流闸门是否开启。
   *
   * <p>{@code rateEnabled} 只数规则自己的开关，不含这道闸门。闸门关着的时候
   * 「N/M 条已启用」很容易被读成「限流正在跑」，所以要多带一句限定。</p>
   */
  rateGlobalOn: boolean;
  blackWhiteTotal: number;
}>();

/** 限流节点的数字说明：闸门关着时把「都不生效」讲出来 */
const rateCountText = computed(() =>
  props.rateGlobalOn
    ? t("policy.overview.rateCount", { enabled: props.rateEnabled, total: props.rateTotal })
    : t("policy.overview.rateCountGlobalOff", { enabled: props.rateEnabled, total: props.rateTotal }),
);

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "navigate", tab: string): void;
}>();
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">POLICY PIPELINE</span>
        <h2>{{ t("policy.overview.chain") }}</h2>
        <p>{{ t("policy.overview.chainDesc") }}</p>
      </div>
      <ReButton layout="modern" icon="Refresh" :loading="props.loading" @click="emit('refresh')">
        {{ t("policy.overview.refreshStats") }}
      </ReButton>
    </div>

    <div class="policy-pipeline">
      <button type="button" class="policy-node is-primary" @click="emit('navigate', 'hotreload')">
        <span class="policy-node__step">01</span>
        <ReIcon name="Setting" size="20" />
        <b>{{ t("policy.overview.hotReload") }}</b>
        <small>{{ t("policy.overview.hotReloadCount", { count: props.hotReloadTotal }) }}</small>
      </button>
      <span class="policy-pipeline__link" />
      <button type="button" class="policy-node is-warning" @click="emit('navigate', 'ratelimit')">
        <span class="policy-node__step">02</span>
        <ReIcon name="Stopwatch" size="20" />
        <b>{{ t("policy.overview.rateLimit") }}</b>
        <small>{{ rateCountText }}</small>
      </button>
      <span class="policy-pipeline__link" />
      <button type="button" class="policy-node is-success" @click="emit('navigate', 'blackwhite')">
        <span class="policy-node__step">03</span>
        <ReIcon name="User" size="20" />
        <b>{{ t("policy.overview.blackwhite") }}</b>
        <small>{{ t("policy.overview.blackwhiteCount", { count: props.blackWhiteTotal }) }}</small>
      </button>
      <span class="policy-pipeline__link" />
      <div class="policy-node is-terminal">
        <span class="policy-node__step">04</span>
        <ReIcon name="CircleCheck" size="20" />
        <b>{{ t("policy.overview.passBlock") }}</b>
        <small>{{ t("policy.overview.passBlockDesc") }}</small>
      </div>
    </div>

    <div class="policy-overview-grid">
      <article class="policy-overview-card">
        <span class="policy-overview-card__icon is-warning"><el-icon :size="18"><Stopwatch /></el-icon></span>
        <div>
          <b>{{ t("policy.overview.rateRule") }}</b>
          <p>{{ t("policy.overview.rateRuleDesc") }}</p>
        </div>
        <ReButton layout="modern" @click="emit('navigate', 'ratelimit')">{{ t("policy.overview.manageRules") }}</ReButton>
      </article>
      <article class="policy-overview-card">
        <span class="policy-overview-card__icon is-primary"><el-icon :size="18"><Setting /></el-icon></span>
        <div>
          <b>{{ t("policy.overview.hotReloadBoundary") }}</b>
          <p>{{ t("policy.overview.hotReloadBoundaryDesc") }}</p>
        </div>
        <ReButton layout="modern" @click="emit('navigate', 'hotreload')">{{ t("policy.overview.manageConfig") }}</ReButton>
      </article>
      <article class="policy-overview-card">
        <span class="policy-overview-card__icon is-success"><el-icon :size="18"><User /></el-icon></span>
        <div>
          <b>{{ t("policy.overview.listPriority") }}</b>
          <p>{{ t("policy.overview.listPriorityDesc") }}</p>
        </div>
        <ReButton layout="modern" @click="emit('navigate', 'blackwhite')">{{ t("policy.overview.manageList") }}</ReButton>
      </article>
    </div>
  </section>
</template>

<style lang="scss">
/* 非 scoped：页签骨架由各页签共用，规则必须一致，放在共享表里一起引。 */
@use "../policyShared.scss";
</style>

<style scoped>
/* 以下都是总览独有的版式，拆出来之后父级的 scoped 规则匹配不到，必须跟着组件走。 */

/* 「内核」版式：四个节点压到 84px 高、14px 圆角收到 8px。
   顶部 3px 色条保留（它是顺序的唯一视觉编码），但收窄到 2px，
   因为密集排布里 3px 会显得比标题还重。 */
.policy-pipeline {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
}

.policy-node {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 86px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--policy-line);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  text-align: left;
}

button.policy-node { cursor: pointer; transition: border-color 0.18s ease, background-color 0.18s ease; }
button.policy-node:hover { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }

.policy-node__step {
  position: absolute;
  top: 8px;
  right: 10px;
  color: var(--el-text-color-placeholder);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.policy-node b { color: var(--el-text-color-primary); font-size: 12px; font-weight: 600; line-height: 1.35; }
.policy-node small { color: var(--el-text-color-secondary); font-size: 10px; line-height: 1.35; }

/* 四个节点顶部的色条就是「顺序」的视觉编码：热更新 / 限流 / 名单 / 放行拦截 */
.policy-node.is-primary { border-top: 2px solid var(--el-color-primary); }
.policy-node.is-warning { border-top: 2px solid var(--el-color-warning); }
.policy-node.is-success { border-top: 2px solid var(--el-color-success); }
.policy-node.is-terminal { border-top: 2px solid var(--el-color-info); }

.policy-pipeline__link {
  width: 14px;
  flex: none;
  align-self: center;
  height: 1px;
  background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-border-color));
}

/* 三张口径卡：内边距收到 10px、图标从 36px 收到 28px、圆角 8px。
   它们承载的是「说明文字」，密集版里不该和上方的流水线节点抢同一档重量。 */
.policy-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.policy-overview-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 10px;
  padding: 10px 12px;
  border: 1px solid var(--policy-line);
  border-radius: 8px;
  background: var(--el-bg-color);
}
.policy-overview-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
}
.policy-overview-card__icon.is-primary { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.policy-overview-card__icon.is-warning { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.policy-overview-card__icon.is-success { background: var(--el-color-success-light-9); color: var(--el-color-success); }

.policy-overview-card b { color: var(--el-text-color-primary); font-size: 12px; font-weight: 600; line-height: 1.35; }
.policy-overview-card p { margin: 2px 0 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.55; }
.policy-overview-card :deep(.rm-btn) { grid-column: 2; justify-self: start; }

@media screen and (max-width: 1280px) {
  .policy-pipeline { flex-wrap: wrap; }
  .policy-node { flex: 1 1 44%; }
  .policy-pipeline__link { display: none; }
  .policy-overview-grid { grid-template-columns: 1fr; }
}

@media screen and (max-width: 768px) {
  .policy-node { flex: 1 1 100%; }
}

@media (prefers-reduced-motion: reduce) {
  button.policy-node { transition: none; }
}
</style>
