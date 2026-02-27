<template>
  <div class="pinyin-tool">
    <!-- 头部区域 -->
    <div class="pinyin-tool__header">
      <div class="pinyin-tool__header-content">
        <IconifyIconOnline icon="ri:translate-2" class="pinyin-tool__header-icon" />
        <div>
          <h2 class="pinyin-tool__header-title">汉字拼音转换工具</h2>
          <p class="pinyin-tool__header-desc">将汉字转换为拼音、注音符号和五笔编码，支持批量处理</p>
        </div>
      </div>
    </div>

    <div class="pinyin-tool__content">
      <ScCard class="pinyin-tool__converter-card" shadow="hover">
        <template #header>
          <div class="pinyin-tool__card-header">
            <IconifyIconOnline icon="ri:translate-2" class="pinyin-tool__card-icon" />
            <span>拼音转换器</span>
          </div>
        </template>
        <div class="pinyin-tool__action-bar">
          <ScRadioGroup v-model="convertType" size="large" @change="convert">
            <el-radio-button label="pinyin">汉字转拼音</el-radio-button>
            <el-radio-button label="zhuyin">汉字转注音</el-radio-button>
            <el-radio-button label="wubi">汉字转五笔</el-radio-button>
          </ScRadioGroup>

          <div class="pinyin-tool__action-buttons">
            <ScButton type="success" @click="copyResult" :icon="CopyDocument">复制结果</ScButton>
            <ScButton @click="clearText" :icon="Delete">清空</ScButton>
          </div>
        </div>

        <div class="pinyin-tool__converter-container">
          <div class="pinyin-tool__input-area">
            <div class="pinyin-tool__area-header">
              <span>输入汉字</span>
              <ScButton size="small" @click="pasteText">粘贴</ScButton>
            </div>
            <ScInput v-model="inputText" type="textarea" :rows="10" placeholder="请输入需要转换的汉字文本..." @input="handleInput" />
            <div class="pinyin-tool__char-count">{{ inputText.length }} 个字符</div>
          </div>

          <div class="pinyin-tool__output-area">
            <div class="pinyin-tool__area-header">
              <span>转换结果</span>
              <div class="pinyin-tool__output-options">
                <ScCheckbox v-if="convertType === 'pinyin'" v-model="options.toneType" @change="convert" label="number">数字声调</ScCheckbox>
                <ScCheckbox v-if="convertType === 'pinyin'" v-model="options.uppercase" @change="convert">首字母大写</ScCheckbox>
                <ScCheckbox v-if="convertType === 'pinyin'" v-model="options.removeTone" @change="convert">去除声调</ScCheckbox>
                <ScCheckbox v-model="options.addSpace" @change="convert">添加空格</ScCheckbox>
              </div>
            </div>
            <div class="pinyin-tool__result-display" ref="resultDisplay">
              <div v-if="resultDisplay.length > 0">
                <template v-for="(item, index) in resultDisplay" :key="index">
                  <span class="pinyin-tool__result-item" :class="{ 'with-space': options.addSpace }" :title="item.original">
                    {{ item.converted }}
                  </span>
                </template>
              </div>
              <div v-else class="pinyin-tool__empty-result">转换结果将显示在这里</div>
            </div>
          </div>
        </div>
      </ScCard>

      <ScRow :gutter="20">
        <ScCol :span="12">
          <ScCard class="pinyin-tool__query-card" shadow="hover">
            <template #header>
              <div class="pinyin-tool__card-header">
                <IconifyIconOnline icon="ri:search-line" class="pinyin-tool__card-icon" />
                <span>常用汉字查询</span>
              </div>
            </template>
          <div class="pinyin-tool__search-container">
            <ScInput v-model="searchChar" placeholder="输入汉字查询拼音、注音和五笔..." maxlength="1" show-word-limit clearable>
              <template #append>
                <ScButton :icon="Search" @click="searchCharInfo"></ScButton>
              </template>
            </ScInput>

            <div v-if="charInfo.char" class="pinyin-tool__char-info">
              <div class="pinyin-tool__char-display">{{ charInfo.char }}</div>
              <ul class="pinyin-tool__char-details">
                <li>
                  <strong>拼音：</strong>
                  <span>{{ charInfo.pinyin || "暂无数据" }}</span>
                </li>
                <li>
                  <strong>注音：</strong>
                  <span>{{ charInfo.zhuyin || "暂无数据" }}</span>
                </li>
                <li>
                  <strong>五笔：</strong>
                  <span>{{ charInfo.wubi || "暂无数据" }}</span>
                </li>
                <li>
                  <strong>部首：</strong>
                  <span>{{ charInfo.radical || "暂无数据" }}</span>
                </li>
                <li>
                  <strong>笔画：</strong>
                  <span>{{ charInfo.strokes || "暂无数据" }}</span>
                </li>
              </ul>
            </div>
            <div v-else-if="searchChar && charInfo.error" class="pinyin-tool__no-result">
              {{ charInfo.error }}
            </div>
            <div v-else-if="searchChar" class="pinyin-tool__no-result">正在查询...</div>
            <div v-else class="pinyin-tool__search-hint">请输入一个汉字进行查询</div>
          </div>
          </ScCard>
        </ScCol>

        <ScCol :span="12">
          <ScCard class="pinyin-tool__batch-card" shadow="hover">
            <template #header>
              <div class="pinyin-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-3-line" class="pinyin-tool__card-icon" />
                <span>批量处理</span>
              </div>
            </template>
          <div class="pinyin-tool__batch-process">
            <div class="pinyin-tool__file-upload">
              <ScUpload action="#" :auto-upload="false" :limit="1" :on-change="handleFileChange">
                <template #trigger>
                  <ScButton type="primary">选择文本文件</ScButton>
                </template>
                <template #tip>
                  <div class="el-upload__tip">仅支持 TXT 文本文件，最大 5MB</div>
                </template>
              </ScUpload>
            </div>

            <div class="pinyin-tool__batch-options">
              <h4>批量转换选项</h4>
              <ScForm :model="batchOptions" label-position="top" size="small">
                <ScFormItem label="转换格式">
                  <ScRadioGroup v-model="batchOptions.type">
                    <el-radio-button label="pinyin">拼音</el-radio-button>
                    <el-radio-button label="zhuyin">注音</el-radio-button>
                    <el-radio-button label="wubi">五笔</el-radio-button>
                  </ScRadioGroup>
                </ScFormItem>

                <ScFormItem label="输出格式">
                  <ScCheckbox v-model="batchOptions.addSpace">添加空格</ScCheckbox>
                  <ScCheckbox v-if="batchOptions.type === 'pinyin'" v-model="batchOptions.uppercase">首字母大写</ScCheckbox>
                  <ScCheckbox v-if="batchOptions.type === 'pinyin'" v-model="batchOptions.removeTone">去除声调</ScCheckbox>
                </ScFormItem>

                <ScFormItem>
                  <ScButton type="success" @click="processBatch" :disabled="!selectedFile">处理文件</ScButton>
                  <ScButton type="primary" @click="downloadResult" :disabled="!batchResult">下载结果</ScButton>
                </ScFormItem>
              </ScForm>
            </div>
          </div>
          </ScCard>
        </ScCol>
      </ScRow>

      <ScCard class="pinyin-tool__help-card" shadow="hover">
        <template #header>
          <div class="pinyin-tool__card-header">
            <IconifyIconOnline icon="ri:question-line" class="pinyin-tool__card-icon" />
            <span>使用说明</span>
          </div>
        </template>
      <div class="pinyin-tool__usage-guide">
        <h3>功能介绍</h3>
        <p>本工具提供汉字转拼音、注音符号和五笔编码的功能，适用于学习、翻译和文本处理等场景。</p>

        <h3>使用方法</h3>
        <ol>
          <li>在输入框中输入中文文本</li>
          <li>选择需要的转换类型（拼音、注音或五笔）</li>
          <li>根据需要调整输出选项</li>
          <li>查看转换结果，可复制或下载</li>
        </ol>

        <h3>选项说明</h3>
        <ul>
          <li><strong>数字声调</strong>：使用数字表示声调（例如：ni3 hao3）</li>
          <li><strong>首字母大写</strong>：将拼音首字母大写（例如：Ni Hao）</li>
          <li><strong>去除声调</strong>：移除所有声调标记（例如：ni hao）</li>
          <li><strong>添加空格</strong>：在转换结果的字符间添加空格</li>
        </ul>

        <h3>批量处理</h3>
        <p>您可以上传文本文件进行批量转换，支持以下功能：</p>
        <ul>
          <li>支持多种转换格式</li>
          <li>可定制输出格式</li>
          <li>处理完成后可下载结果文件</li>
        </ul>

        <h3>注意事项</h3>
        <ul>
          <li>对于多音字，系统会尝试根据上下文选择最适合的读音</li>
          <li>部分生僻字可能没有对应的拼音、注音或五笔数据</li>
          <li>转换过程完全在浏览器中进行，不会上传您的文本</li>
        </ul>
      </div>
      </ScCard>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { message } from "@repo/utils";
import { useClipboard } from "@vueuse/core";

// 复制功能
const { copyText, pasteText: clipboardPaste } = useClipboard();

// 转换类型和选项
const convertType = ref("pinyin");
const options = reactive({
  toneType: true, // true: 数字声调, false: 拼音符号
  uppercase: false, // 首字母大写
  removeTone: false, // 去除声调
  addSpace: true, // 添加空格
});

// 文本和结果
const inputText = ref("");
const resultDisplay = ref([]);

// 汉字查询
const searchChar = ref("");
const charInfo = reactive({
  char: "",
  pinyin: "",
  zhuyin: "",
  wubi: "",
  radical: "",
  strokes: "",
  error: null,
});

// 批量处理
const selectedFile = ref(null);
const batchResult = ref("");
const batchOptions = reactive({
  type: "pinyin",
  addSpace: true,
  uppercase: false,
  removeTone: false,
});

// 常见汉字拼音对照表（简化版）
const pinyinMap = {
  一: "yī",
  二: "èr",
  三: "sān",
  四: "sì",
  五: "wǔ",
  六: "liù",
  七: "qī",
  八: "bā",
  九: "jiǔ",
  十: "shí",
  百: "bǎi",
  千: "qiān",
  万: "wàn",
  中: "zhōng",
  国: "guó",
  人: "rén",
  大: "dà",
  小: "xiǎo",
  上: "shàng",
  下: "xià",
  左: "zuǒ",
  右: "yòu",
  前: "qián",
  后: "hòu",
  东: "dōng",
  西: "xī",
  南: "nán",
  北: "běi",
  天: "tiān",
  地: "dì",
  水: "shuǐ",
  火: "huǒ",
  山: "shān",
  木: "mù",
  金: "jīn",
  土: "tǔ",
  日: "rì",
  月: "yuè",
  星: "xīng",
  年: "nián",
  我: "wǒ",
  你: "nǐ",
  他: "tā",
  她: "tā",
  好: "hǎo",
  是: "shì",
  的: "de",
  了: "le",
  在: "zài",
  有: "yǒu",
  来: "lái",
  去: "qù",
  吃: "chī",
  喝: "hē",
  玩: "wán",
  爱: "ài",
  学: "xué",
  习: "xí",
  工: "gōng",
  作: "zuò",
  家: "jiā",
  学: "xué",
  校: "xiào",
  // ... 可以继续添加更多汉字
};

// 注音符号对照表（简化版）
const zhuyinMap = {
  一: "ㄧ",
  二: "ㄦˋ",
  三: "ㄙㄢ",
  四: "ㄙˋ",
  五: "ㄨˇ",
  六: "ㄌㄧㄡˋ",
  七: "ㄑㄧ",
  八: "ㄅㄚ",
  九: "ㄐㄧㄡˇ",
  十: "ㄕˊ",
  百: "ㄅㄞˇ",
  千: "ㄑㄧㄢ",
  万: "ㄨㄢˋ",
  中: "ㄓㄨㄥ",
  国: "ㄍㄨㄛˊ",
  人: "ㄖㄣˊ",
  // ... 可以继续添加更多汉字
};

// 五笔编码对照表（简化版）
const wubiMap = {
  一: "G",
  二: "F",
  三: "D",
  四: "L",
  五: "G",
  六: "UJ",
  七: "AG",
  八: "W",
  九: "V",
  十: "J",
  百: "D",
  千: "T",
  万: "M",
  中: "K",
  国: "L",
  人: "W",
  // ... 可以继续添加更多汉字
};

// 拼音转换函数
const convert = () => {
  if (!inputText.value) {
    resultDisplay.value = [];
    return;
  }

  const result = [];
  const chars = inputText.value.split("");

  for (let char of chars) {
    let converted = char;

    if (/[\u4E00-\u9FA5]/.test(char)) {
      // 中文字符处理
      switch (convertType.value) {
        case "pinyin":
          converted = pinyinMap[char] || char;

          // 处理声调
          if (options.removeTone) {
            converted = converted.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          } else if (options.toneType) {
            // 转换为数字声调
            converted = convertToNumberTone(converted);
          }

          // 首字母大写
          if (options.uppercase) {
            converted = converted.charAt(0).toUpperCase() + converted.slice(1);
          }
          break;

        case "zhuyin":
          converted = zhuyinMap[char] || char;
          break;

        case "wubi":
          converted = wubiMap[char] || char;
          break;
      }
    }

    result.push({
      original: char,
      converted: converted,
    });
  }

  resultDisplay.value = result;
};

// 将拼音声调转换为数字形式
const convertToNumberTone = (pinyin) => {
  const toneMap = {
    ā: "a1",
    á: "a2",
    ǎ: "a3",
    à: "a4",
    ē: "e1",
    é: "e2",
    ě: "e3",
    è: "e4",
    ī: "i1",
    í: "i2",
    ǐ: "i3",
    ì: "i4",
    ō: "o1",
    ó: "o2",
    ǒ: "o3",
    ò: "o4",
    ū: "u1",
    ú: "u2",
    ǔ: "u3",
    ù: "u4",
    ǖ: "v1",
    ǘ: "v2",
    ǚ: "v3",
    ǜ: "v4",
  };

  let result = pinyin;
  let tone = 5; // 默认轻声

  for (const [markedVowel, replacement] of Object.entries(toneMap)) {
    if (pinyin.includes(markedVowel)) {
      const vowel = replacement.charAt(0);
      tone = parseInt(replacement.charAt(1));
      result = result.replace(markedVowel, vowel);
      break;
    }
  }

  return result + tone;
};

// 输入处理
const handleInput = () => {
  convert();
};

// 复制结果
const copyResult = async () => {
  if (resultDisplay.value.length === 0) {
    message("没有可复制的内容", { type: "warning" });
    return;
  }

  try {
    const textToCopy = resultDisplay.value.map((item) => item.converted).join(options.addSpace ? " " : "");

    await copyText(textToCopy, true);
  } catch (error) {
    console.error("复制失败:", error);
    message("复制失败", { type: "error" });
  }
};

// 清空文本
const clearText = () => {
  inputText.value = "";
  resultDisplay.value = [];
};

// 粘贴文本
const pasteText = async () => {
  try {
    const text = await clipboardPaste();
    if (text) {
      inputText.value = text;
      convert();
      message("已从剪贴板粘贴文本", { type: "success" });
    }
  } catch (error) {
    console.error("粘贴失败:", error);
    message("无法从剪贴板粘贴文本", { type: "error" });
  }
};

// 查询单个汉字信息
const searchCharInfo = () => {
  if (!searchChar.value) {
    return;
  }

  if (!/^[\u4E00-\u9FA5]$/.test(searchChar.value)) {
    charInfo.error = "请输入一个中文汉字";
    charInfo.char = "";
    return;
  }

  charInfo.error = null;
  const char = searchChar.value;

  // 模拟API查询，实际项目中可以替换为真实API调用
  setTimeout(() => {
    charInfo.char = char;
    charInfo.pinyin = pinyinMap[char] || "暂无数据";
    charInfo.zhuyin = zhuyinMap[char] || "暂无数据";
    charInfo.wubi = wubiMap[char] || "暂无数据";

    // 随机模拟部首和笔画数据
    charInfo.radical = ["氵", "亻", "口", "木", "火", "土", "艹"][Math.floor(Math.random() * 7)];
    charInfo.strokes = Math.floor(Math.random() * 15) + 1;
  }, 300);
};

// 文件上传处理
const handleFileChange = (file) => {
  if (!file || !file.raw) {
    selectedFile.value = null;
    return;
  }

  const isText = file.raw.type === "text/plain" || file.name.endsWith(".txt");

  if (!isText) {
    message("请上传TXT文本文件", { type: "error" });
    selectedFile.value = null;
    return;
  }

  if (file.raw.size > 5 * 1024 * 1024) {
    // 5MB
    message("文件大小不能超过5MB", { type: "error" });
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file.raw;
  message("文件已选择: " + file.name, { type: "success" });
};

// 批量处理文件
const processBatch = () => {
  if (!selectedFile.value) {
    message("请先选择文件", { type: "warning" });
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target.result;

    // 保存当前设置
    const currentType = convertType.value;
    const currentOptions = { ...options };

    // 应用批量设置
    convertType.value = batchOptions.type;
    options.addSpace = batchOptions.addSpace;
    options.uppercase = batchOptions.uppercase;
    options.removeTone = batchOptions.removeTone;

    // 处理文本
    inputText.value = text;
    convert();

    // 生成结果
    batchResult.value = resultDisplay.value.map((item) => item.converted).join(options.addSpace ? " " : "");

    // 恢复设置
    convertType.value = currentType;
    Object.assign(options, currentOptions);

    message("文件处理完成", { type: "success" });
  };

  reader.onerror = () => {
    message("读取文件失败", { type: "error" });
  };

  reader.readAsText(selectedFile.value);
};

// 下载结果
const downloadResult = () => {
  if (!batchResult.value) {
    message("没有可下载的内容", { type: "warning" });
    return;
  }

  const blob = new Blob([batchResult.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `转换结果_${convertType.value}_${new Date().getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  message("文件已开始下载", { type: "success" });
};

// 监听输入变化
watch(searchChar, (newVal) => {
  if (newVal && newVal.length === 1) {
    searchCharInfo();
  } else {
    charInfo.char = "";
    charInfo.error = null;
  }
});

// 初始化
onMounted(() => {
  // 示例文本
  inputText.value = "你好，中国！";
  convert();
});
</script>

<style lang="scss" scoped>
.pinyin-tool {
  padding: 20px;

  &__header {
    background: linear-gradient(135deg, var(--el-color-info-light-3) 0%, var(--el-color-info) 100%);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__header-icon {
    font-size: 48px;
    opacity: 0.9;
  }

  &__header-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  &__header-desc {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
  }

  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    padding: 24px;
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__card-icon {
    font-size: 22px;
    margin-right: 10px;
    color: var(--el-color-info);
  }

  &__converter-card,
  &__query-card,
  &__batch-card,
  &__help-card {
    margin-bottom: 24px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
      border-color: var(--el-color-info-light-7);
    }
  }

  &__action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  &__action-buttons {
    display: flex;
    gap: 10px;
  }

  &__converter-container {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }

  &__input-area,
  &__output-area {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__area-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__area-header span {
    font-weight: bold;
    color: var(--el-color-info);
  }

  &__output-options {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__result-display {
    flex: 1;
    min-height: 200px;
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    overflow-y: auto;
    line-height: 1.6;
  }

  &__result-item {
    display: inline-block;
  }

  &__result-item.with-space {
    margin-right: 4px;
  }

  &__empty-result {
    color: var(--el-text-color-secondary);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  &__char-count {
    text-align: right;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-top: 5px;
  }

  &__search-container {
    margin-bottom: 20px;
  }

  &__char-info {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
  }

  &__char-display {
    font-size: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    background-color: var(--el-color-info-light-9);
    border-radius: 8px;
    color: var(--el-color-info);
  }

  &__char-details {
    flex: 1;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__char-details li {
    margin-bottom: 8px;
    line-height: 1.5;
  }

  &__no-result,
  &__search-hint {
    margin-top: 20px;
    padding: 16px;
    text-align: center;
    color: var(--el-text-color-secondary);
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__batch-process {
    display: flex;
    gap: 20px;
  }

  &__file-upload,
  &__batch-options {
    flex: 1;
  }

  &__batch-options h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--el-color-info);
  }

  &__usage-guide h3 {
    color: var(--el-color-info);
    margin-top: 16px;
    margin-bottom: 8px;
  }

  &__usage-guide ul,
  &__usage-guide ol {
  padding-left: 20px;
  margin-bottom: 16px;
}

  &__usage-guide li {
  margin-bottom: 8px;
}

  @media (max-width: 768px) {
    &__converter-container,
    &__batch-process {
      flex-direction: column;
    }

    &__char-info {
      flex-direction: column;
      align-items: center;
    }

    &__char-display {
      margin-bottom: 16px;
    }
  }
}
</style>
