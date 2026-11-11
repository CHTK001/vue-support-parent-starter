<template>
    <div>
        <img v-if="src && !showPlaceholder" :src="avatarSrc" alt="Avatar" class="avatar-image w-full h-full"
            :class="{ 'rounded-full': props.round, 'rounded-lg': !props.round }"
            :style="props.fit === 'contain' ? { objectFit: 'contain' } : undefined"
            @error="onImgError"></img>
        <div v-else class="avatar-placeholder" :class="{
            'rounded-full': props.round,
            'rounded-lg': !props.round, 'avatar-user': props.type === 'user'
        }">
            <!-- 如果有名称且是 assistant 类型，显示首字 -->
            <span v-if="name && props.type === 'assistant'" class="avatar-text">
                {{ firstChar }}
            </span>
            <UserOutlined v-else-if="props.type === 'user'" class="w-[65%] h-[65%]" />
            <OpenAI v-else />
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
// @ts-ignore - icons 类型缺失
import {
    UserOutlined,
} from '@vicons/antd'
// @ts-ignore - icons 类型缺失
import { OpenAI } from '@/components/icons'

// Props 类型化
const props = defineProps<{
    src?: string;
    round?: boolean;
    type?: 'user' | 'assistant';
    full?: boolean;
    name?: string;  // 用于生成首字头像的名称
    /**
     * 图片填充方式，默认 cover（人像/头像要铺满方形）。
     * 品牌 Logo 请传 contain：词标（如 512×58 的横向 logo）与竖版标记
     * 用 cover 会被裁掉两端，只剩中间一截，读不出品牌。
     */
    fit?: 'cover' | 'contain';
}>();

// Logo 加载失败时回退到占位图（首字母），避免显示崩坏图像图标
const showPlaceholder = ref(false);
// 同时向上广播：调用方要的兜底是「换成供应商 logo」而不是首字，只能靠 error 事件才知道
// 这张图其实并不存在（路径存在 ≠ 资源存在）。
const emit = defineEmits<{ error: [] }>();
const onImgError = () => { showPlaceholder.value = true; emit('error') };

// 添加时间戳避免缓存 - 类型化
const avatarSrc = computed((): string => {
    if (!props.src) return ''
    // 如果已经是 blob URL 或者是 base64，直接返回
    if (props.src.startsWith('blob:') || props.src.startsWith('data:')) {
        return props.src
    }

    return props.src
});

// 获取名称的第一个字符 - 类型化
const firstChar = computed((): string => {
    if (!props.name) return ''
    // 去除空格后取第一个字符
    const trimmed = props.name.trim()
    return trimmed ? trimmed.charAt(0) : ''
});

</script>
<style scoped>
/* 令牌口径：占位头像的底色/文字色全部走 --el-*，明暗与 9 套配色自动跟随。
   本文件无 transition/animation，故不需要 prefers-reduced-motion 分支。 */
.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    /* border: 1px solid #d0d0d0; */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 原值 #f5f5f5（浅灰底）→ 填充色令牌，明暗两套都有对应值 */
    background-color: var(--el-fill-color-light);
    /* 原值 #666 → 次级文字色令牌 */
    color: var(--el-text-color-secondary);
    overflow: hidden;
    container-type: size;
}

/* 暗色态原来写死 #374151/#d1d5db，换成 --el-fill-color / --el-text-color-regular：
   这两个令牌在 html.dark 下由 refactor.css 重定义，跟随配色走。 */
.dark .avatar-placeholder {
    background-color: var(--el-fill-color);
    color: var(--el-text-color-regular);
}

/* 用户头像：固定中性灰底 + 白字。
   原值 #999 与 #fff 的对比度只有 2.4:1（未达 WCAG AA），
   --el-text-color-placeholder 明暗两侧都存在且不浅于原值，取它可在不改动观感的前提下跟随主题。 */
.avatar-placeholder.avatar-user {
    background-color: var(--el-text-color-placeholder);
    color: var(--el-color-white);
}

.avatar-text {
    font-size: 60cqw;
    font-weight: 600;
    /* 原值 #444 → 主文字色令牌，明暗两侧都能与占位底色拉开 */
    color: var(--el-text-color-primary);
    line-height: 1;
}
</style>