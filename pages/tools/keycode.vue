<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  currentKey: null,
  history: [],
  // 键盘布局配置
  keyboard: {
    // 第一行 - 功能键
    row1: [
      { code: "Escape", label: "Esc", width: 1.3 },
      { code: "F1", label: "F1", width: 1 },
      { code: "F2", label: "F2", width: 1 },
      { code: "F3", label: "F3", width: 1 },
      { code: "F4", label: "F4", width: 1 },
      { code: "F5", label: "F5", width: 1 },
      { code: "F6", label: "F6", width: 1 },
      { code: "F7", label: "F7", width: 1 },
      { code: "F8", label: "F8", width: 1 },
      { code: "F9", label: "F9", width: 1 },
      { code: "F10", label: "F10", width: 1 },
      { code: "F11", label: "F11", width: 1 },
      { code: "F12", label: "F12", width: 1 },
    ],
    // 第二行 - 数字键
    row2: [
      { code: "Backquote", label: "`", shiftLabel: "~", width: 1 },
      { code: "Digit1", label: "1", shiftLabel: "!", width: 1 },
      { code: "Digit2", label: "2", shiftLabel: "@", width: 1 },
      { code: "Digit3", label: "3", shiftLabel: "#", width: 1 },
      { code: "Digit4", label: "4", shiftLabel: "$", width: 1 },
      { code: "Digit5", label: "5", shiftLabel: "%", width: 1 },
      { code: "Digit6", label: "6", shiftLabel: "^", width: 1 },
      { code: "Digit7", label: "7", shiftLabel: "&", width: 1 },
      { code: "Digit8", label: "8", shiftLabel: "*", width: 1 },
      { code: "Digit9", label: "9", shiftLabel: "(", width: 1 },
      { code: "Digit0", label: "0", shiftLabel: ")", width: 1 },
      { code: "Minus", label: "-", shiftLabel: "_", width: 1 },
      { code: "Equal", label: "=", shiftLabel: "+", width: 1 },
      { code: "Backspace", label: "Backspace", width: 2 },
    ],
    // 第三行 - 第一行字母
    row3: [
      { code: "Tab", label: "Tab", width: 1.5 },
      { code: "KeyQ", label: "Q", width: 1 },
      { code: "KeyW", label: "W", width: 1 },
      { code: "KeyE", label: "E", width: 1 },
      { code: "KeyR", label: "R", width: 1 },
      { code: "KeyT", label: "T", width: 1 },
      { code: "KeyY", label: "Y", width: 1 },
      { code: "KeyU", label: "U", width: 1 },
      { code: "KeyI", label: "I", width: 1 },
      { code: "KeyO", label: "O", width: 1 },
      { code: "KeyP", label: "P", width: 1 },
      { code: "BracketLeft", label: "[", shiftLabel: "{", width: 1 },
      { code: "BracketRight", label: "]", shiftLabel: "}", width: 1 },
      { code: "Backslash", label: "\\", shiftLabel: "|", width: 1.5 },
    ],
    // 第四行 - 第二行字母
    row4: [
      { code: "CapsLock", label: "Caps Lock", width: 1.8 },
      { code: "KeyA", label: "A", width: 1 },
      { code: "KeyS", label: "S", width: 1 },
      { code: "KeyD", label: "D", width: 1 },
      { code: "KeyF", label: "F", width: 1 },
      { code: "KeyG", label: "G", width: 1 },
      { code: "KeyH", label: "H", width: 1 },
      { code: "KeyJ", label: "J", width: 1 },
      { code: "KeyK", label: "K", width: 1 },
      { code: "KeyL", label: "L", width: 1 },
      { code: "Semicolon", label: ";", shiftLabel: ":", width: 1 },
      { code: "Quote", label: "'", shiftLabel: "\"", width: 1 },
      { code: "Enter", label: "Enter", width: 2.2 },
    ],
    // 第五行 - 第三行字母
    row5: [
      { code: "ShiftLeft", label: "Shift", width: 2.5 },
      { code: "KeyZ", label: "Z", width: 1 },
      { code: "KeyX", label: "X", width: 1 },
      { code: "KeyC", label: "C", width: 1 },
      { code: "KeyV", label: "V", width: 1 },
      { code: "KeyB", label: "B", width: 1 },
      { code: "KeyN", label: "N", width: 1 },
      { code: "KeyM", label: "M", width: 1 },
      { code: "Comma", label: ",", shiftLabel: "<", width: 1 },
      { code: "Period", label: ".", shiftLabel: ">", width: 1 },
      { code: "Slash", label: "/", shiftLabel: "?", width: 1 },
      { code: "ShiftRight", label: "Shift", width: 2.5 },
    ],
    // 第六行 - 控制键
    row6: [
      { code: "ControlLeft", label: "Ctrl", width: 1.5 },
      { code: "MetaLeft", label: "Win", width: 1.5 },
      { code: "AltLeft", label: "Alt", width: 1.5 },
      { code: "Space", label: "Space", width: 6 },
      { code: "AltRight", label: "Alt", width: 1.5 },
      { code: "MetaRight", label: "Win", width: 1.5 },
      { code: "ContextMenu", label: "Menu", width: 1.5 },
      { code: "ControlRight", label: "Ctrl", width: 1.5 },
    ],
    // 导航键区域
    navigation: [
      { code: "PrintScreen", label: "PrtSc", width: 1 },
      { code: "ScrollLock", label: "ScrLk", width: 1 },
      { code: "Pause", label: "Pause", width: 1 },
      { code: "Insert", label: "Ins", width: 1 },
      { code: "Home", label: "Home", width: 1 },
      { code: "PageUp", label: "PgUp", width: 1 },
      { code: "Delete", label: "Del", width: 1 },
      { code: "End", label: "End", width: 1 },
      { code: "PageDown", label: "PgDn", width: 1 },
    ],
    // 方向键区域
    arrows: [
      { code: "ArrowUp", label: "↑", width: 1 },
      { code: "ArrowLeft", label: "←", width: 1 },
      { code: "ArrowDown", label: "↓", width: 1 },
      { code: "ArrowRight", label: "→", width: 1 },
    ],
    // 数字键盘区域
    numpad: [
      { code: "NumLock", label: "Num", width: 1 },
      { code: "NumpadDivide", label: "/", width: 1 },
      { code: "NumpadMultiply", label: "*", width: 1 },
      { code: "NumpadSubtract", label: "-", width: 1 },
      { code: "Numpad7", label: "7", width: 1 },
      { code: "Numpad8", label: "8", width: 1 },
      { code: "Numpad9", label: "9", width: 1 },
      { code: "NumpadAdd", label: "+", width: 1, height: 2 },
      { code: "Numpad4", label: "4", width: 1 },
      { code: "Numpad5", label: "5", width: 1 },
      { code: "Numpad6", label: "6", width: 1 },
      { code: "Numpad1", label: "1", width: 1 },
      { code: "Numpad2", label: "2", width: 1 },
      { code: "Numpad3", label: "3", width: 1 },
      { code: "NumpadEnter", label: "Enter", width: 1, height: 2 },
      { code: "Numpad0", label: "0", width: 2 },
      { code: "NumpadDecimal", label: ".", width: 1 },
    ],
  },
});

/**
 * 处理键盘事件
 * @param {KeyboardEvent} event - 键盘事件对象
 */
const handleKeyEvent = (event) => {
  // 阻止默认行为，避免按下空格滚动页面等
  event.preventDefault();
  
  // 获取按键信息
  const keyInfo = {
    id: Date.now(),
    code: event.code,
    key: event.key,
    keyCode: event.keyCode,
    which: event.which,
    location: event.location,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    repeat: event.repeat,
    timestamp: new Date().toLocaleString(),
  };

  // 更新当前按键
  env.currentKey = keyInfo;

  // 添加到历史记录
  addToHistory(keyInfo);

  // 高亮对应的键盘按键
  highlightKey(event.code);
};

/**
 * 添加到历史记录
 * @param {Object} keyInfo - 按键信息
 */
const addToHistory = (keyInfo) => {
  // 添加到历史记录开头
  env.history.unshift(keyInfo);
  
  // 限制历史记录数量为10条
  if (env.history.length > 10) {
    env.history.pop();
  }
};

/**
 * 高亮按键
 * @param {string} code - 按键代码
 */
const highlightKey = (code) => {
  // 移除所有高亮
  document.querySelectorAll('.keycode-tool__key--active').forEach(el => {
    el.classList.remove('keycode-tool__key--active');
  });
  
  // 添加高亮到当前按键
  const keyElement = document.querySelector(`[data-key="${code}"]`);
  if (keyElement) {
    keyElement.classList.add('keycode-tool__key--active');
    
    // 2秒后移除高亮
    setTimeout(() => {
      keyElement.classList.remove('keycode-tool__key--active');
    }, 2000);
  }
};

/**
 * 复制按键信息到剪贴板
 * @param {string} text - 要复制的文本
 */
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess") || "复制成功", { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

/**
 * 清空历史记录
 */
const clearHistory = () => {
  env.history = [];
  message(t("message.clearSuccess") || "清空成功", { type: "success" });
};

/**
 * 获取按键位置描述
 * @param {number} location - 按键位置代码
 * @returns {string} - 位置描述
 */
const getKeyLocation = (location) => {
  switch (location) {
    case 0: return "标准键";
    case 1: return "左侧键";
    case 2: return "右侧键";
    case 3: return "数字键盘";
    default: return "未知位置";
  }
};

/**
 * 获取结果项的图标
 * @param {string} label - 结果项标签
 * @returns {string} - 图标名称
 */
const getResultIcon = (label) => {
  if (label.includes("Code")) return "ri:code-line";
  if (label.includes("Key")) return "ri:keyboard-line";
  if (label.includes("KeyCode")) return "ri:hashtag";
  if (label.includes("Which")) return "ri:question-line";
  if (label.includes("Location")) return "ri:map-pin-line";
  if (label.includes("修饰键")) return "ri:function-line";
  return "ri:information-line";
};

// 组件挂载时添加键盘事件监听
onMounted(() => {
  window.addEventListener("keydown", handleKeyEvent);
});

// 组件卸载时移除键盘事件监听
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyEvent);
});
</script>

<template>
  <div class="keycode-tool">
    <div class="keycode-tool__content">
      <!-- 主要信息显示区域 -->
      <div class="keycode-tool__main-display" :class="{ 'keycode-tool__main-display--active': env.currentKey }">
        <div v-if="!env.currentKey" class="keycode-tool__empty-state">
          <IconifyIconOnline icon="ri:keyboard-line" class="keycode-tool__empty-icon" />
          <div class="keycode-tool__empty-text">按下任意键查看按键码信息</div>
        </div>
        
        <div v-else class="keycode-tool__key-info">
          <div class="keycode-tool__key-display">
            <div class="keycode-tool__key-value">{{ env.currentKey.key }}</div>
            <div class="keycode-tool__key-name">{{ env.currentKey.code }}</div>
          </div>
          
          <div class="keycode-tool__key-details">
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:code-line" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">Code:</span>
              <span class="keycode-tool__detail-value">{{ env.currentKey.code }}</span>
              <el-button type="primary" link size="small" class="keycode-tool__copy-btn" @click="copyToClipboard(env.currentKey.code)">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </el-button>
            </div>
            
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:keyboard-line" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">Key:</span>
              <span class="keycode-tool__detail-value">{{ env.currentKey.key }}</span>
              <el-button type="primary" link size="small" class="keycode-tool__copy-btn" @click="copyToClipboard(env.currentKey.key)">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </el-button>
            </div>
            
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:hashtag" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">KeyCode:</span>
              <span class="keycode-tool__detail-value">{{ env.currentKey.keyCode }}</span>
              <el-button type="primary" link size="small" class="keycode-tool__copy-btn" @click="copyToClipboard(env.currentKey.keyCode.toString())">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </el-button>
            </div>
            
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:question-line" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">Which:</span>
              <span class="keycode-tool__detail-value">{{ env.currentKey.which }}</span>
              <el-button type="primary" link size="small" class="keycode-tool__copy-btn" @click="copyToClipboard(env.currentKey.which.toString())">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </el-button>
            </div>
            
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:map-pin-line" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">Location:</span>
              <span class="keycode-tool__detail-value">{{ env.currentKey.location }} ({{ getKeyLocation(env.currentKey.location) }})</span>
            </div>
            
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:function-line" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">修饰键:</span>
              <span class="keycode-tool__detail-value">
                <el-tag size="small" :type="env.currentKey.ctrlKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Ctrl</el-tag>
                <el-tag size="small" :type="env.currentKey.altKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Alt</el-tag>
                <el-tag size="small" :type="env.currentKey.shiftKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Shift</el-tag>
                <el-tag size="small" :type="env.currentKey.metaKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Meta</el-tag>
              </span>
            </div>
            
            <div class="keycode-tool__key-detail-item">
              <IconifyIconOnline icon="ri:repeat-line" class="keycode-tool__detail-icon" />
              <span class="keycode-tool__detail-label">Repeat:</span>
              <span class="keycode-tool__detail-value">
                <el-tag size="small" :type="env.currentKey.repeat ? 'warning' : 'info'">{{ env.currentKey.repeat ? '是' : '否' }}</el-tag>
              </span>
            </div>
          </div>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 键盘区域 -->
        <el-col :xs="24" :sm="24" :md="24" :lg="16">
          <el-card class="keycode-tool__keyboard-card" shadow="hover">
            <template #header>
              <div class="keycode-tool__card-header">
                <IconifyIconOnline icon="ri:keyboard-box-line" class="keycode-tool__card-icon" />
                <span>虚拟键盘</span>
              </div>
            </template>
            
            <div class="keycode-tool__keyboard">
              <!-- 主键盘区域 -->
              <div class="keycode-tool__keyboard-main">
                <!-- 第一行 - 功能键 -->
                <div class="keycode-tool__keyboard-row">
                  <div 
                    v-for="key in env.keyboard.row1" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--function"
                    :style="{ width: `${key.width * 50}px` }"
                  >
                    {{ key.label }}
                  </div>
                </div>
                
                <!-- 第二行 - 数字键 -->
                <div class="keycode-tool__keyboard-row">
                  <div 
                    v-for="key in env.keyboard.row2" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key"
                    :style="{ width: `${key.width * 50}px` }"
                  >
                    <template v-if="key.shiftLabel">
                      <div class="keycode-tool__key-shift-label">{{ key.shiftLabel }}</div>
                      <div class="keycode-tool__key-main-label">{{ key.label }}</div>
                    </template>
                    <template v-else>
                      {{ key.label }}
                    </template>
                  </div>
                </div>
                
                <!-- 第三行 - 第一行字母 -->
                <div class="keycode-tool__keyboard-row">
                  <div 
                    v-for="key in env.keyboard.row3" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key"
                    :style="{ width: `${key.width * 50}px` }"
                  >
                    <template v-if="key.shiftLabel">
                      <div class="keycode-tool__key-shift-label">{{ key.shiftLabel }}</div>
                      <div class="keycode-tool__key-main-label">{{ key.label }}</div>
                    </template>
                    <template v-else>
                      {{ key.label }}
                    </template>
                  </div>
                </div>
                
                <!-- 第四行 - 第二行字母 -->
                <div class="keycode-tool__keyboard-row">
                  <div 
                    v-for="key in env.keyboard.row4" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key"
                    :style="{ width: `${key.width * 50}px` }"
                  >
                    <template v-if="key.shiftLabel">
                      <div class="keycode-tool__key-shift-label">{{ key.shiftLabel }}</div>
                      <div class="keycode-tool__key-main-label">{{ key.label }}</div>
                    </template>
                    <template v-else>
                      {{ key.label }}
                    </template>
                  </div>
                </div>
                
                <!-- 第五行 - 第三行字母 -->
                <div class="keycode-tool__keyboard-row">
                  <div 
                    v-for="key in env.keyboard.row5" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key"
                    :style="{ width: `${key.width * 50}px` }"
                  >
                    <template v-if="key.shiftLabel">
                      <div class="keycode-tool__key-shift-label">{{ key.shiftLabel }}</div>
                      <div class="keycode-tool__key-main-label">{{ key.label }}</div>
                    </template>
                    <template v-else>
                      {{ key.label }}
                    </template>
                  </div>
                </div>
                
                <!-- 第六行 - 控制键 -->
                <div class="keycode-tool__keyboard-row">
                  <div 
                    v-for="key in env.keyboard.row6" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key"
                    :style="{ width: `${key.width * 50}px` }"
                  >
                    {{ key.label }}
                  </div>
                </div>
              </div>
              
              <!-- 导航键区域 -->
              <div class="keycode-tool__keyboard-navigation">
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--navigation">
                  <div 
                    v-for="key in env.keyboard.navigation.slice(0, 3)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small keycode-tool__key--function"
                  >
                    {{ key.label }}
                  </div>
                </div>
                
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--navigation">
                  <div 
                    v-for="key in env.keyboard.navigation.slice(3, 6)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small"
                  >
                    {{ key.label }}
                  </div>
                </div>
                
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--navigation">
                  <div 
                    v-for="key in env.keyboard.navigation.slice(6, 9)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small"
                  >
                    {{ key.label }}
                  </div>
                </div>
                
                <!-- 方向键区域 -->
                <div class="keycode-tool__keyboard-arrows">
                  <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--arrows">
                    <div 
                      :data-key="env.keyboard.arrows[0].code"
                      class="keycode-tool__key keycode-tool__key--arrow"
                    >
                      {{ env.keyboard.arrows[0].label }}
                    </div>
                  </div>
                  
                  <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--arrows">
                    <div 
                      :data-key="env.keyboard.arrows[1].code"
                      class="keycode-tool__key keycode-tool__key--arrow"
                    >
                      {{ env.keyboard.arrows[1].label }}
                    </div>
                    
                    <div 
                      :data-key="env.keyboard.arrows[2].code"
                      class="keycode-tool__key keycode-tool__key--arrow"
                    >
                      {{ env.keyboard.arrows[2].label }}
                    </div>
                    
                    <div 
                      :data-key="env.keyboard.arrows[3].code"
                      class="keycode-tool__key keycode-tool__key--arrow"
                    >
                      {{ env.keyboard.arrows[3].label }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 数字键盘区域 -->
              <div class="keycode-tool__keyboard-numpad">
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--numpad">
                  <div 
                    v-for="key in env.keyboard.numpad.slice(0, 4)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small"
                    :class="{ 'keycode-tool__key--function': key.code === 'NumLock' }"
                  >
                    {{ key.label }}
                  </div>
                </div>
                
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--numpad">
                  <div 
                    v-for="key in env.keyboard.numpad.slice(4, 7)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small"
                  >
                    {{ key.label }}
                  </div>
                  
                  <div 
                    :data-key="env.keyboard.numpad[7].code"
                    class="keycode-tool__key keycode-tool__key--small keycode-tool__key--tall"
                    :style="{ height: '86px' }"
                  >
                    {{ env.keyboard.numpad[7].label }}
                  </div>
                </div>
                
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--numpad">
                  <div 
                    v-for="key in env.keyboard.numpad.slice(8, 11)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small"
                  >
                    {{ key.label }}
                  </div>
                </div>
                
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--numpad">
                  <div 
                    v-for="key in env.keyboard.numpad.slice(11, 14)" 
                    :key="key.code"
                    :data-key="key.code"
                    class="keycode-tool__key keycode-tool__key--small"
                  >
                    {{ key.label }}
                  </div>
                  
                  <div 
                    :data-key="env.keyboard.numpad[14].code"
                    class="keycode-tool__key keycode-tool__key--small keycode-tool__key--tall"
                    :style="{ height: '86px' }"
                  >
                    {{ env.keyboard.numpad[14].label }}
                  </div>
                </div>
                
                <div class="keycode-tool__keyboard-row keycode-tool__keyboard-row--numpad">
                  <div 
                    :data-key="env.keyboard.numpad[15].code"
                    class="keycode-tool__key keycode-tool__key--small"
                    :style="{ width: '86px' }"
                  >
                    {{ env.keyboard.numpad[15].label }}
                  </div>
                  
                  <div 
                    :data-key="env.keyboard.numpad[16].code"
                    class="keycode-tool__key keycode-tool__key--small"
                  >
                    {{ env.keyboard.numpad[16].label }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 历史记录区域 -->
        <el-col :xs="24" :sm="24" :md="24" :lg="8">
          <el-card class="keycode-tool__history-card" shadow="hover">
            <template #header>
              <div class="keycode-tool__card-header">
                <IconifyIconOnline icon="ri:history-line" class="keycode-tool__card-icon" />
                <span>按键历史记录</span>
                <div class="keycode-tool__card-actions">
                  <el-button type="danger" link size="small" @click="clearHistory">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    <span>清空</span>
                  </el-button>
                </div>
              </div>
            </template>
            
            <div v-if="!env.history.length" class="keycode-tool__empty-state">
              <IconifyIconOnline icon="ri:history-line" class="keycode-tool__empty-icon" />
              <div class="keycode-tool__empty-text">暂无历史记录</div>
            </div>
            
            <div v-else class="keycode-tool__history">
              <div v-for="item in env.history" :key="item.id" class="keycode-tool__history-item">
                <div class="keycode-tool__history-key">
                  <span class="keycode-tool__history-key-value">{{ item.key }}</span>
                  <span class="keycode-tool__history-key-code">{{ item.code }}</span>
                </div>
                
                <div class="keycode-tool__history-details">
                  <div class="keycode-tool__history-detail">
                    <span class="keycode-tool__history-detail-label">KeyCode:</span>
                    <span class="keycode-tool__history-detail-value">{{ item.keyCode }}</span>
                  </div>
                  
                  <div class="keycode-tool__history-detail">
                    <span class="keycode-tool__history-detail-label">修饰键:</span>
                    <span class="keycode-tool__history-detail-value">
                      <el-tag size="small" :type="item.ctrlKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Ctrl</el-tag>
                      <el-tag size="small" :type="item.altKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Alt</el-tag>
                      <el-tag size="small" :type="item.shiftKey ? 'success' : 'info'" class="keycode-tool__modifier-tag">Shift</el-tag>
                    </span>
                  </div>
                  
                  <div class="keycode-tool__history-time">{{ item.timestamp }}</div>
                </div>
                
                <div class="keycode-tool__history-actions">
                  <el-button type="primary" link size="small" @click="copyToClipboard(item.code)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.keycode-tool {
  padding: 20px;

  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    padding: 24px;
  }

  /* 主要信息显示区域 */
  &__main-display {
    background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transform: rotateX(5deg);
    transition: transform 0.5s ease, box-shadow 0.5s ease;
    margin-bottom: 30px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: rotateX(0deg) scale(1.02);
    }

    &--active {
      box-shadow: 0 15px 40px rgba(var(--el-color-primary-rgb), 0.4);
    }
  }

  /* 空状态 */
  &__empty-state {
    text-align: center;
    color: var(--el-color-info-light-5);
    padding: 40px 0;

    .keycode-tool__main-display & {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &__empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    animation: pulse 3s infinite ease-in-out;

    .keycode-tool__main-display & {
      font-size: 80px;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  &__empty-text {
    font-size: 18px;
    font-weight: 500;

    .keycode-tool__main-display & {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  /* 按键信息显示 */
  &__key-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    position: relative;
    z-index: 2;
  }

  &__key-display {
    margin-bottom: 24px;
  }

  &__key-value {
    font-size: 72px;
    font-weight: 700;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    margin-bottom: 8px;
    letter-spacing: 2px;
  }

  &__key-name {
    font-size: 24px;
    opacity: 0.9;
    letter-spacing: 1px;
  }

  &__key-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
  }

  &__key-detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__detail-icon {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.9);
  }

  &__detail-label {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  &__detail-value {
    font-weight: 600;
    flex: 1;
  }

  &__copy-btn {
    opacity: 0.8;
    transition: all 0.3s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  &__modifier-tag {
    margin-right: 4px;
  }

  /* 卡片样式 */
  &__keyboard-card,
  &__history-card {
    height: 100%;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 12px;
    overflow: hidden;
    border: none;
    margin-bottom: 20px;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-fill-color-light);
    position: relative;
  }

  &__card-icon {
    font-size: 22px;
    margin-right: 10px;
    color: var(--el-color-primary);
  }

  &__card-actions {
    margin-left: auto;
  }

  /* 键盘样式 */
  &__keyboard {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 10px;
  }

  &__keyboard-main {
    flex: 1;
    min-width: 750px;
  }

  &__keyboard-navigation {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__keyboard-arrows {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, 40px);
    grid-template-rows: repeat(2, 40px);
    grid-template-areas:
      ". up ."
      "left down right";
    gap: 5px;

    .keycode-tool__key:nth-child(1) {
      grid-area: up;
    }
    .keycode-tool__key:nth-child(2) {
      grid-area: left;
    }
    .keycode-tool__key:nth-child(3) {
      grid-area: down;
    }
    .keycode-tool__key:nth-child(4) {
      grid-area: right;
    }
  }

  &__keyboard-numpad {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__keyboard-row {
    display: flex;
    gap: 5px;
    margin-bottom: 5px;

    &--navigation,
    &--numpad {
      gap: 5px;
    }

    &--arrows {
      display: contents;
    }
  }

  &__key {
    height: 40px;
    min-width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color);
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--el-border-color);
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    position: relative;
    transition: all 0.2s ease;
    user-select: none;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--el-color-primary-light-7);
      background-color: var(--el-fill-color-light);
    }

    &--active {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary-dark-2);
      box-shadow: 0 0 0 2px var(--el-color-primary), 0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
      animation: pulse-key 2s 1;
    }

    &--function {
      background-color: var(--el-fill-color-darker);
      color: var(--el-text-color-secondary);
    }

    &--small {
      width: 40px;
      height: 40px;
      font-size: 12px;
    }

    &--arrow {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    &--tall {
      height: 85px;
    }
  }

  &__key-shift-label {
    font-size: 10px;
    position: absolute;
    top: 4px;
    left: 6px;
    color: var(--el-text-color-secondary);
  }

  &__key-main-label {
    margin-top: 4px;
  }

  /* 历史记录样式 */
  &__history {
    max-height: 600px;
    overflow-y: auto;
    padding-right: 8px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-color-primary-light-7);
      border-radius: 3px;

      &:hover {
        background-color: var(--el-color-primary-light-5);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
  }

  &__history-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    margin-bottom: 10px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  &__history-key {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background-color: var(--el-fill-color-darker);
    border-radius: 8px;
    margin-right: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__history-key-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__history-key-code {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__history-details {
    flex: 1;
  }

  &__history-detail {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    font-size: 13px;
  }

  &__history-detail-label {
    color: var(--el-text-color-secondary);
    width: 70px;
  }

  &__history-detail-value {
    font-weight: 500;
  }

  &__history-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__history-actions {
    display: flex;
    align-items: center;
  }

  /* 动画效果 */
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
  }

  @keyframes pulse-key {
    0% {
      box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
    }
  }

  /* 响应式调整 */
  @media (max-width: 1200px) {
    &__keyboard-main {
      min-width: auto;
    }

    &__key {
      height: 36px;
      font-size: 12px;
    }
  }

  @media (max-width: 768px) {
    &__keyboard {
      flex-direction: column;
    }

    &__keyboard-navigation,
    &__keyboard-numpad {
      display: none;
    }

    &__key-details {
      grid-template-columns: 1fr;
    }
  }
}
</style>