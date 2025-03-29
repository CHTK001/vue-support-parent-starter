<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  mode: "encode", // encode 或 decode
  inputType: "text", // text 或 file
  inputText: "",
  outputText: "",
  errorMessage: "",
  fileInfo: null,
  imagePreview: null,
  urlMode: false,
  history: [],
});

// 文件输入引用
const fileInputRef = ref(null);

// 计算属性
const isImage = computed(() => {
  if (!env.fileInfo) return false;
  return env.fileInfo.type.startsWith("image/");
});

const formattedFileSize = computed(() => {
  if (!env.fileInfo) return "";

  const size = env.fileInfo.size;
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
});

// 编码文本为 Base64
const encodeText = () => {
  if (!env.inputText.trim()) {
    message(t("message.emptyInput") || "请输入要编码的文本", { type: "warning" });
    return;
  }

  env.loading = true;
  env.errorMessage = "";

  try {
    let encoded;

    if (env.urlMode) {
      encoded = encodeURIComponent(env.inputText);
    } else {
      encoded = btoa(unescape(encodeURIComponent(env.inputText)));
    }

    env.outputText = encoded;

    // 添加到历史记录
    addToHistory("encode", env.inputText, encoded);

    message(t("message.encodeSuccess") || "编码成功", { type: "success" });
  } catch (error) {
    env.errorMessage = error.message;
    message(t("message.encodeError") || "编码错误: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 解码 Base64 为文本
const decodeText = () => {
  if (!env.inputText.trim()) {
    message(t("message.emptyInput") || "请输入要解码的 Base64 字符串", { type: "warning" });
    return;
  }

  env.loading = true;
  env.errorMessage = "";
  env.imagePreview = null;

  try {
    let decoded;
    const input = env.inputText.trim();

    if (env.urlMode) {
      decoded = decodeURIComponent(input);
    } else {
      // 检测是否为数据 URL
      if (input.startsWith("data:")) {
        // 尝试解析为图片或其他媒体
        env.imagePreview = input;

        // 提取 MIME 类型和 Base64 数据
        const matches = input.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          // 如果是文本类型，尝试解码内容
          if (mimeType.startsWith("text/")) {
            decoded = decodeURIComponent(escape(atob(base64Data)));
          } else {
            decoded = `[${mimeType} 数据]`;
          }
        }
      } else {
        // 普通 Base64 字符串
        decoded = decodeURIComponent(escape(atob(input)));
      }
    }

    env.outputText = decoded;

    // 添加到历史记录
    addToHistory("decode", env.inputText, decoded);

    message(t("message.decodeSuccess") || "解码成功", { type: "success" });
  } catch (error) {
    env.errorMessage = error.message;
    message(t("message.decodeError") || "解码错误: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 处理文件编码
const encodeFile = (file) => {
  if (!file) return;

  // 检查文件大小
  if (file.size > 10 * 1024 * 1024) {
    // 10MB
    message(t("message.fileTooLarge") || "文件过大，请选择小于 10MB 的文件", { type: "warning" });
    return;
  }

  env.loading = true;
  env.errorMessage = "";
  env.fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
  };

  const reader = new FileReader();

  reader.onload = (e) => {
    const base64String = e.target.result;
    env.outputText = base64String;

    // 如果是图片，显示预览
    if (file.type.startsWith("image/")) {
      env.imagePreview = base64String;
    } else {
      env.imagePreview = null;
    }

    // 添加到历史记录
    addToHistory("encode", `文件: ${file.name}`, base64String.substring(0, 100) + "...");

    env.loading = false;
    message(t("message.fileEncodeSuccess") || "文件编码成功", { type: "success" });
  };

  reader.onerror = () => {
    env.loading = false;
    env.errorMessage = "文件读取失败";
    message(t("message.fileReadError") || "文件读取失败", { type: "error" });
  };

  reader.readAsDataURL(file);
};

// 添加到历史记录
const addToHistory = (operation, input, output) => {
  // 限制历史记录数量为10个
  if (env.history.length >= 10) {
    env.history.pop();
  }

  // 添加到历史记录
  env.history.unshift({
    operation,
    input: input.length > 100 ? input.substring(0, 100) + "..." : input,
    output: output.length > 100 ? output.substring(0, 100) + "..." : output,
    date: new Date().toLocaleString(),
  });

  // 保存到本地存储
  localStorage.setItem("base64-history", JSON.stringify(env.history));
};

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    encodeFile(file);
  }
};

// 处理文件拖放
const handleFileDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();

  const file = event.dataTransfer.files[0];
  if (file) {
    encodeFile(file);
  }
};

// 处理拖放区域事件
const handleDragOver = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

// 打开文件选择器
const openFileSelector = () => {
  fileInputRef.value.click();
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess") || "复制成功", { type: "success" });
    })
    .catch(() => {
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

// 清空输入和输出
const clearAll = () => {
  env.inputText = "";
  env.outputText = "";
  env.errorMessage = "";
  env.fileInfo = null;
  env.imagePreview = null;
};

// 切换模式
const toggleMode = () => {
  env.mode = env.mode === "encode" ? "decode" : "encode";
  clearAll();
};

// 切换输入类型
const toggleInputType = () => {
  env.inputType = env.inputType === "text" ? "file" : "text";
  clearAll();
};

// 下载文件
const downloadFile = () => {
  if (!env.outputText) {
    message(t("message.noDataToDownload") || "没有数据可下载", { type: "warning" });
    return;
  }

  let filename, data, type;

  if (env.mode === "encode") {
    // 下载编码后的文本
    filename = "encoded.txt";
    data = env.outputText;
    type = "text/plain";
  } else {
    // 尝试从 Base64 创建二进制数据
    try {
      if (env.outputText.startsWith("data:")) {
        // 数据 URL
        const matches = env.outputText.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          type = matches[1];
          data = atob(matches[2]);

          // 创建 Uint8Array
          const bytes = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) {
            bytes[i] = data.charCodeAt(i);
          }

          data = bytes;
          filename = "decoded";

          // 根据 MIME 类型添加扩展名
          if (type === "image/jpeg") filename += ".jpg";
          else if (type === "image/png") filename += ".png";
          else if (type === "image/gif") filename += ".gif";
          else if (type === "application/pdf") filename += ".pdf";
          else if (type === "text/plain") filename += ".txt";
          else filename += ".bin";
        } else {
          throw new Error("无效的数据 URL");
        }
      } else {
        // 纯文本
        filename = "decoded.txt";
        data = env.outputText;
        type = "text/plain";
      }
    } catch (error) {
      message(t("message.downloadError") || "下载错误: " + error.message, { type: "error" });
      return;
    }
  }

  // 创建 Blob 和下载链接
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  message(t("message.downloadSuccess") || "下载成功", { type: "success" });
};

// 生成示例文本
const generateExample = () => {
  env.inputText = "Hello, Base64!";
};

// 从历史记录中清除所有项
const clearHistory = () => {
  env.history = [];
  localStorage.removeItem("base64-history");
};

// 从历史记录中加载
const loadFromHistory = (item) => {
  if (item.operation === "encode") {
    env.mode = "decode";
    env.inputText = item.output;
  } else {
    env.mode = "encode";
    env.inputText = item.output;
  }
};

// 组件挂载时的操作
onMounted(() => {
  // 从本地存储加载历史记录
  const savedHistory = localStorage.getItem("base64-history");
  if (savedHistory) {
    try {
      env.history = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }
});
</script>

<template>
  <div class="base64-tool">
    <div class="base64-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="base64-tool__header-container">
        <div class="base64-tool__header">
          <div class="base64-tool__header-inner">
            <div class="base64-tool__header-title">Base64 编解码工具</div>
            <div class="base64-tool__header-subtitle">编码和解码文本、图片和文件</div>
          </div>
          <div class="base64-tool__header-decoration">
            <div class="base64-tool__header-circle"></div>
            <div class="base64-tool__header-circle"></div>
            <div class="base64-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <!-- 模式选择 -->
      <el-card class="base64-tool__mode-card" shadow="hover">
        <div class="base64-tool__mode-selector">
          <el-radio-group v-model="env.mode" size="large" @change="clearAll">
            <el-radio-button label="encode">
              <IconifyIconOnline icon="ri:lock-line" />
              <span>编码</span>
            </el-radio-button>
            <el-radio-button label="decode">
              <IconifyIconOnline icon="ri:lock-unlock-line" />
              <span>解码</span>
            </el-radio-button>
          </el-radio-group>

          <el-switch v-model="env.urlMode" active-text="URL 编解码" inactive-text="Base64 编解码" @change="clearAll" />
        </div>

        <div v-if="env.mode === 'encode'" class="base64-tool__input-type-selector">
          <el-radio-group v-model="env.inputType" size="default" @change="clearAll">
            <el-radio-button label="text">
              <IconifyIconOnline icon="ri:text" />
              <span>文本</span>
            </el-radio-button>
            <el-radio-button label="file">
              <IconifyIconOnline icon="ri:file-line" />
              <span>文件</span>
            </el-radio-button>
          </el-radio-group>
        </div>
      </el-card>

      <el-row :gutter="24">
        <!-- 输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="base64-tool__input-card" shadow="hover">
            <template #header>
              <div class="base64-tool__card-header">
                <IconifyIconOnline icon="ri:input-method-line" class="base64-tool__card-icon" />
                <span>{{ env.mode === "encode" ? "输入内容" : "输入编码" }}</span>
              </div>
            </template>

            <!-- 文本输入 -->
            <template v-if="env.inputType === 'text' || env.mode === 'decode'">
              <div class="base64-tool__actions-top">
                <el-button @click="clearAll" size="small">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>

                <el-button @click="generateExample" size="small" v-if="env.mode === 'encode'">
                  <IconifyIconOnline icon="ri:magic-line" />
                  <span>示例</span>
                </el-button>
              </div>

              <el-input v-model="env.inputText" type="textarea" :rows="12" :placeholder="env.mode === 'encode' ? '请输入要编码的文本...' : '请输入要解码的Base64字符串...'" class="base64-tool__textarea" />
            </template>

            <!-- 文件输入 -->
            <template v-else-if="env.inputType === 'file' && env.mode === 'encode'">
              <input ref="fileInputRef" type="file" style="display: none" @change="handleFileChange" />

              <div class="base64-tool__file-drop-area" @dragover="handleDragOver" @drop="handleFileDrop" @click="openFileSelector">
                <div v-if="!env.fileInfo" class="base64-tool__file-drop-placeholder">
                  <IconifyIconOnline icon="ri:upload-cloud-line" class="base64-tool__file-drop-icon" />
                  <div class="base64-tool__file-drop-text">点击或拖放文件到此处</div>
                  <div class="base64-tool__file-drop-subtext">支持图片、音频、视频、PDF 和其他文件类型</div>
                </div>

                <div v-else class="base64-tool__file-info">
                  <div v-if="isImage" class="base64-tool__image-preview">
                    <img :src="env.imagePreview" alt="预览" />
                  </div>

                  <div class="base64-tool__file-details">
                    <div class="base64-tool__file-name">
                      <IconifyIconOnline icon="ri:file-line" />
                      <span>{{ env.fileInfo.name }}</span>
                    </div>
                    <div class="base64-tool__file-size">
                      <IconifyIconOnline icon="ri:hard-drive-2-line" />
                      <span>{{ formattedFileSize }}</span>
                    </div>
                    <div class="base64-tool__file-type">
                      <IconifyIconOnline icon="ri:file-type-line" />
                      <span>{{ env.fileInfo.type || "未知类型" }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div class="base64-tool__actions-bottom">
              <el-button type="primary" @click="env.mode === 'encode' ? (env.inputType === 'text' ? encodeText() : openFileSelector()) : decodeText()" :loading="env.loading" :disabled="env.loading">
                <IconifyIconOnline :icon="env.mode === 'encode' ? 'ri:lock-line' : 'ri:lock-unlock-line'" />
                <span>{{ env.mode === "encode" ? "编码" : "解码" }}</span>
              </el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 输出区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="base64-tool__output-card" shadow="hover">
            <template #header>
              <div class="base64-tool__card-header">
                <IconifyIconOnline icon="ri:output-line" class="base64-tool__card-icon" />
                <span>{{ env.mode === "encode" ? "编码结果" : "解码结果" }}</span>
              </div>
            </template>

            <div v-if="env.loading" class="base64-tool__loading">
              <el-skeleton :rows="6" animated />
            </div>

            <div v-else-if="env.errorMessage" class="base64-tool__error">
              <IconifyIconOnline icon="ri:error-warning-line" class="base64-tool__error-icon" />
              <div class="base64-tool__error-message">{{ env.errorMessage }}</div>
            </div>

            <div v-else-if="!env.outputText" class="base64-tool__empty">
              <IconifyIconOnline icon="ri:information-line" class="base64-tool__empty-icon" />
              <div class="base64-tool__empty-text">{{ env.mode === "encode" ? "编码结果将显示在这里" : "解码结果将显示在这里" }}</div>
            </div>

            <div v-else class="base64-tool__result">
              <div class="base64-tool__result-actions">
                <el-button type="primary" link size="small" class="base64-tool__copy-btn" @click="copyToClipboard(env.outputText)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  <span>复制</span>
                </el-button>

                <el-button type="success" link size="small" class="base64-tool__download-btn" @click="downloadFile">
                  <IconifyIconOnline icon="ri:download-line" />
                  <span>下载</span>
                </el-button>
              </div>

              <div v-if="env.imagePreview && env.mode === 'decode'" class="base64-tool__image-preview">
                <img :src="env.imagePreview" alt="图片预览" />
              </div>

              <pre class="base64-tool__output">{{ env.outputText }}</pre>
            </div>

            <div class="base64-tool__actions-bottom">
              <el-button type="default" @click="toggleMode">
                <IconifyIconOnline :icon="env.mode === 'encode' ? 'ri:lock-unlock-line' : 'ri:lock-line'" />
                <span>切换到{{ env.mode === "encode" ? "解码" : "编码" }}</span>
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 历史记录 -->
      <el-card class="base64-tool__history-card" shadow="hover" v-if="env.history.length > 0">
        <template #header>
          <div class="base64-tool__card-header">
            <IconifyIconOnline icon="ri:history-line" class="base64-tool__card-icon" />
            <span>历史记录</span>
            <el-button type="danger" link size="small" @click="clearHistory" style="margin-left: auto">
              <IconifyIconOnline icon="ri:delete-bin-line" />
              <span>清空历史</span>
            </el-button>
          </div>
        </template>

        <el-table :data="env.history" style="width: 100%" size="small">
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.operation === 'encode' ? 'primary' : 'success'" size="small">
                {{ scope.row.operation === "encode" ? "编码" : "解码" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="输入" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.input }}</span>
            </template>
          </el-table-column>
          <el-table-column label="输出" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.output }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="scope">
              <span>{{ scope.row.date }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="loadFromHistory(scope.row)">
                <IconifyIconOnline icon="ri:arrow-go-back-line" />
                <span>加载</span>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.base64-tool {
  &__content {
    padding: 20px;
  }

  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary));
    border-radius: 10px;
    padding: 20px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-inner {
    flex: 1;
  }

  &__header-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  &__header-subtitle {
    font-size: 14px;
    opacity: 0.8;
  }

  &__header-decoration {
    display: flex;
    gap: 8px;
  }

  &__header-circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
  }

  &__mode-card {
    margin-bottom: 20px;
  }

  &__mode-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  &__input-type-selector {
    margin-top: 10px;
  }

  &__input-card,
  &__output-card,
  &__history-card {
    margin-bottom: 20px;
    height: 100%;
  }

  &__card-header {
    display: flex;
    align-items: center;
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  &__actions-top {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
    gap: 10px;
  }

  &__actions-bottom {
    display: flex;
    justify-content: center;
    margin-top: 15px;
  }

  &__textarea {
    width: 100%;
    font-family: monospace;
  }

  &__file-drop-area {
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 30px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &:hover {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__file-drop-icon {
    font-size: 48px;
    color: var(--el-color-primary);
    margin-bottom: 15px;
  }

  &__file-drop-text {
    font-size: 16px;
    margin-bottom: 5px;
  }

  &__file-drop-subtext {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__file-info {
    width: 100%;
  }

  &__image-preview {
    margin-bottom: 15px;
    text-align: center;

    img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  &__file-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__file-name,
  &__file-size,
  &__file-type {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__loading {
    padding: 20px;
  }

  &__error {
    padding: 20px;
    text-align: center;
    color: var(--el-color-danger);
  }

  &__error-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  &__empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  &__empty-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  &__result {
    padding: 10px;
  }

  &__result-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
    gap: 10px;
  }

  &__output {
    font-family: monospace;
    background-color: var(--el-bg-color-page);
    padding: 15px;
    border-radius: 6px;
    overflow: auto;
    max-height: 300px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__history-card {
    margin-top: 20px;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
