<template>
  <!--
    AI 答复「首字还没回来」时的占位行。

    为什么需要它：`create` 帧一到，AI 气泡就建出来了，但正文要等第一个 token，
    这段时间（本机实测 5～50s）气泡里是**整块空白**，看起来像卡死。
    这里先给一句随机文案 + 动效（一个在轨道上来回走动的小人 + 文字呼吸），
    首字到了由正文顶替（由父组件 v-if 控制）。

    为什么文案会自己换：等待时间可能很长，同一句盯久了也像卡住。
    每 intervalMs 换一句，且保证不与上一句相同（见 utils/thinkingPhrases.ts）。

    等待增强（解决「像卡死」的三个感知来源）：
    ① 没有推进感 —— 加一条不确定进度条，流动但不承诺进度；
    ② 不知道等了多久 —— 3 秒后显示已等待时长（表宽数字，越长越醒目不了，刻意弱化）；
    ③ 等太久还在抖机灵 —— 超过 20s 文案自动切到「安抚档」（见 pickThinkingPhraseForElapsed）。

    无障碍：轮换的文字/秒数/进度条对读屏器 aria-hidden（否则每几秒播报一次很吵），
    另外给一句固定的 sr-only 文案，读屏器只会听到一次「AI 正在思考」。
  -->
  <div class="thinking-ph" role="status">
    <div class="thinking-ph__row" :title="phrase">
      <!--
        来回走动的小人：纯 CSS 画的火柴人，走到轨道尽头转身再走回来。
        不用 emoji（🚶）：各平台字形/配色差异太大，且跟不了主题色；
        这里全部用 --el-color-primary 画，深浅色主题都协调。
      -->
      <span class="thinking-ph__track" aria-hidden="true">
        <!-- 地面线：让「来回走」有个场景参照，也暗示这是过程而非结果 -->
        <span class="thinking-ph__rail"></span>
        <span class="thinking-ph__walker">
          <span class="thinking-ph__figure">
            <i class="thinking-ph__head"></i>
            <i class="thinking-ph__body"></i>
            <i class="thinking-ph__leg"></i>
            <i class="thinking-ph__leg thinking-ph__leg--back"></i>
          </span>
        </span>
      </span>
      <span class="thinking-ph__text" aria-hidden="true">{{ phrase }}</span>
      <!-- 已等待时长：3 秒前不显示（一闪而过的「1s」反而毛躁） -->
      <span v-if="elapsed >= 3" class="thinking-ph__clock" aria-hidden="true">{{ clockText }}</span>
    </div>
    <!-- 不确定进度条：宽度永远不满，只传达「还在推进」 -->
    <span class="thinking-ph__bar" aria-hidden="true"><i class="thinking-ph__bar-fill"></i></span>
    <span class="sr-only">AI 正在思考</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { apiService } from '@/services/ApiService'
import {
  getThinkingPhrases,
  pickThinkingPhrase,
  pickThinkingPhraseForElapsed,
  setCustomThinkingPhrases,
} from '@/utils/thinkingPhrases'

const props = defineProps<{
  /** 指定文案列表；不传则用会话管理里配置的列表（未配置时是内置默认） */
  phrases?: string[]
  /** 轮换间隔（毫秒） */
  intervalMs?: number
}>()

/** 当前显示的一句 */
const phrase = ref(pickThinkingPhrase(props.phrases))
/** 已等待秒数（驱动秒数显示与长等待文案分档） */
const elapsed = ref(0)

/**
 * 取下一句：外部传入列表 > 会话管理配置 > 内置默认（按等待时长分档）。
 * 统一入口，避免轮换与配置就位两处逻辑漂移。
 */
function nextPhrase(): void {
  if (props.phrases && props.phrases.length > 0) {
    phrase.value = pickThinkingPhrase(props.phrases, phrase.value)
  } else {
    phrase.value = pickThinkingPhraseForElapsed(elapsed.value, phrase.value)
  }
}

/** 秒数展示：60s 内「12s」，超过后「1:23」，表宽数字不跳动 */
const clockText = computed(() => {
  const s = elapsed.value
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

/**
 * 一次性把「会话管理 → 会话配置」里配的占位文案拉进内存。
 *
 * <p>为什么组件自己拉：用户可能直接进会话页、根本没打开过设置页；只在设置页里灌数据的话，
 * 他自己配的文案要等下次进设置才生效。模块级 Promise 保证一个页面生命周期只请求一次，
 * 多个占位实例共享同一次请求。</p>
 *
 * <p>取不到不报错：这是纯装饰文案，拿不到就用内置默认，不值得打扰用户。</p>
 */
let phrasesLoaded: Promise<void> | null = null

function ensurePhrasesLoaded(): Promise<void> {
  if (!phrasesLoaded) {
    phrasesLoaded = apiService
      .fetchMergedGroupSettings('session')
      .then((response: any) => {
        // merged 响应是双层信封，与 SessionConfigSettings.pickField 同源口径
        const first = response?.data ?? response
        const items = Array.isArray(first) ? first : Array.isArray(first?.data) ? first.data : []
        const item = items.find((it: any) => it?.field === 'thinking_placeholder_phrases')
        setCustomThinkingPhrases(item?.value ?? item?.defaultValue)
      })
      .catch(() => {
        /* 拿不到就用内置默认文案 */
      })
  }
  return phrasesLoaded
}

let timer: ReturnType<typeof setInterval> | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null
/** 秒表起点（单调时钟）：后台标签页被节流/休眠后恢复，秒数仍对得上真实等待时长 */
let clockStart = 0

/** 按单调时钟差值校准秒数：暂停期间不丢真实等待时长 */
function syncElapsed(): void {
  elapsed.value = Math.floor((performance.now() - clockStart) / 1000)
}

function stopTimers(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
}

function startTimers(): void {
  if (timer && clockTimer) return
  const gap = props.intervalMs && props.intervalMs > 0 ? props.intervalMs : 4500
  timer = setInterval(() => {
    nextPhrase()
  }, gap)

  // 秒表：1s 一跳，只改数字，不触发文案重排。
  // 用单调时钟差值而非累计 +1：浏览器会把后台标签页的 setInterval 节流到更低频
  // （深度休眠甚至分钟级），累计计数会越走越慢、与真实等待时长脱节；差值不受节流影响。
  clockTimer = setInterval(syncElapsed, 1000)
}

/**
 * 页面隐藏时暂停两个计时器：后台标签页里换文案、走秒都无人看，
 * setInterval 照跑纯耗电（浏览器节流只是降频，不是停）。
 * 秒表起点不动，回到前台先按差值校准一次，秒数自动对齐真实等待时长。
 */
function handleVisibilityChange(): void {
  if (document.hidden) {
    stopTimers()
  } else {
    syncElapsed()
    startTimers()
  }
}

onMounted(() => {
  clockStart = performance.now()
  startTimers()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 配置到位后换一句（配置为空则保持内置默认，界面上不会闪）
  void ensurePhrasesLoaded().then(() => {
    nextPhrase()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopTimers()
})
</script>

<style scoped>
/*
  与「工作中」状态行同族的低调样式：13px、灰字、不抢正文的视线。
  不加背景/边框 —— 它本来就是一个临时占位，加容器反而像一条真消息。
  纵向两行：上行（小人 + 文案 + 秒数），下行（细进度条）。
*/
.thinking-ph {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 22px;
  color: var(--color-text-gray, var(--el-text-color-secondary));
  font-size: 13px;
  line-height: 20px;
  user-select: none;
}

.thinking-ph__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

/*
  走动的轨道：宽度就是小人的活动范围，overflow: hidden 保证它只在轨道里走。
*/
.thinking-ph__track {
  position: relative;
  flex: 0 0 auto;
  width: 30px;
  height: 15px;
  overflow: hidden;
}

/* 地面线：1px 淡线，给小人一个「地面」参照 */
.thinking-ph__rail {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: currentColor;
  opacity: 0.18;
}

/* 位移层：只负责左右走（alternate = 走到头再走回来） */
.thinking-ph__walker {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 10px;
  height: 15px;
  animation: thinking-ph-walk 3s ease-in-out infinite alternate;
}

/*
  转身层：与走动同周期，在中点瞬间翻面。
  必须用 steps 而不是插值 —— 插值会让 scaleX 从 1 平滑过 0 到 -1，
  看起来像小人被压扁又弹开，而不是"转身"。
*/
.thinking-ph__figure {
  position: absolute;
  inset: 0;
  animation: thinking-ph-face 3s steps(1, end) infinite;
}

.thinking-ph__head {
  position: absolute;
  left: 2px;
  top: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.thinking-ph__body {
  position: absolute;
  left: 4.5px;
  top: 6px;
  width: 1.5px;
  height: 5px;
  background: var(--el-color-primary);
}

.thinking-ph__leg {
  position: absolute;
  left: 5px;
  top: 10px;
  width: 1.5px;
  height: 5px;
  background: var(--el-color-primary);
  transform-origin: 50% 0;
  animation: thinking-ph-step 0.64s ease-in-out infinite;
}

/* 两条腿反相：一条前摆时另一条后摆，才像走路；同相就变成原地蹦 */
.thinking-ph__leg--back {
  animation-delay: -0.32s;
}

/* 文案：轻微呼吸，读起来是「在想」而不是「静止」 */
.thinking-ph__text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  animation: thinking-ph-breathe 2.6s ease-in-out infinite;
}

/* 已等待秒数：刻意弱化（小一号、半透明），在场但不催促；表宽数字不抖动 */
.thinking-ph__clock {
  flex: 0 0 auto;
  font-size: 12px;
  line-height: 18px;
  opacity: 0.55;
  font-variant-numeric: tabular-nums;
}

/*
  不确定进度条：细（2px）、短（约一行字的宽度），放在占位行下方。
  只流动、不承诺进度 —— 首字时间本就不可预估，假百分比比没有更糟。
  轨道底色用伪元素画（currentColor + 低透明度），填充条用主题色实色。
*/
.thinking-ph__bar {
  position: relative;
  display: block;
  width: 148px;
  max-width: 100%;
  height: 2px;
  border-radius: 2px;
  overflow: hidden;
}

.thinking-ph__bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0.14;
  border-radius: 2px;
}

.thinking-ph__bar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 36%;
  border-radius: 2px;
  background: var(--el-color-primary);
  animation: thinking-ph-slide 1.8s ease-in-out infinite;
}

/* 走动：轨道 30px、小人 10px，所以最多走 20px，走到头仍完整留在轨道内 */
@keyframes thinking-ph-walk {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(20px);
  }
}

@keyframes thinking-ph-face {
  0% {
    transform: scaleX(1);
  }

  50% {
    transform: scaleX(-1);
  }
}

@keyframes thinking-ph-step {
  0%,
  100% {
    transform: rotate(22deg);
  }

  50% {
    transform: rotate(-22deg);
  }
}

@keyframes thinking-ph-breathe {
  0%,
  100% {
    opacity: 0.72;
  }

  50% {
    opacity: 1;
  }
}

/* 进度条滑行：从左缘外滑入、滑出右缘外，首尾不出现在轨道内 */
@keyframes thinking-ph-slide {
  0% {
    transform: translateX(-110%);
  }

  100% {
    transform: translateX(320%);
  }
}

/*
  读屏器专用文案：项目里没有全局 .sr-only 工具类，这里就地定义。
  视觉上完全隐藏，但读屏器可读 —— 配合根节点 role="status"，
  轮换文案/秒数都 aria-hidden，读屏器只播报这一句固定文案。
*/
.thinking-ph .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/*
  动效降级（系统开了「减少动态效果」）。

  走动的位移必须去掉 —— 那正是这个偏好要拦的东西（前庭反应）。
  但**不能把动效整个掐掉**：先前写的就是 animation: none + 固定 opacity，
  本机实测（prefers-reduced-motion: reduce）小人/圆点会变成完全静止，
  用户看到的是一个"卡死"的占位，恰好与本组件的目的相反。

  改成纯 opacity 的明暗呼吸：没有任何空间移动，但看得出"还活着"。
  进度条同理：不滑行，改为整条明暗呼吸。
*/
@media (prefers-reduced-motion: reduce) {
  .thinking-ph__walker,
  .thinking-ph__figure,
  .thinking-ph__leg {
    animation: none;
  }

  .thinking-ph__figure {
    opacity: 0.55;
    animation: thinking-ph-fade 1.6s ease-in-out infinite;
  }

  .thinking-ph__text {
    animation: thinking-ph-breathe 2.6s ease-in-out infinite;
  }

  .thinking-ph__bar-fill {
    animation: none;
    width: 100%;
    opacity: 0.55;
    animation: thinking-ph-fade 1.6s ease-in-out infinite;
  }
}

@keyframes thinking-ph-fade {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}
</style>
