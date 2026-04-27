<template>
  <div
    class="project-card"
    :class="[
      getOsCardClass(project.serverOs),
      { 'is-activated': project.serverEnabled === 1, 'is-drag-over': isDragOver, 'is-selected': selected },
    ]"
    @click="$emit('click', project)"
    @contextmenu.prevent.stop="$emit('contextmenu', $event, project)"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <!-- 拖拽遮罩 -->
    <div v-if="isDragOver" class="drag-mask">
      <IconifyIconOnline icon="ri:upload-cloud-2-line" />
      <span>松开上传到此项目</span>
    </div>

    <!-- 多选 checkbox -->
    <div v-if="selectMode" class="card-checkbox" @click.stop="$emit('select-toggle', project)">
      <el-checkbox :model-value="selected" />
    </div>

    <!-- OS 图标徽章 -->
    <div class="card-os-badge">
      <IconifyIconOnline :icon="getOsIcon(project.serverOs)" />
    </div>

    <!-- 运行状态指示点 -->
    <div v-if="project.serverEnabled === 1" class="card-server-status">
      <span class="status-dot" :class="project.runtimeStatus === 'running' ? 'is-online' : 'is-offline'" />
    </div>

    <!-- 项目图标 -->
    <div class="card-icon">
      <img v-if="project.projectIcon" :src="project.projectIcon" :alt="project.projectName" class="icon-img" />
      <div v-else class="icon-placeholder">
        <IconifyIconOnline icon="ri:apps-line" />
      </div>
    </div>

    <!-- 项目信息 -->
    <div class="card-body">
      <h3 class="card-title" :title="project.projectName">{{ project.projectName }}</h3>
      <p v-if="project.projectDescription" class="card-desc">{{ project.projectDescription }}</p>
      <div class="card-meta">
        <span class="meta-date">{{ formatDate(project.createTime) }}</span>
        <span v-if="project.secretCount" class="meta-secrets">
          <IconifyIconOnline icon="ri:key-2-line" />
          {{ project.secretCount }}
        </span>
        <span v-if="project.serverEnabled === 1 && project.serverUsername" class="meta-user">
          <IconifyIconOnline icon="ri:user-line" />
          {{ maskUsername(project.serverUsername) }}
        </span>
      </div>
    </div>

    <!-- 操作按钮组（仅激活服务器时显示） -->
    <ProjectActionBar
      v-if="project.serverEnabled === 1"
      :project="project"
      @action="(type, p) => $emit('action', type, p)"
      @upload="(p) => $emit('upload', p)"
      @upgrade="(p) => $emit('upgrade', p)"
      @software="(p) => $emit('software', p)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import type { SysProject } from "../../api/manage/project";
import { getOsCardClass, getOsIcon, maskUsername } from "./utils";
import ProjectActionBar from "./ProjectActionBar.vue";

defineProps<{
  project: SysProject;
  selectMode?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  click: [project: SysProject];
  contextmenu: [event: MouseEvent, project: SysProject];
  "select-toggle": [project: SysProject];
  action: [type: string, project: SysProject];
  upload: [project: SysProject];
  upgrade: [project: SysProject];
  software: [project: SysProject];
  "drop-upload": [files: FileList, project: SysProject];
}>();

const isDragOver = ref(false);

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false;
  if (e.dataTransfer?.files?.length) {
    emit("drop-upload", e.dataTransfer.files, (e.currentTarget as any).__vue_project__);
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString("zh-CN");
};
</script>

<style scoped lang="scss">
.project-card {
  position: relative;
  border-radius: 20px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  overflow: hidden;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.15); }

  &.is-drag-over {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 0 0 3px rgba(64,158,255,0.3);
  }

  &.is-selected {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 0 0 2px var(--el-color-primary);
  }

  // OS 主题
  &.card-os--linux {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: #e0e0e0;
    border-color: rgba(0, 255, 136, 0.2);
    &::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 80% 20%, rgba(0,255,136,0.12), transparent 60%); pointer-events: none; }
  }
  &.card-os--windows {
    background: linear-gradient(135deg, #0078d4 0%, #005a9e 50%, #003d6b 100%);
    color: #fff;
    border-color: rgba(0,120,212,0.4);
    &::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12), transparent 60%); pointer-events: none; }
  }
  &.card-os--macos {
    background: linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 50%, #d1d1d6 100%);
    color: #1d1d1f;
    border-color: rgba(0,0,0,0.1);
  }
  &.card-os--unknown {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    color: var(--el-text-color-primary);
    border-color: var(--el-border-color-lighter);
  }
}

.drag-mask {
  position: absolute;
  inset: 0;
  background: rgba(64,158,255,0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 20px;
  z-index: 10;
  font-size: 32px;
  span { font-size: 14px; }
}

.card-checkbox { position: absolute; top: 12px; left: 12px; z-index: 5; }
.card-os-badge { position: absolute; top: 14px; right: 14px; font-size: 22px; opacity: 0.6; }
.card-server-status { position: absolute; top: 14px; left: 14px; }
.status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; &.is-online { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.25); } &.is-offline { background: #94a3b8; } }
.card-icon { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; }
.icon-img { width: 100%; height: 100%; object-fit: cover; }
.icon-placeholder { font-size: 22px; opacity: 0.7; }
.card-body { flex: 1; }
.card-title { margin: 0 0 4px; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-desc { margin: 0 0 6px; font-size: 12px; opacity: 0.7; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.card-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; opacity: 0.6; flex-wrap: wrap; }
.meta-secrets, .meta-user { display: flex; align-items: center; gap: 3px; }
</style>
