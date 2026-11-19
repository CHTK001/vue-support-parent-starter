<template>
    <div class="workspace-tree-custom">
        <WorkspaceTreeNode
            v-for="node in visibleNodes"
            :key="node.path"
            :node="node"
            :depth="0"
            :selected-path="selectedPath"
            :loading-paths="loadingPaths"
            :on-load="onLoad"
            :show-hidden="showHidden"
            @select="(n, isPreview) => $emit('select', n, isPreview)"
            @toggle="(n, e) => $emit('toggle', n, e)"
            @contextmenu="(e, n) => $emit('contextmenu', e, n)"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WorkspaceTreeNode, { isHiddenByDefault } from './WorkspaceTreeNode.vue';

export interface WorkspaceNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: WorkspaceNode[];
    size?: number;
    hasChildren?: boolean;
}

const props = defineProps<{
    nodes: WorkspaceNode[];
    selectedPath: string;
    loadingPaths: Set<string>;
    onLoad?: (node: WorkspaceNode) => Promise<void>;
    /** 是否显示 .git / node_modules 这类默认隐藏的节点 */
    showHidden?: boolean;
}>();

/** 只做过滤、不复制节点：懒加载写回的是同一批响应式对象，复制会让 children 丢失 */
const visibleNodes = computed(() =>
    props.showHidden ? props.nodes : props.nodes.filter((node) => !isHiddenByDefault(node.name)),
);

const emit = defineEmits<{
    select: [node: WorkspaceNode, isPreview?: boolean];
    toggle: [node: WorkspaceNode, expanded: boolean];
    contextmenu: [event: MouseEvent, node: WorkspaceNode];
}>();
</script>

<style scoped>
.workspace-tree-custom {
    padding: 0 8px;
    min-width: fit-content;
}

.workspace-tree-custom > .tree-node + .tree-node {
    margin-top: 2px;
}

.workspace-tree-custom :deep(.tree-children > .tree-node + .tree-node) {
    margin-top: 2px;
}
</style>
