<!-- ScrollToBottomButton.vue -->
<template>
    <Transition name="fade">
        <button 
            v-if="show"
            ref="buttonRef"
            class="scroll-to-bottom-btn"
            :class="{ streaming: isStreaming, 'has-status': !!status && !inline, 'is-inline': inline }"
            @click="handleClick"
            :title="status || undefined"
            type="button"
        >
            <span class="scroll-to-bottom-btn__icon">
                <!-- 向下箭头图标 -->
                <svg class="scroll-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                        d="M12 5V19M12 19L5 12M12 19L19 12" 
                        stroke="currentColor" 
                        stroke-width="2" 
                        stroke-linecap="round" 
                        stroke-linejoin="round"
                    />
                </svg>
            </span>
            <!--
                当前在做什么（正在运行命令 / 正在压缩 …）。
                由 ChatPanel 计算后传入：这里只负责展示，判据集中在会话状态一侧，
                避免同一个「当前步骤」在按钮和别处各算一遍而分叉。

                内联形态不渲染这段文字（2026-11-12）：输入行里它会把按钮撑成一枚
                带底色的胶囊，和紧邻的「模型名 / 档位」拼成一条长条，看起来像一个控件；
                而这段文案本来就和输入框上方的模型动作条重复。内联时只保留箭头，
                文案降级为 title（hover 可见），既让两个控件分开，也不丢信息。
            -->
            <span v-if="status && !inline" class="scroll-to-bottom-btn__status">{{ status }}</span>
        </button>
    </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'

// Props 类型化
const props = defineProps<{
    show?: boolean;
    isStreaming?: boolean;
    /** 当前正在处理的步骤文案（如「正在运行命令 · pwd」「正在压缩」）；空则不显示 */
    status?: string;
    onClick?: (event: MouseEvent) => void;
    /**
     * 内联形态（2026-11-11 用户要求「滚动到底部融合到模型名/档位的左侧」）。
     *
     * <p>默认是浮在消息流之上的 FAB（absolute + 主色圆）；内联时改成输入行里
     * 的一个 28×28 纯图标按钮，与左侧工具按钮同一基线、不抢视觉焦点。</p>
     */
    inline?: boolean;
}>()

// Emits 类型化
const emit = defineEmits<{
    click: [event: MouseEvent]
}>()

// 响应式数据 - 类型化
const buttonRef = ref<HTMLButtonElement | null>(null)

// 调试：监听 props 变化
watch(() => props.isStreaming, (newVal) => {
  console.log('[ScrollButton Component] isStreaming prop changed:', newVal)
  // 检查类名
  if (buttonRef.value) {
    const hasStreamingClass = buttonRef.value.classList.contains('streaming')
    console.log('[ScrollButton Component] Button has streaming class:', hasStreamingClass)
  }
}, { immediate: true })

watch(() => props.show, (newVal) => {
  console.log('[ScrollButton Component] show prop changed:', newVal)
}, { immediate: true })

// 方法 - 类型化
function handleClick(event: MouseEvent): void {
  console.log('[ScrollButton Component] handleClick called')
  emit('click', event)
  if (props.onClick) {
    props.onClick(event)
  }
}

// 暴露方法给父组件
defineExpose({
    buttonRef
})
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余组件统一）：
   1. 颜色一律走 --el-*。本应用 refactor.css 已把 --el-color-primary 映射到
      --color-primary 主题层，public/themes 下 9 套配色 + 明暗都自动跟随，
      所以原 var(--color-primary, #3b82f6) 里的 hex 兜底是死代码，直接去掉。
   2. 这是浮在消息流之上的浮动按钮，投影本身就是「浮起」表达（koi 允许的第二类
      box-shadow），但颜色必须令牌化——写死 rgba(59,130,246,…) 会在换肤后
      变成蓝底配橙阴影。
   3. 过渡统一 var(--el-transition-duration-fast, 0.2s)：element-plus 的 :root
      已定义 --el-transition-duration: .3s，var(--el-transition-duration, .2s)
      的兜底值永不生效，故一律用 -fast 档。
   ============================================================================ */

/* 按钮基础样式 */
.scroll-to-bottom-btn {
    position: absolute;
    /* 相对「输入列」定位（ChatPanel 把本组件放在模型动作条 + 输入卡那一整列的容器里）：
       bottom 用 100% + 10px 抬到整列上沿之外 10px，不再依赖写死的 140px——
       旧值是按「面板底部 + 输入卡高度」估算的，模型动作条/队列抽屉出现时就会压在它们上面
       （实测 .model-action-bar 与按钮完全重叠，动作条的「正在生成回答」被盖住）。 */
    bottom: calc(100% + 10px);
    /* 输入列左缘内 24px（2026-10-24 用户要求「放左侧、不与正文抢中线」在此实现）。
       旧实现挂在面板根部，面板宽含滚动区 px-5 内边距，限宽窄屏下这个 24px 会贴到
       面板最左缘、跑到内容列外面（2026-11-10 用户报障「现在跑到最左侧了」）。 */
    left: 24px;
    transform: none;
    width: 34px;
    height: 34px;
    /* 原值 50%（正圆）→ full 档，与 34×34 正方形的圆角胶囊同形 */
    border-radius: var(--el-radius-full, 9999px);
    background-color: var(--el-color-primary);
    border: none;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--el-transition-duration-fast, 0.2s) ease;
    z-index: 100;
    padding: 0;
    outline: none;
}

/*
  带状态文案时从正圆变成胶囊：图标 + 「正在运行命令 · pwd」。
  限宽 + 省略号兜底——命令可能很长，不能让它把按钮拉成横贯整屏的长条。
*/
.scroll-to-bottom-btn.has-status {
    width: auto;
    max-width: min(60vw, 420px);
    height: 30px;
    gap: 6px;
    padding: 0 12px 0 9px;
}

/* 键盘焦点环：原来只写了 outline:none 却没给任何替代，键盘用户完全看不到焦点。
   环落在按钮外侧的消息区底色上，12% 主色在浅色/深色底上都偏弱，故给到 45%。 */
.scroll-to-bottom-btn:focus-visible {
    box-shadow:
        0 4px 12px color-mix(in srgb, var(--el-color-primary) 30%, transparent),
        0 0 0 3px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

/* 悬停效果 */
.scroll-to-bottom-btn:hover {
    background-color: var(--el-color-primary-dark-2);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    transform: translateY(-2px);
}

/* 点击效果 */
.scroll-to-bottom-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

/* 按钮内容（图标容器） */
.scroll-to-bottom-btn__icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* 状态文案：等宽数字便于秒数/文件名不跳动，超长省略 */
.scroll-to-bottom-btn__status {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--el-color-white);
}

/* 滚动图标 */
.scroll-icon {
    width: 18px;
    height: 18px;
    /* 原值 white → --el-color-white（图标描边走 currentColor，随按钮底色走） */
    color: var(--el-color-white);
}

/* 呼吸动画 - 流式输出时启用 */
/* 注意：.streaming 类直接绑定在按钮元素上 */
.scroll-to-bottom-btn.streaming {
    animation: breathing 2s ease-in-out infinite;
}

@keyframes breathing {
    0%, 100% {
        opacity: 0.6;
        /* 缩放不再需要补 translateX(-50%)：按钮已改为左对齐（left 定位） */
        transform: scale(0.95);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    }
    50% {
        opacity: 1;
        transform: scale(1.05);
        box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 50%, transparent);
    }
}

/* ── 内联形态（2026-11-11）：挂在「模型名 / 档位」chip 左侧 ──
   用户要求把「回到底部」融进输入行，不再浮在消息区左上方。
   这里必须把 FAB 的绝对定位、主色实底、投影、缩放动效全部撤掉，
   否则它会变成输入行里一颗突兀的蓝色圆钮，把模型 chip 挤歪。 */
.scroll-to-bottom-btn.is-inline {
    position: static;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    box-shadow: none;
    color: var(--el-text-color-regular);
    z-index: auto;
    flex-shrink: 0;
}

.scroll-to-bottom-btn.is-inline:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
    box-shadow: none;
    transform: none;
}

.scroll-to-bottom-btn.is-inline:active {
    transform: none;
    box-shadow: none;
}

.scroll-to-bottom-btn.is-inline .scroll-icon {
    width: 16px;
    height: 16px;
    /* 内联态用文字色描边，随悬停变主色（不再固定白） */
    color: currentColor;
}

/* 流式时不再整颗按钮呼吸（输入行里闪会干扰输入），
   改成图标染主色 + 右上角一颗小圆点把「有新内容」留住 */
.scroll-to-bottom-btn.is-inline.streaming {
    animation: none;
    opacity: 1;
    position: relative;
    /* 清掉 FAB 定位偏移（2026-11-13 用户报障：箭头被右推 24px 压进模型动作条左缘）：
       基础规则里的 left:24px / bottom:calc(100%+10px) 在 position:static 时被忽略，
       这里为了给 ::after 圆点做锚点把 position 改回 relative，偏移立刻复活。
       relative 只用于锚定 ::after，四个偏移必须显式归零。 */
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
}

.scroll-to-bottom-btn.is-inline.streaming .scroll-icon {
    color: var(--el-color-primary);
}

.scroll-to-bottom-btn.is-inline.streaming::after {
    content: '';
    position: absolute;
    top: 4px;
    right: 4px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--el-color-primary);
    animation: mab-wait-dot-inline 1.4s ease-in-out infinite;
}

@keyframes mab-wait-dot-inline {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 1; }
}

/* 内联态永远不带状态文案（见模板注释）：文案降级为 title，
   因此这里不再有 .is-inline.has-status 的胶囊样式。 */

/* 淡入淡出动画 - 使用 !important 确保优先于呼吸动画 */
.fade-enter-active,
.fade-leave-active {
    transition:
        opacity var(--el-transition-duration-fast, 0.2s) ease,
        transform var(--el-transition-duration-fast, 0.2s) ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0 !important;  /* ← 强制覆盖呼吸动画的 opacity */
    transform: scale(0.8) translateY(10px) !important;  /* ← 强制覆盖呼吸动画的 transform */
}

/* 图标跳动动画 */
@keyframes bounce-down {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(3px);
    }
}

/* 移动端适配 */
@media (max-width: 768px) {
    .scroll-to-bottom-btn {
        /* bottom 不再按视口写死：本组件定位在输入卡行内，100% + 10px 的手机上同样成立；
           这里只放大点击目标，避免小屏上 34px 太难点。 */
        width: 40px;
        height: 40px;
    }

    /* 内联态不跟随放大：它现在住在输入行里，40px 会把模型 chip 挤到换行 */
    .scroll-to-bottom-btn.is-inline {
        width: 28px;
        height: 28px;
    }

    .scroll-icon {
        width: 20px;
        height: 20px;
    }

    .scroll-to-bottom-btn.is-inline .scroll-icon {
        width: 16px;
        height: 16px;
    }
}

/* 尊重系统「减少动态效果」偏好。
   为什么要补静态描边：呼吸动画是「正在流式输出」的唯一视觉线索，
   直接 animation:none 会让用户完全无法分辨按钮当前处于什么状态，
   故在降级分支给 .streaming 一个静态主色环把状态留住。 */
@media (prefers-reduced-motion: reduce) {
    .scroll-to-bottom-btn,
    .fade-enter-active,
    .fade-leave-active {
        transition: none;
    }

    .scroll-to-bottom-btn.streaming {
        animation: none;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
    }
}
</style>
