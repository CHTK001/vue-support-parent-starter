<script setup lang="ts">
/**
 * 全局过程任务浮层宿主
 *
 * 独立于具体布局/页面，Teleport 到 body，只渲染「一个」ReProcessTask 堆叠容器，
 * 传入全局 processTasks 单例；多个任务在容器内部左右切换 / 状态条点选。
 * 由 main.ts 挂载并共享主 app context（ElementPlus 等）。
 *
 * @author CH
 * @since 4.0.0.42
 */
import ReProcessTask from "@repo/ui/components/ReProcessTask/ReProcessTask.vue";
import { getProcessTasks, removeTask } from "@pages/server/src/utils/processTasks";

const tasks = getProcessTasks();
</script>

<template>
  <Teleport to="body">
    <ReProcessTask v-if="tasks.length" :tasks="tasks" @close="removeTask" />
  </Teleport>
</template>
