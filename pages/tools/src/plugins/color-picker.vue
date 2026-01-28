<template>
  <div class="color-picker-container">
    <div class="tool-description">
      <el-alert type="info" show-icon :closable="false">
        <p>
          颜色选择器工具可以帮助您选择颜色并获取不同格式（HEX、RGB、HSL）的颜色值，还可以生成颜色渐变。
        </p>
        <p>选择颜色后，您可以复制颜色代码或将其添加到收藏夹。</p>
      </el-alert>
    </div>

    <el-tabs v-model="activeTab" class="color-tabs">
      <el-tab-pane label="颜色选择器" name="picker">
        <el-row :gutter="20" class="main-content">
          <el-col :span="16">
            <el-card class="picker-card">
              <div class="color-picker-section">
                <div class="color-display-group">
                  <div
                    class="color-preview"
                    :style="{ backgroundColor: currentColor }"
                  ></div>
                  <div class="color-info">
                    <div class="color-name">
                      {{ getColorName(currentColor) }}
                    </div>
                    <div class="color-formats">
                      <div class="format-item">
                        <div class="format-label">HEX</div>
                        <div class="format-value">
                          <el-input
                            v-model="hexColor"
                            @change="updateFromHex"
                            @focus="$event.target.select()"
                          >
                            <template #append>
                              <el-button @click="copyToClipboard(hexColor)">
                                <IconifyIconOnline icon="ri:clipboard-line" />
                              </el-button>
                            </template>
                          </el-input>
                        </div>
                      </div>
                      <div class="format-item">
                        <div class="format-label">RGB</div>
                        <div class="format-value">
                          <el-input
                            v-model="rgbColor"
                            @focus="$event.target.select()"
                          >
                            <template #append>
                              <el-button @click="copyToClipboard(rgbColor)">
                                <IconifyIconOnline icon="ri:clipboard-line" />
                              </el-button>
                            </template>
                          </el-input>
                        </div>
                      </div>
                      <div class="format-item">
                        <div class="format-label">HSL</div>
                        <div class="format-value">
                          <el-input
                            v-model="hslColor"
                            @focus="$event.target.select()"
                          >
                            <template #append>
                              <el-button @click="copyToClipboard(hslColor)">
                                <IconifyIconOnline icon="ri:clipboard-line" />
                              </el-button>
                            </template>
                          </el-input>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="color-picker-main">
                  <el-color-picker
                    v-model="currentColor"
                    show-alpha
                    :predefine="predefineColors"
                    @change="handleColorChange"
                    class="full-picker"
                  />
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="favorites-card">
              <template #header>
                <div class="favorites-header">
                  <span>我的收藏颜色</span>
                  <el-button
                    type="primary"
                    @click="addToFavorites"
                    :disabled="isFavorite"
                  >
                    <IconifyIconOnline icon="ri:star-line" />
                    添加到收藏
                  </el-button>
                </div>
              </template>
              <div class="favorites-list" v-if="favoriteColors.length > 0">
                <div
                  v-for="(color, index) in favoriteColors"
                  :key="index"
                  class="favorite-item"
                >
                  <div
                    class="favorite-color"
                    :style="{ backgroundColor: color }"
                    @click="selectFavoriteColor(color)"
                  ></div>
                  <div class="favorite-info">
                    <div class="favorite-hex">{{ color }}</div>
                    <div class="favorite-name">{{ getColorName(color) }}</div>
                  </div>
                  <div class="favorite-actions">
                    <el-button type="text" @click="copyToClipboard(color)">
                      <IconifyIconOnline icon="ri:clipboard-line" />
                    </el-button>
                    <el-button type="text" @click="removeFromFavorites(index)">
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-else class="empty-favorites">
                <IconifyIconOnline icon="ri:star-line" class="empty-icon" />
                <p>暂无收藏颜色</p>
                <p class="empty-tip">选择一个颜色后点击"添加到收藏"按钮</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="渐变生成器" name="gradient">
        <el-card class="gradient-card">
          <div class="gradient-controls">
            <div class="gradient-section">
              <h3>渐变设置</h3>
              <div class="gradient-type">
                <span>渐变类型：</span>
                <el-radio-group v-model="gradientType" @change="updateGradient">
                  <el-radio label="linear">线性渐变</el-radio>
                  <el-radio label="radial">径向渐变</el-radio>
                </el-radio-group>
              </div>

              <div class="gradient-direction" v-if="gradientType === 'linear'">
                <span>渐变方向：</span>
                <el-select v-model="gradientDirection" @change="updateGradient">
                  <el-option label="从左到右" value="to right" />
                  <el-option label="从右到左" value="to left" />
                  <el-option label="从上到下" value="to bottom" />
                  <el-option label="从下到上" value="to top" />
                  <el-option label="从左上到右下" value="to bottom right" />
                  <el-option label="从右上到左下" value="to bottom left" />
                  <el-option label="从左下到右上" value="to top right" />
                  <el-option label="从右下到左上" value="to top left" />
                </el-select>
              </div>

              <div class="gradient-colors">
                <h4>渐变颜色：</h4>
                <draggable
                  v-model="gradientColors"
                  handle=".color-handle"
                  item-key="id"
                  @change="updateGradient"
                  class="gradient-colors-list"
                >
                  <template #item="{ element, index }">
                    <div class="gradient-color-item">
                      <div class="color-handle">
                        <IconifyIconOnline icon="ri:drag-move-line" />
                      </div>
                      <el-color-picker
                        v-model="element.color"
                        show-alpha
                        @change="updateGradient"
                        size="small"
                      />
                      <el-input-number
                        v-model="element.position"
                        :min="0"
                        :max="100"
                        size="small"
                        @change="updateGradient"
                        class="position-input"
                      />
                      <span class="position-label">%</span>
                      <el-button
                        type="danger"
                        icon="delete"
                        size="small"
                        circle
                        @click="removeGradientColor(index)"
                        :disabled="gradientColors.length <= 2"
                      >
                        <IconifyIconOnline icon="ri:close-line" />
                      </el-button>
                    </div>
                  </template>
                </draggable>
                <div class="add-color">
                  <el-button
                    type="primary"
                    @click="addGradientColor"
                    :disabled="gradientColors.length >= 10"
                  >
                    <IconifyIconOnline icon="ri:add-line" />
                    添加颜色
                  </el-button>
                </div>
              </div>
            </div>

            <div class="gradient-preview-section">
              <h3>渐变预览</h3>
              <div
                class="gradient-preview"
                :style="{ background: gradientValue }"
              ></div>
              <div class="gradient-code">
                <h4>CSS 代码:</h4>
                <el-input
                  type="textarea"
                  v-model="gradientCSS"
                  readonly
                  rows="4"
                  class="gradient-textarea"
                />
                <el-button
                  type="primary"
                  @click="copyToClipboard(gradientCSS)"
                  class="copy-gradient"
                >
                  <IconifyIconOnline icon="ri:clipboard-line" />
                  复制CSS代码
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { message } from "@repo/utils";
import draggable from "vuedraggable";

// 当前活动标签
const activeTab = ref("picker");

// 预定义颜色
const predefineColors = [
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "#000000",
  "#ffffff",
];

// 当前选择的颜色
const currentColor = ref("#409EFF");

// 收藏的颜色列表
const favoriteColors = ref([]);

// 计算属性：颜色格式
const hexColor = computed({
  get: () => {
    return currentColor.value;
  },
  set: (value) => {
    currentColor.value = value;
  },
});

const rgbColor = computed(() => {
  return hexToRgb(currentColor.value);
});

const hslColor = computed(() => {
  return hexToHsl(currentColor.value);
});

// 计算当前颜色是否已收藏
const isFavorite = computed(() => {
  return favoriteColors.value.includes(currentColor.value);
});

// 颜色转换函数
const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "";
};

const hexToHsl = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // 灰色
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h = Math.round(h * 60);
    }

    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return "";
};

// 根据HEX更新颜色
const updateFromHex = () => {
  if (/^#[0-9A-F]{6}$/i.test(hexColor.value)) {
    currentColor.value = hexColor.value;
  }
};

// 处理颜色变化
const handleColorChange = (color) => {
  currentColor.value = color;
};

// 添加到收藏
const addToFavorites = () => {
  if (!favoriteColors.value.includes(currentColor.value)) {
    favoriteColors.value.push(currentColor.value);
    localStorage.setItem(
      "favoriteColors",
      JSON.stringify(favoriteColors.value)
    );
    message("已添加到收藏", { type: "success" });
  }
};

// 从收藏中移除
const removeFromFavorites = (index) => {
  favoriteColors.value.splice(index, 1);
  localStorage.setItem("favoriteColors", JSON.stringify(favoriteColors.value));
  message("已从收藏中移除", { type: "success" });
};

// 选择收藏的颜色
const selectFavoriteColor = (color) => {
  currentColor.value = color;
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message("已复制到剪贴板", { type: "success" });
    })
    .catch(() => {
      message("复制失败", { type: "error" });
    });
};

// 获取颜色名称 (简化版本)
const getColorName = (hex) => {
  const colorNames = {
    "#ff0000": "红色",
    "#00ff00": "绿色",
    "#0000ff": "蓝色",
    "#ffff00": "黄色",
    "#ff00ff": "洋红",
    "#00ffff": "青色",
    "#000000": "黑色",
    "#ffffff": "白色",
    "#808080": "灰色",
    "#800000": "褐红色",
    "#808000": "橄榄色",
    "#008000": "深绿色",
    "#800080": "紫色",
    "#008080": "蓝绿色",
    "#000080": "海军蓝",
    "#409EFF": "主题蓝",
  };

  return colorNames[hex.toLowerCase()] || "";
};

// 渐变生成器相关
const gradientType = ref("linear");
const gradientDirection = ref("to right");
const gradientColors = ref([
  { id: 0, color: "#409EFF", position: 0 },
  { id: 1, color: "#ff4500", position: 100 },
]);

// 生成唯一ID
let nextColorId = 2;
const generateId = () => {
  return nextColorId++;
};

// 添加渐变颜色
const addGradientColor = () => {
  if (gradientColors.value.length < 10) {
    const position = Math.round(100 / gradientColors.value.length);
    gradientColors.value.push({
      id: generateId(),
      color: "#ffffff",
      position: position,
    });
    updateGradient();
  }
};

// 移除渐变颜色
const removeGradientColor = (index) => {
  if (gradientColors.value.length > 2) {
    gradientColors.value.splice(index, 1);
    updateGradient();
  }
};

// 渐变CSS值
const gradientValue = ref("");
const gradientCSS = ref("");

// 更新渐变
const updateGradient = () => {
  // 按位置排序
  const sortedColors = [...gradientColors.value].sort(
    (a, b) => a.position - b.position
  );

  // 生成渐变字符串
  let gradientStr =
    gradientType.value === "linear"
      ? `linear-gradient(${gradientDirection.value}, `
      : `radial-gradient(circle, `;

  const colorStops = sortedColors
    .map((color) => `${color.color} ${color.position}%`)
    .join(", ");
  gradientStr += colorStops + ")";

  gradientValue.value = gradientStr;

  // 生成CSS代码
  const prefix =
    gradientType.value === "linear" ? "linear-gradient" : "radial-gradient";
  const direction =
    gradientType.value === "linear" ? gradientDirection.value : "circle";

  gradientCSS.value = `background: ${gradientStr};\n`;
  gradientCSS.value += `background: -webkit-${prefix}(${direction}, ${colorStops});\n`;
  gradientCSS.value += `background: -moz-${prefix}(${direction}, ${colorStops});\n`;
  gradientCSS.value += `background: -o-${prefix}(${direction}, ${colorStops});`;
};

// 初始化
onMounted(() => {
  // 从本地存储加载收藏的颜色
  const savedColors = localStorage.getItem("favoriteColors");
  if (savedColors) {
    try {
      favoriteColors.value = JSON.parse(savedColors);
    } catch (e) {
      console.error("Failed to parse saved colors", e);
    }
  }

  // 初始化渐变
  updateGradient();
});
</script>

<style scoped>
.color-picker-container {
  padding: 20px;
}

.tool-description {
  margin-bottom: 20px;
}

.main-content {
  margin-bottom: 30px;
}

.color-tabs {
  margin-top: 20px;
}

.picker-card,
.favorites-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
    border-color: var(--el-color-primary-light-7);
  }
}

.color-picker-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.color-display-group {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.color-preview {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
}

.color-info {
  flex: 1;
}

.color-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--el-text-color-primary);
}

.color-formats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.format-item {
  display: flex;
  align-items: center;
}

.format-label {
  width: 50px;
  font-weight: bold;
}

.format-value {
  flex: 1;
}

.color-picker-main {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.full-picker {
  width: 100%;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.favorites-list {
  max-height: 400px;
  overflow-y: auto;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.favorite-item:last-child {
  border-bottom: none;
}

.favorite-color {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 10px;
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
}

.favorite-info {
  flex: 1;
}

.favorite-hex {
  font-size: 14px;
  font-weight: bold;
}

.favorite-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.favorite-actions {
  display: flex;
  gap: 5px;
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-tip {
  font-size: 12px;
  margin-top: 5px;
}

/* 渐变相关样式 */
.gradient-card {
  margin-top: 20px;
}

.gradient-controls {
  display: flex;
  gap: 30px;
}

.gradient-section {
  flex: 1;
}

.gradient-preview-section {
  flex: 1;
}

.gradient-section h3,
.gradient-preview-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;
}

.gradient-type,
.gradient-direction {
  margin-bottom: 20px;
}

.gradient-colors h4,
.gradient-code h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  font-size: 14px;
}

.gradient-colors-list {
  margin-bottom: 15px;
}

.gradient-color-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.color-handle {
  cursor: move;
  margin-right: 10px;
  color: var(--el-text-color-secondary);
}

.position-input {
  width: 100px;
  margin: 0 10px;
}

.position-label {
  margin-right: 10px;
}

.add-color {
  margin-top: 15px;
}

.gradient-preview {
  height: 150px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-light);
}

.gradient-textarea {
  margin-bottom: 15px;
}

.copy-gradient {
  width: 100%;
}
</style>
