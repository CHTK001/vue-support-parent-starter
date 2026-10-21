<template>
  <!--
    AI 答复「首字还没回来」时的占位行。

    为什么需要它：`create` 帧一到，AI 气泡就建出来了，但正文要等第一个 token，
    这段时间（本机实测 5～50s）气泡里是**整块空白**，看起来像卡死。
    这里先给一句随机文案 + 两点动效（跳动的小圆点 + 文字呼吸），
    首字到了由正文顶替（由父组件 v-if 控制）。

    为什么文案会自己换：等待时间可能很长，同一句盯久了也像卡住。
    每 intervalMs 换一句，且保证不与上一句相同（见 utils/thinkingPhrases.ts）。

    无障碍：轮换的文字对读屏器 aria-hidden 掉（否则每 4.5s 播报一次很吵），
    另外给一句固定的 sr-only 文案，读屏器只会听到一次「AI 正在思考」。
  -->
  <div class="thinking-ph" role="status" :title="phrase">
    <span class="thinking-ph__dots" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
    <span class="thinking-ph__text" aria-hidden="true">{{ phrase }}</span>
    <span class="sr-only">AI 正在思考</span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { apiService } from '@/services/ApiService'
import { getThinkingPhrases, pickThinkingPhrase, setCustomThinkingPhrases } from '@/utils/thinkingPhrases'

const props = defineProps<{
  /** 指定文案列表；不传则用会话管理里配置的列表（未配置时是内置默认） */
  phrases?: string[]
  /** 轮换间隔（毫秒） */
  intervalMs?: number
}>()

/** 当前显示的一句 */
const phrase = ref(pickThinkingPhrase(props.phrases))

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

onMounted(() => {
  const gap = props.intervalMs && props.intervalMs > 0 ? props.intervalMs : 4500
  timer = setInterval(() => {
    // 传 avoid = 当前这句，保证不会连着两次一样
    phrase.value = pickThinkingPhrase(props.phrases ?? getThinkingPhrases(), phrase.value)
  }, gap)

  // 配置到位后换一句（配置为空则保持内置默认，界面上不会闪）
  void ensurePhrasesLoaded().then(() => {
    phrase.value = pickThinkingPhrase(props.phrases ?? getThinkingPhrases(), phrase.value)
  })
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
/*
  与「工作中」状态行同族的低调样式：13px、灰字、不抢正文的视线。
  不加背景/边框 —— 它本来就是一个临时占位，加容器反而像一条真消息。
*/
.thinking-ph {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  color: var(--color-text-gray, var(--el-text-color-secondary));
  font-size: 13px;
  line-height: 20px;
  user-select: none;
}

/* 三点：只动 transform/opacity，不触发布局重排 */
.thinking-ph__dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
}

.thinking-ph__dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-color-primary);
  opacity: 0.35;
  animation: thinking-ph-bounce 1.25s infinite ease-in-out;
}

.thinking-ph__dots i:nth-child(2) {
  animation-delay: 0.16s;
}

.thinking-ph__dots i:nth-child(3) {
  animation-delay: 0.32s;
}

/* 文案：轻微呼吸，读起来是「在想」而不是「静止」 */
.thinking-ph__text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  animation: thinking-ph-breathe 2.6s ease-in-out infinite;
}

@keyframes thinking-ph-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  30% {
    transform: translateY(-3px);
    opacity: 1;
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

/* 动效降级：系统开「减少动态效果」时停止跳动/呼吸，但文字照样在（不能变成空白） */
@media (prefers-reduced-motion: reduce) {
  .thinking-ph__dots i {
    animation: none;
    opacity: 0.8;
  }

  .thinking-ph__text {
    animation: none;
    opacity: 1;
  }
}
</style>
