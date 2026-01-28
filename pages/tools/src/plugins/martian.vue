<script setup>
import { reactive, ref } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  inputText: "",
  outputText: "",
  selectedStyle: "classic",
  customMapping: "",
  history: [],
  favoriteTexts: [],
  styles: [
    {
      label: "经典火星文",
      value: "classic",
      icon: "ri:alien-fill",
      example: "你好 → 尓㚚",
    },
    {
      label: "花体火星文",
      value: "flower",
      icon: "ri:flower-fill",
      example: "你好 → 妮好",
    },
    {
      label: "符号火星文",
      value: "symbol",
      icon: "ri:shapes-fill",
      example: "你好 → ♥◈♪",
    },
    {
      label: "颠倒火星文",
      value: "upside",
      icon: "ri:contrast-fill",
      example: "你好 → noʎ ollǝɥ",
    },
    {
      label: "乱码火星文",
      value: "chaos",
      icon: "ri:bug-fill",
      example: "你好 → 璑餀",
    },
    {
      label: "自定义映射",
      value: "custom",
      icon: "ri:edit-fill",
      example: "自定义替换规则",
    },
  ],
});

// 字符映射表
const charMappings = {
  classic: {
    '你': '尓',
    '好': '㚚',
    '我': '莪',
    '的': '嘚',
    '是': '昰',
    '了': '孒',
    '在': '咱',
    '有': '冇',
    '和': '龢',
    '人': '亾',
    '都': '嘟',
    '说': '説',
    '要': '藐',
    '会': '茴',
    '对': '対',
    '很': '狠',
    '想': '想',
    '能': '能',
    '什': '甚',
    '么': '庅',
  },
  flower: {
    '你': '妮',
    '好': '恏',
    '我': '莪',
    '的': '啲',
    '是': '昰',
    '了': '叻',
    '在': '咱',
    '有': '囿',
    '和': '咊',
    '人': '亽',
    '都': '嘟',
    '说': '説',
    '要': '耀',
    '会': '繪',
    '对': '対',
    '很': '狠',
    '想': '想',
    '能': '能',
    '什': '甚',
    '么': '麽',
  },
  symbol: {
    'a': '₳',
    'b': '฿',
    'c': '₵',
    'd': 'Đ',
    'e': 'Ɇ',
    'f': '₣',
    'g': '₲',
    'h': 'Ⱨ',
    'i': 'ł',
    'j': 'J',
    'k': '₭',
    'l': 'Ⱡ',
    'm': '₥',
    'n': '₦',
    'o': 'Ø',
    'p': '₱',
    'q': 'Q',
    'r': 'Ɽ',
    's': '₴',
    't': '₮',
    'u': 'Ʉ',
    'v': 'V',
    'w': 'W',
    'x': 'Ӿ',
    'y': 'Ɏ',
    'z': 'Ⱬ',
  },
};

/**
 * 转换文本为火星文
 */
const convertText = () => {
  if (!env.inputText) {
    message(t("message.pleaseInputText"), { type: "warning" });
    return;
  }

  env.loading = true;
  try {
    let result = env.inputText;

    switch (env.selectedStyle) {
      case "classic":
      case "flower":
        result = convertWithMapping(result, charMappings[env.selectedStyle]);
        break;
      case "symbol":
        result = convertToSymbols(result);
        break;
      case "upside":
        result = convertToUpsideDown(result);
        break;
      case "chaos":
        result = convertToChaos(result);
        break;
      case "custom":
        const customMap = parseCustomMapping(env.customMapping);
        result = convertWithMapping(result, customMap);
        break;
    }

    env.outputText = result;
    addToHistory(env.inputText, result, env.selectedStyle);
  } catch (error) {
    console.error("转换错误:", error);
    message(t("message.convertError"), { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 使用映射表转换文本
 */
const convertWithMapping = (text, mapping) => {
  return text.split('').map(char => mapping[char] || char).join('');
};

/**
 * 转换为符号文本
 */
const convertToSymbols = (text) => {
  return text.toLowerCase().split('').map(char => 
    charMappings.symbol[char] || char
  ).join('');
};

/**
 * 转换为颠倒文本
 */
const convertToUpsideDown = (text) => {
  const upsideDownChars = {
    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ',
    'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ı', 'j': 'ɾ',
    'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o',
    'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ',
    'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ',
    'z': 'z', '!': '¡', '?': '¿', '&': '⅋', '.': '˙',
    '[': ']', '(': ')', '{': '}', '<': '>', '_': '‾',
  };
  return text.toLowerCase().split('').reverse().map(char => 
    upsideDownChars[char] || char
  ).join('');
};

/**
 * 转换为乱码文本
 */
const convertToChaos = (text) => {
  const chaosChars = '璑餀龗韛髜鑶驫鸑麤靐霳韠韛颲饙餀饐霻麷';
  return text.split('').map(() => 
    chaosChars[Math.floor(Math.random() * chaosChars.length)]
  ).join('');
};

/**
 * 解析自定义映射规则
 */
const parseCustomMapping = (mappingText) => {
  if (!mappingText) return {};
  const mapping = {};
  mappingText.split('\n').forEach(line => {
    const [from, to] = line.split('=>').map(s => s.trim());
    if (from && to) {
      mapping[from] = to;
    }
  });
  return mapping;
};

/**
 * 添加到历史记录
 */
const addToHistory = (input, output, style) => {
  env.history.unshift({
    id: Date.now(),
    input,
    output,
    style,
    timestamp: new Date().toLocaleString(),
  });
  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }
};

/**
 * 添加到收藏
 */
const addToFavorites = (text) => {
  if (!env.favoriteTexts.includes(text)) {
    env.favoriteTexts.push(text);
    message(t("message.addToFavoritesSuccess"), { type: "success" });
  }
};

/**
 * 从收藏中移除
 */
const removeFromFavorites = (text) => {
  const index = env.favoriteTexts.indexOf(text);
  if (index > -1) {
    env.favoriteTexts.splice(index, 1);
    message(t("message.removeFromFavoritesSuccess"), { type: "success" });
  }
};

/**
 * 复制文本到剪贴板
 */
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess"), { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message(t("message.copyError"), { type: "error" });
    });
};

/**
 * 重置表单
 */
const resetForm = () => {
  env.inputText = "";
  env.outputText = "";
  env.customMapping = "";
};

</script>

<template>
  <div class="martian-tool">
    <div class="martian-tool__content">
      <!-- 标题区域 -->
      <div class="martian-tool__header">
        <div class="martian-tool__title">
          <IconifyIconOnline icon="ri:alien-fill" class="martian-tool__title-icon" />
          <span>火星文转换器</span>
        </div>
        <div class="martian-tool__subtitle">
          将普通文字转换成各种风格的火星文，让聊天更有趣！
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="martian-tool__input-card" shadow="hover">
            <template #header>
              <div class="martian-tool__card-header">
                <IconifyIconOnline icon="ri:input-method-line" class="martian-tool__card-icon" />
                <span>输入文本</span>
              </div>
            </template>

            <el-form label-position="top">
              <el-form-item label="转换风格">
                <el-radio-group v-model="env.selectedStyle" class="martian-tool__style-group">
                  <el-radio v-for="style in env.styles" :key="style.value" :label="style.value">
                    <div class="martian-tool__style-item">
                      <IconifyIconOnline :icon="style.icon" />
                      <span>{{ style.label }}</span>
                      <el-tooltip :content="style.example" placement="top">
                        <IconifyIconOnline icon="ri:question-line" class="martian-tool__help-icon" />
                      </el-tooltip>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="输入文本">
                <el-input
                  v-model="env.inputText"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入要转换的文本"
                  class="martian-tool__textarea"
                />
              </el-form-item>

              <el-form-item v-if="env.selectedStyle === 'custom'" label="自定义映射规则">
                <el-input
                  v-model="env.customMapping"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入映射规则，每行一个，格式：原文=>火星文"
                  class="martian-tool__textarea"
                />
                <div class="martian-tool__mapping-example">
                  示例：<br/>
                  你=>尓<br/>
                  好=>㚚
                </div>
              </el-form-item>

              <div class="martian-tool__actions">
                <el-button type="primary" :loading="env.loading" @click="convertText">
                  <IconifyIconOnline icon="ri:translate-2" />
                  <span>转换</span>
                </el-button>

                <el-button @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>
              </div>
            </el-form>
          </el-card>
        </el-col>

        <!-- 输出区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="martian-tool__output-card" shadow="hover">
            <template #header>
              <div class="martian-tool__card-header">
                <IconifyIconOnline icon="ri:alien-fill" class="martian-tool__card-icon" />
                <span>转换结果</span>
              </div>
            </template>

            <div v-if="!env.outputText" class="martian-tool__empty">
              <IconifyIconOnline icon="ri:alien-fill" class="martian-tool__empty-icon" />
              <span>转换结果将在这里显示</span>
            </div>

            <template v-else>
              <div class="martian-tool__output">
                <div class="martian-tool__output-text">{{ env.outputText }}</div>
                <div class="martian-tool__output-actions">
                  <el-button type="primary" link @click="copyToClipboard(env.outputText)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    <span>复制</span>
                  </el-button>
                  <el-button type="success" link @click="addToFavorites(env.outputText)">
                    <IconifyIconOnline icon="ri:star-line" />
                    <span>收藏</span>
                  </el-button>
                </div>
              </div>
            </template>
          </el-card>

          <!-- 历史记录 -->
          <el-card class="martian-tool__history-card" shadow="hover">
            <template #header>
              <div class="martian-tool__card-header">
                <IconifyIconOnline icon="ri:history-line" class="martian-tool__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <div v-if="!env.history.length" class="martian-tool__empty">
              <IconifyIconOnline icon="ri:history-line" class="martian-tool__empty-icon" />
              <span>暂无历史记录</span>
            </div>

            <div v-else class="martian-tool__history">
              <div v-for="item in env.history" :key="item.id" class="martian-tool__history-item">
                <div class="martian-tool__history-content">
                  <div class="martian-tool__history-text">
                    <div>原文：{{ item.input }}</div>
                    <div>转换：{{ item.output }}</div>
                  </div>
                  <div class="martian-tool__history-info">
                    <el-tag size="small" :type="item.style === 'custom' ? 'warning' : 'info'">
                      {{ env.styles.find(s => s.value === item.style)?.label }}
                    </el-tag>
                    <span class="martian-tool__history-time">{{ item.timestamp }}</span>
                  </div>
                </div>
                <div class="martian-tool__history-actions">
                  <el-button type="primary" link @click="copyToClipboard(item.output)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 收藏夹 -->
          <el-card class="martian-tool__favorites-card" shadow="hover">
            <template #header>
              <div class="martian-tool__card-header">
                <IconifyIconOnline icon="ri:star-line" class="martian-tool__card-icon" />
                <span>收藏夹</span>
              </div>
            </template>

            <div v-if="!env.favoriteTexts.length" class="martian-tool__empty">
              <IconifyIconOnline icon="ri:star-line" class="martian-tool__empty-icon" />
              <span>暂无收藏内容</span>
            </div>

            <div v-else class="martian-tool__favorites">
              <div v-for="(text, index) in env.favoriteTexts" :key="index" class="martian-tool__favorite-item">
                <span class="martian-tool__favorite-text">{{ text }}</span>
                <div class="martian-tool__favorite-actions">
                  <el-button type="primary" link @click="copyToClipboard(text)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                  <el-button type="danger" link @click="removeFromFavorites(text)">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
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
.martian-tool {
  padding: 20px;

  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    padding: 24px;
  }

  &__header {
    background: linear-gradient(
      135deg,
      var(--el-color-warning-light-3) 0%,
      var(--el-color-warning) 100%
    );
    border-radius: 12px;
    padding: 30px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(var(--el-color-warning-rgb), 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 24px;
    text-align: center;

    &:hover {
      box-shadow: 0 6px 24px rgba(var(--el-color-warning-rgb), 0.4);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &-icon {
      font-size: 36px;
      margin-right: 10px;
      animation: float 3s infinite ease-in-out;
    }
  }

  &__subtitle {
    font-size: 16px;
    opacity: 0.95;
    margin: 0;
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
  }

  &__card-icon {
    font-size: 22px;
    margin-right: 10px;
    color: var(--el-color-primary);
  }

  &__input-card,
  &__output-card,
  &__history-card,
  &__favorites-card {
    margin-bottom: 20px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
      border-color: var(--el-color-warning-light-7);
    }
  }

  &__style-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    width: 100%;
  }

  &__style-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;

    .el-radio.is-checked & {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__help-icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    cursor: help;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  &__textarea {
    :deep(.el-textarea__inner) {
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
    }
  }

  &__mapping-example {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;
    padding: 8px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 4px;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;

    .el-button {
      min-width: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }

  &__output {
    padding: 16px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    margin-bottom: 16px;
  }

  &__output-text {
    font-size: 16px;
    line-height: 1.6;
    word-break: break-all;
    margin-bottom: 12px;
    padding: 12px;
    background-color: var(--el-bg-color);
    border-radius: 6px;
    border: 1px dashed var(--el-border-color);
  }

  &__output-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  &__empty {
    text-align: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);

    &-icon {
      font-size: 48px;
      margin-bottom: 16px;
      display: block;
      animation: float 3s infinite ease-in-out;
    }
  }

  &__history {
    max-height: 300px;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color);
      border-radius: 3px;
    }
  }

  &__history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-lighter);
    margin-bottom: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(5px);
      background-color: var(--el-fill-color-light);
    }
  }

  &__history-content {
    flex: 1;
    margin-right: 16px;
  }

  &__history-text {
    font-size: 14px;
    margin-bottom: 8px;

    > div {
      margin-bottom: 4px;
      &:last-child {
        color: var(--el-color-primary);
      }
    }
  }

  &__history-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  &__history-time {
    color: var(--el-text-color-secondary);
  }

  &__favorites {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color);
      border-radius: 3px;
    }
  }

  &__favorite-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-lighter);
    margin-bottom: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(5px);
      background-color: var(--el-fill-color-light);
    }
  }

  &__favorite-text {
    flex: 1;
    margin-right: 16px;
    word-break: break-all;
  }

  &__favorite-actions {
    display: flex;
    gap: 8px;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @media (max-width: 768px) {
    &__style-group {
      grid-template-columns: repeat(2, 1fr);
    }

    &__actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>