<template>
  <div class="container-action-toolbar system-container modern-bg">
    <div class="toolbar-left">
      <ScButton type="primary" @click="handleCreate">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        创建容器
      </ScButton>
      <ScButton @click="handleRefresh">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </ScButton>
      <ScButton @click="handleAutoRefresh">
        <IconifyIconOnline
          :icon="autoRefresh ? 'ri:pause-line' : 'ri:play-line'"
          class="mr-1"
        />
        {{ autoRefresh ? "暂停自动刷新" : "自动刷新" }}
      </ScButton>
    </div>

    <div class="toolbar-right">
      <ScButton @click="handleExport">
        <IconifyIconOnline icon="ri:download-line" class="mr-1" />
        导出数据
      </ScButton>
      <ScDropdown @command="handleCommand">
        <ScButton>
          更多操作
          <IconifyIconOnline icon="ri:arrow-down-s-line" class="ml-1" />
        </ScButton>
        <template #dropdown>
          <ScDropdownMenu>
            <ScDropdownItem command="batchStart">
              <IconifyIconOnline icon="ri:play-line" class="mr-2" />
              批量启动
            </ScDropdownItem>
            <ScDropdownItem command="batchStop">
              <IconifyIconOnline icon="ri:stop-line" class="mr-2" />
              批量停止
            </ScDropdownItem>
            <ScDropdownItem command="batchRestart">
              <IconifyIconOnline icon="ri:restart-line" class="mr-2" />
              批量重启
            </ScDropdownItem>
            <ScDropdownItem command="batchRemove" divided>
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-2" />
              批量删除
            </ScDropdownItem>
          </ScDropdownMenu>
        </template>
      </ScDropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Emits {
  (e: "create"): void;
  (e: "refresh"): void;
  (e: "auto-refresh", enabled: boolean): void;
  (e: "export"): void;
  (e: "batch-operation", command: string): void;
}

const emit = defineEmits<Emits>();

const autoRefresh = ref(false);

// 创建容器
const handleCreate = () => {
  emit("create");
};

// 刷新
const handleRefresh = () => {
  emit("refresh");
};

// 自动刷新
const handleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  emit("auto-refresh", autoRefresh.value);
};

// 导出数据
const handleExport = () => {
  emit("export");
};

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  emit("batch-operation", command);
};
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.container-action-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .container-action-toolbar {
    flex-direction: column;
    gap: 16px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
