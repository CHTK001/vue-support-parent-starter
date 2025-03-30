<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { saveAs } from "file-saver";
import QRCode from "qrcode";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 防抖生成函数
const debounceGenerateQR = (value) => {
  if (!value) return;

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的定时器，延迟500ms执行
  debounceTimer = setTimeout(() => {
    if (env.inputValue) {
      generateQRCode();
    }
  }, 500);
};

// 环境变量
const env = reactive({
  loading: false,
  inputValue: "",
  qrCodeDataUrl: "",
  qrCodeHistory: [],
  activeTab: "generate",
  errorCorrectionLevels: [
    { label: "低 (L)", value: "L", description: "约可恢复 7% 的数据" },
    { label: "中 (M)", value: "M", description: "约可恢复 15% 的数据" },
    { label: "高 (Q)", value: "Q", description: "约可恢复 25% 的数据" },
    { label: "最高 (H)", value: "H", description: "约可恢复 30% 的数据" },
  ],
  errorCorrectionLevel: "M",
  qrSize: 256,
  darkColor: "#000000",
  lightColor: "#FFFFFF",
  logoImage: null,
  logoPreview: "",
  logoSize: 60,
  margin: 4,
  outputFormat: "png",
  outputFormats: [
    { label: "PNG", value: "png" },
    { label: "JPEG", value: "jpeg" },
    { label: "SVG", value: "svg" },
  ],
  scanResult: "",
  scanHistory: [],
  isScanning: false,
  scannerActive: false,
  customStyles: [
    { label: "标准", value: "standard", icon: "ri:qr-code-line" },
    { label: "圆点", value: "dots", icon: "ri:bubble-chart-line" },
    { label: "圆角", value: "rounded", icon: "ri:shape-line" },
  ],
  customStyle: "standard",
  presetTemplates: [
    { label: "商务黑", colors: { dark: "#000000", light: "#FFFFFF" }, style: "standard" },
    { label: "科技蓝", colors: { dark: "#0078D7", light: "#F0F8FF" }, style: "rounded" },
    { label: "活力橙", colors: { dark: "#FF6600", light: "#FFF5E6" }, style: "dots" },
    { label: "自然绿", colors: { dark: "#2E8B57", light: "#F0FFF0" }, style: "rounded" },
  ],
});

// 文件输入引用
const fileInput = ref(null);

// 计算属性：二维码选项
const qrOptions = computed(() => {
  return {
    errorCorrectionLevel: env.errorCorrectionLevel,
    margin: env.margin,
    width: env.qrSize,
    color: {
      dark: env.darkColor,
      light: env.lightColor,
    },
  };
});

/**
 * 生成二维码
 */
const generateQRCode = async () => {
  if (!env.inputValue) {
    message(t("message.inputRequired") || "请输入内容", { type: "warning" });
    return;
  }

  try {
    env.loading = true;

    // 生成二维码
    const canvas = document.createElement("canvas");
    const options = { ...qrOptions.value };

    // 根据自定义样式调整选项
    if (env.customStyle === "dots") {
      options.rendererOpts = {
        ...options.rendererOpts,
        quality: 1.0,
      };
    } else if (env.customStyle === "rounded") {
      options.rendererOpts = {
        ...options.rendererOpts,
        quality: 1.0,
      };
    }

    await QRCode.toCanvas(canvas, env.inputValue, options);

    // 如果有自定义样式，应用样式
    if (env.customStyle !== "standard") {
      applyCustomStyle(canvas, env.customStyle);
    }

    // 如果有Logo，添加Logo
    if (env.logoImage) {
      await addLogoToCanvas(canvas);
    }

    // 转换为数据URL
    env.qrCodeDataUrl = canvas.toDataURL(`image/${env.outputFormat === "svg" ? "png" : env.outputFormat}`);

    // 添加到历史记录
    if (!env.qrCodeHistory.some((item) => item.text === env.inputValue)) {
      env.qrCodeHistory.unshift({
        text: env.inputValue,
        dataUrl: env.qrCodeDataUrl,
        timestamp: new Date().toISOString(),
      });

      // 限制历史记录数量
      if (env.qrCodeHistory.length > 5) {
        env.qrCodeHistory.pop();
      }
    }

    message(t("message.generateSuccess") || "二维码生成成功", { type: "success" });
  } catch (error) {
    console.error("二维码生成错误:", error);
    message(t("message.generateError") || "二维码生成失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 应用自定义样式到画布
 * @param {HTMLCanvasElement} canvas - 画布元素
 * @param {string} style - 样式类型
 */
const applyCustomStyle = (canvas, style) => {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const pixelSize = Math.floor(canvas.width / 25); // 估算QR码模块大小

  // 创建临时画布存储原始数据
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.putImageData(imageData, 0, 0);

  // 清除原画布
  ctx.fillStyle = env.lightColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (style === "dots") {
    // 圆点样式
    for (let y = 0; y < canvas.height; y += pixelSize) {
      for (let x = 0; x < canvas.width; x += pixelSize) {
        // 获取中心点颜色
        const centerX = x + Math.floor(pixelSize / 2);
        const centerY = y + Math.floor(pixelSize / 2);
        const centerIndex = (centerY * width + centerX) * 4;

        if (data[centerIndex] === 0) {
          // 黑色像素
          ctx.fillStyle = env.darkColor;
          ctx.beginPath();
          ctx.arc(
            x + pixelSize / 2,
            y + pixelSize / 2,
            (pixelSize / 2) * 0.8, // 稍微小一点的圆
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  } else if (style === "rounded") {
    // 圆角样式
    // 首先识别模块位置
    const modules = [];
    for (let y = 0; y < canvas.height; y += pixelSize) {
      for (let x = 0; x < canvas.width; x += pixelSize) {
        const centerX = x + Math.floor(pixelSize / 2);
        const centerY = y + Math.floor(pixelSize / 2);
        const centerIndex = (centerY * width + centerX) * 4;

        if (data[centerIndex] === 0) {
          // 黑色像素
          modules.push({ x, y });
        }
      }
    }

    // 绘制圆角矩形
    ctx.fillStyle = env.darkColor;
    for (const module of modules) {
      ctx.beginPath();
      ctx.roundRect(module.x + pixelSize * 0.1, module.y + pixelSize * 0.1, pixelSize * 0.8, pixelSize * 0.8, pixelSize * 0.3);
      ctx.fill();
    }
  }

  // 重新绘制定位点
  drawPositionPatterns(ctx, canvas.width, pixelSize);
};

/**
 * 绘制QR码定位点
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {number} size - 画布大小
 * @param {number} pixelSize - 像素大小
 */
const drawPositionPatterns = (ctx, size, pixelSize) => {
  const patternSize = pixelSize * 7; // 定位点大小为7个模块
  const positions = [
    { x: 0, y: 0 }, // 左上
    { x: size - patternSize, y: 0 }, // 右上
    { x: 0, y: size - patternSize }, // 左下
  ];

  for (const pos of positions) {
    // 外框
    ctx.fillStyle = env.darkColor;
    ctx.fillRect(pos.x, pos.y, patternSize, patternSize);

    // 中间白色部分
    ctx.fillStyle = env.lightColor;
    ctx.fillRect(pos.x + pixelSize, pos.y + pixelSize, patternSize - 2 * pixelSize, patternSize - 2 * pixelSize);

    // 内部黑色方块
    ctx.fillStyle = env.darkColor;
    ctx.fillRect(pos.x + 2 * pixelSize, pos.y + 2 * pixelSize, patternSize - 4 * pixelSize, patternSize - 4 * pixelSize);
  }
};

/**
 * 添加Logo到画布
 * @param {HTMLCanvasElement} canvas - 画布元素
 */
const addLogoToCanvas = (canvas) => {
  return new Promise((resolve, reject) => {
    if (!env.logoImage) {
      resolve();
      return;
    }

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      try {
        // 计算Logo位置
        const logoSize = env.logoSize;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;

        // 绘制白色背景
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

        // 绘制Logo
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = env.logoPreview;
  });
};

/**
 * 上传Logo
 * @param {Event} event - 文件上传事件
 */
const uploadLogo = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    env.logoPreview = e.target.result;
    env.logoImage = file;

    // 如果已经有二维码，重新生成
    if (env.qrCodeDataUrl) {
      generateQRCode();
    }
  };
  reader.readAsDataURL(file);
};

/**
 * 移除Logo
 */
const removeLogo = () => {
  env.logoImage = null;
  env.logoPreview = "";

  // 如果已经有二维码，重新生成
  if (env.qrCodeDataUrl) {
    generateQRCode();
  }
};

/**
 * 下载二维码
 */
const downloadQRCode = () => {
  if (!env.qrCodeDataUrl) {
    message(t("message.noQRCode") || "请先生成二维码", { type: "warning" });
    return;
  }

  try {
    // 创建文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `qrcode-${timestamp}.${env.outputFormat}`;

    // 如果是SVG格式
    if (env.outputFormat === "svg") {
      // 从Canvas转换为SVG
      QRCode.toString(env.inputValue, {
        ...qrOptions.value,
        type: "svg",
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        saveAs(blob, filename);
      });
    } else {
      // 从数据URL创建Blob
      fetch(env.qrCodeDataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          saveAs(blob, filename);
        });
    }

    message(t("message.downloadSuccess") || "下载成功", { type: "success" });
  } catch (error) {
    console.error("下载错误:", error);
    message(t("message.downloadError") || "下载失败: " + error.message, { type: "error" });
  }
};

/**
 * 复制二维码到剪贴板
 */
const copyQRCodeToClipboard = async () => {
  if (!env.qrCodeDataUrl) {
    message(t("message.noQRCode") || "请先生成二维码", { type: "warning" });
    return;
  }

  try {
    // 创建图像元素
    const img = new Image();
    img.src = env.qrCodeDataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // 创建Canvas
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // 转换为Blob
    canvas.toBlob(async (blob) => {
      try {
        // 创建ClipboardItem
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        message(t("message.copySuccess") || "已复制到剪贴板", { type: "success" });
      } catch (error) {
        console.error("复制错误:", error);
        message(t("message.copyError") || "复制失败: " + error.message, { type: "error" });
      }
    });
  } catch (error) {
    console.error("复制错误:", error);
    message(t("message.copyError") || "复制失败: " + error.message, { type: "error" });
  }
};

/**
 * 从历史记录中选择
 * @param {Object} item - 历史记录项
 */
const selectFromHistory = (item) => {
  env.inputValue = item.text;
  env.qrCodeDataUrl = item.dataUrl;
};

/**
 * 应用预设模板
 * @param {Object} template - 预设模板
 */
const applyTemplate = (template) => {
  env.darkColor = template.colors.dark;
  env.lightColor = template.colors.light;
  env.customStyle = template.style;

  // 如果已经有输入内容，重新生成
  if (env.inputValue) {
    generateQRCode();
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  env.inputValue = "";
  env.qrCodeDataUrl = "";
  env.errorCorrectionLevel = "M";
  env.qrSize = 256;
  env.darkColor = "#000000";
  env.lightColor = "#FFFFFF";
  env.logoImage = null;
  env.logoPreview = "";
  env.logoSize = 60;
  env.margin = 4;
  env.outputFormat = "png";
  env.customStyle = "standard";
};

/**
 * 解析二维码图片
 * @param {Event} event - 文件上传事件
 */
const parseQRCodeImage = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // 创建Canvas
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 使用jsQR库解析
      import("jsqr")
        .then(({ default: jsQR }) => {
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            env.scanResult = code.data;

            // 添加到历史记录
            if (!env.scanHistory.some((item) => item.text === code.data)) {
              env.scanHistory.unshift({
                text: code.data,
                timestamp: new Date().toISOString(),
              });

              // 限制历史记录数量
              if (env.scanHistory.length > 5) {
                env.scanHistory.pop();
              }
            }

            message(t("message.scanSuccess") || "解析成功", { type: "success" });
          } else {
            message(t("message.scanNoQRCode") || "未检测到二维码", { type: "error" });
          }
        })
        .catch((error) => {
          console.error("解析错误:", error);
          message(t("message.scanError") || "解析失败: " + error.message, { type: "error" });
        });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

/**
 * 复制解析结果到剪贴板
 */
const copyResultToClipboard = () => {
  if (!env.scanResult) {
    message(t("message.noScanResult") || "没有解析结果", { type: "warning" });
    return;
  }

  navigator.clipboard
    .writeText(env.scanResult)
    .then(() => {
      message(t("message.copySuccess") || "已复制到剪贴板", { type: "success" });
    })
    .catch((error) => {
      console.error("复制错误:", error);
      message(t("message.copyError") || "复制失败: " + error.message, { type: "error" });
    });
};

/**
 * 打开URL
 */
const openUrl = () => {
  if (!env.scanResult) {
    message(t("message.noScanResult") || "没有解析结果", { type: "warning" });
    return;
  }

  // 验证是否为URL
  try {
    const url = new URL(env.scanResult);
    window.open(url.href, "_blank");
  } catch (error) {
    message(t("message.notValidUrl") || "不是有效的URL", { type: "warning" });
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
});
</script>

<template>
  <div class="qrcode-tool">
    <div class="qrcode-tool__content">
      <!-- 页面头部区域 -->
      <div class="qrcode-tool__header-container">
        <div class="qrcode-tool__header">
          <div class="qrcode-tool__header-inner">
            <div class="qrcode-tool__header-title">二维码工具</div>
            <div class="qrcode-tool__header-subtitle">生成、解析和自定义二维码</div>
          </div>
        </div>
      </div>

      <el-tabs v-model="env.activeTab" class="qrcode-tool__main-tabs">
        <!-- 生成二维码选项卡 -->
        <el-tab-pane label="生成二维码" name="generate">
          <el-row :gutter="24">
            <!-- 左侧输入区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="qrcode-tool__input-card" shadow="hover">
                <template #header>
                  <div class="qrcode-tool__card-header">
                    <IconifyIconOnline icon="ri:qr-code-line" class="qrcode-tool__card-icon" />
                    <span>输入内容</span>
                  </div>
                </template>

                <el-form label-position="top">
                  <!-- 内容输入框 -->
                  <el-form-item label="输入文本、网址或其他内容">
                    <el-input v-model="env.inputValue" type="textarea" :rows="4" placeholder="请输入要生成二维码的内容" clearable class="qrcode-tool__input" @input="debounceGenerateQR" />
                  </el-form-item>

                  <!-- 历史记录区域 -->
                  <div class="qrcode-tool__history" v-if="env.qrCodeHistory.length > 0">
                    <div class="qrcode-tool__history-label">
                      <IconifyIconOnline icon="ri:history-line" class="qrcode-tool__history-icon" />
                      <span>历史记录:</span>
                    </div>
                    <div class="qrcode-tool__history-items">
                      <div v-for="(item, index) in env.qrCodeHistory" :key="index" class="qrcode-tool__history-item" @click="selectFromHistory(item)">
                        <div class="qrcode-tool__history-preview">
                          <img :src="item.dataUrl" alt="QR Code" />
                        </div>
                        <div class="qrcode-tool__history-text">
                          {{ item.text.length > 20 ? item.text.substring(0, 20) + "..." : item.text }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮区域 -->
                  <div class="qrcode-tool__actions">
                    <el-button type="primary" :loading="env.loading" class="qrcode-tool__generate-btn" @click="generateQRCode">
                      <IconifyIconOnline icon="ri:qr-code-line" />
                      <span>生成二维码</span>
                    </el-button>

                    <el-button class="qrcode-tool__reset-btn" @click="resetForm">
                      <IconifyIconOnline icon="ri:refresh-line" />
                      <span>重置</span>
                    </el-button>
                  </div>
                </el-form>
              </el-card>

              <!-- 自定义选项卡片 -->
              <el-card class="qrcode-tool__options-card" shadow="hover">
                <template #header>
                  <div class="qrcode-tool__card-header">
                    <IconifyIconOnline icon="ri:settings-line" class="qrcode-tool__card-icon" />
                    <span>自定义选项</span>
                  </div>
                </template>

                <el-form label-position="top">
                  <!-- 预设模板 -->
                  <div class="qrcode-tool__templates">
                    <div class="qrcode-tool__templates-label">预设模板:</div>
                    <div class="qrcode-tool__templates-items">
                      <div v-for="(template, index) in env.presetTemplates" :key="index" class="qrcode-tool__template-item" @click="applyTemplate(template)">
                        <div class="qrcode-tool__template-color" :style="`background-color: ${template.colors.dark}; color: ${template.colors.light}`">
                          <IconifyIconOnline :icon="template.style === 'standard' ? 'ri:qr-code-line' : template.style === 'dots' ? 'ri:bubble-chart-line' : 'ri:shape-line'" />
                        </div>
                        <div class="qrcode-tool__template-name">{{ template.label }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- 错误纠正级别 -->
                  <el-form-item label="错误纠正级别">
                    <el-select v-model="env.errorCorrectionLevel" class="qrcode-tool__select">
                      <el-option v-for="item in env.errorCorrectionLevels" :key="item.value" :label="item.label" :value="item.value">
                        <div class="qrcode-tool__option-content">
                          <span>{{ item.label }}</span>
                          <span class="qrcode-tool__option-description">{{ item.description }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </el-form-item>

                  <!-- 二维码大小 -->
                  <el-form-item label="二维码大小">
                    <el-slider v-model="env.qrSize" :min="128" :max="512" :step="8" show-input :format-tooltip="(value) => `${value}px`" />
                  </el-form-item>

                  <!-- 颜色选择 -->
                  <el-row :gutter="12">
                    <el-col :span="12">
                      <el-form-item label="前景色">
                        <el-color-picker v-model="env.darkColor" show-alpha />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="背景色">
                        <el-color-picker v-model="env.lightColor" show-alpha />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <!-- 样式选择 -->
                  <el-form-item label="二维码样式">
                    <el-radio-group v-model="env.customStyle" class="qrcode-tool__style-group">
                      <el-radio v-for="style in env.customStyles" :key="style.value" :label="style.value">
                        <div class="qrcode-tool__style-option">
                          <IconifyIconOnline :icon="style.icon" />
                          <span>{{ style.label }}</span>
                        </div>
                      </el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <!-- Logo设置 -->
                  <el-form-item label="添加Logo">
                    <div class="qrcode-tool__logo-container">
                      <div class="qrcode-tool__logo-preview" v-if="env.logoPreview">
                        <img :src="env.logoPreview" alt="Logo" />
                        <div class="qrcode-tool__logo-actions">
                          <el-button type="danger" size="small" circle @click="removeLogo">
                            <IconifyIconOnline icon="ri:delete-bin-line" />
                          </el-button>
                        </div>
                      </div>
                      <div class="qrcode-tool__logo-upload" v-else>
                        <el-upload action="" :auto-upload="false" :show-file-list="false" accept="image/*" @change="uploadLogo">
                          <el-button type="primary">
                            <IconifyIconOnline icon="ri:image-add-line" />
                            <span>上传Logo</span>
                          </el-button>
                        </el-upload>
                      </div>

                      <el-slider v-if="env.logoPreview" v-model="env.logoSize" :min="20" :max="120" :step="5" :format-tooltip="(value) => `${value}px`" @change="generateQRCode" />
                    </div>
                  </el-form-item>
                  <!-- 输出格式 -->
                  <el-form-item label="输出格式">
                    <div class="qrcode-tool__format-cards">
                      <div v-for="item in env.outputFormats" :key="item.value" class="qrcode-tool__format-card" :class="{ 'is-active': env.outputFormat === item.value }" @click="env.outputFormat = item.value">
                        <div class="qrcode-tool__format-icon">
                          <IconifyIconOnline :icon="item.value === 'png' ? 'ri:progress-6-line' : item.value === 'jpeg' ? 'ri:file-jpg-line' : 'ri:file-code-line'" />
                        </div>
                        <div class="qrcode-tool__format-label">{{ item.label }}</div>
                      </div>
                    </div>
                  </el-form-item>

                  <!-- 边距设置 -->
                  <el-form-item label="边距">
                    <el-slider v-model="env.margin" :min="0" :max="10" :step="1" show-input />
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>

            <!-- 右侧预览区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="qrcode-tool__result-card" shadow="hover">
                <template #header>
                  <div class="qrcode-tool__card-header">
                    <IconifyIconOnline icon="ri:qr-scan-line" class="qrcode-tool__card-icon" />
                    <span>二维码预览</span>
                  </div>
                </template>

                <!-- 空状态提示 -->
                <el-empty v-if="!env.qrCodeDataUrl" description="请先输入内容并生成二维码" class="qrcode-tool__empty">
                  <template #image>
                    <IconifyIconOnline icon="ri:qr-code-line" class="qrcode-tool__empty-icon" />
                  </template>
                </el-empty>

                <!-- 二维码预览 -->
                <div v-else class="qrcode-tool__preview">
                  <div class="qrcode-tool__preview-image">
                    <img :src="env.qrCodeDataUrl" alt="QR Code" />
                  </div>

                  <div class="qrcode-tool__preview-actions">
                    <el-button type="primary" @click="downloadQRCode">
                      <IconifyIconOnline icon="ri:download-line" />
                      <span>下载</span>
                    </el-button>

                    <el-button type="success" @click="copyQRCodeToClipboard">
                      <IconifyIconOnline icon="ri:clipboard-line" />
                      <span>复制</span>
                    </el-button>
                  </div>

                  <div class="qrcode-tool__preview-info">
                    <div class="qrcode-tool__preview-info-item">
                      <span class="qrcode-tool__preview-info-label">尺寸:</span>
                      <span class="qrcode-tool__preview-info-value">{{ env.qrSize }}px × {{ env.qrSize }}px</span>
                    </div>
                    <div class="qrcode-tool__preview-info-item">
                      <span class="qrcode-tool__preview-info-label">纠错级别:</span>
                      <span class="qrcode-tool__preview-info-value">{{ env.errorCorrectionLevel }}</span>
                    </div>
                    <div class="qrcode-tool__preview-info-item">
                      <span class="qrcode-tool__preview-info-label">内容长度:</span>
                      <span class="qrcode-tool__preview-info-value">{{ env.inputValue.length }} 字符</span>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 解析二维码选项卡 -->
        <el-tab-pane label="解析二维码" name="scan">
          <el-row :gutter="24">
            <!-- 左侧上传区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="qrcode-tool__scan-card" shadow="hover">
                <template #header>
                  <div class="qrcode-tool__card-header">
                    <IconifyIconOnline icon="ri:qr-scan-line" class="qrcode-tool__card-icon" />
                    <span>上传二维码图片</span>
                  </div>
                </template>

                <div class="qrcode-tool__scan-upload">
                  <el-upload action="" :auto-upload="false" :show-file-list="false" accept="image/*" drag @change="parseQRCodeImage">
                    <div class="qrcode-tool__upload-content">
                      <IconifyIconOnline icon="ri:upload-cloud-line" class="qrcode-tool__upload-icon" />
                      <div class="qrcode-tool__upload-text">
                        <span>拖拽二维码图片到此处，或</span>
                        <el-button type="primary" size="small">点击上传</el-button>
                      </div>
                      <div class="qrcode-tool__upload-tip">支持 JPG、PNG、GIF 等常见图片格式</div>
                    </div>
                  </el-upload>
                </div>

                <!-- 历史记录区域 -->
                <div class="qrcode-tool__scan-history" v-if="env.scanHistory.length > 0">
                  <div class="qrcode-tool__history-label">
                    <IconifyIconOnline icon="ri:history-line" class="qrcode-tool__history-icon" />
                    <span>解析历史:</span>
                  </div>
                  <div class="qrcode-tool__scan-history-items">
                    <div v-for="(item, index) in env.scanHistory" :key="index" class="qrcode-tool__scan-history-item" @click="env.scanResult = item.text">
                      <div class="qrcode-tool__scan-history-text">
                        {{ item.text.length > 30 ? item.text.substring(0, 30) + "..." : item.text }}
                      </div>
                      <div class="qrcode-tool__scan-history-time">
                        {{ new Date(item.timestamp).toLocaleString() }}
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <!-- 右侧结果区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="qrcode-tool__scan-result-card" shadow="hover">
                <template #header>
                  <div class="qrcode-tool__card-header">
                    <IconifyIconOnline icon="ri:file-list-line" class="qrcode-tool__card-icon" />
                    <span>解析结果</span>
                  </div>
                </template>

                <!-- 空状态提示 -->
                <el-empty v-if="!env.scanResult" description="请先上传二维码图片" class="qrcode-tool__empty">
                  <template #image>
                    <IconifyIconOnline icon="ri:qr-scan-line" class="qrcode-tool__empty-icon" />
                  </template>
                </el-empty>

                <!-- 结果显示 -->
                <div v-else class="qrcode-tool__scan-result">
                  <div class="qrcode-tool__scan-result-content">
                    <el-input v-model="env.scanResult" type="textarea" :rows="6" readonly class="qrcode-tool__scan-result-text" />
                  </div>

                  <div class="qrcode-tool__scan-result-actions">
                    <el-button type="primary" @click="copyResultToClipboard">
                      <IconifyIconOnline icon="ri:clipboard-line" />
                      <span>复制结果</span>
                    </el-button>

                    <el-button type="success" @click="openUrl" v-if="env.scanResult.startsWith('http')">
                      <IconifyIconOnline icon="ri:external-link-line" />
                      <span>打开链接</span>
                    </el-button>
                  </div>

                  <!-- 智能识别区域 -->
                  <div class="qrcode-tool__scan-detect" v-if="env.scanResult">
                    <div class="qrcode-tool__scan-detect-title">
                      <IconifyIconOnline icon="ri:radar-line" class="qrcode-tool__scan-detect-icon" />
                      <span>智能识别</span>
                    </div>

                    <div class="qrcode-tool__scan-detect-content">
                      <!-- URL 识别 -->
                      <div class="qrcode-tool__scan-detect-item" v-if="env.scanResult.startsWith('http')">
                        <div class="qrcode-tool__scan-detect-type">
                          <IconifyIconOnline icon="ri:links-line" />
                          <span>网址链接</span>
                        </div>
                        <el-button type="primary" size="small" @click="openUrl">
                          <IconifyIconOnline icon="ri:external-link-line" />
                          <span>访问网站</span>
                        </el-button>
                      </div>

                      <!-- 电话号码识别 -->
                      <div class="qrcode-tool__scan-detect-item" v-if="/^tel:|\+?\d{11}$/.test(env.scanResult)">
                        <div class="qrcode-tool__scan-detect-type">
                          <IconifyIconOnline icon="ri:phone-line" />
                          <span>电话号码</span>
                        </div>
                        <el-button type="primary" size="small" @click="window.location.href = `tel:${env.scanResult.replace('tel:', '')}`">
                          <IconifyIconOnline icon="ri:phone-line" />
                          <span>拨打电话</span>
                        </el-button>
                      </div>

                      <!-- 邮箱识别 -->
                      <div class="qrcode-tool__scan-detect-item" v-if="/^mailto:|[\w.-]+@[\w.-]+\.\w+$/.test(env.scanResult)">
                        <div class="qrcode-tool__scan-detect-type">
                          <IconifyIconOnline icon="ri:mail-line" />
                          <span>电子邮箱</span>
                        </div>
                        <el-button type="primary" size="small" @click="window.location.href = `mailto:${env.scanResult.replace('mailto:', '')}`">
                          <IconifyIconOnline icon="ri:mail-send-line" />
                          <span>发送邮件</span>
                        </el-button>
                      </div>

                      <!-- WiFi 识别 -->
                      <div class="qrcode-tool__scan-detect-item" v-if="env.scanResult.startsWith('WIFI:')">
                        <div class="qrcode-tool__scan-detect-type">
                          <IconifyIconOnline icon="ri:wifi-line" />
                          <span>WiFi 配置</span>
                        </div>
                        <div class="qrcode-tool__scan-detect-details">
                          <div v-for="(part, index) in env.scanResult.replace('WIFI:', '').split(';')" :key="index" class="qrcode-tool__scan-detect-detail">
                            {{ part }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.qrcode-tool {
  padding: 20px;

  &__format-cards {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__format-card {
    flex: 1;
    min-width: 80px;
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    border: 2px solid transparent;
    cursor: pointer;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__format-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }

  &__format-label {
    font-size: 14px;
    font-weight: 500;
  }
  &__content {
    margin: 0 auto;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary));
    border-radius: 12px;
    padding: 30px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
  }

  &__header-inner {
    max-width: 800px;
  }

  &__header-title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  &__header-subtitle {
    font-size: 16px;
    opacity: 0.8;
  }

  &__main-tabs {
    :deep(.el-tabs__nav-wrap) {
      padding: 0 10px;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      padding: 0 20px;
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
  }

  &__card-icon {
    margin-right: 10px;
    font-size: 20px;
  }

  &__input-card,
  &__options-card,
  &__result-card,
  &__scan-card,
  &__scan-result-card {
    margin-bottom: 24px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
  }

  &__input {
    width: 100%;
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    gap: 12px;
  }

  &__generate-btn,
  &__reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__history {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__history-label {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__history-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  &__history-items {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 10px;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color);
      border-radius: 3px;
    }
  }

  &__history-item {
    flex: 0 0 auto;
    width: 80px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }
  }

  &__history-preview {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    margin-bottom: 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__history-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__select {
    width: 100%;
  }

  &__option-content {
    display: flex;
    flex-direction: column;
  }

  &__option-description {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__templates {
    margin-bottom: 20px;
  }

  &__templates-label {
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--el-text-color-primary);
  }

  &__templates-items {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__template-item {
    cursor: pointer;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__template-color {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    i {
      font-size: 24px;
    }
  }

  &__template-name {
    font-size: 12px;
    color: var(--el-text-color-primary);
  }

  &__style-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__style-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__logo-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  &__logo-preview {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__logo-actions {
    position: absolute;
    top: 5px;
    right: 5px;
  }

  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 60px;
    color: var(--el-color-info-light-5);
  }

  &__preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  &__preview-image {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    img {
      max-width: 100%;
      height: auto;
    }
  }

  &__preview-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__preview-info {
    width: 100%;
    padding: 15px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__preview-info-item {
    display: flex;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__preview-info-label {
    font-weight: 600;
    color: var(--el-text-color-secondary);
    width: 80px;
  }

  &__preview-info-value {
    color: var(--el-text-color-primary);
  }

  &__scan-upload {
    padding: 20px;
  }

  &__upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
  }

  &__upload-icon {
    font-size: 48px;
    color: var(--el-color-primary-light-3);
    margin-bottom: 16px;
  }

  &__upload-text {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__upload-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__scan-history {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__scan-history-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__scan-history-item {
    padding: 12px;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9);
      transform: translateX(5px);
    }
  }

  &__scan-history-text {
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 5px;
  }

  &__scan-history-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__scan-result {
    padding: 20px;
  }

  &__scan-result-content {
    margin-bottom: 20px;
  }

  &__scan-result-text {
    width: 100%;
  }

  &__scan-result-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__scan-detect {
    padding: 15px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__scan-detect-title {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__scan-detect-icon {
    margin-right: 8px;
    font-size: 18px;
    color: var(--el-color-success);
  }

  &__scan-detect-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__scan-detect-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: var(--el-bg-color);
    border-radius: 8px;
  }

  &__scan-detect-type {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  &__scan-detect-details {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__scan-detect-detail {
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
