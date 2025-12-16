<script setup>
import { ref, onMounted, watch } from "vue";
import { localStorageProxy } from "@repo/utils";

const STORAGE_KEY = "widget-quick-notes";

const noteContent = ref("");
const lastSaved = ref("");

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
  const now = new Date().toLocaleString();
  localStorageProxy().setItem(STORAGE_KEY, {
    content: val,
    time: now
  });
  lastSaved.value = now;
}, { debounce: 500 });

const clearNotes = () => {
  noteContent.value = "";
};
</script>

<template>
  <div class="quick-notes">
    <div class="notes-header">
      <span class="header-title">
        <el-icon class="mr-1"><component :is="'ri:sticky-note-line'" /></el-icon>
        快捷便签
      </span>
      <el-button type="danger" link size="small" @click="clearNotes" v-if="noteContent">
        清空
      </el-button>
    </div>
    <div class="notes-content">
      <el-input
        v-model="noteContent"
        type="textarea"
        placeholder="在这里记录你的想法..."
        :autosize="false"
        resize="none"
        class="notes-textarea"
      />
    </div>
    <div class="notes-footer" v-if="lastSaved">
      <span class="save-hint">自动保存于 {{ lastSaved }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-notes {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
  }
}

.notes-content {
  flex: 1;
  min-height: 0;
}

.notes-textarea {
  height: 100%;
  
  :deep(.el-textarea__inner) {
    height: 100% !important;
    background: var(--el-fill-color-lighter);
    border: none;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.6;
    
    &:focus {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
    }
  }
}

.notes-footer {
  margin-top: 8px;
  
  .save-hint {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
