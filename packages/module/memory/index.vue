<script setup>
/**
 * 便签/备忘录部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.0
 */
import { reactive, onMounted, watch, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";

// 存储键
const STORAGE_KEY = "sc_module_memory_notes";

// 便签颜色
const noteColors = [
  { name: "黄色", value: "#fff9c4" },
  { name: "绿色", value: "#c8e6c9" },
  { name: "蓝色", value: "#bbdefb" },
  { name: "粉色", value: "#f8bbd9" },
  { name: "紫色", value: "#e1bee7" },
  { name: "橙色", value: "#ffe0b2" },
];

// 环境变量
const env = reactive({
  notes: [],
  currentNote: {
    id: null,
    title: "",
    content: "",
    color: noteColors[0].value,
    createdAt: null,
    updatedAt: null,
  },
  isEditing: false,
  showColorPicker: false,
});

/**
 * 从本地存储加载便签
 */
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

/**
 * 保存便签到本地存储
 */
const saveNotes = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(env.notes));
  } catch (error) {
    console.error("保存便签失败:", error);
  }
};

/**
 * 创建新便签
 */
const createNote = () => {
  env.currentNote = {
    id: Date.now(),
    title: "",
    content: "",
    color: noteColors[Math.floor(Math.random() * noteColors.length)].value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  env.isEditing = true;
};

/**
 * 编辑便签
 * @param {Object} note - 便签对象
 */
const editNote = (note) => {
  env.currentNote = { ...note };
  env.isEditing = true;
};

/**
 * 保存当前便签
 */
const saveCurrentNote = () => {
  if (!env.currentNote.title.trim() && !env.currentNote.content.trim()) {
    message("请输入便签内容", { type: "warning" });
    return;
  }

  env.currentNote.updatedAt = new Date().toISOString();

  const existingIndex = env.notes.findIndex((n) => n.id === env.currentNote.id);
  if (existingIndex >= 0) {
    env.notes[existingIndex] = { ...env.currentNote };
  } else {
    env.notes.unshift({ ...env.currentNote });
  }

  saveNotes();
  env.isEditing = false;
  message("保存成功", { type: "success" });
};

/**
 * 删除便签
 * @param {number} id - 便签ID
 */
const deleteNote = (id) => {
  env.notes = env.notes.filter((n) => n.id !== id);
  saveNotes();
  message("删除成功", { type: "success" });
};

/**
 * 取消编辑
 */
const cancelEdit = () => {
  env.isEditing = false;
};

/**
 * 选择颜色
 * @param {string} color - 颜色值
 */
const selectColor = (color) => {
  env.currentNote.color = color;
  env.showColorPicker = false;
};

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};

// 组件挂载时加载便签
onMounted(() => {
  loadNotes();
});
</script>

<template>
  <div class="memory-module">
    <div class="memory-module__content">
      <!-- 编辑模式 -->
      <div class="memory-module__editor" v-if="env.isEditing">
        <div class="memory-module__editor-header" :style="{ backgroundColor: env.currentNote.color }">
          <input v-model="env.currentNote.title" class="memory-module__editor-title" placeholder="标题" />
          <div class="memory-module__editor-actions">
            <div class="memory-module__color-picker">
              <el-button type="primary" link size="small" @click="env.showColorPicker = !env.showColorPicker">
                <IconifyIconOnline icon="ri:palette-line" />
              </el-button>
              <div class="memory-module__color-options" v-show="env.showColorPicker">
                <div
                  v-for="color in noteColors"
                  :key="color.value"
                  class="memory-module__color-option"
                  :style="{ backgroundColor: color.value }"
                  :class="{ active: env.currentNote.color === color.value }"
                  @click="selectColor(color.value)"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <textarea
          v-model="env.currentNote.content"
          class="memory-module__editor-content"
          :style="{ backgroundColor: env.currentNote.color }"
          placeholder="写点什么..."
        ></textarea>
        <div class="memory-module__editor-footer">
          <el-button type="default" size="small" @click="cancelEdit">取消</el-button>
          <el-button type="primary" size="small" @click="saveCurrentNote">保存</el-button>
        </div>
      </div>

      <!-- 便签列表 -->
      <div class="memory-module__list" v-else>
        <div class="memory-module__header">
          <span>便签</span>
          <el-button type="primary" link size="small" @click="createNote">
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
        </div>
        <div class="memory-module__notes" v-if="env.notes.length > 0">
          <div
            v-for="note in env.notes"
            :key="note.id"
            class="memory-module__note"
            :style="{ backgroundColor: note.color }"
            @click="editNote(note)"
          >
            <div class="memory-module__note-header">
              <div class="memory-module__note-title">{{ note.title || "无标题" }}</div>
              <el-button type="danger" link size="small" @click.stop="deleteNote(note.id)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
            <div class="memory-module__note-content">{{ note.content }}</div>
            <div class="memory-module__note-date">{{ formatDate(note.updatedAt) }}</div>
          </div>
        </div>
        <div class="memory-module__empty" v-else>
          <IconifyIconOnline icon="ri:sticky-note-line" />
          <span>暂无便签，点击右上角创建</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.memory-module {
  &__content {
    border-radius: 12px;
    background: var(--el-bg-color);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  &__notes {
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
  }

  &__note {
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    &-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-content {
      font-size: 12px;
      color: var(--el-text-color-regular);
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      min-height: 54px;
    }

    &-date {
      font-size: 10px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
      text-align: right;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--el-text-color-secondary);
    gap: 12px;

    .iconify {
      font-size: 48px;
      opacity: 0.5;
    }
  }

  &__editor {
    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 12px 12px 0 0;
    }

    &-title {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      font-weight: 600;
      outline: none;
      color: var(--el-text-color-primary);

      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    &-actions {
      display: flex;
      gap: 8px;
    }

    &-content {
      width: 100%;
      min-height: 150px;
      border: none;
      padding: 16px;
      font-size: 14px;
      line-height: 1.6;
      resize: none;
      outline: none;
      color: var(--el-text-color-primary);

      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    &-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 16px;
      background: var(--el-fill-color-light);
      border-radius: 0 0 12px 12px;
    }
  }

  &__color-picker {
    position: relative;
  }

  &__color-options {
    position: absolute;
    top: 100%;
    right: 0;
    display: flex;
    gap: 6px;
    padding: 8px;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }

  &__color-option {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;

    &:hover {
      transform: scale(1.1);
    }

    &.active {
      border-color: var(--el-color-primary);
    }
  }
}
</style>
