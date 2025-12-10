<script setup>
import { ref, reactive, onMounted } from "vue";
import { useClipboard } from "@vueuse/core";
import { message } from "@repo/utils";

const { copy } = useClipboard();

// 环境变量
const env = reactive({
  generatorType: "string", // 默认为字符串生成器
  loading: false,
  history: [], // 历史记录
  outputResults: [], // 输出结果

  // 字符串生成器配置
  stringConfig: {
    length: 16, // 默认长度
    count: 1, // 生成数量
    uppercase: true, // 大写字母
    lowercase: true, // 小写字母
    numbers: true, // 数字
    symbols: false, // 特殊符号
    excludeSimilar: false, // 排除相似字符
    excludeAmbiguous: false, // 排除歧义字符
    customCharset: "", // 自定义字符集
    useCustomCharset: false, // 是否使用自定义字符集
  },

  // 数字生成器配置
  numberConfig: {
    min: 1, // 最小值
    max: 100, // 最大值
    count: 1, // 生成数量
    decimal: 0, // 小数位数
    unique: false, // 是否唯一
    sorted: false, // 是否排序
  },

  // 字符集
  charsets: {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>/?",
    similar: "il1Lo0O",
    ambiguous: "`{}[]()/'\"\\~,;:.<>",
  },

  // 预设配置
  presets: [
    {
      label: "强密码",
      type: "string",
      config: {
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeSimilar: true,
        excludeAmbiguous: true,
        count: 1,
      },
    },
    {
      label: "PIN码",
      type: "string",
      config: {
        length: 6,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        excludeSimilar: false,
        excludeAmbiguous: false,
        count: 1,
      },
    },
    {
      label: "用户名",
      type: "string",
      config: {
        length: 8,
        uppercase: false,
        lowercase: true,
        numbers: true,
        symbols: false,
        excludeSimilar: true,
        excludeAmbiguous: true,
        count: 1,
      },
    },
    {
      label: "UUID",
      type: "uuid",
      config: {
        uppercase: false,
        count: 1,
      },
    },
    {
      label: "骰子(1-6)",
      type: "number",
      config: {
        min: 1,
        max: 6,
        decimal: 0,
        count: 1,
        unique: false,
        sorted: false,
      },
    },
    {
      label: "彩票号码",
      type: "number",
      config: {
        min: 1,
        max: 49,
        decimal: 0,
        count: 7,
        unique: true,
        sorted: true,
      },
    },
  ],
});

// 生成随机字符串
const generateRandomString = () => {
  try {
    env.loading = true;

    const config = env.stringConfig;
    let charset = "";

    // 使用自定义字符集
    if (config.useCustomCharset && config.customCharset) {
      charset = config.customCharset;
    } else {
      // 构建字符集
      if (config.uppercase) charset += env.charsets.uppercase;
      if (config.lowercase) charset += env.charsets.lowercase;
      if (config.numbers) charset += env.charsets.numbers;
      if (config.symbols) charset += env.charsets.symbols;

      // 排除相似字符
      if (config.excludeSimilar) {
        for (const char of env.charsets.similar) {
          charset = charset.replace(new RegExp(char, "g"), "");
        }
      }

      // 排除歧义字符
      if (config.excludeAmbiguous) {
        for (const char of env.charsets.ambiguous) {
          charset = charset.replace(new RegExp("\\" + char, "g"), "");
        }
      }
    }

    if (!charset) {
      message("请至少选择一种字符类型", { type: "warning" });
      env.loading = false;
      return;
    }

    // 生成随机字符串
    const results = [];
    for (let i = 0; i < config.count; i++) {
      let result = "";
      for (let j = 0; j < config.length; j++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
      }
      results.push(result);
    }

    // 设置输出结果
    env.outputResults = results.map((result) => ({
      label: "随机字符串",
      value: result,
    }));

    // 添加到历史记录
    addToHistory("string", results, config);

    message("生成成功", { type: "success" });
  } catch (error) {
    console.error("生成错误:", error);
    message("生成失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 生成UUID
const generateUUID = () => {
  try {
    env.loading = true;

    const config = env.stringConfig;
    const results = [];

    for (let i = 0; i < config.count; i++) {
      let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

      if (config.uppercase) {
        uuid = uuid.toUpperCase();
      }

      results.push(uuid);
    }

    // 设置输出结果
    env.outputResults = results.map((result) => ({
      label: "UUID",
      value: result,
    }));

    // 添加到历史记录
    addToHistory("uuid", results, config);

    message("生成成功", { type: "success" });
  } catch (error) {
    console.error("生成错误:", error);
    message("生成失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 生成随机数字
const generateRandomNumber = () => {
  try {
    env.loading = true;

    const config = env.numberConfig;

    if (config.min > config.max) {
      message("最小值不能大于最大值", { type: "warning" });
      env.loading = false;
      return;
    }

    if (config.unique && config.count > config.max - config.min + 1) {
      message(`在范围 ${config.min}-${config.max} 内无法生成 ${config.count} 个唯一数字`, { type: "warning" });
      env.loading = false;
      return;
    }

    // 生成随机数字
    const results = [];
    const usedNumbers = new Set();

    for (let i = 0; i < config.count; i++) {
      let randomNum;

      do {
        // 生成随机数
        const range = config.max - config.min;
        const random = Math.random() * (range + 1) + config.min;

        // 处理小数位数
        if (config.decimal === 0) {
          randomNum = Math.floor(random);
        } else {
          randomNum = parseFloat(random.toFixed(config.decimal));
        }
      } while (config.unique && usedNumbers.has(randomNum));

      usedNumbers.add(randomNum);
      results.push(randomNum);
    }

    // 排序
    if (config.sorted) {
      results.sort((a, b) => a - b);
    }

    // 设置输出结果
    env.outputResults = results.map((result) => ({
      label: "随机数字",
      value: result.toString(),
    }));

    // 添加到历史记录
    addToHistory("number", results, config);

    message("生成成功", { type: "success" });
  } catch (error) {
    console.error("生成错误:", error);
    message("生成失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 生成随机内容
const generateRandom = () => {
  if (env.generatorType === "string") {
    generateRandomString();
  } else if (env.generatorType === "uuid") {
    generateUUID();
  } else if (env.generatorType === "number") {
    generateRandomNumber();
  }
};

// 添加到历史记录
const addToHistory = (type, results, config) => {
  let configSummary = "";

  if (type === "string") {
    configSummary = `长度: ${config.length}, 字符: ${getCharsetDescription(config)}`;
  } else if (type === "uuid") {
    configSummary = `UUID ${config.uppercase ? "大写" : "小写"}`;
  } else if (type === "number") {
    configSummary = `范围: ${config.min}-${config.max}, 小数位: ${config.decimal}`;
    if (config.unique) configSummary += ", 唯一";
    if (config.sorted) configSummary += ", 已排序";
  }

  env.history.unshift({
    type,
    results,
    config: JSON.parse(JSON.stringify(config)),
    configSummary,
    date: new Date().toLocaleString(),
  });

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }
};

// 获取字符集描述
const getCharsetDescription = (config) => {
  const parts = [];
  if (config.uppercase) parts.push("大写字母");
  if (config.lowercase) parts.push("小写字母");
  if (config.numbers) parts.push("数字");
  if (config.symbols) parts.push("符号");
  if (config.useCustomCharset) parts.push("自定义");
  return parts.join(", ");
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.generatorType = item.type;

  if (item.type === "string" || item.type === "uuid") {
    env.stringConfig = { ...item.config };
  } else if (item.type === "number") {
    env.numberConfig = { ...item.config };
  }

  // 设置输出结果
  env.outputResults = item.results.map((result) => ({
    label: item.type === "string" ? "随机字符串" : item.type === "uuid" ? "UUID" : "随机数字",
    value: result.toString(),
  }));
};

// 应用预设配置
const applyPreset = (preset) => {
  env.generatorType = preset.type;

  if (preset.type === "string" || preset.type === "uuid") {
    env.stringConfig = { ...env.stringConfig, ...preset.config };
  } else if (preset.type === "number") {
    env.numberConfig = { ...env.numberConfig, ...preset.config };
  }
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  copy(text)
    .then(() => {
      message("已复制到剪贴板", { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message("复制失败", { type: "error" });
    });
};

// 复制所有结果
const copyAllResults = () => {
  if (env.outputResults.length === 0) {
    message("没有可复制的结果", { type: "warning" });
    return;
  }

  const text = env.outputResults.map((result) => result.value).join("\n");
  copyToClipboard(text);
};

// 重置表单
const resetForm = () => {
  if (env.generatorType === "string" || env.generatorType === "uuid") {
    env.stringConfig = {
      length: 16,
      count: 1,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeSimilar: false,
      excludeAmbiguous: false,
      customCharset: "",
      useCustomCharset: false,
    };
  } else if (env.generatorType === "number") {
    env.numberConfig = {
      min: 1,
      max: 100,
      count: 1,
      decimal: 0,
      unique: false,
      sorted: false,
    };
  }

  env.outputResults = [];
};

// 获取结果图标
const getResultIcon = (label) => {
  if (label.includes("随机字符串")) return "ri:text";
  if (label.includes("UUID")) return "ri:fingerprint-line";
  if (label.includes("随机数字")) return "ri:number-5";
  return "ri:information-line";
};

// 组件挂载时初始化
onMounted(() => {
  // 初始化操作
});
</script>

<template>
  <div class="random-tool">
    <div class="random-tool__content">
      <!-- 头部信息 -->
      <div class="random-tool__header-container">
        <div class="random-tool__header">
          <div class="random-tool__header-inner">
            <h1 class="random-tool__header-title">随机生成器</h1>
            <p class="random-tool__header-subtitle">生成随机字符串、UUID和随机数字，支持自定义参数和多种预设</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="random-tool__input-card" shadow="hover">
            <template #header>
              <div class="random-tool__card-header">
                <IconifyIconOnline icon="ri:shuffle-line" class="random-tool__card-icon" />
                <span>随机生成器</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 生成器类型选择 -->
              <el-form-item label="生成器类型">
                <el-radio-group v-model="env.generatorType" class="random-tool__radio-group">
                  <el-radio label="string">
                    <div class="random-tool__radio-content">
                      <IconifyIconOnline icon="ri:text" />
                      <span>随机字符串</span>
                    </div>
                  </el-radio>
                  <el-radio label="uuid">
                    <div class="random-tool__radio-content">
                      <IconifyIconOnline icon="ri:fingerprint-line" />
                      <span>UUID</span>
                    </div>
                  </el-radio>
                  <el-radio label="number">
                    <div class="random-tool__radio-content">
                      <IconifyIconOnline icon="ri:number-5" />
                      <span>随机数字</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 预设配置 -->
              <el-form-item label="预设配置">
                <div class="random-tool__presets">
                  <el-button v-for="(preset, index) in env.presets" :key="index" size="small" @click="applyPreset(preset)" :type="env.generatorType === preset.type ? 'primary' : 'default'" class="random-tool__preset-btn">
                    {{ preset.label }}
                  </el-button>
                </div>
              </el-form-item>

              <!-- 字符串生成器配置 -->
              <template v-if="env.generatorType === 'string'">
                <el-form-item label="字符串长度">
                  <el-input-number v-model="env.stringConfig.length" :min="1" :max="1000" class="random-tool__input-number" />
                </el-form-item>

                <el-form-item label="生成数量">
                  <el-input-number v-model="env.stringConfig.count" :min="1" :max="100" class="random-tool__input-number" />
                </el-form-item>

                <el-form-item label="字符集">
                  <div class="random-tool__checkbox-group">
                    <el-checkbox v-model="env.stringConfig.uppercase" label="大写字母 (A-Z)" border />
                    <el-checkbox v-model="env.stringConfig.lowercase" label="小写字母 (a-z)" border />
                    <el-checkbox v-model="env.stringConfig.numbers" label="数字 (0-9)" border />
                    <el-checkbox v-model="env.stringConfig.symbols" label="特殊符号 (!@#$...)" border />
                  </div>
                </el-form-item>

                <el-form-item label="排除选项">
                  <div class="random-tool__checkbox-group">
                    <el-checkbox v-model="env.stringConfig.excludeSimilar" label="排除相似字符 (i, l, 1, L, o, 0, O)" border />
                    <el-checkbox v-model="env.stringConfig.excludeAmbiguous" label="排除歧义字符 ({}, [], (), /, \, 等)" border />
                  </div>
                </el-form-item>

                <el-form-item label="自定义字符集">
                  <div class="random-tool__custom-charset">
                    <el-checkbox v-model="env.stringConfig.useCustomCharset" label="使用自定义字符集" />
                    <el-input v-model="env.stringConfig.customCharset" placeholder="输入自定义字符集" :disabled="!env.stringConfig.useCustomCharset" class="random-tool__input" />
                  </div>
                </el-form-item>
              </template>

              <!-- UUID生成器配置 -->
              <template v-if="env.generatorType === 'uuid'">
                <el-form-item label="UUID格式">
                  <el-radio-group v-model="env.stringConfig.uppercase" class="random-tool__radio-group">
                    <el-radio :label="false">
                      <div class="random-tool__radio-content">
                        <span>小写 (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)</span>
                      </div>
                    </el-radio>
                    <el-radio :label="true">
                      <div class="random-tool__radio-content">
                        <span>大写 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)</span>
                      </div>
                    </el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="生成数量">
                  <el-input-number v-model="env.stringConfig.count" :min="1" :max="100" class="random-tool__input-number" />
                </el-form-item>
              </template>

              <!-- 数字生成器配置 -->
              <template v-if="env.generatorType === 'number'">
                <el-form-item label="数值范围">
                  <div class="random-tool__range">
                    <el-input-number v-model="env.numberConfig.min" placeholder="最小值" class="random-tool__input-number" />
                    <span class="random-tool__range-separator">至</span>
                    <el-input-number v-model="env.numberConfig.max" placeholder="最大值" class="random-tool__input-number" />
                  </div>
                </el-form-item>

                <el-form-item label="小数位数">
                  <el-input-number v-model="env.numberConfig.decimal" :min="0" :max="10" class="random-tool__input-number" />
                </el-form-item>

                <el-form-item label="生成数量">
                  <el-input-number v-model="env.numberConfig.count" :min="1" :max="1000" class="random-tool__input-number" />
                </el-form-item>

                <el-form-item label="高级选项">
                  <div class="random-tool__checkbox-group">
                    <el-checkbox v-model="env.numberConfig.unique" label="生成唯一数字" border />
                    <el-checkbox v-model="env.numberConfig.sorted" label="结果排序" border />
                  </div>
                </el-form-item>
              </template>

              <!-- 操作按钮 -->
              <div class="random-tool__actions">
                <el-button type="primary" :loading="env.loading" class="random-tool__generate-btn" @click="generateRandom">
                  <IconifyIconOnline icon="ri:shuffle-line" />
                  <span>生成随机{{ env.generatorType === "string" ? "字符串" : env.generatorType === "uuid" ? "UUID" : "数字" }}</span>
                </el-button>

                <el-button class="random-tool__reset-btn" @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>
              </div>
            </el-form>
          </el-card>

          <!-- 历史记录 -->
          <el-card class="random-tool__history-card" shadow="hover">
            <template #header>
              <div class="random-tool__card-header">
                <IconifyIconOnline icon="ri:history-line" class="random-tool__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="random-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="random-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="random-tool__history">
              <div v-for="(item, index) in env.history" :key="index" class="random-tool__history-item" @click="loadFromHistory(item)">
                <div class="random-tool__history-content">
                  <div class="random-tool__history-type">
                    <IconifyIconOnline :icon="item.type === 'string' ? 'ri:text' : item.type === 'uuid' ? 'ri:fingerprint-line' : 'ri:number-5'" class="random-tool__history-icon" />
                    <span>{{ item.type === "string" ? "随机字符串" : item.type === "uuid" ? "UUID" : "随机数字" }}</span>
                  </div>
                  <div class="random-tool__history-value">{{ item.results[0] }}{{ item.results.length > 1 ? ` 等 ${item.results.length} 项` : "" }}</div>
                  <div class="random-tool__history-meta">
                    <span class="random-tool__history-config">{{ item.configSummary }}</span>
                    <span class="random-tool__history-date">{{ item.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="random-tool__result-card" shadow="hover">
            <template #header>
              <div class="random-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="random-tool__card-icon" />
                <span>生成结果</span>
                <div class="random-tool__header-actions" v-if="env.outputResults.length">
                  <el-button type="primary" link size="small" @click="copyAllResults">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    <span>复制全部</span>
                  </el-button>
                </div>
              </div>
            </template>

            <el-empty v-if="!env.outputResults.length" description="请先生成随机内容" class="random-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:shuffle-line" class="random-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="random-tool__results">
              <div v-for="(result, index) in env.outputResults" :key="index" class="random-tool__result-item">
                <div class="random-tool__result-label">
                  <IconifyIconOnline :icon="getResultIcon(result.label)" class="random-tool__result-icon" />
                  <span>{{ result.label }} #{{ index + 1 }}</span>
                </div>
                <div class="random-tool__result-value">
                  <span>{{ result.value }}</span>
                  <el-button type="primary" link size="small" class="random-tool__copy-btn" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 参考卡片 -->
          <el-card class="random-tool__reference-card" shadow="hover">
            <template #header>
              <div class="random-tool__card-header">
                <IconifyIconOnline icon="ri:information-line" class="random-tool__card-icon" />
                <span>使用说明</span>
              </div>
            </template>

            <div class="random-tool__reference">
              <el-collapse accordion>
                <el-collapse-item title="随机字符串生成器" name="string">
                  <div class="random-tool__reference-content">
                    <p>随机字符串生成器可以生成指定长度和字符集的随机字符串，常用于：</p>
                    <ul>
                      <li>生成安全密码</li>
                      <li>创建会话标识符</li>
                      <li>生成临时令牌</li>
                      <li>创建随机用户名</li>
                    </ul>
                    <p>您可以自定义字符串长度、字符集和生成数量，还可以排除容易混淆的字符。</p>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="UUID生成器" name="uuid">
                  <div class="random-tool__reference-content">
                    <p>UUID (通用唯一标识符) 是一种标准化的标识符格式，保证在时间和空间上的唯一性。</p>
                    <p>UUID常用于：</p>
                    <ul>
                      <li>数据库记录的唯一标识</li>
                      <li>分布式系统中的对象标识</li>
                      <li>跨系统的数据同步</li>
                      <li>防止数据冲突</li>
                    </ul>
                    <p>标准UUID格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx，其中x是任何十六进制数字，y是8、9、A或B中的一个。</p>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="随机数字生成器" name="number">
                  <div class="random-tool__reference-content">
                    <p>随机数字生成器可以在指定范围内生成随机数字，支持整数和小数，常用于：</p>
                    <ul>
                      <li>模拟掷骰子或抽奖</li>
                      <li>生成测试数据</li>
                      <li>随机抽样</li>
                      <li>生成彩票号码</li>
                    </ul>
                    <p>您可以设置数值范围、小数位数、生成数量，还可以选择是否生成唯一数字和是否对结果排序。</p>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="常见用途" name="usage">
                  <div class="random-tool__reference-content">
                    <p>随机生成器在以下场景中特别有用：</p>
                    <ul>
                      <li><strong>安全性</strong>：生成强密码、安全令牌和加密密钥</li>
                      <li><strong>开发测试</strong>：生成测试数据、模拟用户ID和随机值</li>
                      <li><strong>游戏开发</strong>：创建随机事件、掷骰子和抽奖功能</li>
                      <li><strong>统计分析</strong>：生成随机样本和模拟数据</li>
                      <li><strong>数据库</strong>：生成唯一标识符和主键</li>
                    </ul>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.random-tool {
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
    background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
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

    .random-tool__header-actions {
      margin-left: auto;
    }
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
  }

  &__input-card,
  &__result-card,
  &__history-card,
  &__reference-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  &__radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__preset-btn {
    margin-right: 0;
  }

  &__input-number {
    width: 100%;
  }

  &__checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__custom-charset {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__range {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__range-separator {
    color: var(--el-text-color-secondary);
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

  &__result-item {
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  &__result-label {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__result-icon {
    margin-right: 8px;
  }

  &__result-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-color-primary);
    word-break: break-all;
  }

  &__copy-btn {
    margin-left: 8px;
  }

  &__history {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
  }

  &__history-item {
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

  &__history-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__history-type {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  &__history-icon {
    font-size: 16px;
  }

  &__history-value {
    font-weight: 600;
    color: var(--el-color-primary);
    word-break: break-all;
  }

  &__history-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__reference-content {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;

    ul {
      padding-left: 20px;
      margin: 8px 0;
    }

    p {
      margin: 8px 0;
    }
  }

  @media (max-width: 768px) {
    &__radio-group {
      flex-direction: column;
      gap: 8px;
    }

    &__range {
      flex-direction: column;
      align-items: stretch;
    }

    &__range-separator {
      text-align: center;
      padding: 4px 0;
    }

    &__actions {
      flex-wrap: wrap;
    }
  }
}
</style>
