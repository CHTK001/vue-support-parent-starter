<script setup>
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

// 响应式数据
const env = reactive({
  // 输入值
  inputValue: "",
  // 输入进制
  inputBase: "10",
  // 输出结果
  outputResults: [],
  // 加载状态
  loading: false,
  // 历史记录
  history: [],
  // 常用进制选项
  baseOptions: [
    { label: "二进制", value: "2" },
    { label: "八进制", value: "8" },
    { label: "十进制", value: "10" },
    { label: "十六进制", value: "16" },
  ],
  // 扩展进制选项
  extendedBaseOptions: [
    { label: "三进制", value: "3" },
    { label: "四进制", value: "4" },
    { label: "五进制", value: "5" },
    { label: "六进制", value: "6" },
    { label: "七进制", value: "7" },
    { label: "九进制", value: "9" },
    { label: "十一进制", value: "11" },
    { label: "十二进制", value: "12" },
    { label: "三十二进制", value: "32" },
    { label: "三十六进制", value: "36" },
  ],
  // 显示扩展进制
  showExtendedBases: false,
  // 显示字符转换
  showCharConversion: false,
  // 字符输入
  charInput: "",
  // 字符输出
  charOutput: "",
});

// 进制转换函数
const convertBase = () => {
  try {
    env.loading = true;

    if (!env.inputValue) {
      throw new Error("请输入要转换的数值");
    }

    // 验证输入是否符合当前进制
    const inputBase = parseInt(env.inputBase);
    const validChars = getValidCharsForBase(inputBase);
    const inputValue = env.inputValue.toLowerCase();

    for (let i = 0; i < inputValue.length; i++) {
      if (!validChars.includes(inputValue[i])) {
        throw new Error(`输入值包含无效字符: ${inputValue[i]}，不符合${inputBase}进制`);
      }
    }

    // 将输入值转换为十进制
    const decimalValue = parseInt(env.inputValue, inputBase);

    if (isNaN(decimalValue)) {
      throw new Error("无法解析输入值，请检查输入是否符合所选进制");
    }

    // 生成各种进制的输出结果
    env.outputResults = [
      {
        label: "二进制",
        value: decimalValue.toString(2),
        icon: "ri:code-box-line",
      },
      {
        label: "八进制",
        value: decimalValue.toString(8),
        icon: "ri:code-box-line",
      },
      {
        label: "十进制",
        value: decimalValue.toString(10),
        icon: "ri:code-box-line",
      },
      {
        label: "十六进制",
        value: decimalValue.toString(16).toUpperCase(),
        icon: "ri:code-box-line",
      },
    ];

    // 添加扩展进制结果
    if (env.showExtendedBases) {
      env.outputResults.push(
        {
          label: "三进制",
          value: decimalValue.toString(3),
          icon: "ri:code-box-line",
        },
        {
          label: "四进制",
          value: decimalValue.toString(4),
          icon: "ri:code-box-line",
        },
        {
          label: "五进制",
          value: decimalValue.toString(5),
          icon: "ri:code-box-line",
        },
        {
          label: "六进制",
          value: decimalValue.toString(6),
          icon: "ri:code-box-line",
        },
        {
          label: "七进制",
          value: decimalValue.toString(7),
          icon: "ri:code-box-line",
        },
        {
          label: "九进制",
          value: decimalValue.toString(9),
          icon: "ri:code-box-line",
        },
        {
          label: "十一进制",
          value: decimalValue.toString(11),
          icon: "ri:code-box-line",
        },
        {
          label: "十二进制",
          value: decimalValue.toString(12),
          icon: "ri:code-box-line",
        },
        {
          label: "三十二进制",
          value: decimalValue.toString(32).toUpperCase(),
          icon: "ri:code-box-line",
        },
        {
          label: "三十六进制",
          value: decimalValue.toString(36).toUpperCase(),
          icon: "ri:code-box-line",
        }
      );
    }

    // 添加到历史记录
    addToHistory(env.inputValue, env.inputBase, env.outputResults);
  } catch (error) {
    console.error("进制转换错误:", error);
    ElMessage.error(error.message || "进制转换失败");
  } finally {
    env.loading = false;
  }
};

// 获取指定进制的有效字符
const getValidCharsForBase = (base) => {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return chars.substring(0, base);
};

// 添加到历史记录
const addToHistory = (inputValue, inputBase, results) => {
  const now = new Date();
  const historyItem = {
    id: now.getTime(),
    date: now.toLocaleString(),
    inputValue,
    inputBase,
    results: JSON.parse(JSON.stringify(results)),
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  try {
    localStorage.setItem("base-converter-history", JSON.stringify(env.history));
  } catch (e) {
    console.error("保存历史记录失败:", e);
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.inputValue = item.inputValue;
  env.inputBase = item.inputBase;
  env.outputResults = item.results;

  ElMessage.success("已从历史记录加载");
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success("复制成功");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

// 清空表单
const clearForm = () => {
  env.inputValue = "";
  env.outputResults = [];

  ElMessage.success("已清空");
};

// 切换显示扩展进制
const toggleExtendedBases = () => {
  env.showExtendedBases = !env.showExtendedBases;
  if (env.inputValue && env.outputResults.length > 0) {
    convertBase();
  }
};

// 字符转ASCII/Unicode
const convertChar = () => {
  try {
    if (!env.charInput) {
      throw new Error("请输入要转换的字符");
    }

    let result = [];
    for (let i = 0; i < env.charInput.length; i++) {
      const char = env.charInput[i];
      const code = char.charCodeAt(0);
      result.push({
        char,
        decimal: code,
        hex: "0x" + code.toString(16).toUpperCase(),
        binary: code.toString(2).padStart(8, "0"),
        octal: "0" + code.toString(8),
      });
    }

    env.charOutput = result;
    ElMessage.success("字符转换成功");
  } catch (error) {
    console.error("字符转换错误:", error);
    ElMessage.error(error.message || "字符转换失败");
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载历史记录
  try {
    const savedHistory = localStorage.getItem("base-converter-history");
    if (savedHistory) {
      env.history = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("加载历史记录失败:", e);
  }
});
</script>

<template>
  <div class="base-converter">
    <div class="base-converter__content">
      <!-- 头部信息 -->
      <div class="base-converter__header-container">
        <div class="base-converter__header">
          <div class="base-converter__header-inner">
            <h1 class="base-converter__header-title">进制转换工具</h1>
            <p class="base-converter__header-subtitle">支持二进制、八进制、十进制、十六进制等多种进制的相互转换</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="base-converter__input-card" shadow="hover">
            <template #header>
              <div class="base-converter__card-header">
                <IconifyIconOnline icon="ri:exchange-line" class="base-converter__card-icon" />
                <span>进制转换</span>
                <div class="base-converter__header-actions">
                  <el-button type="primary" link size="small" @click="toggleExtendedBases">
                    <IconifyIconOnline :icon="env.showExtendedBases ? 'ri:subtract-line' : 'ri:add-line'" />
                    <span>{{ env.showExtendedBases ? "隐藏扩展进制" : "显示扩展进制" }}</span>
                  </el-button>
                </div>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 输入值 -->
              <el-form-item label="输入值">
                <el-input @keyup.stop="convertBase" v-model="env.inputValue" placeholder="输入要转换的数值" clearable>
                  <template #suffix></template>
                </el-input>
              </el-form-item>

              <!-- 输入进制选择 -->
              <el-form-item label="输入进制">
                <el-radio-group v-model="env.inputBase" class="base-converter__radio-group">
                  <el-radio v-for="option in env.baseOptions" :key="option.value" :label="option.value">
                    <div class="base-converter__radio-content">
                      <IconifyIconOnline icon="ri:code-box-line" />
                      <span>{{ option.label }}</span>
                    </div>
                  </el-radio>
                </el-radio-group>

                <div v-if="env.showExtendedBases" class="base-converter__extended-bases">
                  <el-select v-model="env.inputBase" placeholder="选择其他进制" class="base-converter__select">
                    <el-option v-for="option in env.extendedBaseOptions" :key="option.value" :label="option.label" :value="option.value" />
                  </el-select>
                </div>
              </el-form-item>

              <!-- 操作按钮 -->
              <div class="base-converter__actions">
                <el-button type="primary" :loading="env.loading" class="base-converter__convert-btn" @click="convertBase">
                  <IconifyIconOnline icon="ri:exchange-line" />
                  <span>转换进制</span>
                </el-button>

                <el-button class="base-converter__clear-btn" @click="clearForm">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>
            </el-form>
          </el-card>

          <!-- 字符转换卡片 -->
          <el-card class="base-converter__char-card" shadow="hover">
            <template #header>
              <div class="base-converter__card-header">
                <IconifyIconOnline icon="ri:text" class="base-converter__card-icon" />
                <span>字符转换</span>
              </div>
            </template>

            <el-form label-position="top">
              <el-form-item label="输入字符">
                <el-input @keyup.stop="convertChar" v-model="env.charInput" placeholder="输入要转换的字符" clearable />
              </el-form-item>

              <div class="base-converter__actions">
                <el-button type="primary" class="base-converter__convert-btn" @click="convertChar">
                  <IconifyIconOnline icon="ri:exchange-line" />
                  <span>转换字符</span>
                </el-button>

                <el-button
                  class="base-converter__clear-btn"
                  @click="
                    env.charInput = '';
                    env.charOutput = '';
                  "
                >
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>

              <div v-if="env.charOutput && env.charOutput.length > 0" class="base-converter__char-results">
                <el-table :data="env.charOutput" style="width: 100%">
                  <el-table-column prop="char" label="字符" width="80" />
                  <el-table-column prop="decimal" label="十进制" />
                  <el-table-column prop="hex" label="十六进制" />
                  <el-table-column prop="binary" label="二进制" />
                  <el-table-column prop="octal" label="八进制" />
                </el-table>
              </div>
            </el-form>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <!-- 结果卡片 -->
          <el-card class="base-converter__result-card" shadow="hover">
            <template #header>
              <div class="base-converter__card-header">
                <IconifyIconOnline icon="ri:code-box-line" class="base-converter__card-icon" />
                <span>转换结果</span>
              </div>
            </template>

            <el-empty v-if="!env.outputResults.length" description="请先进行进制转换" class="base-converter__empty">
              <template #image>
                <IconifyIconOnline icon="ri:exchange-line" class="base-converter__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="base-converter__results">
              <div v-for="(result, index) in env.outputResults" :key="index" class="base-converter__result-item">
                <div class="base-converter__result-label">
                  <IconifyIconOnline :icon="result.icon" class="base-converter__result-icon" />
                  <span>{{ result.label }}</span>
                </div>
                <div class="base-converter__result-value">
                  <span>{{ result.value }}</span>
                  <el-button type="primary" link size="small" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 历史记录卡片 -->
          <el-card class="base-converter__history-card" shadow="hover">
            <template #header>
              <div class="base-converter__card-header">
                <IconifyIconOnline icon="ri:history-line" class="base-converter__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="base-converter__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="base-converter__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="base-converter__history">
              <div v-for="item in env.history" :key="item.id" class="base-converter__history-item">
                <div class="base-converter__history-content">
                  <div class="base-converter__history-expression">{{ item.inputValue }} ({{ env.baseOptions.find((o) => o.value === item.inputBase)?.label || `${item.inputBase}进制` }})</div>
                  <div class="base-converter__history-meta">
                    <span class="base-converter__history-date">{{ item.date }}</span>
                  </div>
                </div>
                <div class="base-converter__history-actions">
                  <el-button type="primary" link size="small" @click="loadFromHistory(item)">
                    <IconifyIconOnline icon="ri:arrow-go-back-line" />
                    <span>加载</span>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 参考卡片 -->
          <el-card class="base-converter__reference-card" shadow="hover">
            <template #header>
              <div class="base-converter__card-header">
                <IconifyIconOnline icon="ri:information-line" class="base-converter__card-icon" />
                <span>使用说明</span>
              </div>
            </template>

            <div class="base-converter__reference">
              <el-collapse accordion>
                <el-collapse-item title="进制转换说明" name="base">
                  <div class="base-converter__reference-content">
                    <p>进制转换工具可以在不同进制之间转换数值：</p>
                    <ul>
                      <li><strong>二进制</strong>：使用0和1表示的数字系统</li>
                      <li><strong>八进制</strong>：使用0-7的数字系统</li>
                      <li><strong>十进制</strong>：我们日常使用的数字系统</li>
                      <li><strong>十六进制</strong>：使用0-9和A-F的数字系统</li>
                    </ul>
                    <p>点击"显示扩展进制"可以查看更多进制的转换结果。</p>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="字符转换说明" name="char">
                  <div class="base-converter__reference-content">
                    <p>字符转换功能可以将输入的字符转换为对应的ASCII码和各种进制表示：</p>
                    <ul>
                      <li><strong>十进制</strong>：字符的ASCII/Unicode码值</li>
                      <li><strong>十六进制</strong>：以0x开头的十六进制表示</li>
                      <li><strong>二进制</strong>：8位二进制表示</li>
                      <li><strong>八进制</strong>：以0开头的八进制表示</li>
                    </ul>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="常见进制前缀" name="prefix">
                  <div class="base-converter__reference-content">
                    <p>在编程中，不同进制通常有特定的前缀：</p>
                    <ul>
                      <li><strong>二进制</strong>：0b 或 0B（如：0b1010）</li>
                      <li><strong>八进制</strong>：0 或 0o（如：0377）</li>
                      <li><strong>十六进制</strong>：0x 或 0X（如：0xFF）</li>
                    </ul>
                    <p>本工具在输入时不需要添加这些前缀。</p>
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
.base-converter {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    margin: 0 auto;
    padding: 20px;
  }

  /* 头部样式 */
  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    border-radius: 12px;
    padding: 30px;
    color: var(--el-text-color-primary);
    box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transform: rotateX(5deg);
    transition: transform 0.5s ease;

    &:hover {
      transform: rotateX(0deg) scale(1.02);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      opacity: 0.1;
      background-image: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.8) 0%, transparent 20%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.8) 0%, transparent 20%);
    }

    &-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &-subtitle {
      font-size: 16px;
      margin: 0;
      opacity: 0.9;
    }
  }

  /* 卡片样式 */
  &__card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__card-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  &__header-actions {
    margin-left: auto;
  }

  /* 输入卡片 */
  &__input-card,
  &__char-card,
  &__result-card,
  &__history-card,
  &__reference-card {
    margin-bottom: 24px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }
  }

  /* 单选按钮组样式 */
  &__radio-group {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .el-radio {
      margin-right: 0;
      padding: 8px 0;

      &.is-checked {
        .base-converter__radio-content {
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

  /* 扩展进制选择 */
  &__extended-bases {
    margin-top: 10px;
  }

  &__select {
    width: 100%;
  }

  /* 操作按钮 */
  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  &__convert-btn,
  &__clear-btn {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* 结果区域 */
  &__results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__result-item {
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
      transform: translateX(5px);
      border-left: 3px solid var(--el-color-primary);
      background-color: rgba(var(--el-color-primary-rgb), 0.05);
    }
  }

  &__result-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__result-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }

  &__result-value {
    font-size: 16px;
    font-family: monospace;
    color: var(--el-text-color-primary);
    word-break: break-all;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* 空状态 */
  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-color-info-light-5);
  }

  /* 历史记录 */
  &__history {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__history-item {
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
    }
  }

  &__history-content {
    flex: 1;
  }

  &__history-expression {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    font-family: monospace;
  }

  &__history-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  /* 字符转换结果 */
  &__char-results {
    margin-top: 20px;
  }

  /* 参考说明 */
  &__reference-content {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;

    h4 {
      margin: 16px 0 8px;
      color: var(--el-color-primary);
    }

    p {
      margin: 8px 0;
    }

    ul {
      padding-left: 20px;
      margin: 8px 0;
    }

    pre {
      background-color: var(--el-fill-color);
      padding: 12px;
      border-radius: 4px;
      margin: 8px 0;
      overflow-x: auto;
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .base-converter {
    &__radio-group {
      flex-wrap: wrap;

      .el-radio {
        margin-right: 10px;
        margin-bottom: 10px;
        flex: 0 0 calc(50% - 10px);
      }
    }
  }
}
</style>
