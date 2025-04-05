<script setup>
import { ref, reactive, onMounted } from "vue";
import { useClipboard } from "@vueuse/core";
import { ElMessage } from "element-plus";
import ScCron from "@repo/components/ScCron/index.vue";
import { fetchJobNextTriggerTime } from "../../../apps/vue-support-monitor-starter/src/api/monitor/job";

const { copy } = useClipboard();

// 环境变量
const env = reactive({
  currentTime: new Date(),
  inputValue: "0 0 * * * ?",
  loading: false,
  cronExpressions: [
    { label: "每秒钟", value: "* * * * * ?", description: "每秒钟执行一次" },
    { label: "每分钟", value: "0 * * * * ?", description: "每分钟执行一次" },
    { label: "每小时", value: "0 0 * * * ?", description: "每小时执行一次" },
    { label: "每天午夜", value: "0 0 0 * * ?", description: "每天午夜执行一次" },
    { label: "每天早上8点", value: "0 0 8 * * ?", description: "每天早上8点执行一次" },
    { label: "每周一早上8点", value: "0 0 8 * 1 ?", description: "每周一早上8点执行一次" },
    { label: "每月1号午夜", value: "0 0 0 1 * ?", description: "每月1号午夜执行一次" },
    { label: "每年1月1日午夜", value: "0 0 0 1 1 ?", description: "每年1月1日午夜执行一次" },
    { label: "每15分钟", value: "0 0/15 * * * ?", description: "每15分钟执行一次" },
    { label: "工作日早上9点到下午6点每小时", value: "0 0 9-18 * 1-5 ?", description: "工作日早上9点到下午6点每小时执行一次" },
  ],
  cronParts: [
    { name: "分钟", range: "0-59", examples: ["0", "*/5", "1,10,30"] },
    { name: "小时", range: "0-23", examples: ["0", "*/2", "8,12,18"] },
    { name: "日期", range: "1-31", examples: ["1", "15", "1,15,30"] },
    { name: "月份", range: "1-12", examples: ["*", "1,6,12", "*/3"] },
    { name: "星期", range: "0-6", examples: ["*", "1-5", "0,6"] },
  ],
  specialExpressions: [
    { name: "@yearly", equivalent: "0 0 1 1 * ?", description: "每年1月1日午夜执行一次" },
    { name: "@monthly", equivalent: "0 0 1 * * ?", description: "每月1号午夜执行一次" },
    { name: "@weekly", equivalent: "0 0 * * 0 ?", description: "每周日午夜执行一次" },
    { name: "@daily", equivalent: "0 0 * * * ?", description: "每天午夜执行一次" },
    { name: "@hourly", equivalent: "0 * * * * ?", description: "每小时执行一次" },
  ],
  shortcuts: [
    {
      text: "每天8点和12点 (自定义追加)",
      value: "0 0 8,12 * * ?",
    },
    {
      text: "每分钟 (自定义追加)",
      value: "0 * * * * ?",
    },
  ],
  nextExecutions: [],
  selectedTab: "editor",
  minute: "*",
  hour: "*",
  day: "*",
  month: "*",
  weekday: "*",
});

// 计算下一次执行时间
const calculateNextExecutions = async () => {
  env.loading = true;

  try {
    const cronParts = env.inputValue.split(" ");
    if (cronParts.length < 5 || cronParts.length > 6) {
      throw new Error("Cron 表达式格式不正确");
    }

    const _result = await fetchJobNextTriggerTime({
      jobScheduleType: "CRON",
      jobScheduleTime: env.inputValue,
    });

    env.nextExecutions = _result.data;
  } catch (error) {
    ElMessage.error("Cron 表达式解析错误: " + error.message);
    env.nextExecutions = [];
  } finally {
    env.loading = false;
  }
};

// 从UI构建cron表达式
const buildCronFromUI = () => {
  env.inputValue = `${env.minute} ${env.hour} ${env.day} ${env.month} ${env.weekday}`;
  calculateNextExecutions();
};

// 从cron表达式更新UI
const updateUIFromCron = () => {
  try {
    const parts = env.inputValue.split(" ");
    if (parts.length >= 5) {
      env.minute = parts[0];
      env.hour = parts[1];
      env.day = parts[2];
      env.month = parts[3];
      env.weekday = parts[4];
    }
  } catch (error) {
    ElMessage.error("解析Cron表达式失败");
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

// 使用预设表达式
const useExpression = (expression) => {
  env.inputValue = expression.value;
  updateUIFromCron();
  calculateNextExecutions();
};

// 重置表单
const resetForm = () => {
  env.inputValue = "0 0 * * *";
  updateUIFromCron();
  env.nextExecutions = [];
};

// 组件挂载时初始化
onMounted(() => {
  updateUIFromCron();
  calculateNextExecutions();
});

// 处理 cron 组件的值变化
const handleCronChange = (val) => {
  if (val && typeof val === "string") {
    env.inputValue = val;
    updateUIFromCron();
  }
};
</script>

<template>
  <div class="crontab-tool">
    <div class="crontab-tool__content">
      <!-- 头部信息 -->
      <div class="crontab-tool__header-container">
        <div class="crontab-tool__header">
          <div class="crontab-tool__header-inner">
            <h1 class="crontab-tool__header-title">Cron 表达式工具</h1>
            <p class="crontab-tool__header-subtitle">创建、解析和测试 Cron 表达式，用于定时任务调度</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-tabs v-model="env.selectedTab" class="crontab-tool__main-tabs">
        <el-tab-pane label="Cron 编辑器" name="editor">
          <el-row :gutter="24">
            <!-- 左侧输入区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="crontab-tool__input-card" shadow="hover">
                <template #header>
                  <div class="crontab-tool__card-header">
                    <IconifyIconOnline icon="ri:time-line" class="crontab-tool__card-icon" />
                    <span>Cron 表达式</span>
                  </div>
                </template>

                <el-form label-position="top">
                  <!-- Cron 表达式输入 - 使用 ScCron 替换 -->
                  <el-form-item label="Cron 表达式">
                    <div class="crontab-tool__vcrontab-wrapper w-full">
                      <ScCron v-model="env.inputValue" maxlength="128" :shortcuts="env.shortcuts" placeholder="请输入Cron定时规则" clearable />
                    </div>
                    <div class="crontab-tool__input-actions">
                      <el-button type="primary" :loading="env.loading" @click="calculateNextExecutions">
                        <IconifyIconOnline icon="ri:play-line" />
                        <span>解析表达式</span>
                      </el-button>
                      <el-button type="success" @click="copyToClipboard(env.inputValue)">
                        <IconifyIconOnline icon="ri:file-copy-line" />
                        <span>复制</span>
                      </el-button>
                    </div>
                  </el-form-item>

                  <!-- 常用表达式 -->
                  <el-form-item label="常用表达式">
                    <div class="crontab-tool__expressions">
                      <el-scrollbar height="200px">
                        <div v-for="(expr, index) in env.cronExpressions" :key="index" class="crontab-tool__expression-item" @click="useExpression(expr)">
                          <div class="crontab-tool__expression-header">
                            <span class="crontab-tool__expression-name">{{ expr.label }}</span>
                            <span class="crontab-tool__expression-value">{{ expr.value }}</span>
                          </div>
                          <div class="crontab-tool__expression-desc">
                            {{ expr.description }}
                          </div>
                        </div>
                      </el-scrollbar>
                    </div>
                  </el-form-item>

                  <!-- 操作按钮 -->
                  <div class="crontab-tool__actions">
                    <el-button type="primary" :loading="env.loading" class="crontab-tool__parse-btn" @click="calculateNextExecutions">
                      <IconifyIconOnline icon="ri:time-line" />
                      <span>解析表达式</span>
                    </el-button>

                    <el-button class="crontab-tool__reset-btn" @click="resetForm">
                      <IconifyIconOnline icon="ri:refresh-line" />
                      <span>重置</span>
                    </el-button>

                    <el-button type="success" class="crontab-tool__copy-btn" @click="copyToClipboard(env.inputValue)">
                      <IconifyIconOnline icon="ri:file-copy-line" />
                      <span>复制</span>
                    </el-button>
                  </div>
                </el-form>
              </el-card>
            </el-col>

            <!-- 右侧结果区域 -->
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="crontab-tool__result-card" shadow="hover">
                <template #header>
                  <div class="crontab-tool__card-header">
                    <IconifyIconOnline icon="ri:calendar-check-line" class="crontab-tool__card-icon" />
                    <span>执行计划</span>
                  </div>
                </template>

                <el-empty v-if="!env.nextExecutions.length" description="请先解析 Cron 表达式" class="crontab-tool__empty">
                  <template #image>
                    <IconifyIconOnline icon="ri:calendar-line" class="crontab-tool__empty-icon" />
                  </template>
                </el-empty>

                <div v-else class="crontab-tool__results">
                  <div class="crontab-tool__result-section">
                    <div class="crontab-tool__result-section-header">
                      <IconifyIconOnline icon="ri:calendar-event-line" class="crontab-tool__result-section-icon" />
                      <span>未来执行时间</span>
                    </div>
                    <div class="crontab-tool__result-content">
                      <div v-for="(date, index) in env.nextExecutions" :key="index" class="crontab-tool__execution-time">
                        <div class="crontab-tool__execution-index">{{ index + 1 }}</div>
                        <div class="crontab-tool__execution-date">
                          {{ date.toLocaleString() }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>

              <!-- Cron 语法参考 -->
              <el-card class="crontab-tool__reference-card" shadow="hover">
                <template #header>
                  <div class="crontab-tool__card-header">
                    <IconifyIconOnline icon="ri:information-line" class="crontab-tool__card-icon" />
                    <span>Cron 语法参考</span>
                  </div>
                </template>

                <div class="crontab-tool__reference">
                  <pre class="crontab-tool__reference-format">
┌──────────── 分钟 (0 - 59)
│ ┌────────── 小时 (0 - 23)
│ │ ┌──────── 日期 (1 - 31)
│ │ │ ┌────── 月份 (1 - 12)
│ │ │ │ ┌──── 星期几 (0 - 6, 周日=0)
│ │ │ │ │
* * * * *</pre
                  >

                  <div class="crontab-tool__reference-section">
                    <h4 class="crontab-tool__reference-title">特殊字符</h4>
                    <div class="crontab-tool__reference-table">
                      <div class="crontab-tool__reference-row">
                        <div class="crontab-tool__reference-cell">*</div>
                        <div class="crontab-tool__reference-cell">任意值</div>
                        <div class="crontab-tool__reference-cell">* * * * *</div>
                        <div class="crontab-tool__reference-cell">每分钟</div>
                      </div>
                      <div class="crontab-tool__reference-row">
                        <div class="crontab-tool__reference-cell">,</div>
                        <div class="crontab-tool__reference-cell">值列表</div>
                        <div class="crontab-tool__reference-cell">1,3,5 * * * *</div>
                        <div class="crontab-tool__reference-cell">第1,3,5分钟</div>
                      </div>
                      <div class="crontab-tool__reference-row">
                        <div class="crontab-tool__reference-cell">-</div>
                        <div class="crontab-tool__reference-cell">范围</div>
                        <div class="crontab-tool__reference-cell">1-5 * * * *</div>
                        <div class="crontab-tool__reference-cell">第1至5分钟</div>
                      </div>
                      <div class="crontab-tool__reference-row">
                        <div class="crontab-tool__reference-cell">/</div>
                        <div class="crontab-tool__reference-cell">步长</div>
                        <div class="crontab-tool__reference-cell">*/15 * * * *</div>
                        <div class="crontab-tool__reference-cell">每15分钟</div>
                      </div>
                    </div>
                  </div>

                  <div class="crontab-tool__reference-section">
                    <h4 class="crontab-tool__reference-title">特殊表达式</h4>
                    <div class="crontab-tool__reference-table">
                      <div v-for="(expr, index) in env.specialExpressions" :key="index" class="crontab-tool__reference-row">
                        <div class="crontab-tool__reference-cell">{{ expr.name }}</div>
                        <div class="crontab-tool__reference-cell">{{ expr.equivalent }}</div>
                        <div class="crontab-tool__reference-cell">{{ expr.description }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Cron 在线测试" name="tester">
          <el-row :gutter="24">
            <el-col :span="24">
              <el-card class="crontab-tool__tester-card" shadow="hover">
                <template #header>
                  <div class="crontab-tool__card-header">
                    <IconifyIconOnline icon="ri:test-tube-line" class="crontab-tool__card-icon" />
                    <span>Cron 在线测试</span>
                  </div>
                </template>

                <div class="crontab-tool__tester">
                  <p class="crontab-tool__tester-desc">此功能允许您测试 Cron 表达式在特定时间范围内的执行情况。输入 Cron 表达式和时间范围，然后点击"测试"按钮。</p>

                  <div class="crontab-tool__tester-form">
                    <!-- 这里可以添加更复杂的测试功能，如时间范围选择等 -->
                    <p class="crontab-tool__tester-note">注意：此功能正在开发中，敬请期待。</p>
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
.crontab-tool {
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
  &__reference-card,
  &__tester-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  &__input {
    width: 100%;
    font-family: monospace;
  }

  &__input-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__builder {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__builder-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__builder-label {
    min-width: 120px;
    font-size: 14px;
  }

  &__expressions {
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }

  &__expression-item {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-light);
    cursor: pointer;
    transition: background-color 0.3s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  &__expression-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  &__expression-name {
    font-weight: 600;
  }

  &__expression-value {
    font-family: monospace;
    color: var(--el-color-primary);
  }

  &__expression-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    gap: 12px;
  }

  &__parse-btn,
  &__copy-btn {
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
  }

  &__result-section-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  &__result-content {
    padding: 16px;
  }

  &__execution-time {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px dashed var(--el-border-color-light);

    &:last-child {
      border-bottom: none;
    }
  }

  &__execution-index {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 24px;
    background-color: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    margin-right: 12px;
  }

  &__execution-date {
    font-family: monospace;
  }

  &__reference {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__reference-format {
    background-color: var(--el-fill-color-light);
    padding: 16px;
    border-radius: 8px;
    font-family: monospace;
    margin: 0;
    line-height: 1.5;
  }

  &__reference-section {
    margin-bottom: 16px;
  }

  &__reference-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
  }

  &__reference-table {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  &__reference-row {
    display: flex;
    border-bottom: 1px solid var(--el-border-color-light);

    &:last-child {
      border-bottom: none;
    }
  }

  &__reference-cell {
    padding: 8px 12px;
    flex: 1;
    border-right: 1px solid var(--el-border-color-light);

    &:last-child {
      border-right: none;
    }

    &:first-child {
      flex: 0 0 60px;
      font-weight: 600;
      background-color: var(--el-fill-color-light);
    }
  }

  &__tester {
    padding: 16px;
  }

  &__tester-desc {
    margin-bottom: 20px;
  }

  &__tester-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__tester-note {
    color: var(--el-text-color-secondary);
    font-style: italic;
  }

  @media (max-width: 768px) {
    &__builder-row {
      flex-direction: column;
      align-items: flex-start;
    }

    &__builder-label {
      margin-bottom: 4px;
    }

    &__actions {
      flex-wrap: wrap;
    }
  }
}

// 全局样式覆盖，使 vcrontab 组件与当前主题匹配
:deep(.crontab-container) {
  background-color: transparent;

  .crontab-input {
    border-color: var(--el-border-color);
    background-color: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }

  .crontab-radio {
    color: var(--el-text-color-primary);
  }

  .crontab-select {
    border-color: var(--el-border-color);
    background-color: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }
}

// 修改 vcrontab 组件样式覆盖
:deep(.cron-container) {
  width: 100% !important;
  background-color: transparent !important;

  .cron-input {
    border: 1px solid var(--el-border-color) !important;
    background-color: var(--el-bg-color) !important;
    color: var(--el-text-color-primary) !important;
    height: 32px !important;
    line-height: 32px !important;
    padding: 0 8px !important;
  }

  .cron-select {
    border: 1px solid var(--el-border-color) !important;
    background-color: var(--el-bg-color) !important;
    color: var(--el-text-color-primary) !important;
  }

  .cron-radio {
    color: var(--el-text-color-primary) !important;
  }

  .cron-radio-label {
    margin-right: 10px !important;
  }

  .cron-button {
    background-color: var(--el-color-primary) !important;
    border-color: var(--el-color-primary) !important;
  }
}

// 删除原有的样式覆盖
// :deep(.crontab-container) { ... }
// :deep(.cron-container) { ... }

// 添加 ScCron 的样式覆盖
:deep(.sc-cron) {
  width: 100% !important;

  .el-input,
  .el-select {
    width: 100% !important;
  }

  .el-tabs__item {
    font-size: 14px !important;
  }

  .el-radio {
    margin-right: 12px !important;
  }
}

// 保留新添加的样式
.crontab-tool {
  &__vcrontab-wrapper {
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
  }

  &__input-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
}
</style>
