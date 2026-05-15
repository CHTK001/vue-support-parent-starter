<template>
  <div class="installed-software">
    <div class="installed-toolbar">
      <ElInput
        v-model="searchQuery"
        placeholder="搜索已安装软件..."
        clearable
        style="width: 220px"
      />
      <ElSelect v-model="statusFilter" placeholder="全部状态" clearable style="width: 130px">
        <ElOption label="运行中" value="running" />
        <ElOption label="已停止" value="stopped" />
        <ElOption label="未安装" value="uninstalled" />
      </ElSelect>
      <span class="installed-count">共 {{ filteredBindings.length }} 个</span>
      <ElButton :loading="loading" circle @click="$emit('refresh')">
        <IconifyIconOffline icon="ep:refresh" />
      </ElButton>
    </div>

    <div v-if="loading && bindings.length === 0" class="installed-loading">
      <ElSkeleton :rows="3" animated />
    </div>

    <div v-else-if="filteredBindings.length === 0" class="installed-empty">
      <ElEmpty :description="bindings.length === 0 ? '暂无已安装软件' : '没有匹配的软件，试试其他搜索条件'">
        <ElButton v-if="bindings.length === 0" type="primary" @click="$emit('install', undefined)">
          安装第一个软件
        </ElButton>
      </ElEmpty>
    </div>

    <!-- Icon grid (like software market) -->
    <div v-else class="installed-grid">
      <div
        v-for="b in filteredBindings"
        :key="b.sysProjectContainerSoftwareBindingId"
        class="installed-cell"
        :style="{ '--i': filteredBindings.indexOf(b) }"
        @click="handleCellClick(b)"
        @contextmenu.prevent="handleContextMenu($event, b)"
      >
        <ElTooltip
          :content="cellTooltip(b)"
          placement="top"
          :hide-after="0"
          :show-after="400"
        >
          <div class="installed-cell-content">
            <div class="installed-cell-delete" @click.stop="handleCellDelete(b)" title="删除">
              <IconifyIconOffline icon="ep:close" />
            </div>
            <div
              class="installed-cell-icon"
              :class="{
                'is-installed': b.installStatus === 'SUCCESS' || b.installStatus === 'INSTALLED',
                'is-failed': b.installStatus === 'FAILED',
                'is-running': b.runtimeStatus === 'RUNNING',
              }"
            >
              <SoftwareIcon
                :icon="cellIcon(b)"
                class="installed-cell-svg"
                fallback="ep:monitor"
              />
            </div>
            <span class="installed-cell-label">{{ b.softwareName || '未知' }}</span>
            <span class="installed-cell-version">v{{ b.softwareVersion || '-' }}</span>
          </div>
        </ElTooltip>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="ctx.visible"
        class="installed-ctxmenu"
        :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }"
        @mouseleave="ctxSubmenu = ''"
      >
        <div v-if="ctx.binding" class="ctxmenu-header">
          {{ ctx.binding.softwareName }}
          <ElTag size="small" :type="isCtxRunning ? 'success' : 'info'" style="margin-left: 6px">
            {{ isCtxRunning ? '运行中' : '已停止' }}
          </ElTag>
        </div>
        <div class="ctxmenu-divider" />
        <template v-if="ctx.binding">
          <!-- Not installed: install actions -->
          <template v-if="!isCtxInstalled">
            <div class="ctxmenu-item" @click="ctxEmit('install')">
              <IconifyIconOffline icon="ep:download" /> 安装
            </div>
            <div class="ctxmenu-item" @click="ctxEmit('quick-install')">
              <IconifyIconOffline icon="ep:lightning" /> 快速安装
            </div>
          </template>
          <!-- Installed: full management menu -->
          <template v-else>
            <div class="ctxmenu-section-label">管理</div>
            <div v-if="isCtxRunning" class="ctxmenu-item" @click="ctxEmit('stop')">
              <IconifyIconOffline icon="ep:video-pause" /> 停止
            </div>
            <div v-else class="ctxmenu-item" @click="ctxEmit('start')">
              <IconifyIconOffline icon="ep:video-play" /> 启动
            </div>
            <div v-if="isCtxRunning" class="ctxmenu-item" @click="ctxEmit('restart')">
              <IconifyIconOffline icon="ep:refresh" /> 重启
            </div>
            <div class="ctxmenu-item" @click="ctxEmit('reinstall')">
              <IconifyIconOffline icon="ep:download" /> 重装
            </div>
            <div class="ctxmenu-item" @click="ctxEmit('edit-config')">
              <IconifyIconOffline icon="ep:setting" /> 编辑配置
            </div>

            <!-- Auto-start: only for systemd-managed SYSTEM mode software -->
            <template v-if="supportsAutoStart">
              <div class="ctxmenu-divider" />
              <div class="ctxmenu-section-label">自启动</div>
              <div class="ctxmenu-item" @click="ctxEmit('enable-autostart')">
                <IconifyIconOffline icon="ep:circle-check" /> 开启自启动
              </div>
              <div class="ctxmenu-item" @click="ctxEmit('disable-autostart')">
                <IconifyIconOffline icon="ep:remove" /> 关闭自启动
              </div>
            </template>

            <div class="ctxmenu-divider" />
            <div class="ctxmenu-section-label">诊断</div>
            <div class="ctxmenu-item" @click="ctxEmit('diagnose')">
              <IconifyIconOffline icon="ep:tools" /> 诊断
            </div>
            <div class="ctxmenu-item" @click="ctxEmit('install-log')">
              <IconifyIconOffline icon="ep:document" /> 查看安装日志
            </div>

            <div class="ctxmenu-divider" />
            <div class="ctxmenu-section-label">监控</div>
            <div class="ctxmenu-item" @click="ctxEmit('performance')">
              <IconifyIconOffline icon="ep:trend-chart" /> 性能图表
            </div>

            <!-- Docker submenu -->
            <div
              class="ctxmenu-item ctxmenu-has-submenu"
              @mouseenter="ctxSubmenu = 'docker'"
              @mouseleave="ctxSubmenu = ''"
            >
              <span class="ctxmenu-item-label">
                <IconifyIconOffline icon="ep:container" /> Docker
              </span>
              <IconifyIconOffline icon="ep:arrow-right" class="ctxmenu-sub-arrow" />
              <div v-if="ctxSubmenu === 'docker'" class="ctxmenu-submenu">
                <div class="ctxmenu-item" @click="ctxEmit('docker-exec')">
                  <IconifyIconOffline icon="ep:terminal" /> 进入容器
                </div>
                <div class="ctxmenu-item" @click="ctxEmit('runtime-logs')">
                  <IconifyIconOffline icon="ep:chat-line-square" /> 运行时日志
                </div>
                <div class="ctxmenu-item" @click="ctxEmit('container-info')">
                  <IconifyIconOffline icon="ep:info-filled" /> 容器信息
                </div>
              </div>
            </div>

            <div class="ctxmenu-divider" />
            <div class="ctxmenu-section-label">操作</div>
            <div class="ctxmenu-item" @click="ctxEmit('open-panel')">
              <IconifyIconOffline icon="ep:monitor" /> 工作台
            </div>

            <div class="ctxmenu-divider" />
            <div class="ctxmenu-item ctxmenu-item--danger" @click="ctxEmit('uninstall')">
              <IconifyIconOffline icon="ep:delete" /> 卸载
            </div>
          </template>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { ElButton, ElEmpty, ElInput, ElOption, ElSelect, ElSkeleton, ElTag, ElTooltip } from "element-plus";
import { IconifyIconOffline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import { getSoftwareLogoUrl } from "../../api/software";
import type { SoftwareBinding } from "../../api/software";

const props = defineProps<{
  bindings: SoftwareBinding[];
  loading: boolean;
  actionLoading: number | null;
  bindingErrors: Record<number, string>;
  statsByBinding?: Record<number, {
    cpuPercent?: number;
    memoryUsage?: number;
    memoryLimit?: number;
  }>;
}>();

const emit = defineEmits<{
  install: [binding?: SoftwareBinding];
  "quick-install": [binding: SoftwareBinding];
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
  "uninstall-then-delete": [binding: SoftwareBinding];
  "install-log": [binding: SoftwareBinding];
  performance: [binding: SoftwareBinding];
  "docker-exec": [binding: SoftwareBinding];
  "runtime-logs": [binding: SoftwareBinding];
  "container-info": [binding: SoftwareBinding];
  "enable-autostart": [binding: SoftwareBinding];
  "disable-autostart": [binding: SoftwareBinding];
  refresh: [];
}>();

const searchQuery = ref("");
const statusFilter = ref("");

const filteredBindings = computed(() => {
  let list = props.bindings;

  // 默认过滤掉未安装的记录（除非用户选择了"未安装"过滤条件）
  if (!statusFilter.value) {
    list = list.filter((b) => b.installStatus === 'SUCCESS' || b.installStatus === 'INSTALLED' || b.installStatus === 'FAILED');
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (b) =>
        b.softwareName?.toLowerCase().includes(q) ||
        b.softwareCode?.toLowerCase().includes(q),
    );
  }
  if (statusFilter.value === "running") {
    list = list.filter((b) => b.runtimeStatus === "RUNNING");
  } else if (statusFilter.value === "stopped") {
    list = list.filter((b) => b.runtimeStatus === "STOPPED" && b.installStatus === "SUCCESS");
  } else if (statusFilter.value === "uninstalled") {
    list = list.filter((b) => b.installStatus !== "SUCCESS");
  }
  return list;
});

/** Resolve icon: skip CDN URLs, prefer Iconify names */
const cellIcon = (b: SoftwareBinding): string | undefined => {
  const icon = b.softwareIcon;
  if (icon && !/^(https?:)?\/\//.test(icon)) return icon;
  return getSoftwareLogoUrl(b.softwareCode) || undefined;
};

/** Tooltip text for installed-cell hover */
const cellTooltip = (b: SoftwareBinding): string => {
  const id = b.sysProjectContainerSoftwareBindingId;
  const parts: string[] = [];
  const installed = b.installStatus === "SUCCESS" || b.installStatus === "INSTALLED";
  if (installed) {
    parts.push(`状态: ${b.runtimeStatus === "RUNNING" ? "运行中" : "已停止"}`);
    parts.push(`版本: v${b.softwareVersion || "-"}`);
    if (b.createTime) parts.push(`安装时间: ${b.createTime}`);
    // Show stats if available
    if (id && props.statsByBinding?.[id]) {
      const s = props.statsByBinding[id];
      if (s.cpuPercent !== undefined) parts.push(`CPU: ${s.cpuPercent.toFixed(1)}%`);
      if (s.memoryUsage !== undefined && s.memoryLimit !== undefined) {
        const usedMB = (s.memoryUsage / 1024 / 1024).toFixed(1);
        const limitMB = (s.memoryLimit / 1024 / 1024).toFixed(0);
        parts.push(`内存: ${usedMB}MB / ${limitMB}MB`);
      } else if (s.memoryUsage !== undefined) {
        parts.push(`内存: ${(s.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      }
    }
  } else if (b.installStatus === "FAILED") {
    parts.push("状态: 安装失败");
  } else {
    parts.push("状态: 未安装");
  }
  return parts.join("\n");
};

// ─── Context menu state ────────────────────────────

const ctx = reactive<{ visible: boolean; x: number; y: number; binding: SoftwareBinding | null }>({
  visible: false, x: 0, y: 0, binding: null,
});
const ctxSubmenu = ref("");

const isCtxInstalled = computed(
  () => ctx.binding && (ctx.binding.installStatus === "SUCCESS" || ctx.binding.installStatus === "INSTALLED"),
);
const isCtxRunning = computed(
  () => ctx.binding?.runtimeStatus === "RUNNING",
);
/** 判断软件是否支持 systemd 开机自启动（仅 SYSTEM 模式且含 systemctl 脚本的软件） */
const supportsAutoStart = computed(() => {
  const b = ctx.binding;
  if (!b) return false;
  if (!b.serviceName) return false;
  const scripts = [b.startScript, b.stopScript, b.restartScript, b.statusScript].filter(Boolean).join(" ");
  return scripts.includes("systemctl") || scripts.includes("service ");
});

const handleContextMenu = (e: MouseEvent, b: SoftwareBinding) => {
  ctx.visible = true;
  ctx.x = e.clientX;
  ctx.y = e.clientY;
  ctx.binding = b;
};

const hideContextMenu = () => {
  ctx.visible = false;
  ctx.binding = null;
};

const ctxEmit = (action: string) => {
  if (!ctx.binding) return;
  const b = ctx.binding;
  hideContextMenu();
  emit(action as any, b);
};

// ─── Cell click ────────────────────────────────────

const handleCellClick = (b: SoftwareBinding) => {
  const installed = b.installStatus === "SUCCESS" || b.installStatus === "INSTALLED";
  if (!installed) {
    emit("install", b);
  } else if (b.runtimeStatus === "RUNNING") {
    emit("stop", b);
  } else {
    emit("start", b);
  }
};

// ─── Global click to dismiss context menu ──────────

import { onMounted, onUnmounted } from "vue";
onMounted(() => document.addEventListener("click", hideContextMenu));
onUnmounted(() => document.removeEventListener("click", hideContextMenu));

const handleCellDelete = (b: SoftwareBinding) => {
  const installed = b.installStatus === "SUCCESS" || b.installStatus === "INSTALLED";
  if (installed) {
    emit("uninstall-then-delete", b);
  } else {
    emit("delete", b);
  }
};
</script>

<style scoped>
.installed-software {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Toolbar ─── */

.installed-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: var(--dt-space-3) var(--dt-space-4);
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  border: 1px solid var(--dt-glass-border-light);
  border-radius: var(--dt-radius-xl);
  transition: all var(--dt-transition-normal);
}
html.dark .installed-toolbar {
  background: var(--dt-glass-bg-dark);
}
.installed-toolbar:hover {
  border-color: var(--dt-border-color-strong);
  box-shadow: var(--dt-shadow-xs);
}
.installed-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

/* ─── States ─── */

.installed-loading {
  padding: var(--dt-space-8);
  background: var(--dt-glass-bg-light);
  border-radius: var(--dt-radius-xl);
  border: 1px solid var(--dt-glass-border-light);
}
.installed-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: var(--dt-glass-bg-light);
  border-radius: var(--dt-radius-xl);
  border: 1px solid var(--dt-glass-border-light);
  padding: var(--dt-space-10);
}

/* ─── Icon Grid (like software market) ─── */

.installed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  padding: 4px;
}

.installed-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px 8px;
  border-radius: var(--dt-radius-lg);
  cursor: pointer;
  transition: all var(--dt-transition-spring);
  animation: cellIn 0.35s var(--dt-ease-out) both;
  animation-delay: calc(var(--i, 0) * 0.03s);
  user-select: none;
  position: relative;
  background: var(--dt-glass-bg-light);
  border: 1px solid var(--dt-glass-border-light);
}
html.dark .installed-cell {
  background: var(--dt-glass-bg-dark);
}
.installed-cell:hover {
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  transform: translateY(-3px);
  border-color: var(--dt-border-color-strong);
  box-shadow: var(--dt-shadow-sm);
}
html.dark .installed-cell:hover {
  background: var(--dt-glass-bg-dark);
}
.installed-cell:active {
  transform: translateY(-1px) scale(0.96);
}

/* ─── Hover delete button ── */

.installed-cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}
.installed-cell-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
}
.installed-cell:hover .installed-cell-delete {
  opacity: 1;
  transform: scale(1);
}
.installed-cell-delete:hover {
  transform: scale(1.18);
}

.installed-cell-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--dt-radius-lg);
  background: var(--dt-hover-bg);
  font-size: 28px;
  transition: all var(--dt-transition-normal);
  position: relative;
  overflow: hidden;
}
.installed-cell:hover .installed-cell-icon {
  background: var(--el-color-primary-light-9);
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

/* Not installed: gray (applied to icon child for reliable rendering) */
.installed-cell-icon:not(.is-installed) .installed-cell-svg {
  filter: grayscale(1);
  opacity: 0.5;
}

/* Installed (running): green glow */
.installed-cell-icon.is-running {
  box-shadow: 0 0 0 2px var(--el-color-success);
}

/* Failed: red glow */
.installed-cell-icon.is-failed {
  box-shadow: 0 0 0 2px var(--el-color-danger);
}

/* Unknown/uninstalled: gray border */
.installed-cell-icon:not(.is-running):not(.is-failed).is-installed {
  box-shadow: 0 0 0 2px var(--el-color-info);
}

.installed-cell-svg {
  transition: transform var(--dt-transition-normal);
}
.installed-cell:hover .installed-cell-svg {
  transform: scale(1.12);
}

.installed-cell-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
  line-height: 1.3;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.installed-cell-version {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@keyframes cellIn {
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ─── Context Menu ─── */

.installed-ctxmenu {
  position: fixed;
  z-index: 99999;
  min-width: 160px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.ctxmenu-header {
  display: flex;
  align-items: center;
  padding: 6px 10px 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ctxmenu-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: 4px 0;
}
.ctxmenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.ctxmenu-item:hover {
  background: var(--el-fill-color-light);
}
.ctxmenu-item--danger {
  color: var(--el-color-danger);
}
.ctxmenu-item--danger:hover {
  background: var(--el-color-danger-light-9);
}

/* ─── Section labels ───────────────────────── */

.ctxmenu-section-label {
  padding: 2px 12px 1px;
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ─── Submenu ──────────────────────────────── */

.ctxmenu-has-submenu {
  position: relative;
}
.ctxmenu-item-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ctxmenu-sub-arrow {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}
.ctxmenu-submenu {
  position: absolute;
  left: 100%;
  top: -4px;
  min-width: 150px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100000;
}
</style>
