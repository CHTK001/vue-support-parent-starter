<script setup>
import { reactive, ref, onMounted } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { dateFormat } from "@repo/utils";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 防抖解析函数
const debounceParseTime = (value) => {
  if (!value) return;

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的定时器，延迟500ms执行
  debounceTimer = setTimeout(() => {
    // 只有时间戳模式下且有值时才自动解析
    if ((env.inputType === "timestamp-s" || env.inputType === "timestamp-ms") && env.inputValue) {
      parseTime();
    }
  }, 500);
};

/**
 * 获取结果项的图标
 * @param {string} label - 结果项标签
 * @returns {string} - 图标名称
 */
const getResultIcon = (label) => {
  if (label.includes("标准日期时间")) return "ri:calendar-event-fill";
  if (label.includes("日期")) return "ri:calendar-line";
  if (label.includes("时间") && !label.includes("时间戳")) return "ri:time-line";
  if (label.includes("中文")) return "ri:file-text-line";
  if (label.includes("ISO")) return "ri:global-line";
  if (label.includes("时间戳")) return "ri:timer-line";
  if (label.includes("自定义")) return "ri:settings-line";
  if (label.includes("时区")) return "ri:map-pin-time-line";
  return "ri:information-line";
};

// 环境变量
const env = reactive({
  loading: false,
  currentTime: new Date(),
  formats: [
    { label: "标准日期时间", value: "yyyy-MM-dd hh:mm:ss", example: "2023-01-01 12:30:45" },
    { label: "日期", value: "yyyy-MM-dd", example: "2023-01-01" },
    { label: "时间", value: "hh:mm:ss", example: "12:30:45" },
    { label: "中文日期时间", value: "yyyy年MM月dd日 hh时mm分ss秒", example: "2023年01月01日 12时30分45秒" },
    { label: "ISO 8601", value: "yyyy-MM-ddThh:mm:ss.SSSZ", example: "2023-01-01T12:30:45.000Z" },
    { label: "Unix 时间戳(秒)", value: "timestamp-s", example: "1672571445" },
    { label: "Unix 时间戳(毫秒)", value: "timestamp-ms", example: "1672571445000" },
  ],
  customFormat: "yyyy-MM-dd hh:mm:ss",
  inputType: "datetime",
  inputValue: "",
  outputResults: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezones: ["Asia/Shanghai", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "UTC"],
});

// 时钟定时器
let clockTimer = null;

/**
 * 更新当前时间
 */
const updateCurrentTime = () => {
  env.currentTime = new Date();
};

/**
 * 解析时间
 */
const parseTime = () => {
  if (!env.inputValue) {
    return;
  }

  env.loading = true;
  env.outputResults = [];

  try {
    let parsedDate;

    // 根据输入类型解析时间
    if (env.inputType === "timestamp-s") {
      // 秒级时间戳
      parsedDate = new Date(parseInt(env.inputValue) * 1000);
    } else if (env.inputType === "timestamp-ms") {
      // 毫秒级时间戳
      parsedDate = new Date(parseInt(env.inputValue));
    } else {
      // 字符串日期时间
      parsedDate = new Date(env.inputValue);
    }

    // 验证解析结果是否有效
    if (isNaN(parsedDate.getTime())) {
      message(t("message.invalidTimeFormat"), { type: "error" });
      env.loading = false;
      return;
    }

    // 生成各种格式的输出结果
    env.outputResults = [
      {
        label: "标准日期时间",
        value: dateFormat(parsedDate, "yyyy-MM-dd hh:mm:ss"),
      },
      {
        label: "日期",
        value: dateFormat(parsedDate, "yyyy-MM-dd"),
      },
      {
        label: "时间",
        value: dateFormat(parsedDate, "hh:mm:ss"),
      },
      {
        label: "中文日期时间",
        value: dateFormat(parsedDate, "yyyy年MM月dd日 HH时mm分ss秒"),
      },
      {
        label: "ISO 8601",
        value: parsedDate.toISOString(),
      },
      {
        label: "Unix 时间戳(秒)",
        value: Math.floor(parsedDate.getTime() / 1000).toString(),
      },
      {
        label: "Unix 时间戳(毫秒)",
        value: parsedDate.getTime().toString(),
      },
      {
        label: "自定义格式",
        value: dateFormat(parsedDate, env.customFormat),
      },
    ];

    // 添加不同时区的时间
    env.timezones.forEach((timezone) => {
      try {
        const options = {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        };

        const formatter = new Intl.DateTimeFormat("zh-CN", options);
        const timeInZone = formatter.format(parsedDate).replace(/\//g, "-").replace(",", "");

        env.outputResults.push({
          label: `${timezone} 时区`,
          value: timeInZone,
        });
      } catch (error) {
        console.error(`时区转换错误 (${timezone}):`, error);
      }
    });
  } catch (error) {
    console.error("时间解析错误:", error);
    message(t("message.parseError"), { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 复制结果到剪贴板
 * @param {string} text - 要复制的文本
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
 * 获取当前时间戳
 */
const getCurrentTimestamp = () => {
  env.inputType = "timestamp-ms";
  env.inputValue = Date.now().toString();
  parseTime();
};

/**
 * 重置表单
 */
const resetForm = () => {
  env.inputValue = "";
  env.customFormat = "yyyy-MM-dd hh:mm:ss";
  env.outputResults = [];
};

// 组件挂载时启动时钟
onMounted(() => {
  updateCurrentTime();
  getCurrentTimestamp();
  clockTimer = setInterval(updateCurrentTime, 1000);
});

// 组件卸载时清除定时器
const onBeforeUnmount = () => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
};
</script>

<template>
  <div class="time-tool">
    <div class="time-tool__content h-[200px]">
      <!-- 当前时间显示 - 美化版 -->
      <div class="time-tool__clock-container">
        <div class="time-tool__clock">
          <div class="time-tool__clock-inner">
            <div class="time-tool__clock-time">{{ dateFormat(env.currentTime, "hh:mm:ss") }}</div>
            <div class="time-tool__clock-date">{{ dateFormat(env.currentTime, "yyyy年MM月dd日") }}</div>
            <div class="time-tool__clock-weekday">{{ ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][env.currentTime.getDay()] }}</div>
            <div class="time-tool__clock-timestamp">
              <span>当前时间戳: {{ Math.floor(env.currentTime.getTime() / 1000) }}</span>
              <ScButton type="primary" link size="small" @click="copyToClipboard(Math.floor(env.currentTime.getTime() / 1000).toString())">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </ScButton>
            </div>
          </div>
          <div class="time-tool__clock-decoration">
            <div class="time-tool__clock-circle"></div>
            <div class="time-tool__clock-circle"></div>
            <div class="time-tool__clock-circle"></div>
          </div>
        </div>
      </div>

      <ScRow :gutter="24">
        <!-- 输入区域 - 美化版 -->
        <ScCol :xs="24" :sm="24" :md="12" :lg="12">
          <ScCard class="time-tool__input-card" shadow="hover">
            <template #header>
              <div class="time-tool__card-header">
                <IconifyIconOnline icon="ri:input-method-line" class="time-tool__card-icon" />
                <span>输入时间</span>
              </div>
            </template>

            <ScForm label-position="top">
              <ScFormItem label="输入类型">
                <ScRadioGroup v-model="env.inputType" class="time-tool__radio-group">
                  <ScRadio label="datetime">
                    <div class="time-tool__radio-content">
                      <IconifyIconOnline icon="ri:calendar-event-fill" />
                      <span>日期时间</span>
                    </div>
                  </ScRadio>
                  <ScRadio label="timestamp-s">
                    <div class="time-tool__radio-content">
                      <IconifyIconOnline icon="ri:time-line" />
                      <span>时间戳(秒)</span>
                    </div>
                  </ScRadio>
                  <ScRadio label="timestamp-ms">
                    <div class="time-tool__radio-content">
                      <IconifyIconOnline icon="ri:timer-flash-line" />
                      <span>时间戳(毫秒)</span>
                    </div>
                  </ScRadio>
                </ScRadioGroup>
              </ScFormItem>

              <ScFormItem label="输入值">
                <ScInput @input="parseTime" v-if="env.inputType === 'datetime'" v-model="env.inputValue" placeholder="请输入日期时间，如：2023-01-01 12:30:45" clearable class="time-tool__input">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:calendar-line" />
                  </template>
                </ScInput>

                <ScInput v-else v-model="env.inputValue" placeholder="请输入时间戳，如：1672571445" clearable type="number" @input="debounceParseTime" class="time-tool__input">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:timer-line" />
                  </template>
                </ScInput>
              </ScFormItem>

              <ScFormItem label="自定义输出格式">
                <ScSelect v-model="env.customFormat" placeholder="选择或输入自定义格式" filterable allow-create class="time-tool__select">
                  <ScOption v-for="item in env.formats" :key="item.value" :label="`${item.label} (${item.example})`" :value="item.value" />
                </ScSelect>
              </ScFormItem>

              <div class="time-tool__actions">
                <ScButton type="primary" :loading="env.loading" class="time-tool__parse-btn" @click="parseTime">
                  <IconifyIconOnline icon="ri:time-line" />
                  <span>解析时间</span>
                </ScButton>

                <ScButton type="success" class="time-tool__now-btn" @click="getCurrentTimestamp">
                  <IconifyIconOnline icon="ri:time-fill" />
                  <span>当前时间</span>
                </ScButton>

                <ScButton class="time-tool__reset-btn" @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </ScButton>
              </div>
            </ScForm>
          </ScCard>
        </ScCol>

        <!-- 结果区域 - 美化版 -->
        <ScCol :xs="24" :sm="24" :md="12" :lg="12">
          <ScCard class="time-tool__result-card" shadow="hover">
            <template #header>
              <div class="time-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="time-tool__card-icon" />
                <span>解析结果</span>
              </div>
            </template>

            <ScEmpty v-if="!env.outputResults.length" description="请先输入并解析时间" class="time-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:time-line" class="time-tool__empty-icon" />
              </template>
            </ScEmpty>

            <div v-else class="time-tool__results">
              <div v-for="(result, index) in env.outputResults" :key="index" class="time-tool__result-item" :class="{ 'time-tool__result-item--highlight': index < 3 }">
                <div class="time-tool__result-label">
                  <IconifyIconOnline :icon="getResultIcon(result.label)" class="time-tool__result-icon" />
                  <span>{{ result.label }}</span>
                </div>
                <div class="time-tool__result-value">
                  <span>{{ result.value }}</span>
                  <ScButton type="primary" link size="small" class="time-tool__copy-btn" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </ScButton>
                </div>
              </div>
            </div>
          </ScCard>
        </ScCol>
      </ScRow>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.time-tool {
  padding: 20px;

  /* 头部样式 */
  &__header {
    margin-bottom: 30px;
    text-align: center;
    position: relative;
    background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
    border-radius: 12px;
    padding: 30px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      box-shadow: 0 6px 24px rgba(var(--el-color-primary-rgb), 0.4);
      transform: translateY(-2px);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    font-size: 28px;
    font-weight: 700;
    color: #fff;

    &-icon {
      font-size: 32px;
      margin-right: 10px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    }
  }

  &__subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 16px;
  }

  /* 内容区域样式 */
  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
    padding: 24px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-primary-light-7);
    }
  }

  /* 时钟容器 */
  &__clock-container {
    margin-bottom: 30px;
    perspective: 1000px;
  }

  /* 时钟样式 - 美化版 */
  &__clock {
    background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
    border-radius: 12px;
    padding: 30px;
    text-align: center;
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
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }

    &-time {
      font-size: 56px;
      font-weight: 700;
      color: var(--el-color-white);
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
      letter-spacing: 2px;
    }

    &-date {
      font-size: 20px;
      color: var(--el-color-white);
      opacity: 0.95;
      margin-bottom: 6px;
      position: relative;
      z-index: 1;
      letter-spacing: 1px;
    }

    &-weekday {
      font-size: 18px;
      color: var(--el-color-white);
      opacity: 0.9;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
      font-weight: 500;
    }

    &-timestamp {
      font-size: 15px;
      color: var(--el-color-white);
      opacity: 0.8;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-flex;
      backdrop-filter: blur(5px);
    }
  }

  /* 卡片样式 - 美化版 */
  &__input-card,
  &__result-card {
    height: 100%;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 12px;
    overflow: hidden;
    border: none;

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
  }

  &__card-icon {
    font-size: 22px;
    margin-right: 10px;
    color: var(--el-color-primary);
  }

  /* 单选按钮组样式 - 美化版 */
  &__radio-group {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .el-radio {
      margin-right: 0;
      padding: 8px 0;

      &.is-checked {
        .time-tool__radio-content {
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

  /* 输入框和选择器美化 */
  &__input,
  &__select {
    width: 100%;

    &:deep(.el-input__wrapper) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover,
      &.is-focus {
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.1),
          0 0 0 1px var(--el-color-primary-light-5);
      }
    }
  }

  /* 操作按钮区域样式 - 美化版 */
  &__actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    gap: 12px;
  }

  &__parse-btn,
  &__now-btn,
  &__reset-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 8px;
    padding: 12px 16px;
    font-weight: 500;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 空状态美化 */
  &__empty {
    padding: 40px 0;

    &-icon {
      font-size: 80px;
      color: var(--el-color-info-light-5);
      margin-bottom: 20px;
      animation: pulse 3s infinite ease-in-out;
    }
  }

  /* 结果区域样式 - 美化版 */
  &__results {
    max-height: 450px;
    overflow-y: auto;
    padding-right: 8px;
    padding-top: 5px;

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

  &__result-item {
    padding: 14px;
    border-radius: 10px;
    background-color: var(--el-fill-color-light);
    margin-bottom: 12px;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;

    &:hover {
      background-color: var(--el-fill-color);
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &:last-child {
      margin-bottom: 0;
    }

    &--highlight {
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
    color: var(--el-text-color-primary);
    font-weight: 500;
    word-break: break-all;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--el-bg-color);
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px dashed var(--el-border-color);
  }

  &__copy-btn {
    opacity: 0.6;
    transition: all 0.3s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .time-tool {
    &__actions {
      flex-direction: column;
    }

    &__clock-time {
      font-size: 42px;
    }

    &__radio-group {
      flex-direction: column;
      gap: 10px;

      .el-radio {
        margin-bottom: 5px;
      }
    }

    &__result-card {
      margin-top: 20px;
    }
  }
}
</style>
