<template>
  <div class="project-toolbar">
    <!-- 左侧：批量操作按钮 -->
    <div class="toolbar-left">
      <template v-if="!selectMode">
        <el-tooltip content="点击进入多选模式，批量启动" placement="bottom">
          <ScButton size="small" type="success" plain @click="$emit('enter-select', 'start')">
            <IconifyIconOnline icon="ep:video-play" />
            启动
          </ScButton>
        </el-tooltip>
        <el-tooltip content="点击进入多选模式，批量停止" placement="bottom">
          <ScButton size="small" type="danger" plain @click="$emit('enter-select', 'stop')">
            <IconifyIconOnline icon="ep:video-pause" />
            停止
          </ScButton>
        </el-tooltip>
        <el-tooltip content="点击进入多选模式，批量重启" placement="bottom">
          <ScButton size="small" type="warning" plain @click="$emit('enter-select', 'restart')">
            <IconifyIconOnline icon="ep:refresh-right" />
            重启
          </ScButton>
        </el-tooltip>
      </template>

      <template v-else>
        <span class="select-hint">已选 {{ selectedCount }} 个</span>
        <ScButton size="small" type="success" :loading="batchLoading === 'start'" @click="$emit('batch-action', 'start')">
          <IconifyIconOnline icon="ep:video-play" /> 批量启动
        </ScButton>
        <ScButton size="small" type="danger" :loading="batchLoading === 'stop'" @click="$emit('batch-action', 'stop')">
          <IconifyIconOnline icon="ep:video-pause" /> 批量停止
        </ScButton>
        <ScButton size="small" type="warning" :loading="batchLoading === 'restart'" @click="$emit('batch-action', 'restart')">
          <IconifyIconOnline icon="ep:refresh-right" /> 批量重启
        </ScButton>
        <ScButton size="small" plain @click="$emit('exit-select')">取消选择</ScButton>
      </template>
    </div>

    <!-- 右侧：上传 + 全局设置 -->
    <div class="toolbar-right">
      <ScButton size="small" type="primary" plain @click="$emit('upload-multi')">
        <IconifyIconOnline icon="ri:upload-cloud-line" />
        上传
      </ScButton>
      <ProjectUploadSettings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";
import ProjectUploadSettings from "./ProjectUploadSettings.vue";

defineProps<{
  selectMode?: boolean;
  selectedCount?: number;
  batchLoading?: string | null;
}>();

defineEmits<{
  "enter-select": [action: string];
  "exit-select": [];
  "batch-action": [action: string];
  "upload-multi": [];
}>();
</script>

<style scoped lang="scss">
.project-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
.select-hint { font-size: 13px; font-weight: 600; color: var(--el-color-primary); }
</style>
