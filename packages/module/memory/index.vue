<script setup>
/**
 * 便签/备忘录部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted, ref, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message, dateFormat } from "@repo/utils";
import ScDialog from "@repo/components/ScDialog/src/index.vue";

const STORAGE_KEY = "sc_module_memory_notes";

const noteColors = [
  { name: "黄色", value: "#fff9c4" },
  { name: "绿色", value: "#c8e6c9" },
  { name: "蓝色", value: "#bbdefb" },
  { name: "粉色", value: "#f8bbd9" },
  { name: "紫色", value: "#e1bee7" },
  { name: "橙色", value: "#ffe0b2" },
];

const dialogVisible = ref(false);
const editingId = ref(null);

const env = reactive({
  notes: [],
  currentNote: {
    id: null,
    title: "",
    content: "",
    color: noteColors[0].value,
  },
});

const loadNotes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      env.notes = JSON.parse(stored);
    }
  } catch (error) {
    console.error("加载便签失败:", error);
  }
};

const saveNotes = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(env.notes));
};

const openEditor = (note = null) => {
  if (note) {
    env.currentNote = { ...note };
    editingId.value = note.id;
  } else {
    env.currentNote = {
      id: Date.now(),
      title: "",
      content: "",
      color: noteColors[0].value,
      updatedAt: new Date().toISOString(),
    };
    editingId.value = null;
  }
  dialogVisible.value = true;
};

const saveNote = () => {
  if (!env.currentNote.title.trim() && !env.currentNote.content.trim()) {
    message("内容不能为空", { type: "warning" });
    return;
  }
  
  env.currentNote.updatedAt = new Date().toISOString();
  
  if (editingId.value) {
    const index = env.notes.findIndex(n => n.id === editingId.value);
    if (index !== -1) {
      env.notes[index] = { ...env.currentNote };
    }
  } else {
    env.notes.unshift({ ...env.currentNote });
  }
  
  saveNotes();
  dialogVisible.value = false;
  message("保存成功", { type: "success" });
};

const deleteNote = (id) => {
  env.notes = env.notes.filter(n => n.id !== id);
  saveNotes();
  message("已删除", { type: "success" });
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  return dateFormat(new Date(isoString), "MM-dd HH:mm");
};

onMounted(() => {
  loadNotes();
});
</script>

<template>
  <div class="memory-board">
    <div class="board-header">
      <span class="title">我的便签</span>
      <el-button circle size="small" type="primary" @click="openEditor()">
        <el-icon><component :is="useRenderIcon('ep:plus')" /></el-icon>
      </el-button>
    </div>
    
    <div class="notes-container">
      <el-empty v-if="env.notes.length === 0" description="暂无便签" :image-size="60" />
      <div v-else class="notes-grid">
        <div
          v-for="note in env.notes"
          :key="note.id"
          class="note-item"
          :style="{ backgroundColor: note.color }"
          @click="openEditor(note)"
        >
          <div class="note-title" v-if="note.title">{{ note.title }}</div>
          <div class="note-content">{{ note.content }}</div>
          <div class="note-footer">
            <span class="time">{{ formatDate(note.updatedAt) }}</span>
            <div class="delete-btn" @click.stop="deleteNote(note.id)">
              <IconifyIconOnline icon="ep:close" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <sc-dialog v-model="dialogVisible" :title="editingId ? '编辑便签' : '新建便签'" width="400px" append-to-body>
      <div class="editor-container" :style="{ backgroundColor: env.currentNote.color }">
        <input
          v-model="env.currentNote.title"
          class="editor-title"
          placeholder="标题 (可选)"
        />
        <textarea
          v-model="env.currentNote.content"
          class="editor-content"
          placeholder="便签内容..."
        ></textarea>
        <div class="color-picker">
          <div
            v-for="color in noteColors"
            :key="color.value"
            class="color-dot"
            :style="{ backgroundColor: color.value }"
            :class="{ active: env.currentNote.color === color.value }"
            @click="env.currentNote.color = color.value"
          ></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.memory-board {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  
  .title {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.notes-container {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-lighter);
    border-radius: 3px;
  }
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.note-item {
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    
    .delete-btn {
      opacity: 1;
    }
  }
  
  .note-title {
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 4px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .note-content {
    font-size: 12px;
    color: #555;
    flex: 1;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .note-footer {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .time {
      font-size: 10px;
      color: rgba(0,0,0,0.5);
    }
    
    .delete-btn {
      opacity: 0;
      transition: opacity 0.2s;
      color: rgba(0,0,0,0.5);
      
      &:hover {
        color: #f56c6c;
      }
    }
  }
}

.editor-container {
  border-radius: 8px;
  padding: 16px;
  transition: background-color 0.3s;
  
  .editor-title {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 12px;
    outline: none;
    color: #333;
    
    &::placeholder {
      color: rgba(0,0,0,0.4);
    }
  }
  
  .editor-content {
    width: 100%;
    min-height: 150px;
    border: none;
    background: transparent;
    font-size: 14px;
    line-height: 1.6;
    outline: none;
    resize: none;
    color: #333;
    font-family: inherit;
    
    &::placeholder {
      color: rgba(0,0,0,0.4);
    }
  }
}

.color-picker {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  
  .color-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.1);
    }
    
    &.active {
      border-color: #666;
    }
  }
}
</style>
