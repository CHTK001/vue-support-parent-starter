<script setup>
import { ref, onMounted, watch } from "vue";
import { localStorageProxy, message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const STORAGE_KEY = "widget-quick-notes";

const noteContent = ref("");
const lastSaved = ref("");
const isSaving = ref(false);

// 加载保存的内容
onMounted(() => {
  const saved = localStorageProxy().getItem(STORAGE_KEY);
  if (saved) {
    noteContent.value = saved.content || "";
    lastSaved.value = saved.time || "";
  }
});

// 自动保存
watch(noteContent, (val) => {
  isSaving.value = true;
  const now = new Date().toLocaleString();
  localStorageProxy().setItem(STORAGE_KEY, {
    content: val,
    time: now
  });
  lastSaved.value = now;
  setTimeout(() => {
    isSaving.value = false;
  }, 1000);
}, { debounce: 1000 });

const clearNotes = () => {
  noteContent.value = "";
  message("便签已清空", { type: "success" });
};
</script>

<template>
  <div class="quick-notes-card">
    <div class="card-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:sticky-note-line" class="header-icon" />
        <span class="title">快捷便签</span>
      </div>
      <div class="header-right">
        <span v-if="isSaving" class="status-text saving">保存中...</span>
        <span v-else-if="lastSaved" class="status-text saved">已保存</span>
        <el-tooltip content="清空便签" placement="top">
          <div class="action-btn delete" @click="clearNotes">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </div>
        </el-tooltip>
      </div>
    </div>
    
    <div class="card-content">
      <textarea
        v-model="noteContent"
        class="custom-textarea"
        placeholder="在此输入内容..."
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-notes-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .header-icon {
      font-size: 18px;
      color: var(--el-color-warning);
    }
    
    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .status-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      
      &.saving {
        color: var(--el-color-primary);
      }
    }
    
    .action-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      color: var(--el-text-color-secondary);
      transition: all 0.2s;
      
      &:hover {
        background: var(--el-fill-color);
        
        &.delete {
          color: var(--el-color-danger);
          background: var(--el-color-danger-light-9);
        }
      }
    }
  }
}

.card-content {
  flex: 1;
  position: relative;
  background-color: var(--el-bg-color);
  
  /* Lined paper effect */
  background-image: linear-gradient(var(--el-border-color-lighter) 1px, transparent 1px);
  background-size: 100% 32px;
  background-position: 0 8px; /* Offset to align with text */
  
  .custom-textarea {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    padding: 8px 16px;
    font-size: 14px;
    line-height: 32px; /* Match background size */
    color: var(--el-text-color-regular);
    font-family: inherit;
    
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}
</style>
