<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:time-line" class="title-icon" />
            Cron 表达式工具
          </h1>
          <p class="page-subtitle">生成和解析 Cron 定时任务表达式</p>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-auto">
      <el-card shadow="never">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form :inline="true">
              <el-form-item>
                <el-button v-copy:click="input" size="small" :icon="useRenderIcon('ep:copy-document')" />
              </el-form-item>
              <el-form-item>
                <sc-cron v-model="input" maxlength="128" placeholder="请输入Cron定时规则" clearable :shortcuts="shortcuts" />
              </el-form-item>
            </el-form>
          </el-col>
          <el-col :span="12">
            <div data-v-236d2dc6="" data-v-b6cbd7a9="" class="c-card cron-card">
              <pre data-v-b6cbd7a9="">
┌──────────── [可选] 秒 (0 - 59)
| ┌────────── 分钟 (0 - 59)
| | ┌──────── 小时 (0 - 23)
| | | ┌────── 日期 (1 - 31)
| | | | ┌──── 月份 (1 - 12) 或 jan,feb,mar,apr ...
| | | | | ┌── 星期几 (0 - 6, 周日=0) 或 sun,mon ...
| | | | | |
* * * * * * 命令</pre
              >
              <div data-v-b6cbd7a9="" class="relative overflow-x-auto rounded">
                <table class="cron-table" role="table" aria-label="数据表">
                  <thead class="cron-table-head">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-xs">符号</th>
                      <th scope="col" class="px-6 py-3 text-xs">含义</th>
                      <th scope="col" class="px-6 py-3 text-xs">示例</th>
                      <th scope="col" class="px-6 py-3 text-xs">等效于</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">*</td>
                      <td class="px-6 py-4">任何值</td>
                      <td class="px-6 py-4">* * * *</td>
                      <td class="px-6 py-4">每分钟</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">-</td>
                      <td class="px-6 py-4">值的范围</td>
                      <td class="px-6 py-4">1-10 * * *</td>
                      <td class="px-6 py-4">第1到第10分钟</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">,</td>
                      <td class="px-6 py-4">值的列表</td>
                      <td class="px-6 py-4">1,10 * * *</td>
                      <td class="px-6 py-4">第1和第10分钟</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">/</td>
                      <td class="px-6 py-4">步进值</td>
                      <td class="px-6 py-4">*/10 * * *</td>
                      <td class="px-6 py-4">每隔10分钟</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@yearly</td>
                      <td class="px-6 py-4">每年1月1日午夜执行一次</td>
                      <td class="px-6 py-4">@yearly</td>
                      <td class="px-6 py-4">0 0 1 1 *</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@annually</td>
                      <td class="px-6 py-4">与@yearly相同</td>
                      <td class="px-6 py-4">@annually</td>
                      <td class="px-6 py-4">0 0 1 1 *</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@monthly</td>
                      <td class="px-6 py-4">每月1日午夜执行一次</td>
                      <td class="px-6 py-4">@monthly</td>
                      <td class="px-6 py-4">0 0 1 * *</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@weekly</td>
                      <td class="px-6 py-4">每周日午夜执行一次</td>
                      <td class="px-6 py-4">@weekly</td>
                      <td class="px-6 py-4">0 0 * * 0</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@daily</td>
                      <td class="px-6 py-4">每天午夜执行一次</td>
                      <td class="px-6 py-4">@daily</td>
                      <td class="px-6 py-4">0 0 * * *</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@midnight</td>
                      <td class="px-6 py-4">与@daily相同</td>
                      <td class="px-6 py-4">@midnight</td>
                      <td class="px-6 py-4">0 0 * * *</td>
                    </tr>
                    <tr class="cron-table-row">
                      <td class="px-6 py-4">@hourly</td>
                      <td class="px-6 py-4">每小时开始时执行一次</td>
                      <td class="px-6 py-4">@hourly</td>
                      <td class="px-6 py-4">0 * * * *</td>
                    </tr>
                    <tr class="cron-table-row cron-table-row-last">
                      <td class="px-6 py-4">@reboot</td>
                      <td class="px-6 py-4">启动时运行</td>
                      <td class="px-6 py-4" />
                      <td class="px-6 py-4" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import scCron from "@repo/components/ScCron/index.vue";
export default {
  components: { scCron },
  data() {
    return {
      input: "0 * * * * ?",
      shortcuts: [
        {
          text: "每天8点和12点 (自定义追加)",
          value: "0 0 8,12 * * ?"
        },
        {
          text: "每分钟 (自定义追加)",
          value: "0 * * * * ?"
        }
      ]
    };
  },
  methods: {
    useRenderIcon
  }
};
</script>

<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

:deep(.el-card) {
  border-radius: 8px;
}

// 导入自定义颜色系统
@import "../../../../../../../packages/assets/style/colors/index.scss";

.cron-card {
  background-color: var(--app-bg-primary);
  border: 1px solid var(--app-border-primary);
}

.cron-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.cron-table-head {
  background-color: var(--app-bg-primary);
  text-transform: uppercase;
  color: var(--app-text-primary);
  border-bottom: 1px solid var(--app-border-primary);

  html.dark & {
    background-color: var(--app-bg-secondary);
    color: var(--app-text-primary);
  }
}

.cron-table-row {
  background-color: var(--app-bg-primary);
  border-bottom: 1px solid var(--app-border-primary);

  html.dark & {
    background-color: var(--app-bg-secondary);
    border-bottom-color: var(--app-border-secondary);
  }
}

.cron-table-row-last {
  border-bottom: none !important;
}
</style>
