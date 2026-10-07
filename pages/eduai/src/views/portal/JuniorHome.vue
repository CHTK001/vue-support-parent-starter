<template>
  <div class="jp">
    <header class="jp-head">
      <div class="jp-head__row">
        <div>
          <h1 class="jp-title">趣味学习</h1>
          <p class="jp-sub">
            {{ stageText }} · {{ overview?.student?.grade || "—" }}
            <span class="jp-sep">|</span>
            学习进度 {{ overallProgress }}%
          </p>
        </div>
        <div class="jp-stats">
          <!-- 图标统一走 ReIcon：emoji 会被读屏念成「白色对勾」之类的冗余文本 -->
          <div class="jp-stat">
            <span class="jp-stat__ic is-blue"><ReIcon name="Timer" :size="15" aria-hidden="true" /></span>
            <div>
              <div class="jp-stat__lbl">今日学习</div>
              <div class="jp-stat__val">{{ today?.studyMinutes ?? 0 }}<i>分钟</i></div>
            </div>
          </div>
          <div class="jp-stat">
            <span class="jp-stat__ic is-green"><ReIcon name="CircleCheck" :size="15" aria-hidden="true" /></span>
            <div>
              <div class="jp-stat__lbl">完成练习</div>
              <div class="jp-stat__val">{{ today?.questionCount ?? 0 }}<i>题</i></div>
            </div>
          </div>
          <div class="jp-stat">
            <span class="jp-stat__ic is-amber"><ReIcon name="Warning" :size="15" aria-hidden="true" /></span>
            <div>
              <div class="jp-stat__lbl">错题本</div>
              <div class="jp-stat__val">{{ wrongPending }}<i>题待复习</i></div>
            </div>
          </div>
          <div class="jp-stat">
            <span class="jp-stat__ic is-info"><ReIcon name="StarFilled" :size="15" aria-hidden="true" /></span>
            <div>
              <div class="jp-stat__lbl">学习积分</div>
              <div class="jp-stat__val">{{ total?.points ?? 0 }}<i>分</i></div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <section class="jp-body">
      <div class="jp-grid">
        <button
          v-for="(m, i) in modules"
          :key="m.moduleCode"
          type="button"
          class="jp-card"
          @click="emit('open', m.moduleCode)"
        >
          <span class="jp-card__no">{{ i + 1 }}</span>
          <div class="jp-card__top">
            <span
              class="jp-card__ic"
              :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
            >{{ m.icon }}</span>
            <div class="jp-card__text">
              <div class="jp-card__title">{{ m.title }}</div>
              <div class="jp-card__sub">{{ m.subtitle }}</div>
            </div>
          </div>
          <div class="jp-bar"><span class="jp-bar__fill" :style="{ width: progressOf(m) + '%' }" /></div>
        </button>
      </div>
      <!--
        「查看更多功能」与小学/高中端同一个出口：就地展开本学段全部模块。
        原来只有小学(.pp-more)/高中(.sp-more)有这个入口，初中端缺了 —— 模块被
        后台裁剪后学生就没有「全集」可看。div + tabindex 与另两端保持一致（可 Tab 到）。
      -->
      <div class="jp-more" tabindex="0" @click="emit('open', '')">查看更多功能 ›</div>
      <div v-if="recommendTitle" class="jp-rec">
        今日推荐：{{ recommendTitle }}
        <span v-if="recommendSub"> | {{ recommendSub }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * JuniorHome —— 初中端首页（简洁现代，深蓝渐变）
 *
 * 对应设计稿：深蓝渐变顶栏 + 四张统计卡（今日学习/完成练习/错题本/学习积分）；
 * 白底区域 8 张功能卡，每张带学习进度条；底部一行「今日推荐」。
 *
 * 顶栏右侧的学习进度取所有模块进度的平均值 —— 设计稿写的是 68%，
 * 但没有定义这个数字从哪来，用平均进度是唯一能从真实数据算出来的口径。
 */
import { computed } from "vue";
import type { PortalModule } from "./modules";
import { progressOf as readProgress, stageLabel } from "./modules";
import type { StudentOverview } from "../../api/types";

const props = defineProps<{
  overview: StudentOverview | null;
  modules: PortalModule[];
}>();

const emit = defineEmits<{ (e: "open", moduleCode: string): void }>();

const today = computed(() => props.overview?.today);
const total = computed(() => props.overview?.total);
const wrongPending = computed(() => props.overview?.wrongPending ?? 0);
const stageText = computed(() => stageLabel(props.overview?.stage));

/**
 * 该卡片的模块进度
 *
 * @param m 模块
 * @returns 0-100
 */
function progressOf(m: PortalModule): number {
  return readProgress(props.overview?.modules, m.moduleCode);
}

const overallProgress = computed(() => {
  if (!props.modules.length) {
    return 0;
  }
  const sum = props.modules.reduce((acc, m) => acc + progressOf(m), 0);
  return Math.round(sum / props.modules.length);
});

const recommendModule = computed(() =>
  props.modules.find((m) => m.moduleCode === props.overview?.recommend),
);
const recommendTitle = computed(() => recommendModule.value?.title ?? "");
const recommendSub = computed(() => recommendModule.value?.subtitle ?? "");
</script>

<style scoped>
/*
 * koi 令牌口径（与 PrimaryHome / SeniorHome / TeacherPortalView / StudentPortalView 完全一致）：
 *   品牌色带 = --el-color-primary → --el-color-primary-light-3
 *   页面底   = --el-bg-color-page，卡片面 = --el-bg-color
 *   文字三级 = --el-text-color-primary / -regular / -secondary / -placeholder
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器一律不加投影，投影只留给「悬浮浮起」与「键盘焦点环」两种反馈。
 */
.jp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  /* 初中端：蓝→靛蓝渐变（对齐设计稿），与小学亮蓝、高中深蓝区分 */
  background: linear-gradient(
    175deg,
    #4a5cf5 0%,
    #7c8bff 46%,
    var(--el-bg-color-page) 46.1%,
    var(--el-fill-color-lighter) 100%
  );
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.jp-head {
  padding: clamp(16px, 2.4vw, 30px) clamp(16px, 3.2vw, 44px) 0;
}
.jp-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(12px, 2vw, 26px);
  flex-wrap: wrap;
}
.jp-title {
  margin: 0;
  font-size: clamp(26px, 4.2vw, 44px);
  font-weight: 900;
  letter-spacing: clamp(1px, 0.3vw, 4px);
  color: var(--el-color-white);
  /* 白字压在主色带上的可读性靠描边阴影，暗色模式下色带更深，描边同样跟随 */
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.jp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  /* 色带上的白字不能换成 --el-text-color-primary（暗色下会变浅色失去对比），
     用 --el-color-white + color-mix 保留原来的 95% 透明度 */
  color: color-mix(in srgb, var(--el-color-white) 95%, transparent);
}
.jp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.jp-stats {
  display: grid;
  /* auto-fit：四枚统计卡按可用宽度自动换列。原先写死 repeat(4)，
     在 390px 手机上每枚不到 90px，「完成练习」这类标签直接被挤断 */
  grid-template-columns: repeat(auto-fit, minmax(clamp(132px, 30vw, 180px), 1fr));
  gap: clamp(8px, 1.2vw, 12px);
  min-width: 0;
  width: 100%;
}
.jp-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: clamp(8px, 1.1vw, 12px) clamp(10px, 1.4vw, 16px);
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  /* 卡片类容器不加投影：改用一条边框承载边界，暗色模式下也分得清 */
  border: 1px solid var(--el-border-color-lighter);
}
.jp-stat__ic {
  width: clamp(24px, 3vw, 30px);
  height: clamp(24px, 3vw, 30px);
  flex-shrink: 0;
  border-radius: var(--el-border-radius-circle, 50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(12px, 1.5vw, 15px);
  font-weight: 900;
  color: var(--el-color-white);
}
.jp-stat__ic.is-blue { background: var(--el-color-primary); }
.jp-stat__ic.is-green { background: var(--el-color-success); }
.jp-stat__ic.is-amber { background: var(--el-color-warning); }
/* 第四枚用中性灰 info，不用紫色：
   紫色在 element 语义位里没有对应项。先前用 color-mix(primary 50%, danger) 混出紫相，
   但那是「当前主色恰好是蓝」才成立的巧合——主色换成橙就混出棕、换成绿就混出墨绿，
   色相随主题漂移。这里改用语义位 info：色相在任何主题下都稳定为中性灰，
   与蓝/绿/橙三枚仍可区分，代价是失去紫色辨识度（换取跨主题一致）。 */
.jp-stat__ic.is-info { background: var(--el-color-info); }
.jp-stat__lbl {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}
.jp-stat__val {
  font-size: 20px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.jp-stat__val i {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
  margin-left: 3px;
}
/* 对齐设计稿：四枚统计胶囊各有浅色底（蓝/绿/橙/紫），通过 nth-child 着色，
   不改模板；第四枚固定紫（语义位里没有紫，用固定值保证色相稳定）。 */
.jp-stat:nth-child(1) { background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color)); }
.jp-stat:nth-child(2) { background: color-mix(in srgb, var(--el-color-success) 10%, var(--el-bg-color)); }
.jp-stat:nth-child(3) { background: color-mix(in srgb, var(--el-color-warning) 12%, var(--el-bg-color)); }
.jp-stat:nth-child(4) { background: color-mix(in srgb, #7c3aed 10%, var(--el-bg-color)); }

.jp-body {
  margin: clamp(14px, 2vw, 26px) clamp(12px, 1.8vw, 26px) 0;
  padding: clamp(16px, 2.2vw, 30px) clamp(14px, 2.2vw, 30px) clamp(14px, 1.8vw, 22px);
  /* 原 28px，最近档 16px（xl）；底部两角贴边所以保留 0 */
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-xl, 16px) 0 0;
  background: var(--el-bg-color);
  /* 原 min-height:55vh —— 写死 vh 在矮屏上凭空多出一段空白，
     改成随视口高度收放并封顶 */
  min-height: min(55dvh, 520px);
}
.jp-grid {
  display: grid;
  /* auto-fit：八张卡按可用宽度自己算列数，不再靠 1200/800 两个死断点 */
  grid-template-columns: repeat(auto-fit, minmax(clamp(150px, 24vw, 230px), 1fr));
  gap: clamp(12px, 1.5vw, 18px);
}
.jp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.3vw, 14px);
  padding: clamp(12px, 1.5vw, 20px) clamp(12px, 1.4vw, 18px);
  /* 对齐设计稿：白卡 + 柔和投影、20px 圆角 */
  border: 0;
  border-radius: clamp(14px, 1.6vw, 20px);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  box-shadow: 0 10px 24px color-mix(in srgb, #2b3a8f 10%, transparent);
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.jp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 30px color-mix(in srgb, #2b3a8f 18%, transparent);
}
.jp-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.jp-card__no {
  position: absolute;
  top: 12px;
  right: 14px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--el-border-radius-circle, 50%);
  /* 对齐设计稿：描边小圆牌（不是实心灰底） */
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.jp-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.jp-card__ic {
  flex-shrink: 0;
  width: clamp(38px, 4.2vw, 56px);
  height: clamp(38px, 4.2vw, 56px);
  /* 对齐设计稿：圆角方块图标 + 柔和投影 */
  border-radius: clamp(12px, 1.5vw, 18px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(18px, 2.1vw, 26px);
  /* 底色由 modules.ts 的 color/colorTo 渐变内联下发（数据驱动），这里只定前景 */
  color: var(--el-color-white);
  box-shadow: 0 8px 18px -6px color-mix(in srgb, var(--el-color-black) 22%, transparent);
}
.jp-card__text {
  min-width: 0;
}
.jp-card__title {
  font-size: clamp(14px, 1.7vw, 18px);
  font-weight: 900;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}
.jp-card__sub {
  margin-top: 4px;
  font-size: clamp(11px, 1.3vw, 12px);
  color: var(--el-text-color-placeholder);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jp-bar {
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.jp-bar__fill {
  display: block;
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  transition: width var(--el-transition-duration-fast, 0.2s) ease;
}
.jp-rec {
  margin: 26px 0 10px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-regular);
}
/* 「查看更多功能」：与小学 .pp-more / 高中 .sp-more 同一口径（字号、触摸目标、焦点环） */
.jp-more {
  margin: 26px 0 10px;
  padding: 10px 0;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: var(--el-color-primary);
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}
.jp-more:focus-visible {
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
/*
 * 响应式：列数已由 .jp-grid / .jp-stats 的 auto-fit + minmax(clamp(…)) 接管，
 * 这里**不再**写 repeat(3)/repeat(2) 的死断点 —— 与 auto-fit 逻辑重复且互相覆盖，
 * 窄屏反而被固定列数压成又窄又高的长条。只保留间距收口。
 */
@media (max-width: 800px) {
  .jp-head { padding: 16px 16px 0; }
  .jp-sub { margin-top: 6px; font-size: 13px; }
  .jp-body { margin: 14px 10px 0; padding: 16px 12px; min-height: 0; }
  .jp-rec { margin: 16px 0 8px; font-size: 13px; }
  /* 触摸目标仍保持 44px，只收间距与字号 */
  .jp-more { margin: 16px 0 8px; font-size: 14px; }
  /* 触摸目标不小于 44px */
  .jp-card { min-height: 64px; }
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部 transition */
@media (prefers-reduced-motion: reduce) {
  .jp-card,
  .jp-bar__fill {
    transition: none;
  }
}
</style>
