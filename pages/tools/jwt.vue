<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import * as jose from "jose";
import { saveAs } from "file-saver";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 环境变量
const env = reactive({
  activeTab: "decode",
  loading: false,
  // 解码相关
  jwtInput: "",
  header: null,
  payload: null,
  signature: "",
  isValid: null,
  // 编码相关
  headerInput: `{
  "alg": "HS256",
  "typ": "JWT"
}`,
  payloadInput: `{
  "sub": "1234567890",
  "name": "用户名",
  "iat": ${Math.floor(Date.now() / 1000)},
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`,
  secretKey: "",
  algorithm: "HS256",
  encodedJWT: "",
  // 验证相关
  verifyJwtInput: "",
  verifySecretKey: "",
  verifyAlgorithm: "HS256",
  verifyResult: null,
  // 历史记录
  history: [],
  // 算法选项
  algorithms: [
    { value: "HS256", label: "HS256 (HMAC + SHA256)" },
    { value: "HS384", label: "HS384 (HMAC + SHA384)" },
    { value: "HS512", label: "HS512 (HMAC + SHA512)" },
    { value: "RS256", label: "RS256 (RSA + SHA256)" },
    { value: "RS384", label: "RS384 (RSA + SHA384)" },
    { value: "RS512", label: "RS512 (RSA + SHA512)" },
    { value: "ES256", label: "ES256 (ECDSA + P-256 + SHA256)" },
    { value: "ES384", label: "ES384 (ECDSA + P-384 + SHA384)" },
    { value: "ES512", label: "ES512 (ECDSA + P-521 + SHA512)" },
  ],
  // 常用模板
  templates: [
    {
      name: "用户认证",
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        sub: "user123",
        name: "张三",
        role: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
    },
    {
      name: "API访问令牌",
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        client_id: "api_client_123",
        scope: "read write",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    },
    {
      name: "刷新令牌",
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        sub: "user123",
        token_type: "refresh",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 2592000, // 30天
      },
    },
  ],
});

/**
 * 解码JWT
 */
const decodeJWT = () => {
  if (!env.jwtInput) {
    message(t("message.inputRequired") || "请输入JWT", { type: "warning" });
    return;
  }

  try {
    env.loading = true;

    // 解析JWT
    const parts = env.jwtInput.split(".");
    if (parts.length !== 3) {
      throw new Error("JWT格式不正确，应包含三部分");
    }

    // 解码头部和载荷
    env.header = JSON.parse(atob(parts[0]));
    env.payload = JSON.parse(atob(parts[1]));
    env.signature = parts[2];

    // 检查过期时间
    if (env.payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (env.payload.exp < now) {
        env.isValid = false;
        message("JWT已过期", { type: "warning" });
      } else {
        env.isValid = null; // 需要密钥验证
      }
    }

    // 添加到历史记录
    addToHistory(env.jwtInput, "decode");

    message(t("message.decodeSuccess") || "解码成功", { type: "success" });
  } catch (error) {
    console.error("解码错误:", error);
    message(t("message.decodeError") || "解码失败: " + error.message, { type: "error" });
    env.header = null;
    env.payload = null;
    env.signature = "";
    env.isValid = null;
  } finally {
    env.loading = false;
  }
};

/**
 * 编码JWT
 */
const encodeJWT = async () => {
  if (!env.headerInput || !env.payloadInput) {
    message(t("message.inputRequired") || "请输入头部和载荷", { type: "warning" });
    return;
  }

  if (!env.secretKey && env.algorithm.startsWith("HS")) {
    message(t("message.secretRequired") || "请输入密钥", { type: "warning" });
    return;
  }

  try {
    env.loading = true;

    // 解析JSON
    const header = JSON.parse(env.headerInput);
    const payload = JSON.parse(env.payloadInput);

    // 强制设置算法
    header.alg = env.algorithm;

    // 使用jose库签名
    let jwt;
    if (env.algorithm.startsWith("HS")) {
      // HMAC算法
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(env.secretKey);

      jwt = await new jose.SignJWT(payload).setProtectedHeader(header).sign(secretKey);
    } else {
      // 其他算法需要密钥对，这里简化处理
      message("目前仅支持HMAC算法", { type: "warning" });
      return;
    }

    env.encodedJWT = jwt;

    // 添加到历史记录
    addToHistory(jwt, "encode");

    message(t("message.encodeSuccess") || "编码成功", { type: "success" });
  } catch (error) {
    console.error("编码错误:", error);
    message(t("message.encodeError") || "编码失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 验证JWT
 */
const verifyJWT = async () => {
  if (!env.verifyJwtInput) {
    message(t("message.inputRequired") || "请输入JWT", { type: "warning" });
    return;
  }

  if (!env.verifySecretKey && env.verifyAlgorithm.startsWith("HS")) {
    message(t("message.secretRequired") || "请输入密钥", { type: "warning" });
    return;
  }

  try {
    env.loading = true;

    // 使用jose库验证
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(env.verifySecretKey);

    const { payload, protectedHeader } = await jose.jwtVerify(env.verifyJwtInput, secretKey, {
      algorithms: [env.verifyAlgorithm],
    });

    env.verifyResult = {
      valid: true,
      payload,
      header: protectedHeader,
    };

    message(t("message.verifySuccess") || "验证成功", { type: "success" });
  } catch (error) {
    console.error("验证错误:", error);
    env.verifyResult = {
      valid: false,
      error: error.message,
    };
    message(t("message.verifyError") || "验证失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 添加到历史记录
 */
const addToHistory = (jwt, type) => {
  // 检查是否已存在
  const exists = env.history.some((item) => item.jwt === jwt);
  if (!exists) {
    env.history.unshift({
      jwt,
      type,
      timestamp: new Date().toISOString(),
    });

    // 限制历史记录数量
    if (env.history.length > 10) {
      env.history.pop();
    }
  }
};

/**
 * 从历史记录中选择
 */
const selectFromHistory = (item) => {
  if (item.type === "decode") {
    env.jwtInput = item.jwt;
    env.activeTab = "decode";
    decodeJWT();
  } else if (item.type === "encode") {
    env.encodedJWT = item.jwt;
    env.activeTab = "encode";
  }
};

/**
 * 应用模板
 */
const applyTemplate = (template) => {
  env.headerInput = JSON.stringify(template.header, null, 2);
  env.payloadInput = JSON.stringify(template.payload, null, 2);
};

/**
 * 复制到剪贴板
 */
const copyToClipboard = (text, message) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess") || "已复制到剪贴板", { type: "success" });
    })
    .catch((error) => {
      console.error("复制错误:", error);
      message(t("message.copyError") || "复制失败: " + error.message, { type: "error" });
    });
};

/**
 * 下载JWT
 */
const downloadJWT = () => {
  if (!env.encodedJWT) {
    message(t("message.noJWT") || "没有可下载的JWT", { type: "warning" });
    return;
  }

  try {
    const blob = new Blob([env.encodedJWT], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `jwt-token-${new Date().getTime()}.txt`);
    message(t("message.downloadSuccess") || "下载成功", { type: "success" });
  } catch (error) {
    console.error("下载错误:", error);
    message(t("message.downloadError") || "下载失败: " + error.message, { type: "error" });
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  if (env.activeTab === "decode") {
    env.jwtInput = "";
    env.header = null;
    env.payload = null;
    env.signature = "";
    env.isValid = null;
  } else if (env.activeTab === "encode") {
    env.headerInput = `{
  "alg": "HS256",
  "typ": "JWT"
}`;
    env.payloadInput = `{
  "sub": "1234567890",
  "name": "用户名",
  "iat": ${Math.floor(Date.now() / 1000)},
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`;
    env.secretKey = "";
    env.encodedJWT = "";
  } else if (env.activeTab === "verify") {
    env.verifyJwtInput = "";
    env.verifySecretKey = "";
    env.verifyResult = null;
  }
};

/**
 * 格式化JSON
 */
const formatJSON = (json) => {
  try {
    if (typeof json === "string") {
      return JSON.stringify(JSON.parse(json), null, 2);
    } else {
      return JSON.stringify(json, null, 2);
    }
  } catch (error) {
    console.error("格式化JSON错误:", error);
    return json;
  }
};

/**
 * 防抖处理
 */
const debounceProcess = (func) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    func();
  }, 500);
};

// 计算属性：JWT过期状态
const expirationStatus = computed(() => {
  if (!env.payload || !env.payload.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  const exp = env.payload.exp;

  if (exp < now) {
    return { status: "expired", message: "已过期" };
  } else {
    const remaining = exp - now;
    if (remaining < 60) {
      return { status: "warning", message: `即将过期 (${remaining}秒)` };
    } else if (remaining < 3600) {
      return { status: "warning", message: `即将过期 (${Math.floor(remaining / 60)}分钟)` };
    } else {
      return { status: "valid", message: `有效 (${Math.floor(remaining / 3600)}小时)` };
    }
  }
});

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
});
</script>

<template>
  <div class="jwt-tool">
    <div class="jwt-tool__content">
      <!-- 页面头部区域 -->
      <div class="jwt-tool__header-container">
        <div class="jwt-tool__header">
          <div class="jwt-tool__header-inner">
            <div class="jwt-tool__header-title">JWT 工具</div>
            <div class="jwt-tool__header-subtitle">JSON Web Token 编码、解码与验证</div>
          </div>
        </div>
      </div>

      <el-tabs v-model="env.activeTab" class="jwt-tool__main-tabs">
        <!-- 解码选项卡 -->
        <el-tab-pane label="解码 JWT" name="decode">
          <el-row :gutter="24">
            <!-- 左侧输入区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="jwt-tool__input-card" shadow="hover">
                <template #header>
                  <div class="jwt-tool__card-header">
                    <IconifyIconOnline icon="ri:key-line" class="jwt-tool__card-icon" />
                    <span>输入 JWT</span>
                  </div>
                </template>

                <el-form label-position="top">
                  <!-- JWT输入框 -->
                  <el-form-item label="输入需要解码的 JWT">
                    <el-input v-model="env.jwtInput" type="textarea" :rows="6" placeholder="请输入 JWT 令牌" clearable class="jwt-tool__input" @input="() => debounceProcess(decodeJWT)" />
                  </el-form-item>

                  <!-- 历史记录区域 -->
                  <div class="jwt-tool__history" v-if="env.history.length > 0">
                    <div class="jwt-tool__history-label">
                      <IconifyIconOnline icon="ri:history-line" class="jwt-tool__history-icon" />
                      <span>历史记录:</span>
                    </div>
                    <div class="jwt-tool__history-items">
                      <div v-for="(item, index) in env.history" :key="index" class="jwt-tool__history-item" @click="selectFromHistory(item)">
                        <div class="jwt-tool__history-preview">
                          <IconifyIconOnline :icon="item.type === 'decode' ? 'ri:key-line' : 'ri:lock-line'" class="jwt-tool__history-icon-preview" />
                        </div>
                        <div class="jwt-tool__history-text">
                          {{ item.jwt.substring(0, 15) + "..." }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮区域 -->
                  <div class="jwt-tool__actions">
                    <el-button type="primary" :loading="env.loading" class="jwt-tool__decode-btn" @click="decodeJWT">
                      <IconifyIconOnline icon="ri:key-line" />
                      <span>解码 JWT</span>
                    </el-button>

                    <el-button class="jwt-tool__reset-btn" @click="resetForm">
                      <IconifyIconOnline icon="ri:refresh-line" />
                      <span>重置</span>
                    </el-button>
                  </div>
                </el-form>
              </el-card>
            </el-col>

            <!-- 右侧结果区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="jwt-tool__result-card" shadow="hover">
                <template #header>
                  <div class="jwt-tool__card-header">
                    <IconifyIconOnline icon="ri:file-list-line" class="jwt-tool__card-icon" />
                    <span>解码结果</span>
                  </div>
                </template>

                <el-empty v-if="!env.header && !env.payload" description="请先输入并解码 JWT" class="jwt-tool__empty">
                  <template #image>
                    <IconifyIconOnline icon="ri:key-line" class="jwt-tool__empty-icon" />
                  </template>
                </el-empty>

                <div v-else class="jwt-tool__results">
                  <!-- 头部信息 -->
                  <div class="jwt-tool__result-section">
                    <div class="jwt-tool__result-section-header">
                      <IconifyIconOnline icon="ri:file-info-line" class="jwt-tool__result-section-icon" />
                      <span>头部 (Header)</span>
                      <el-button type="primary" size="small" class="jwt-tool__copy-btn" @click="copyToClipboard(JSON.stringify(env.header, null, 2), message)">
                        <IconifyIconOnline icon="ri:clipboard-line" />
                      </el-button>
                    </div>
                    <div class="jwt-tool__result-content">
                      <pre class="jwt-tool__json-display">{{ formatJSON(env.header) }}</pre>
                    </div>
                  </div>

                  <!-- 载荷信息 -->
                  <div class="jwt-tool__result-section">
                    <div class="jwt-tool__result-section-header">
                      <IconifyIconOnline icon="ri:file-text-line" class="jwt-tool__result-section-icon" />
                      <span>载荷 (Payload)</span>
                      <el-button type="primary" size="small" class="jwt-tool__copy-btn" @click="copyToClipboard(JSON.stringify(env.payload, null, 2), message)">
                        <IconifyIconOnline icon="ri:clipboard-line" />
                      </el-button>
                    </div>
                    <div class="jwt-tool__result-content">
                      <pre class="jwt-tool__json-display">{{ formatJSON(env.payload) }}</pre>
                    </div>
                  </div>

                  <!-- 签名信息 -->
                  <div class="jwt-tool__result-section">
                    <div class="jwt-tool__result-section-header">
                      <IconifyIconOnline icon="ri:shield-check-line" class="jwt-tool__result-section-icon" />
                      <span>签名 (Signature)</span>
                      <el-button type="primary" size="small" class="jwt-tool__copy-btn" @click="copyToClipboard(env.signature, message)">
                        <IconifyIconOnline icon="ri:clipboard-line" />
                      </el-button>
                    </div>
                    <div class="jwt-tool__result-content">
                      <div class="jwt-tool__signature">{{ env.signature }}</div>
                    </div>
                  </div>

                  <!-- 过期信息 -->
                  <div v-if="env.payload && env.payload.exp" class="jwt-tool__result-section">
                    <div class="jwt-tool__result-section-header">
                      <IconifyIconOnline icon="ri:time-line" class="jwt-tool__result-section-icon" />
                      <span>过期状态</span>
                    </div>
                    <div class="jwt-tool__result-content">
                      <div
                        class="jwt-tool__expiration"
                        :class="{
                          'jwt-tool__expiration--expired': expirationStatus.status === 'expired',
                          'jwt-tool__expiration--warning': expirationStatus.status === 'warning',
                          'jwt-tool__expiration--valid': expirationStatus.status === 'valid',
                        }"
                      >
                        <IconifyIconOnline :icon="expirationStatus.status === 'expired' ? 'ri:time-fill' : expirationStatus.status === 'warning' ? 'ri:alarm-warning-line' : 'ri:shield-check-fill'" class="jwt-tool__expiration-icon" />
                        <span>{{ expirationStatus.message }}</span>
                        <span class="jwt-tool__expiration-time"> 过期时间: {{ new Date(env.payload.exp * 1000).toLocaleString() }} </span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 编码选项卡 -->
        <el-tab-pane label="编码 JWT" name="encode">
          <el-row :gutter="24">
            <!-- 左侧输入区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="jwt-tool__input-card" shadow="hover">
                <template #header>
                  <div class="jwt-tool__card-header">
                    <IconifyIconOnline icon="ri:lock-line" class="jwt-tool__card-icon" />
                    <span>创建 JWT</span>
                  </div>
                </template>

                <el-form label-position="top">
                  <!-- 模板选择 -->
                  <div class="jwt-tool__templates">
                    <div class="jwt-tool__templates-label">预设模板:</div>
                    <div class="jwt-tool__templates-items">
                      <el-button v-for="(template, index) in env.templates" :key="index" size="small" @click="applyTemplate(template)">
                        {{ template.name }}
                      </el-button>
                    </div>
                  </div>

                  <!-- 头部输入 -->
                  <el-form-item label="头部 (Header)">
                    <el-input v-model="env.headerInput" type="textarea" :rows="4" placeholder="请输入 JWT 头部 JSON" class="jwt-tool__input" />
                  </el-form-item>

                  <!-- 载荷输入 -->
                  <el-form-item label="载荷 (Payload)">
                    <el-input v-model="env.payloadInput" type="textarea" :rows="6" placeholder="请输入 JWT 载荷 JSON" class="jwt-tool__input" />
                  </el-form-item>

                  <!-- 算法选择 -->
                  <el-form-item label="签名算法">
                    <el-select v-model="env.algorithm" class="jwt-tool__select">
                      <el-option v-for="item in env.algorithms" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <!-- 密钥输入 -->
                  <el-form-item label="密钥">
                    <el-input v-model="env.secretKey" placeholder="请输入密钥" :type="env.algorithm.startsWith('HS') ? 'password' : 'textarea'" :rows="env.algorithm.startsWith('HS') ? 1 : 4" show-password class="jwt-tool__input" />
                    <div class="jwt-tool__input-tip">
                      {{ env.algorithm.startsWith("HS") ? "对称密钥" : "非对称密钥 (目前仅支持HMAC算法)" }}
                    </div>
                  </el-form-item>

                  <!-- 操作按钮区域 -->
                  <div class="jwt-tool__actions">
                    <el-button type="primary" :loading="env.loading" class="jwt-tool__encode-btn" @click="encodeJWT">
                      <IconifyIconOnline icon="ri:lock-line" />
                      <span>生成 JWT</span>
                    </el-button>

                    <el-button class="jwt-tool__reset-btn" @click="resetForm">
                      <IconifyIconOnline icon="ri:refresh-line" />
                      <span>重置</span>
                    </el-button>
                  </div>
                </el-form>
              </el-card>
            </el-col>

            <!-- 右侧结果区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="jwt-tool__result-card" shadow="hover">
                <template #header>
                  <div class="jwt-tool__card-header">
                    <IconifyIconOnline icon="ri:key-line" class="jwt-tool__card-icon" />
                    <span>生成结果</span>
                  </div>
                </template>

                <el-empty v-if="!env.encodedJWT" description="请先创建 JWT" class="jwt-tool__empty">
                  <template #image>
                    <IconifyIconOnline icon="ri:lock-line" class="jwt-tool__empty-icon" />
                  </template>
                </el-empty>

                <div v-else class="jwt-tool__results">
                  <div class="jwt-tool__result-section">
                    <div class="jwt-tool__result-section-header">
                      <IconifyIconOnline icon="ri:key-line" class="jwt-tool__result-section-icon" />
                      <span>JWT 令牌</span>
                    </div>
                    <div class="jwt-tool__result-content">
                      <div class="jwt-tool__encoded-jwt">
                        <div class="jwt-tool__jwt-parts">
                          <span v-for="(part, index) in env.encodedJWT.split('.')" :key="index" class="jwt-tool__jwt-part" :class="`jwt-tool__jwt-part-${index}`">
                            {{ part }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="jwt-tool__result-actions">
                    <el-button type="primary" @click="copyToClipboard(env.encodedJWT, message)">
                      <IconifyIconOnline icon="ri:clipboard-line" />
                      <span>复制 JWT</span>
                    </el-button>

                    <el-button type="success" @click="downloadJWT">
                      <IconifyIconOnline icon="ri:download-line" />
                      <span>下载 JWT</span>
                    </el-button>
                  </div>

                  <div class="jwt-tool__result-info">
                    <div class="jwt-tool__result-info-item">
                      <span class="jwt-tool__result-info-label">算法:</span>
                      <span class="jwt-tool__result-info-value">{{ env.algorithm }}</span>
                    </div>
                    <div class="jwt-tool__result-info-item">
                      <span class="jwt-tool__result-info-label">过期时间:</span>
                      <span class="jwt-tool__result-info-value">
                        {{ env.payload && env.payload.exp ? new Date(env.payload.exp * 1000).toLocaleString() : "未设置" }}
                      </span>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 验证选项卡 -->
        <el-tab-pane label="验证 JWT" name="verify">
          <el-row :gutter="24">
            <!-- 左侧输入区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="jwt-tool__input-card" shadow="hover">
                <template #header>
                  <div class="jwt-tool__card-header">
                    <IconifyIconOnline icon="ri:shield-check-line" class="jwt-tool__card-icon" />
                    <span>验证 JWT</span>
                  </div>
                </template>

                <el-form label-position="top">
                  <!-- JWT输入框 -->
                  <el-form-item label="输入需要验证的 JWT">
                    <el-input v-model="env.verifyJwtInput" type="textarea" :rows="6" placeholder="请输入 JWT 令牌" clearable class="jwt-tool__input" />
                  </el-form-item>

                  <!-- 算法选择 -->
                  <el-form-item label="签名算法">
                    <el-select v-model="env.verifyAlgorithm" class="jwt-tool__select">
                      <el-option v-for="item in env.algorithms" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <!-- 密钥输入 -->
                  <el-form-item label="密钥">
                    <el-input v-model="env.verifySecretKey" placeholder="请输入密钥" :type="env.verifyAlgorithm.startsWith('HS') ? 'password' : 'textarea'" :rows="env.verifyAlgorithm.startsWith('HS') ? 1 : 4" show-password class="jwt-tool__input" />
                    <div class="jwt-tool__input-tip">
                      {{ env.verifyAlgorithm.startsWith("HS") ? "对称密钥" : "非对称密钥 (目前仅支持HMAC算法)" }}
                    </div>
                  </el-form-item>

                  <!-- 操作按钮区域 -->
                  <div class="jwt-tool__actions">
                    <el-button type="primary" :loading="env.loading" class="jwt-tool__verify-btn" @click="verifyJWT">
                      <IconifyIconOnline icon="ri:shield-check-line" />
                      <span>验证 JWT</span>
                    </el-button>

                    <el-button class="jwt-tool__reset-btn" @click="resetForm">
                      <IconifyIconOnline icon="ri:refresh-line" />
                      <span>重置</span>
                    </el-button>
                  </div>
                </el-form>
              </el-card>
            </el-col>

            <!-- 右侧结果区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="jwt-tool__result-card" shadow="hover">
                <template #header>
                  <div class="jwt-tool__card-header">
                    <IconifyIconOnline icon="ri:check-double-line" class="jwt-tool__card-icon" />
                    <span>验证结果</span>
                  </div>
                </template>

                <el-empty v-if="!env.verifyResult" description="请先验证 JWT" class="jwt-tool__empty">
                  <template #image>
                    <IconifyIconOnline icon="ri:shield-check-line" class="jwt-tool__empty-icon" />
                  </template>
                </el-empty>

                <div v-else class="jwt-tool__results">
                  <!-- 验证状态 -->
                  <div class="jwt-tool__verify-status" :class="{ 'is-valid': env.verifyResult.valid, 'is-invalid': !env.verifyResult.valid }">
                    <IconifyIconOnline :icon="env.verifyResult.valid ? 'ri:check-double-line' : 'ri:close-circle-line'" class="jwt-tool__verify-status-icon" />
                    <span class="jwt-tool__verify-status-text">
                      {{ env.verifyResult.valid ? "JWT 验证通过" : "JWT 验证失败" }}
                    </span>
                  </div>

                  <!-- 错误信息 -->
                  <div v-if="!env.verifyResult.valid" class="jwt-tool__verify-error">
                    <div class="jwt-tool__verify-error-title">错误信息:</div>
                    <div class="jwt-tool__verify-error-message">{{ env.verifyResult.error }}</div>
                  </div>

                  <!-- 验证成功信息 -->
                  <div v-if="env.verifyResult.valid" class="jwt-tool__verify-details">
                    <!-- 头部信息 -->
                    <div class="jwt-tool__result-section">
                      <div class="jwt-tool__result-section-header">
                        <IconifyIconOnline icon="ri:file-info-line" class="jwt-tool__result-section-icon" />
                        <span>头部 (Header)</span>
                      </div>
                      <div class="jwt-tool__result-content">
                        <pre class="jwt-tool__json-display">{{ formatJSON(env.verifyResult.header) }}</pre>
                      </div>
                    </div>

                    <!-- 载荷信息 -->
                    <div class="jwt-tool__result-section">
                      <div class="jwt-tool__result-section-header">
                        <IconifyIconOnline icon="ri:file-text-line" class="jwt-tool__result-section-icon" />
                        <span>载荷 (Payload)</span>
                      </div>
                      <div class="jwt-tool__result-content">
                        <pre class="jwt-tool__json-display">{{ formatJSON(env.verifyResult.payload) }}</pre>
                      </div>
                    </div>

                    <!-- 过期信息 -->
                    <div v-if="env.verifyResult.payload && env.verifyResult.payload.exp" class="jwt-tool__result-section">
                      <div class="jwt-tool__result-section-header">
                        <IconifyIconOnline icon="ri:time-line" class="jwt-tool__result-section-icon" />
                        <span>过期时间</span>
                      </div>
                      <div class="jwt-tool__result-content">
                        <div class="jwt-tool__expiration-time">
                          {{ new Date(env.verifyResult.payload.exp * 1000).toLocaleString() }}
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
.jwt-tool {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    margin: 0 auto;
    padding: 20px;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
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

  &__main-tabs {
    margin-bottom: 20px;

    :deep(.el-tabs__header) {
      margin-bottom: 24px;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      padding: 0 24px;
    }
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
  &__options-card,
  &__scan-card,
  &__scan-result-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    height: 100%;
  }

  &__input {
    width: 100%;
    font-family: monospace;
  }

  &__select {
    width: 100%;
  }

  &__input-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    gap: 12px;
  }

  &__decode-btn,
  &__encode-btn,
  &__verify-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__result-section {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    overflow: hidden;
  }

  &__result-section-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background-color: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-light);
    font-weight: 600;
    position: relative;
  }

  &__result-section-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  &__copy-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  &__result-content {
    padding: 16px;
    background-color: var(--el-bg-color);
  }

  &__json-display {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
  }

  &__signature {
    font-family: monospace;
    word-break: break-all;
    font-size: 14px;
    line-height: 1.5;
  }

  &__expiration {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 6px;
    font-weight: 500;

    &--expired {
      background-color: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }

    &--warning {
      background-color: var(--el-color-warning-light-9);
      color: var(--el-color-warning-dark-2);
    }

    &--valid {
      background-color: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }
  }

  &__expiration-icon {
    font-size: 20px;
  }

  &__expiration-time {
    margin-left: auto;
    font-size: 14px;
    font-weight: normal;
  }

  &__history {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  &__history-label {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__history-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  &__history-items {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__history-item {
    flex: 0 0 calc(33.33% - 8px);
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }

  &__history-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    margin-bottom: 8px;
  }

  &__history-icon-preview {
    font-size: 24px;
    color: var(--el-color-primary);
  }

  &__history-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    word-break: break-all;
  }

  &__templates {
    margin-bottom: 20px;
  }

  &__templates-label {
    font-weight: 600;
    margin-bottom: 12px;
  }

  &__templates-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__encoded-jwt {
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
  }

  &__jwt-parts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: monospace;
    word-break: break-all;
  }

  &__jwt-part {
    padding: 8px;
    border-radius: 4px;
    font-size: 14px;

    &-0 {
      background-color: rgba(var(--el-color-primary-rgb), 0.1);
      color: var(--el-color-primary);
    }

    &-1 {
      background-color: rgba(var(--el-color-success-rgb), 0.1);
      color: var(--el-color-success);
    }

    &-2 {
      background-color: rgba(var(--el-color-warning-rgb), 0.1);
      color: var(--el-color-warning-dark-2);
    }
  }

  &__result-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  &__result-info {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 12px 16px;
  }

  &__result-info-item {
    display: flex;
    align-items: center;
  }

  &__result-info-label {
    font-weight: 600;
    margin-right: 8px;
    min-width: 80px;
  }

  &__verify-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;

    &.is-valid {
      background-color: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }

    &.is-invalid {
      background-color: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }

  &__verify-status-icon {
    font-size: 24px;
  }

  &__verify-error {
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  &__verify-error-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--el-color-danger);
  }

  &__verify-error-message {
    font-family: monospace;
    word-break: break-all;
  }

  &__verify-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (max-width: 768px) {
    &__history-item {
      flex: 0 0 calc(50% - 6px);
    }
  }

  @media (max-width: 576px) {
    &__history-item {
      flex: 0 0 100%;
    }
  }
}
</style>
