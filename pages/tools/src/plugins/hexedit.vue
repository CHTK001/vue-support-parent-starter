<script setup>
import {
  reactive,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  fileName: "",
  fileSize: 0,
  fileType: "",
  hexData: [],
  textData: [],
  offset: 0,
  bytesPerRow: 16,
  totalRows: 0,
  selection: {
    start: -1,
    end: -1,
    active: false,
  },
  clipboard: null,
  undoStack: [],
  redoStack: [],
  searchQuery: "",
  searchResults: [],
  currentSearchIndex: -1,
  editMode: "hex", // hex 或 text
  showSettings: false,
  settings: {
    bytesPerRow: 16,
    showOffset: true,
    showHex: true,
    showText: true,
    showToolbar: true,
    theme: "light",
  },
  isModified: false,
});

// DOM 引用
const fileInputRef = ref(null);
const hexEditorRef = ref(null);
const hexCellsRef = ref([]);
const textCellsRef = ref([]);

// 计算属性
const visibleData = computed(() => {
  const startOffset = env.offset;
  const endOffset = Math.min(startOffset + 1000, env.hexData.length);
  return env.hexData.slice(startOffset, endOffset);
});

const visibleRows = computed(() => {
  const rows = [];
  for (let i = 0; i < visibleData.value.length; i += env.bytesPerRow) {
    const rowOffset = env.offset + i;
    const rowHex = visibleData.value.slice(i, i + env.bytesPerRow);
    const rowText = env.textData.slice(rowOffset, rowOffset + env.bytesPerRow);

    rows.push({
      offset: rowOffset,
      hex: rowHex,
      text: rowText,
    });
  }
  return rows;
});

const canUndo = computed(() => env.undoStack.length > 0);
const canRedo = computed(() => env.redoStack.length > 0);
const hasSelection = computed(
  () => env.selection.active && env.selection.start !== env.selection.end
);
const selectionSize = computed(() => {
  if (!hasSelection.value) return 0;
  return env.selection.end - env.selection.start;
});

// 文件处理函数
const openFile = () => {
  fileInputRef.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  env.loading = true;
  env.fileName = file.name;
  env.fileSize = file.size;
  env.fileType = file.type || "application/octet-stream";

  const reader = new FileReader();

  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    const bytes = new Uint8Array(arrayBuffer);

    env.hexData = Array.from(bytes);
    env.textData = Array.from(bytes).map((byte) => byteToChar(byte));
    env.totalRows = Math.ceil(env.hexData.length / env.bytesPerRow);
    env.offset = 0;
    env.selection = { start: -1, end: -1, active: false };
    env.undoStack = [];
    env.redoStack = [];
    env.isModified = false;

    env.loading = false;
    message(t("message.fileLoadSuccess") || `文件 ${file.name} 加载成功`, {
      type: "success",
    });
  };

  reader.onerror = () => {
    env.loading = false;
    message(t("message.fileLoadError") || "文件加载失败", { type: "error" });
  };

  reader.readAsArrayBuffer(file);
};

const saveFile = () => {
  if (env.hexData.length === 0) {
    message(t("message.noDataToSave") || "没有数据可保存", { type: "warning" });
    return;
  }

  const blob = new Blob([new Uint8Array(env.hexData)], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = env.fileName || "hexedit.bin";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  env.isModified = false;
  message(t("message.fileSaveSuccess") || "文件保存成功", { type: "success" });
};

const createNewFile = () => {
  env.fileName = "new.bin";
  env.fileSize = 0;
  env.fileType = "application/octet-stream";
  env.hexData = [];
  env.textData = [];
  env.totalRows = 0;
  env.offset = 0;
  env.selection = { start: -1, end: -1, active: false };
  env.undoStack = [];
  env.redoStack = [];
  env.isModified = false;

  message(t("message.newFileCreated") || "新文件已创建", { type: "success" });
};

// 编辑函数
const updateByte = (index, value) => {
  if (index < 0 || index >= env.hexData.length) return;

  // 保存撤销状态
  saveUndoState();

  // 更新数据
  const oldValue = env.hexData[index];
  env.hexData[index] = value;
  env.textData[index] = byteToChar(value);
  env.isModified = true;

  message(
    t("message.byteUpdated") ||
      `字节已更新: 0x${oldValue.toString(16).padStart(2, "0")} → 0x${value.toString(16).padStart(2, "0")}`,
    { type: "success" }
  );
};

const insertBytes = (index, bytes) => {
  if (index < 0 || index > env.hexData.length) return;

  // 保存撤销状态
  saveUndoState();

  // 插入数据
  env.hexData.splice(index, 0, ...bytes);
  env.textData.splice(index, 0, ...bytes.map((byte) => byteToChar(byte)));
  env.totalRows = Math.ceil(env.hexData.length / env.bytesPerRow);
  env.isModified = true;

  message(t("message.bytesInserted") || `已插入 ${bytes.length} 个字节`, {
    type: "success",
  });
};

const deleteBytes = (start, end) => {
  if (start < 0 || end > env.hexData.length || start >= end) return;

  // 保存撤销状态
  saveUndoState();

  // 删除数据
  const count = end - start;
  env.hexData.splice(start, count);
  env.textData.splice(start, count);
  env.totalRows = Math.ceil(env.hexData.length / env.bytesPerRow);
  env.selection = { start: -1, end: -1, active: false };
  env.isModified = true;

  message(t("message.bytesDeleted") || `已删除 ${count} 个字节`, {
    type: "success",
  });
};

const saveUndoState = () => {
  env.undoStack.push({
    hexData: [...env.hexData],
    textData: [...env.textData],
    selection: { ...env.selection },
  });

  // 限制撤销栈大小
  if (env.undoStack.length > 50) {
    env.undoStack.shift();
  }

  // 清空重做栈
  env.redoStack = [];
};

const undo = () => {
  if (env.undoStack.length === 0) return;

  // 保存当前状态到重做栈
  env.redoStack.push({
    hexData: [...env.hexData],
    textData: [...env.textData],
    selection: { ...env.selection },
  });

  // 恢复上一个状态
  const prevState = env.undoStack.pop();
  env.hexData = prevState.hexData;
  env.textData = prevState.textData;
  env.selection = prevState.selection;
  env.totalRows = Math.ceil(env.hexData.length / env.bytesPerRow);

  message(t("message.undoSuccess") || "撤销成功", { type: "info" });
};

const redo = () => {
  if (env.redoStack.length === 0) return;

  // 保存当前状态到撤销栈
  env.undoStack.push({
    hexData: [...env.hexData],
    textData: [...env.textData],
    selection: { ...env.selection },
  });

  // 恢复下一个状态
  const nextState = env.redoStack.pop();
  env.hexData = nextState.hexData;
  env.textData = nextState.textData;
  env.selection = nextState.selection;
  env.totalRows = Math.ceil(env.hexData.length / env.bytesPerRow);

  message(t("message.redoSuccess") || "重做成功", { type: "info" });
};

// 选择函数
const setSelection = (start, end) => {
  env.selection = {
    start: Math.min(start, end),
    end: Math.max(start, end),
    active: true,
  };
};

const clearSelection = () => {
  env.selection = { start: -1, end: -1, active: false };
};

const selectAll = () => {
  if (env.hexData.length === 0) return;
  setSelection(0, env.hexData.length);
};

// 复制粘贴函数
const copySelection = () => {
  if (!hasSelection.value) return;

  const { start, end } = env.selection;
  env.clipboard = env.hexData.slice(start, end);

  message(t("message.copySuccess") || `已复制 ${env.clipboard.length} 个字节`, {
    type: "success",
  });
};

const cutSelection = () => {
  if (!hasSelection.value) return;

  copySelection();
  deleteBytes(env.selection.start, env.selection.end);
};

const paste = (index) => {
  if (!env.clipboard || env.clipboard.length === 0) {
    message(t("message.noDataToPaste") || "剪贴板为空", { type: "warning" });
    return;
  }

  insertBytes(index, env.clipboard);
};

// 搜索函数
const search = () => {
  if (!env.searchQuery) {
    message(t("message.emptySearchQuery") || "请输入搜索内容", {
      type: "warning",
    });
    return;
  }

  env.searchResults = [];
  env.currentSearchIndex = -1;

  // 判断搜索类型：十六进制或文本
  let searchBytes = [];

  if (/^([0-9A-Fa-f]{2}\s*)+$/.test(env.searchQuery)) {
    // 十六进制搜索
    searchBytes = env.searchQuery.split(/\s+/).map((hex) => parseInt(hex, 16));
  } else {
    // 文本搜索
    searchBytes = Array.from(env.searchQuery).map((char) => char.charCodeAt(0));
  }

  // 执行搜索
  for (let i = 0; i <= env.hexData.length - searchBytes.length; i++) {
    let found = true;
    for (let j = 0; j < searchBytes.length; j++) {
      if (env.hexData[i + j] !== searchBytes[j]) {
        found = false;
        break;
      }
    }

    if (found) {
      env.searchResults.push(i);
    }
  }

  if (env.searchResults.length > 0) {
    env.currentSearchIndex = 0;
    const offset = env.searchResults[0];
    setSelection(offset, offset + searchBytes.length);
    scrollToOffset(offset);

    message(
      t("message.searchResultsFound") ||
        `找到 ${env.searchResults.length} 个匹配结果`,
      { type: "success" }
    );
  } else {
    message(t("message.noSearchResults") || "未找到匹配结果", {
      type: "warning",
    });
  }
};

const findNext = () => {
  if (env.searchResults.length === 0) {
    search();
    return;
  }

  env.currentSearchIndex =
    (env.currentSearchIndex + 1) % env.searchResults.length;
  const offset = env.searchResults[env.currentSearchIndex];
  const searchBytes = /^([0-9A-Fa-f]{2}\s*)+$/.test(env.searchQuery)
    ? env.searchQuery.split(/\s+/).map((hex) => parseInt(hex, 16)).length
    : env.searchQuery.length;

  setSelection(offset, offset + searchBytes);
  scrollToOffset(offset);
};

const findPrev = () => {
  if (env.searchResults.length === 0) {
    search();
    return;
  }

  env.currentSearchIndex =
    (env.currentSearchIndex - 1 + env.searchResults.length) %
    env.searchResults.length;
  const offset = env.searchResults[env.currentSearchIndex];
  const searchBytes = /^([0-9A-Fa-f]{2}\s*)+$/.test(env.searchQuery)
    ? env.searchQuery.split(/\s+/).map((hex) => parseInt(hex, 16)).length
    : env.searchQuery.length;

  setSelection(offset, offset + searchBytes);
  scrollToOffset(offset);
};

// 导航函数
const scrollToOffset = (offset) => {
  const row = Math.floor(offset / env.bytesPerRow);
  env.offset = Math.max(0, row * env.bytesPerRow - 5 * env.bytesPerRow);

  nextTick(() => {
    const index = offset - env.offset;
    if (index >= 0 && hexCellsRef.value && hexCellsRef.value[index]) {
      hexCellsRef.value[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });
};

const goToOffset = (offset) => {
  if (isNaN(offset) || offset < 0 || offset >= env.hexData.length) {
    message(t("message.invalidOffset") || "无效的偏移量", { type: "error" });
    return;
  }

  scrollToOffset(offset);
  setSelection(offset, offset + 1);
};

// 工具函数
const byteToChar = (byte) => {
  if (byte >= 32 && byte <= 126) {
    return String.fromCharCode(byte);
  }
  return ".";
};

const formatOffset = (offset) => {
  return "0x" + offset.toString(16).toUpperCase().padStart(8, "0");
};

const formatHexByte = (byte) => {
  return byte.toString(16).toUpperCase().padStart(2, "0");
};

const isSelected = (offset) => {
  return (
    env.selection.active &&
    offset >= env.selection.start &&
    offset < env.selection.end
  );
};

// 事件处理函数
const handleHexCellClick = (offset, event) => {
  if (event.shiftKey && env.selection.active) {
    setSelection(env.selection.start, offset + 1);
  } else {
    setSelection(offset, offset + 1);
  }

  env.editMode = "hex";
};

const handleTextCellClick = (offset, event) => {
  if (event.shiftKey && env.selection.active) {
    setSelection(env.selection.start, offset + 1);
  } else {
    setSelection(offset, offset + 1);
  }

  env.editMode = "text";
};

const handleKeyDown = (event) => {
  // 如果没有选择，忽略键盘事件
  if (!env.selection.active) return;

  const key = event.key.toLowerCase();

  // 复制、剪切、粘贴快捷键
  if (event.ctrlKey || event.metaKey) {
    if (key === "c") {
      copySelection();
      event.preventDefault();
    } else if (key === "x") {
      cutSelection();
      event.preventDefault();
    } else if (key === "v") {
      paste(env.selection.start);
      event.preventDefault();
    } else if (key === "z") {
      undo();
      event.preventDefault();
    } else if (key === "y") {
      redo();
      event.preventDefault();
    } else if (key === "a") {
      selectAll();
      event.preventDefault();
    } else if (key === "f") {
      // 聚焦搜索框
      event.preventDefault();
    }
    return;
  }

  // 删除键
  if (key === "delete" || key === "backspace") {
    if (hasSelection.value) {
      deleteBytes(env.selection.start, env.selection.end);
    }
    event.preventDefault();
    return;
  }

  // 导航键
  if (key === "arrowleft") {
    if (env.selection.start > 0) {
      const newPos = env.selection.start - 1;
      setSelection(newPos, newPos + 1);
      scrollToOffset(newPos);
    }
    event.preventDefault();
  } else if (key === "arrowright") {
    if (env.selection.end < env.hexData.length) {
      const newPos = env.selection.end;
      setSelection(newPos, newPos + 1);
      scrollToOffset(newPos);
    }
    event.preventDefault();
  } else if (key === "arrowup") {
    if (env.selection.start >= env.bytesPerRow) {
      const newPos = env.selection.start - env.bytesPerRow;
      setSelection(newPos, newPos + 1);
      scrollToOffset(newPos);
    }
    event.preventDefault();
  } else if (key === "arrowdown") {
    if (env.selection.end + env.bytesPerRow <= env.hexData.length) {
      const newPos = env.selection.start + env.bytesPerRow;
      setSelection(newPos, newPos + 1);
      scrollToOffset(newPos);
    }
    event.preventDefault();
  }

  // 编辑模式下的输入
  if (env.editMode === "hex") {
    // 十六进制编辑模式
    const hexChars = "0123456789abcdef";
    if (hexChars.includes(key)) {
      const index = env.selection.start;
      if (index < env.hexData.length) {
        const currentByte = env.hexData[index];
        const currentHex = currentByte.toString(16).padStart(2, "0");
        let newHex = currentHex[1] + key;
        updateByte(index, parseInt(newHex, 16));

        // 移动到下一个字节
        if (index + 1 < env.hexData.length) {
          setSelection(index + 1, index + 2);
        }
      }
      event.preventDefault();
    }
  } else if (env.editMode === "text") {
    // 文本编辑模式
    if (key.length === 1) {
      const index = env.selection.start;
      if (index < env.hexData.length) {
        updateByte(index, key.charCodeAt(0));

        // 移动到下一个字节
        if (index + 1 < env.hexData.length) {
          setSelection(index + 1, index + 2);
        }
      }
      event.preventDefault();
    }
  }
};

// 生命周期钩子
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <div class="hexedit-tool">
    <div class="hexedit-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="hexedit-tool__header-container">
        <div class="hexedit-tool__header">
          <div class="hexedit-tool__header-inner">
            <div class="hexedit-tool__header-title">十六进制编辑器</div>
            <div class="hexedit-tool__header-subtitle">
              在线查看和编辑二进制文件
            </div>
          </div>
          <div class="hexedit-tool__header-decoration">
            <div class="hexedit-tool__header-circle"></div>
            <div class="hexedit-tool__header-circle"></div>
            <div class="hexedit-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <el-card class="hexedit-tool__toolbar-card" shadow="hover">
        <div class="hexedit-tool__toolbar">
          <div class="hexedit-tool__toolbar-group">
            <el-button type="primary" @click="createNewFile">
              <IconifyIconOnline icon="ri:file-add-line" />
              <span>新建</span>
            </el-button>
            <el-button type="primary" @click="openFile">
              <IconifyIconOnline icon="ri:folder-open-line" />
              <span>打开</span>
            </el-button>
            <el-button
              type="primary"
              @click="saveFile"
              :disabled="!env.hexData.length"
            >
              <IconifyIconOnline icon="ri:save-line" />
              <span>保存</span>
            </el-button>
            <input
              ref="fileInputRef"
              type="file"
              style="display: none"
              @change="handleFileChange"
            />
          </div>

          <div class="hexedit-tool__toolbar-group">
            <el-button @click="undo" :disabled="!canUndo">
              <IconifyIconOnline icon="ri:arrow-go-back-line" />
              <span>撤销</span>
            </el-button>
            <el-button @click="redo" :disabled="!canRedo">
              <IconifyIconOnline icon="ri:arrow-go-forward-line" />
              <span>重做</span>
            </el-button>
          </div>

          <div class="hexedit-tool__toolbar-group">
            <el-button @click="selectAll" :disabled="!env.hexData.length">
              <IconifyIconOnline icon="ri:select-all" />
              <span>全选</span>
            </el-button>
            <el-button @click="copySelection" :disabled="!hasSelection">
              <IconifyIconOnline icon="ri:file-copy-line" />
              <span>复制</span>
            </el-button>
            <el-button @click="cutSelection" :disabled="!hasSelection">
              <IconifyIconOnline icon="ri:scissors-cut-line" />
              <span>剪切</span>
            </el-button>
            <el-button
              @click="paste(env.selection.start)"
              :disabled="!env.clipboard"
            >
              <IconifyIconOnline icon="ri:clipboard-line" />
              <span>粘贴</span>
            </el-button>
          </div>

          <div class="hexedit-tool__toolbar-group">
            <el-input
              v-model="env.searchQuery"
              placeholder="搜索十六进制或文本"
              class="hexedit-tool__search-input"
            >
              <template #append>
                <el-button @click="search">
                  <IconifyIconOnline icon="ri:search-line" />
                </el-button>
              </template>
            </el-input>
            <el-button
              @click="findPrev"
              :disabled="env.searchResults.length === 0"
            >
              <IconifyIconOnline icon="ri:arrow-up-s-line" />
            </el-button>
            <el-button
              @click="findNext"
              :disabled="env.searchResults.length === 0"
            >
              <IconifyIconOnline icon="ri:arrow-down-s-line" />
            </el-button>
          </div>

          <div class="hexedit-tool__toolbar-group">
            <el-input
              placeholder="跳转到偏移量"
              class="hexedit-tool__goto-input"
            >
              <template #prepend>0x</template>
              <template #append>
                <el-button
                  @click="goToOffset(parseInt($event.target.value, 16))"
                >
                  <IconifyIconOnline icon="ri:arrow-right-line" />
                </el-button>
              </template>
            </el-input>
          </div>
        </div>

        <div class="hexedit-tool__file-info" v-if="env.fileName">
          <div class="hexedit-tool__file-name">
            <IconifyIconOnline icon="ri:file-code-line" />
            <span>{{ env.fileName }}</span>
            <span v-if="env.isModified">*</span>
          </div>
          <div class="hexedit-tool__file-size">
            <IconifyIconOnline icon="ri:hard-drive-2-line" />
            <span>{{ (env.fileSize / 1024).toFixed(2) }} KB</span>
          </div>
        </div>
      </el-card>

      <!-- 编辑器区域 -->
      <el-card
        class="hexedit-tool__editor-card"
        shadow="hover"
        v-loading="env.loading"
      >
        <div v-if="!env.hexData.length" class="hexedit-tool__empty">
          <IconifyIconOnline
            icon="ri:file-code-line"
            class="hexedit-tool__empty-icon"
          />
          <div class="hexedit-tool__empty-text">没有打开的文件</div>
          <div class="hexedit-tool__empty-actions">
            <el-button type="primary" @click="createNewFile">
              <IconifyIconOnline icon="ri:file-add-line" />
              <span>新建文件</span>
            </el-button>
            <el-button type="success" @click="openFile">
              <IconifyIconOnline icon="ri:folder-open-line" />
              <span>打开文件</span>
            </el-button>
          </div>
        </div>

        <div v-else ref="hexEditorRef" class="hexedit-tool__editor">
          <!-- 表头 -->
          <div class="hexedit-tool__editor-header">
            <div class="hexedit-tool__offset-header">偏移量</div>
            <div class="hexedit-tool__hex-header">
              <div
                v-for="i in env.bytesPerRow"
                :key="`header-${i}`"
                class="hexedit-tool__hex-cell-header"
              >
                {{ (i - 1).toString(16).toUpperCase().padStart(2, "0") }}
              </div>
            </div>
            <div class="hexedit-tool__text-header">ASCII</div>
          </div>

          <!-- 数据行 -->
          <div class="hexedit-tool__editor-rows">
            <div
              v-for="row in visibleRows"
              :key="`row-${row.offset}`"
              class="hexedit-tool__editor-row"
            >
              <!-- 偏移量 -->
              <div class="hexedit-tool__offset-cell">
                {{ formatOffset(row.offset) }}
              </div>

              <!-- 十六进制区域 -->
              <div class="hexedit-tool__hex-cells">
                <div
                  v-for="(byte, index) in row.hex"
                  :key="`hex-${row.offset + index}`"
                  :ref="
                    (el) => {
                      if (el) hexCellsRef[row.offset + index] = el;
                    }
                  "
                  class="hexedit-tool__hex-cell"
                  :class="{
                    'is-selected': isSelected(row.offset + index),
                    'is-active':
                      env.selection.start === row.offset + index &&
                      env.editMode === 'hex',
                  }"
                  @click="handleHexCellClick(row.offset + index, $event)"
                >
                  {{ formatHexByte(byte) }}
                </div>
                <!-- 填充空白单元格 -->
                <div
                  v-for="i in env.bytesPerRow - row.hex.length"
                  :key="`empty-${row.offset + row.hex.length + i}`"
                  class="hexedit-tool__hex-cell hexedit-tool__hex-cell--empty"
                ></div>
              </div>

              <!-- 文本区域 -->
              <div class="hexedit-tool__text-cells">
                <div
                  v-for="(char, index) in row.text"
                  :key="`text-${row.offset + index}`"
                  :ref="
                    (el) => {
                      if (el) textCellsRef[row.offset + index] = el;
                    }
                  "
                  class="hexedit-tool__text-cell"
                  :class="{
                    'is-selected': isSelected(row.offset + index),
                    'is-active':
                      env.selection.start === row.offset + index &&
                      env.editMode === 'text',
                  }"
                  @click="handleTextCellClick(row.offset + index, $event)"
                >
                  {{ char }}
                </div>
                <!-- 填充空白单元格 -->
                <div
                  v-for="i in env.bytesPerRow - row.text.length"
                  :key="`empty-text-${row.offset + row.text.length + i}`"
                  class="hexedit-tool__text-cell hexedit-tool__text-cell--empty"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 使用说明 -->
      <el-card class="hexedit-tool__tips-card" shadow="hover">
        <template #header>
          <div class="hexedit-tool__card-header">
            <IconifyIconOnline
              icon="ri:information-line"
              class="hexedit-tool__card-icon"
            />
            <span>使用说明</span>
          </div>
        </template>
        <div class="hexedit-tool__tips-content">
          <div class="hexedit-tool__tip-item">
            <div class="hexedit-tool__tip-number">1</div>
            <div class="hexedit-tool__tip-text">
              点击"打开"按钮或拖放文件到编辑器区域来加载二进制文件
            </div>
          </div>
          <div class="hexedit-tool__tip-item">
            <div class="hexedit-tool__tip-number">2</div>
            <div class="hexedit-tool__tip-text">
              在十六进制区域点击可以选择字节，按住Shift键可以选择多个字节
            </div>
          </div>
          <div class="hexedit-tool__tip-item">
            <div class="hexedit-tool__tip-number">3</div>
            <div class="hexedit-tool__tip-text">
              使用键盘输入十六进制字符(0-9, A-F)可以直接编辑选中的字节
            </div>
          </div>
          <div class="hexedit-tool__tip-item">
            <div class="hexedit-tool__tip-number">4</div>
            <div class="hexedit-tool__tip-text">
              在文本区域点击可以以ASCII文本方式编辑字节
            </div>
          </div>
          <div class="hexedit-tool__tip-item">
            <div class="hexedit-tool__tip-number">5</div>
            <div class="hexedit-tool__tip-text">
              使用Ctrl+C复制、Ctrl+X剪切和Ctrl+V粘贴选中的字节
            </div>
          </div>
          <div class="hexedit-tool__tip-item">
            <div class="hexedit-tool__tip-number">6</div>
            <div class="hexedit-tool__tip-text">
              使用搜索框可以搜索十六进制值(如"48 65 6C 6C 6F")或文本
            </div>
          </div>
          <div class="hexedit-tool__tip-item tv-tool__tip-item--warning">
            <IconifyIconOnline
              icon="ri:alert-line"
              class="hexedit-tool__tip-icon"
            />
            <div class="hexedit-tool__tip-text">
              注意：编辑大文件时可能会导致性能下降，建议分割大文件后再编辑
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hexedit-tool {
  /* 头部样式 */
  &__content {
    padding: 0 10px;
  }

  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(
      135deg,
      var(--el-color-info-light-3) 0%,
      var(--el-color-info) 100%
    );
    border-radius: 12px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(var(--el-color-info-rgb), 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 6px 24px rgba(var(--el-color-info-rgb), 0.4);
      transform: translateY(-2px);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }
  }

  /* 工具栏样式 */
  &__toolbar-card {
    margin-bottom: 20px;
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 15px;

    &-group {
      display: flex;
      gap: 10px;
      align-items: center;

      &:not(:last-child) {
        margin-right: 10px;
        padding-right: 10px;
        border-right: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  &__search-input {
    width: 200px;
  }

  &__goto-input {
    width: 150px;
  }

  &__file-info {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__file-name,
  &__file-size {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* 编辑器样式 */
  &__editor-card {
    margin-bottom: 20px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;

    &-icon {
      font-size: 80px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 20px;
    }

    &-text {
      font-size: 18px;
      color: var(--el-text-color-secondary);
      margin-bottom: 30px;
    }

    &-actions {
      display: flex;
      gap: 15px;
    }
  }

  &__editor {
    font-family: "Courier New", monospace;
    font-size: 14px;
    line-height: 1.5;
    user-select: none;

    &-header {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid var(--el-border-color);
      position: sticky;
      top: 0;
      background-color: var(--el-bg-color);
      z-index: 1;
    }

    &-rows {
      max-height: 500px;
      overflow-y: auto;
    }

    &-row {
      display: flex;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }
  }

  &__offset-header,
  &__offset-cell {
    width: 120px;
    padding: 5px 10px;
    border-right: 1px solid var(--el-border-color);
    color: var(--el-text-color-secondary);
    font-weight: bold;
  }

  &__hex-header,
  &__hex-cells {
    display: flex;
    flex-wrap: wrap;
    border-right: 1px solid var(--el-border-color);
    padding: 5px 0;
  }

  &__hex-cell-header {
    width: 30px;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-weight: bold;
  }

  &__hex-cell {
    width: 30px;
    height: 24px;
    text-align: center;
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color);
    }

    &.is-selected {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary-dark-2);
      font-weight: bold;
    }

    &--empty {
      background-color: var(--el-fill-color-lighter);
      cursor: default;
    }
  }

  &__text-header,
  &__text-cells {
    display: flex;
    padding: 5px 10px;
  }

  &__text-header {
    color: var(--el-text-color-secondary);
    font-weight: bold;
  }

  &__text-cell {
    width: 10px;
    text-align: center;
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color);
    }

    &.is-selected {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary-dark-2);
      font-weight: bold;
    }

    &--empty {
      background-color: var(--el-fill-color-lighter);
      cursor: default;
    }
  }

  /* 使用说明样式 */
  &__tips-card {
    margin-bottom: 20px;
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;

    .hexedit-tool__card-icon {
      margin-right: 10px;
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

  &__tips-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  &__tip-item {
    display: flex;
    align-items: flex-start;

    &--warning {
      margin-top: 10px;
      padding: 15px;
      background-color: rgba(var(--el-color-warning-rgb), 0.1);
      border-radius: 8px;
      border-left: 3px solid var(--el-color-warning);
    }
  }

  &__tip-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-right: 10px;
    flex-shrink: 0;
  }

  &__tip-icon {
    font-size: 24px;
    color: var(--el-color-warning);
    margin-right: 10px;
  }

  &__tip-text {
    flex: 1;
    line-height: 1.5;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .hexedit-tool {
    &__toolbar {
      flex-direction: column;

      &-group {
        width: 100%;
        border-right: none;
        padding-right: 0;
        margin-right: 0;

        &:not(:last-child) {
          padding-bottom: 10px;
          border-bottom: 1px solid var(--el-border-color-lighter);
        }
      }
    }

    &__search-input,
    &__goto-input {
      width: 100%;
    }

    &__editor {
      font-size: 12px;
    }

    &__offset-header,
    &__offset-cell {
      width: 80px;
    }

    &__hex-cell {
      width: 25px;
    }
  }
}
</style>
