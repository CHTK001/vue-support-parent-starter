<template>
    <div class="tree-node">
        <div
            class="tree-node-content"
            :class="{ 'is-selected': selectedPath === node.path }"
            :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
            @click="handleClick"
            @contextmenu.prevent="(e) => $emit('contextmenu', e, node)"
        >
            <!-- 展开/折叠图标（仅目录） -->
            <span v-if="node.isDirectory" class="expand-icon" @click.stop="toggle">
                <svg v-if="expanded" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </span>
            <span v-else class="expand-icon-placeholder" />

            <!-- 文件夹/文件图标 -->
            <span v-if="node.isDirectory" class="node-icon folder-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg>
            </span>
            <span v-else class="node-icon file-icon">
                <img :src="fileIcon" width="16" height="16" />
            </span>

            <!-- 节点名称 -->
            <span class="node-label">{{ node.name }}</span>

            <!-- 加载中（右对齐，带淡出过渡） -->
            <Transition name="fade">
                <span v-if="loadingPaths.has(node.path)" class="loading-indicator">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                </span>
            </Transition>
        </div>

        <!-- 子节点（仅展开的目录） -->
        <div v-if="expanded && node.isDirectory" class="tree-children">
            <!-- 有缓存数据时先显示，background 刷新 -->
            <WorkspaceTreeNode
                v-for="child in node.children || []"
                :key="child.path"
                :node="child"
                :depth="depth + 1"
                :selected-path="selectedPath"
                :loading-paths="loadingPaths"
                :on-load="onLoad"
                @select="(n, isPreview) => $emit('select', n, isPreview)"
                @toggle="(n, e) => $emit('toggle', n, e)"
                @contextmenu="(e, n) => $emit('contextmenu', e, n)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WorkspaceNode } from './WorkspaceTree.vue';

// 递归组件需要显式导入自身
import WorkspaceTreeNode from './WorkspaceTreeNode.vue';
import { useFileIcon } from '@/composables/useFileIcon';

const fileIcon = useFileIcon(() => props.node.name);

const props = defineProps<{
    node: WorkspaceNode;
    depth: number;
    selectedPath: string;
    loadingPaths: Set<string>;
    onLoad?: (node: WorkspaceNode) => Promise<void>;
}>();

const emit = defineEmits<{
    select: [node: WorkspaceNode, isPreview?: boolean];
    contextmenu: [event: MouseEvent, node: WorkspaceNode];
    toggle: [node: WorkspaceNode, expanded: boolean];
}>();

const expanded = ref(false);

// 单击/双击延迟区分（仅文件节点）
let clickTimer: ReturnType<typeof setTimeout> | null = null;

function handleClick() {
    if (props.node.isDirectory) {
        toggle();
        return
    }
    // 文件节点：延迟区分单击/双击
    if (clickTimer) {
        // 第二次点击在延迟内到达 → 双击 → 持久标签
        clearTimeout(clickTimer)
        clickTimer = null
        emit('select', props.node, false)
    } else {
        clickTimer = setTimeout(() => {
            clickTimer = null
            emit('select', props.node, true)
        }, 250)
    }
}

async function toggle() {
    if (!props.node.isDirectory) return;
    expanded.value = !expanded.value;

    // 通知父组件展开状态变化（用于同步到后端）
    emit('toggle', props.node, expanded.value);

    // 展开时调用 onLoad 回调加载子节点（有缓存数据时会先显示再刷新）
    if (expanded.value && props.onLoad) {
        await props.onLoad(props.node);
    }
}
</script>

<style scoped>
.tree-node {
    user-select: none;
}

.tree-node-content {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 8px 0 8px;
    /* 原值 4px → xs 档 */
    border-radius: var(--el-radius-xs, 4px);
    cursor: pointer;
    font-size: 13px;
    color: var(--color-text);
    transition: background-color 0.15s;
}

.tree-node-content:hover {
    background-color: var(--color-sidebar-bg-hover);
}

.tree-node-content.is-selected {
    background-color: var(--color-sidebar-bg-active) !important;
    color: var(--color-sidebar-text-active) !important;
}

.expand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--color-text-gray);
    flex-shrink: 0;
}

.expand-icon-placeholder {
    width: 16px;
    flex-shrink: 0;
}

.node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.folder-icon {
    color: var(--el-color-warning);
}

.file-icon img {
    display: block;
    width: 16px;
    height: 16px;
}

.node-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--color-text-gray);
    flex-shrink: 0;
    margin-left: auto;
}

.spin {
    animation: tree-spin 0.6s linear infinite;
}

@keyframes tree-spin {
    to { transform: rotate(360deg); }
}

.tree-children {
    /* children indent via paddingLeft on each node-content */
}

/* 加载指示器淡出过渡 */
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-leave-to {
    opacity: 0;
}

/* 动效降级：系统开启「减少动态效果」时，节点选中底色与加载指示器淡出改为瞬间切换。
   逐个列出，不写 `*` / `.tree-node *` 通配，避免影响内部 SVG 图标。
   .is-selected 的底色是 !important 静态声明，停掉过渡后选中态照常成立。 */
@media (prefers-reduced-motion: reduce) {
    .tree-node-content,
    .fade-leave-active {
        transition: none;
    }

    /* 节点加载圈：这是「该节点正在展开」唯一的视觉提示 —— .loading-indicator
       只在 loadingPaths 命中时渲染，所以圈一旦不转就必须自己站得住。
       先把颜色从弱化的 --color-text-gray 提到主色、并显式保持满不透明，
       让它停住之后仍是一枚清晰的静态进度环，而不是一个几乎看不见的灰弧。 */
    .spin {
        color: var(--el-color-primary);
        opacity: 1;
        animation: none;
    }
}

/* 键盘焦点可见性：节点行与展开箭头都是带 @click 的 div/span（不是可聚焦控件），
   浏览器不给默认焦点环。
   .tree-node-content 原有 cursor: pointer 已在上面声明，不重复写；
   .expand-icon 原本既没有 CSS 指针样式、模板里也没写 cursor-pointer，这里补上。 */
.tree-node-content,
.expand-icon {
    outline: none;
}

.tree-node-content:focus-visible,
.expand-icon:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.expand-icon {
    cursor: pointer;
}
</style>
