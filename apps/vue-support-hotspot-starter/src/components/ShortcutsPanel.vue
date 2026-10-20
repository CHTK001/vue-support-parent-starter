<template>
  <Teleport to="body">
    <div v-if="visible" class="shortcuts-overlay" @click.self="close" @keydown.esc="close">
      <div class="shortcuts-panel" role="dialog" aria-modal="true" aria-label="键盘快捷键">
        <div class="shortcuts-head">
          <h2 class="shortcuts-title">键盘快捷键</h2>
          <button class="shortcuts-close" @click="close" aria-label="关闭">
            <el-icon :size="18"><Close /></el-icon>
          </button>
        </div>

        <div class="shortcuts-groups">
          <div v-for="group in shortcutGroups" :key="group.title" class="shortcut-group">
            <div class="group-title">{{ group.title }}</div>
            <div v-for="s in group.shortcuts" :key="s.keys.join('-')" class="shortcut-row">
              <div class="shortcut-keys">
                <kbd v-for="k in s.keys" :key="k" class="shortcut-kbd">{{ k }}</kbd>
              </div>
              <span class="shortcut-desc">{{ s.desc }}</span>
            </div>
          </div>
        </div>

        <div class="shortcuts-footer">
          按 <kbd class="shortcut-kbd">Esc</kbd> 或点击外部关闭
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Close } from "@element-plus/icons-vue";

const visible = ref(false);

const shortcutGroups = [
  {
    title: "导航",
    shortcuts: [
      { keys: ["←"], desc: "返回上一路由" },
      { keys: ["→"], desc: "进入已选菜单项" },
      { keys: ["↑", "↓"], desc: "在菜单中上下移动" },
    ],
  },
  {
    title: "搜索",
    shortcuts: [
      { keys: ["/"], desc: "聚焦全局搜索框" },
      { keys: ["Enter"], desc: "执行搜索（traceId → 链路，关键词 → 日志）" },
    ],
  },
  {
    title: "视图",
    shortcuts: [
      { keys: ["?"], desc: "打开本快捷键面板" },
      { keys: ["r"], desc: "刷新当前页面数据" },
      { keys: ["t"], desc: "切换侧栏折叠/展开" },
    ],
  },
  {
    title: "表格",
    shortcuts: [
      { keys: ["↑", "↓"], desc: "在表格行间移动" },
      { keys: ["Enter"], desc: "展开/收起当前行" },
      { keys: ["Esc"], desc: "取消当前操作" },
    ],
  },
];

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
}

function onKeyDown(e: KeyboardEvent) {
  // 全局劫持 "?" —— 必须在输入区外才能触发
  if (
    e.key === "?" &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !isInInput()
  ) {
    e.preventDefault();
    visible.value = !visible.value;
    return;
  }
  if (e.key === "Escape" && visible.value) {
    close();
  }
  // 全局 "r" 刷新（不在输入区）
  if (
    e.key === "r" &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !isInInput()
  ) {
    e.preventDefault();
    // 触发自定义事件让各视图处理
    window.dispatchEvent(new CustomEvent("apm:global-refresh"));
  }
}

function isInInput(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});

defineExpose({ open, close });
</script>

<style scoped>
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(7, 10, 18, 0.72);
  backdrop-filter: blur(4px);
  animation: overlay-in 140ms ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.shortcuts-panel {
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--apm-radius-xl);
  box-shadow: var(--apm-shadow-pop);
  animation: panel-in 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes panel-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.shortcuts-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--apm-space-5) var(--apm-space-6);
  border-bottom: 1px solid var(--apm-border-soft);
}

.shortcuts-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--apm-fg);
}

.shortcuts-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--apm-radius-md);
  background: transparent;
  color: var(--apm-muted);
  cursor: pointer;
  transition: background var(--apm-t-fast), color var(--apm-t-fast);
}

.shortcuts-close:hover {
  background: var(--apm-panel-active);
  color: var(--apm-fg);
}

.shortcuts-groups {
  padding: var(--apm-space-4) var(--apm-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-5);
}

.shortcut-group {
  display: flex;
  flex-direction: column;
  gap: var(--apm-space-2);
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--apm-muted);
  margin-bottom: 4px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: var(--apm-space-4);
  padding: 6px 0;
  border-bottom: 1px solid var(--apm-border-soft);
}

.shortcut-row:last-child {
  border-bottom: none;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
  min-width: 80px;
}

.shortcut-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--apm-border);
  border-radius: 6px;
  background: var(--apm-panel-raised);
  color: var(--apm-fg);
  font-family: var(--apm-font-mono);
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 0 var(--apm-border-soft);
}

.shortcut-desc {
  font-size: 13px;
  color: var(--apm-fg-regular);
}

.shortcuts-footer {
  padding: var(--apm-space-3) var(--apm-space-6);
  border-top: 1px solid var(--apm-border-soft);
  font-size: 12px;
  color: var(--apm-muted);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .shortcuts-overlay,
  .shortcuts-panel {
    animation: none;
  }
}
</style>
