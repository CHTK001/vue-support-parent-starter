<template>
  <div
    class="software-card"
    :class="{ 'is-installed': isInstalled, 'is-running': isRunning, 'is-clickable': hasPanelLink }"
    @click="handleClick"
    @contextmenu.prevent="showContextMenu"
  >
    <!-- Hover delete button -->
    <ElButton
      v-if="isInstalled"
      size="small"
      circle
      type="danger"
      class="card-delete-btn"
      @click.stop="handleUninstall"
    >
      <IconifyIconOffline icon="ep:delete" />
    </ElButton>

    <div class="card-header">
      <div class="card-icon">
        <SoftwareIcon
          :icon="displayIcon"
          :style="iconStyle"
          fallback="ep:monitor"
        />
      </div>
      <div class="card-info">
        <div class="card-name">{{ binding.softwareName || '未知软件' }}</div>
        <div class="card-version">
          v{{ binding.softwareVersion || '-' }}
          <ElTag size="small" type="warning" style="margin-left:4px">Docker</ElTag>
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

    <div class="card-row">
      <div class="card-meta">
        <span class="meta-item">
          <IconifyIconOffline icon="ep:ship" />
          {{ binding.serviceName || '-' }}
        </span>
        <span v-if="binding.exposePorts" class="meta-item">
          <IconifyIconOffline icon="ep:connection" />
          {{ binding.exposePorts }}
        </span>
      </div>

      <div class="card-actions">
        <template v-if="!isInstalled">
          <ElTooltip content="安装" placement="top">
            <ElButton size="small" type="primary" circle @click.stop="emit('install', binding)">
              <IconifyIconOffline icon="ep:download" />
            </ElButton>
          </ElTooltip>
          <ElTooltip content="移除记录" placement="top">
            <ElButton size="small" type="danger" circle plain @click.stop="emit('delete', binding)">
              <IconifyIconOffline icon="ep:delete" />
            </ElButton>
          </ElTooltip>
        </template>
        <template v-else>
          <div class="action-group">
            <template v-if="isRunning">
              <ElTooltip content="停止" placement="top">
                <ElButton size="small" type="warning" circle @click.stop="emit('stop', binding)">
                  <IconifyIconOffline icon="ep:video-pause" />
                </ElButton>
              </ElTooltip>
              <ElTooltip content="重启" placement="top">
                <ElButton size="small" circle @click.stop="emit('restart', binding)">
                  <IconifyIconOffline icon="ep:refresh" />
                </ElButton>
              </ElTooltip>
            </template>
            <template v-else>
              <ElTooltip content="启动" placement="top">
                <ElButton size="small" type="success" circle @click.stop="emit('start', binding)">
                  <IconifyIconOffline icon="ep:video-play" />
                </ElButton>
              </ElTooltip>
            </template>
          </div>

          <ElTooltip content="诊断" placement="top">
            <ElButton size="small" circle plain @click.stop="emit('diagnose', binding)">
              <IconifyIconOffline icon="ep:tools" />
            </ElButton>
          </ElTooltip>

          <ElTooltip content="编辑配置" placement="top">
            <ElButton size="small" circle plain @click.stop="emit('edit-config', binding)">
              <IconifyIconOffline icon="ep:setting" />
            </ElButton>
          </ElTooltip>

          <ElDropdown trigger="click" @command="(cmd: string) => handleMoreAction(cmd, binding)">
            <ElButton size="small" circle plain @click.stop>
              <IconifyIconOffline icon="ep:more-filled" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="uninstall">
                  <IconifyIconOffline icon="ep:delete" style="margin-right: 6px" />
                  卸载
                </ElDropdownItem>
                <ElDropdownItem v-if="hasPanelLink" command="open-panel">
                  <IconifyIconOffline icon="ep:monitor" style="margin-right: 6px" />
                  管理面板
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </template>
      </div>
    </div>

    <div v-if="lastError" class="card-error" @click.stop>
      <IconifyIconOffline icon="ep:warning-filled" style="color: var(--el-color-danger); flex-shrink: 0" />
      <span class="error-text">{{ lastError }}</span>
      <ElButton size="small" text type="primary" @click.stop="emit('ai-analyze', binding)">
        AI 分析
      </ElButton>
    </div>

    <!-- Right-click context menu -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      >
        <div class="context-menu-item" @click="contextMenuAction('info')">
          <IconifyIconOffline icon="ep:info-filled" />
          查看信息
        </div>
        <div class="context-menu-item" @click="contextMenuAction('open-panel')" v-if="hasPanelLink">
          <IconifyIconOffline icon="ep:monitor" />
          管理面板
        </div>
        <div class="context-menu-divider" />
        <div class="context-menu-item" @click="contextMenuAction('uninstall')">
          <IconifyIconOffline icon="ep:delete" style="color: var(--el-color-danger)" />
          <span style="color: var(--el-color-danger)">卸载</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage, ElMessageBox, ElTag, ElTooltip } from "element-plus";
import { IconifyIconOffline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import { getSoftwareLogoUrl } from "../../api/software";
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
  delete: [binding: SoftwareBinding];
  "open-panel": [binding: SoftwareBinding];
  "ai-analyze": [binding: SoftwareBinding];
}>();

const isInstalled = computed(
  () => props.binding.installStatus === "SUCCESS" || props.binding.installStatus === "INSTALLED",
);
const isRunning = computed(
  () => props.binding.runtimeStatus === "RUNNING",
);

const displayIcon = computed(() => {
  const icon = props.binding.softwareIcon;
  if (icon && !/^(https?:)?\/\//.test(icon)) return icon;
  return getSoftwareLogoUrl(props.binding.softwareCode) || undefined;
});

const iconStyle = computed(() => {
  if (!isInstalled.value) return { filter: "grayscale(1)", opacity: "0.5", fontSize: "32px" };
  return { fontSize: "32px" };
});

const hasPanelLink = computed(() => {
  const code = props.binding.softwareCode?.toLowerCase() || "";
  return ["nginx", "redis", "mysql", "mongo", "zookeeper", "prometheus", "nacos"].some(
    (k) => code.includes(k),
  );
});

// ─── Click → open panel if available ─────────────────────

const handleClick = () => {
  if (hasPanelLink.value) {
    emit("open-panel", props.binding);
  }
};

// ─── Hover delete ─────────────────────────────────────────

const handleUninstall = () => {
  emit("uninstall", props.binding);
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定移除 "${props.binding.softwareName || '未知软件'}" 的记录？此操作不可撤销。`,
      "确认移除",
      { confirmButtonText: "移除", cancelButtonText: "取消", type: "warning" },
    );
    emit("delete", props.binding);
  } catch { /* cancelled */ }
};

// ─── Right-click context menu ─────────────────────────────

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

const showContextMenu = (event: MouseEvent) => {
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const hideContextMenu = () => {
  contextMenuVisible.value = false;
};

const contextMenuAction = (action: string) => {
  contextMenuVisible.value = false;
  if (action === "info") {
    ElMessage.info(`${props.binding.softwareName} v${props.binding.softwareVersion}\n服务名: ${props.binding.serviceName}\n状态: ${isRunning.value ? '运行中' : '已停止'}`);
  } else if (action === "open-panel" && hasPanelLink.value) {
    emit("open-panel", props.binding);
  } else if (action === "uninstall") {
    emit("uninstall", props.binding);
  }
};

onMounted(() => {
  document.addEventListener("click", hideContextMenu);
});
onUnmounted(() => {
  document.removeEventListener("click", hideContextMenu);
});

const handleMoreAction = (command: string, binding: SoftwareBinding) => {
  if (command === "uninstall") emit("uninstall", binding);
  if (command === "open-panel") emit("open-panel", binding);
};
</script>

<style scoped>
.software-card {
  position: relative;
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  -webkit-backdrop-filter: var(--dt-glass-blur-light);
  border: 1px solid var(--dt-glass-border-light);
  border-radius: var(--dt-radius-lg);
  padding: var(--dt-space-3) var(--dt-space-4);
  transition: all var(--dt-transition-spring);
  display: flex;
  flex-direction: column;
  gap: var(--dt-space-2);
  overflow: visible;
  box-shadow: var(--dt-shadow-xs);
  cursor: default;
}

.software-card.is-clickable {
  cursor: pointer;
}

/* Gradient left border accent */
.software-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  transition: all var(--dt-duration-slow) var(--dt-ease-out);
}
.software-card.is-installed::before {
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, var(--el-color-success), #36d399);
}
.software-card.is-running::before {
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, var(--el-color-primary), #60a5fa);
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.3);
}

.software-card:hover {
  box-shadow: var(--dt-shadow-lg), 0 8px 32px rgba(0, 0, 0, 0.08);
  border-color: var(--dt-border-color-strong);
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.92);
}

html.dark .software-card {
  background: var(--dt-glass-bg-dark);
}
html.dark .software-card:hover {
  background: rgba(25, 25, 35, 0.88);
}

/* ─── Hover delete button (top-right) ──────────────────── */

.card-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.software-card:hover .card-delete-btn {
  opacity: 1;
  transform: scale(1);
}

/* ─── Header ── */

.card-header {
  display: flex;
  align-items: center;
  gap: var(--dt-space-2);
}
.card-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: var(--dt-radius-md);
  transition: all var(--dt-transition-normal);
}
.software-card:hover .card-icon {
  background: var(--el-color-primary-light-9);
  transform: scale(1.05);
}
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--dt-space-2);
}
.card-name {
  font-weight: var(--dt-font-weight-semibold);
  font-size: var(--dt-font-size-base);
  line-height: var(--dt-line-height-tight);
  color: var(--el-text-color-primary);
}
.card-version {
  font-size: var(--dt-font-size-xs);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.card-status-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

/* ─── Status tag with hover → 重装 ── */

.card-tag {
  cursor: pointer !important;
  transition: all var(--dt-transition-fast) !important;
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

/* ─── Status dot ── */

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
  animation: pulse-dot 2s ease-in-out infinite;
}
.dot-stopped {
  background: var(--el-color-danger);
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 4px var(--el-color-success); }
  50% { box-shadow: 0 0 10px var(--el-color-success); }
}

/* ─── Meta info ── */

.card-row {
  display: flex;
  align-items: center;
  gap: var(--dt-space-2);
  min-height: 0;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: var(--dt-space-2);
  font-size: var(--dt-font-size-xs);
  color: var(--el-text-color-secondary);
  flex: 1;
  min-width: 0;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  line-height: 1.4;
}

/* ─── Actions (hover reveal) ── */

.card-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  opacity: 0;
  transform: translateY(6px) scale(0.97);
  transition: all var(--dt-duration-slow) var(--dt-ease-spring);
  pointer-events: none;
  margin-left: auto;
}
.software-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.action-group {
  display: flex;
  gap: 4px;
}

/* ─── Entrance animation ── */

.software-card {
  animation: cardSlideIn 0.4s var(--dt-ease-out) both;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Error banner ── */

.card-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--dt-font-size-sm);
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  padding: 8px 10px;
  border-radius: var(--dt-radius-md);
  border: 1px solid rgba(245, 108, 108, 0.15);
}
.error-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Context Menu ── */

.context-menu {
  position: fixed;
  z-index: 99999;
  min-width: 150px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.context-menu-item:hover {
  background: var(--el-fill-color-light);
}
.context-menu-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: 4px 0;
}
</style>
