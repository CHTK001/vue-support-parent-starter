<template>
  <div class="software-card" :class="{ 'is-installed': isInstalled, 'is-running': isRunning }">
    <div class="card-header">
      <div class="card-icon">
        <IconifyIconOnline
          :icon="binding.softwareIcon || 'ep:monitor'"
          :style="{ fontSize: '32px', color: iconColor }"
        />
      </div>
      <div class="card-info">
        <div class="card-name">{{ binding.softwareName || '未知软件' }}</div>
        <div class="card-version">
          v{{ binding.softwareVersion || '-' }}
          <ElTag v-if="installMode === 'DOCKER'" size="small" type="warning" style="margin-left:4px">Docker</ElTag>
          <ElTag v-else size="small" type="info" style="margin-left:4px">系统</ElTag>
        </div>
      </div>
      <div class="card-status-tags">
        <ElTag
          v-if="isInstalled"
          size="small"
          type="success"
          class="card-tag card-tag--reinstall"
          @click.stop="emit('reinstall', binding)"
        >
          <span class="tag-text-default">已安装</span>
          <span class="tag-text-hover">重装</span>
        </ElTag>
        <ElTag v-else size="small" type="info">未安装</ElTag>
        <span v-if="isInstalled" class="status-dot" :class="isRunning ? 'dot-running' : 'dot-stopped'" />
      </div>
    </div>

    <div class="card-meta">
      <span class="meta-item">
        <IconifyIconOnline icon="ep:folder" />
        {{ binding.installPath || '-' }}
      </span>
      <span v-if="binding.exposePorts" class="meta-item">
        <IconifyIconOnline icon="ep:connection" />
        {{ binding.exposePorts }}
      </span>
    </div>

    <div class="card-actions">
      <template v-if="!isInstalled">
        <ElButton size="small" type="primary" circle @click="emit('install', binding)">
          <IconifyIconOnline icon="ep:download" />
        </ElButton>
      </template>
      <template v-else>
        <!-- Primary actions: Start/Stop + Restart (mutually exclusive) -->
        <div class="action-group">
          <template v-if="isRunning">
            <ElTooltip content="停止" placement="top">
              <ElButton size="small" type="warning" circle @click="emit('stop', binding)">
                <IconifyIconOnline icon="ep:video-pause" />
              </ElButton>
            </ElTooltip>
            <ElTooltip content="重启" placement="top">
              <ElButton size="small" circle @click="emit('restart', binding)">
                <IconifyIconOnline icon="ep:refresh" />
              </ElButton>
            </ElTooltip>
          </template>
          <template v-else>
            <ElTooltip content="启动" placement="top">
              <ElButton size="small" type="success" circle @click="emit('start', binding)">
                <IconifyIconOnline icon="ep:video-play" />
              </ElButton>
            </ElTooltip>
          </template>
        </div>

        <!-- Diagnose (merged status + logs) -->
        <ElTooltip content="诊断" placement="top">
          <ElButton size="small" circle plain @click="emit('diagnose', binding)">
            <IconifyIconOnline icon="ep:tools" />
          </ElButton>
        </ElTooltip>

        <!-- Edit Config -->
        <ElTooltip content="编辑配置" placement="top">
          <ElButton size="small" circle plain @click="emit('edit-config', binding)">
            <IconifyIconOnline icon="ep:setting" />
          </ElButton>
        </ElTooltip>

        <!-- More actions dropdown -->
        <ElDropdown trigger="click" @command="(cmd: string) => handleMoreAction(cmd, binding)">
          <ElButton size="small" circle plain>
            <IconifyIconOnline icon="ep:more-filled" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="uninstall">
                <IconifyIconOnline icon="ep:delete" style="margin-right: 6px" />
                卸载
              </ElDropdownItem>
              <ElDropdownItem v-if="hasPanelLink" command="open-panel">
                <IconifyIconOnline icon="ep:monitor" style="margin-right: 6px" />
                管理面板
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </template>
    </div>

    <div v-if="lastError" class="card-error">
      <IconifyIconOnline icon="ep:warning-filled" style="color: var(--el-color-danger); flex-shrink: 0" />
      <span class="error-text">{{ lastError }}</span>
      <ElButton size="small" text type="primary" @click="emit('ai-analyze', binding)">
        AI 分析
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTag, ElTooltip } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { SoftwareBinding } from "../../api/software";

const props = defineProps<{
  binding: SoftwareBinding;
  actionLoading?: boolean;
  lastError?: string;
}>();

const emit = defineEmits<{
  install: [binding: SoftwareBinding];
  start: [binding: SoftwareBinding];
  stop: [binding: SoftwareBinding];
  restart: [binding: SoftwareBinding];
  diagnose: [binding: SoftwareBinding];
  reinstall: [binding: SoftwareBinding];
  "edit-config": [binding: SoftwareBinding];
  uninstall: [binding: SoftwareBinding];
  "open-panel": [binding: SoftwareBinding];
  "ai-analyze": [binding: SoftwareBinding];
}>();

const isInstalled = computed(
  () => props.binding.installStatus === "SUCCESS" || props.binding.installStatus === "INSTALLED",
);
const isRunning = computed(
  () => props.binding.runtimeStatus === "RUNNING",
);

const installMode = computed(() => {
  try {
    const remark = JSON.parse(props.binding.bindingRemark || "{}");
    return remark.installMode === "DOCKER" ? "DOCKER" : "SYSTEM";
  } catch {
    return "SYSTEM";
  }
});

const iconColor = computed(() => {
  if (isRunning.value) return "var(--el-color-success)";
  if (isInstalled.value) return "var(--el-color-warning)";
  return "var(--el-text-color-placeholder)";
});

const hasPanelLink = computed(() => {
  const code = props.binding.softwareCode?.toLowerCase() || "";
  return ["nginx", "redis", "mysql", "mongo", "zookeeper", "prometheus", "nacos"].some(
    (k) => code.includes(k),
  );
});

const handleMoreAction = (command: string, binding: SoftwareBinding) => {
  if (command === "uninstall") emit("uninstall", binding);
  if (command === "open-panel") emit("open-panel", binding);
};
</script>

<style scoped>
.software-card {
  position: relative;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

/* Gradient left border accent */
.software-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  border-radius: 12px 0 0 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.software-card.is-installed::before {
  opacity: 1;
  background: linear-gradient(180deg, var(--el-color-success), #36d399);
}
.software-card.is-running::before {
  opacity: 1;
  background: linear-gradient(180deg, var(--el-color-primary), #60a5fa);
}

.software-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-color: var(--el-border-color-darker);
  transform: translateY(-2px);
}

/* ── Header ── */

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  transition: all 0.2s;
}
.software-card:hover .card-icon {
  background: var(--el-fill-color);
}
.card-info {
  flex: 1;
  min-width: 0;
}
.card-name {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}
.card-version {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.card-status-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* ── Status tag with hover → 重装 ── */

.card-tag {
  cursor: pointer !important;
  transition: all 0.2s;
}
.card-tag--reinstall:hover {
  background: var(--el-color-danger) !important;
  border-color: var(--el-color-danger) !important;
}
.tag-text-hover {
  display: none;
}
.card-tag--reinstall:hover .tag-text-default {
  display: none;
}
.card-tag--reinstall:hover .tag-text-hover {
  display: inline;
}

/* ── Status dot indicator ── */

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.dot-running {
  background: var(--el-color-success);
  box-shadow: 0 0 6px var(--el-color-success);
}
.dot-stopped {
  background: var(--el-color-danger);
}

/* ── Meta info ── */

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.5;
}

/* ── Actions: hidden by default, slide up on hover ── */

.card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.software-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.action-group {
  display: flex;
  gap: 6px;
}

/* ── Error banner ── */

.card-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  padding: 8px 10px;
  border-radius: 6px;
}
.error-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
