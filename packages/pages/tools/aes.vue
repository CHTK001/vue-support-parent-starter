<script setup>
import { ref, reactive, onMounted } from "vue";
import { useClipboard } from "@vueuse/core";
import { ElMessage } from "element-plus";
import CryptoJS from "crypto-js";

const { copy } = useClipboard();

// 环境变量
const env = reactive({
  inputText: "",
  outputText: "",
  key: "",
  iv: "",
  mode: "CBC",
  padding: "Pkcs7",
  keySize: "256",
  outputType: "base64",
  action: "encrypt",
  loading: false,
  history: [],
  modes: [
    { label: "CBC (推荐)", value: "CBC" },
    { label: "ECB", value: "ECB" },
    { label: "CFB", value: "CFB" },
    { label: "OFB", value: "OFB" },
    { label: "CTR", value: "CTR" },
  ],
  paddings: [
    { label: "Pkcs7 (推荐)", value: "Pkcs7" },
    { label: "Iso97971", value: "Iso97971" },
    { label: "AnsiX923", value: "AnsiX923" },
    { label: "Iso10126", value: "Iso10126" },
    { label: "ZeroPadding", value: "ZeroPadding" },
    { label: "NoPadding", value: "NoPadding" },
  ],
  keySizes: [
    { label: "128位", value: "128" },
    { label: "192位", value: "192" },
    { label: "256位 (推荐)", value: "256" },
  ],
  outputTypes: [
    { label: "Base64", value: "base64" },
    { label: "Hex", value: "hex" },
  ],
  examples: [
    {
      name: "CBC模式加密示例",
      input: "Hello, World!",
      key: "0123456789abcdef0123456789abcdef",
      iv: "0123456789abcdef",
      mode: "CBC",
      padding: "Pkcs7",
      keySize: "256",
      action: "encrypt",
    },
    {
      name: "ECB模式加密示例",
      input: "Hello, World!",
      key: "0123456789abcdef0123456789abcdef",
      iv: "",
      mode: "ECB",
      padding: "Pkcs7",
      keySize: "256",
      action: "encrypt",
    },
  ],
});

// 生成随机密钥
const generateRandomKey = () => {
  const keyLength = parseInt(env.keySize) / 8;
  const randomArray = new Uint8Array(keyLength);
  window.crypto.getRandomValues(randomArray);
  env.key = Array.from(randomArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// 生成随机IV
const generateRandomIV = () => {
  const randomArray = new Uint8Array(16);
  window.crypto.getRandomValues(randomArray);
  env.iv = Array.from(randomArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// 执行加密
const encrypt = () => {
  try {
    env.loading = true;

    if (!env.inputText) {
      ElMessage.warning("请输入要加密的内容");
      env.loading = false;
      return;
    }

    if (!env.key) {
      ElMessage.warning("请输入密钥");
      env.loading = false;
      return;
    }

    if (env.mode !== "ECB" && !env.iv) {
      ElMessage.warning("CBC模式需要提供初始向量(IV)");
      env.loading = false;
      return;
    }

    // 准备密钥和IV
    const keyBytes = CryptoJS.enc.Hex.parse(env.key);
    const ivBytes = env.iv ? CryptoJS.enc.Hex.parse(env.iv) : CryptoJS.enc.Hex.parse("00000000000000000000000000000000");

    // 配置加密选项
    const options = {
      mode: CryptoJS.mode[env.mode],
      padding: CryptoJS.pad[env.padding],
    };

    if (env.mode !== "ECB") {
      options.iv = ivBytes;
    }

    // 执行加密
    const encrypted = CryptoJS.AES.encrypt(env.inputText, keyBytes, options);

    // 根据输出类型格式化结果
    if (env.outputType === "base64") {
      env.outputText = encrypted.toString();
    } else {
      env.outputText = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    }

    // 添加到历史记录
    addToHistory("加密", env.inputText, env.outputText);

    ElMessage.success("加密成功");
  } catch (error) {
    console.error("加密错误:", error);
    ElMessage.error("加密失败: " + error.message);
    env.outputText = "";
  } finally {
    env.loading = false;
  }
};

// 执行解密
const decrypt = () => {
  try {
    env.loading = true;

    if (!env.inputText) {
      ElMessage.warning("请输入要解密的内容");
      env.loading = false;
      return;
    }

    if (!env.key) {
      ElMessage.warning("请输入密钥");
      env.loading = false;
      return;
    }

    if (env.mode !== "ECB" && !env.iv) {
      ElMessage.warning("CBC模式需要提供初始向量(IV)");
      env.loading = false;
      return;
    }

    // 准备密钥和IV
    const keyBytes = CryptoJS.enc.Hex.parse(env.key);
    const ivBytes = env.iv ? CryptoJS.enc.Hex.parse(env.iv) : CryptoJS.enc.Hex.parse("00000000000000000000000000000000");

    // 配置解密选项
    const options = {
      mode: CryptoJS.mode[env.mode],
      padding: CryptoJS.pad[env.padding],
    };

    if (env.mode !== "ECB") {
      options.iv = ivBytes;
    }

    // 根据输入类型处理密文
    let cipherParams;
    if (env.outputType === "base64") {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(env.inputText),
      });
    } else {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(env.inputText),
      });
    }

    // 执行解密
    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyBytes, options);

    // 转换为UTF-8字符串
    env.outputText = decrypted.toString(CryptoJS.enc.Utf8);

    // 添加到历史记录
    addToHistory("解密", env.inputText, env.outputText);

    ElMessage.success("解密成功");
  } catch (error) {
    console.error("解密错误:", error);
    ElMessage.error("解密失败: " + error.message);
    env.outputText = "";
  } finally {
    env.loading = false;
  }
};

// 处理操作
const handleAction = () => {
  if (env.action === "encrypt") {
    encrypt();
  } else {
    decrypt();
  }
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  copy(text)
    .then(() => {
      ElMessage.success("已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
      ElMessage.error("复制失败");
    });
};

// 添加到历史记录
const addToHistory = (type, input, output) => {
  env.history.unshift({
    type,
    input: input.length > 50 ? input.substring(0, 50) + "..." : input,
    output: output.length > 50 ? output.substring(0, 50) + "..." : output,
    date: new Date().toLocaleString(),
    fullInput: input,
    fullOutput: output,
  });

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.inputText = item.fullInput;
  env.outputText = item.fullOutput;
};

// 使用示例
const useExample = (example) => {
  env.inputText = example.input;
  env.key = example.key;
  env.iv = example.iv;
  env.mode = example.mode;
  env.padding = example.padding;
  env.keySize = example.keySize;
  env.action = example.action;
};

// 重置表单
const resetForm = () => {
  env.inputText = "";
  env.outputText = "";
  env.key = "";
  env.iv = "";
  env.mode = "CBC";
  env.padding = "Pkcs7";
  env.keySize = "256";
  env.outputType = "base64";
  env.action = "encrypt";
};

// 交换输入输出
const swapInputOutput = () => {
  const temp = env.inputText;
  env.inputText = env.outputText;
  env.outputText = temp;
  // 切换操作类型
  env.action = env.action === "encrypt" ? "decrypt" : "encrypt";
};

onMounted(() => {
  // 初始化
});
</script>

<template>
  <div class="aes-tool">
    <div class="aes-tool__content">
      <!-- 头部信息 -->
      <div class="aes-tool__header-container">
        <div class="aes-tool__header">
          <div class="aes-tool__header-inner">
            <h1 class="aes-tool__header-title">AES 加解密工具</h1>
            <p class="aes-tool__header-subtitle">高级加密标准(AES)加密和解密工具，支持多种模式和填充方式</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="aes-tool__input-card" shadow="hover">
            <template #header>
              <div class="aes-tool__card-header">
                <IconifyIconOnline :icon="env.action === 'encrypt' ? 'ri:lock-line' : 'ri:lock-unlock-line'" class="aes-tool__card-icon" />
                <span>{{ env.action === "encrypt" ? "加密" : "解密" }}</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 操作类型选择 -->
              <el-form-item label="操作类型">
                <el-radio-group v-model="env.action" class="aes-tool__radio-group">
                  <el-radio label="encrypt">
                    <div class="aes-tool__radio-content">
                      <IconifyIconOnline icon="ri:lock-line" />
                      <span>加密</span>
                    </div>
                  </el-radio>
                  <el-radio label="decrypt">
                    <div class="aes-tool__radio-content">
                      <IconifyIconOnline icon="ri:lock-unlock-line" />
                      <span>解密</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 输入文本 -->
              <el-form-item :label="env.action === 'encrypt' ? '待加密文本' : '待解密文本'">
                <el-input v-model="env.inputText" type="textarea" :rows="5" :placeholder="env.action === 'encrypt' ? '请输入要加密的文本' : '请输入要解密的文本'" class="aes-tool__input" />
              </el-form-item>

              <!-- 密钥 -->
              <el-form-item label="密钥 (Hex格式)">
                <div class="aes-tool__input-group">
                  <el-input v-model="env.key" placeholder="请输入16/24/32字节的密钥(Hex格式)" class="aes-tool__input" />
                  <el-button type="primary" @click="generateRandomKey">
                    <IconifyIconOnline icon="ri:refresh-line" />
                    <span>生成随机密钥</span>
                  </el-button>
                </div>
                <div class="aes-tool__input-tip">密钥长度: 128位=16字节(32个Hex字符), 192位=24字节(48个Hex字符), 256位=32字节(64个Hex字符)</div>
              </el-form-item>

              <!-- 初始向量 -->
              <el-form-item label="初始向量 IV (Hex格式)" v-if="env.mode !== 'ECB'">
                <div class="aes-tool__input-group">
                  <el-input v-model="env.iv" placeholder="请输入16字节的初始向量(Hex格式)" class="aes-tool__input" />
                  <el-button type="primary" @click="generateRandomIV">
                    <IconifyIconOnline icon="ri:refresh-line" />
                    <span>生成随机IV</span>
                  </el-button>
                </div>
                <div class="aes-tool__input-tip">初始向量长度: 16字节(32个Hex字符)，ECB模式不需要IV</div>
              </el-form-item>

              <!-- 加密模式 -->
              <el-form-item label="加密模式">
                <el-select v-model="env.mode" placeholder="选择加密模式" class="aes-tool__select">
                  <el-option v-for="item in env.modes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <!-- 填充方式 -->
              <el-form-item label="填充方式">
                <el-select v-model="env.padding" placeholder="选择填充方式" class="aes-tool__select">
                  <el-option v-for="item in env.paddings" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <!-- 密钥长度 -->
              <el-form-item label="密钥长度">
                <el-select v-model="env.keySize" placeholder="选择密钥长度" class="aes-tool__select">
                  <el-option v-for="item in env.keySizes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <!-- 输出格式 -->
              <el-form-item label="输出格式">
                <el-select v-model="env.outputType" placeholder="选择输出格式" class="aes-tool__select">
                  <el-option v-for="item in env.outputTypes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <!-- 操作按钮 -->
              <div class="aes-tool__actions">
                <el-button type="primary" :loading="env.loading" class="aes-tool__action-btn" @click="handleAction">
                  <IconifyIconOnline :icon="env.action === 'encrypt' ? 'ri:lock-line' : 'ri:lock-unlock-line'" />
                  <span>{{ env.action === "encrypt" ? "加密" : "解密" }}</span>
                </el-button>

                <el-button type="success" class="aes-tool__swap-btn" @click="swapInputOutput">
                  <IconifyIconOnline icon="ri:swap-line" />
                  <span>交换输入输出</span>
                </el-button>

                <el-button class="aes-tool__reset-btn" @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>
              </div>
            </el-form>
          </el-card>

          <!-- 示例 -->
          <el-card class="aes-tool__examples-card" shadow="hover">
            <template #header>
              <div class="aes-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="aes-tool__card-icon" />
                <span>示例</span>
              </div>
            </template>

            <div class="aes-tool__examples">
              <div v-for="(example, index) in env.examples" :key="index" class="aes-tool__example-item" @click="useExample(example)">
                <div class="aes-tool__example-header">
                  <span class="aes-tool__example-name">{{ example.name }}</span>
                </div>
                <div class="aes-tool__example-details">
                  <div class="aes-tool__example-detail">
                    <span class="aes-tool__example-label">输入:</span>
                    <span class="aes-tool__example-value">{{ example.input }}</span>
                  </div>
                  <div class="aes-tool__example-detail">
                    <span class="aes-tool__example-label">模式:</span>
                    <span class="aes-tool__example-value">{{ example.mode }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="aes-tool__result-card" shadow="hover">
            <template #header>
              <div class="aes-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="aes-tool__card-icon" />
                <span>结果</span>
              </div>
            </template>

            <el-empty v-if="!env.outputText" description="请先执行加密或解密操作" class="aes-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:lock-line" class="aes-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="aes-tool__result">
              <el-form-item label="输出结果">
                <el-input v-model="env.outputText" type="textarea" :rows="8" readonly class="aes-tool__output" />
                <div class="aes-tool__result-actions">
                  <el-button type="primary" @click="copyToClipboard(env.outputText)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    <span>复制结果</span>
                  </el-button>
                </div>
              </el-form-item>
            </div>
          </el-card>

          <!-- 历史记录 -->
          <el-card class="aes-tool__history-card" shadow="hover">
            <template #header>
              <div class="aes-tool__card-header">
                <IconifyIconOnline icon="ri:history-line" class="aes-tool__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="aes-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="aes-tool__empty-icon" />
              </template>
            </el-empty>

            <el-table v-else :data="env.history" style="width: 100%" max-height="300">
              <el-table-column label="类型" width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.type === '加密' ? 'success' : 'warning'">{{ scope.row.type }}</el-tag>
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
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.aes-tool {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary));
    border-radius: 12px;
    padding: 24px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-inner {
    max-width: 800px;
  }

  &__header-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__header-subtitle {
    font-size: 16px;
    opacity: 0.9;
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
  }

  &__input-card,
  &__result-card,
  &__examples-card,
  &__history-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  &__input,
  &__output,
  &__select {
    width: 100%;
    font-family: monospace;

    &:deep(.el-input__wrapper) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover,
      &.is-focus {
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.1),
          0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }
  }

  &__input-group {
    display: flex;
    gap: 10px;
  }

  &__input-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__radio-group {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .el-radio {
      margin-right: 0;
      padding: 8px 0;

      &.is-checked {
        .aes-tool__radio-content {
          color: var(--el-color-primary);
          transform: translateY(-2px);
        }
      }
    }
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    gap: 12px;
  }

  &__action-btn,
  &__swap-btn,
  &__reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__result-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  &__examples {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__example-item {
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }

  &__example-header {
    margin-bottom: 8px;
  }

  &__example-name {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__example-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__example-detail {
    display: flex;
    font-size: 12px;
  }

  &__example-label {
    color: var(--el-text-color-secondary);
    margin-right: 8px;
    min-width: 40px;
  }

  &__example-value {
    color: var(--el-text-color-regular);
  }

  @media (max-width: 768px) {
    &__actions {
      flex-wrap: wrap;
    }

    &__input-group {
      flex-direction: column;
    }
  }
}
</style>
