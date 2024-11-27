<template>
  <div class="bg-white p-[30px]">
    <el-row>
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
        <div data-v-236d2dc6="" data-v-b6cbd7a9="" class="c-card" style="--51386d66: #ffffff; --1d9c24b0: #efeff5">
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
            <table class="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400" role="table" aria-label="数据表">
              <thead class="bg-#ffffff uppercase text-gray-700 dark:bg-#333333 dark:text-gray-400" border-b="1px solid dark:transparent #efeff5">
                <tr>
                  <th scope="col" class="px-6 py-3 text-xs">符号</th>
                  <th scope="col" class="px-6 py-3 text-xs">含义</th>
                  <th scope="col" class="px-6 py-3 text-xs">示例</th>
                  <th scope="col" class="px-6 py-3 text-xs">等效于</th>
                </tr>
              </thead>
              <tbody>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">*</td>
                  <td class="px-6 py-4">任何值</td>
                  <td class="px-6 py-4">* * * *</td>
                  <td class="px-6 py-4">每分钟</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">-</td>
                  <td class="px-6 py-4">值的范围</td>
                  <td class="px-6 py-4">1-10 * * *</td>
                  <td class="px-6 py-4">第1到第10分钟</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">,</td>
                  <td class="px-6 py-4">值的列表</td>
                  <td class="px-6 py-4">1,10 * * *</td>
                  <td class="px-6 py-4">第1和第10分钟</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">/</td>
                  <td class="px-6 py-4">步进值</td>
                  <td class="px-6 py-4">*/10 * * *</td>
                  <td class="px-6 py-4">每隔10分钟</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@yearly</td>
                  <td class="px-6 py-4">每年1月1日午夜执行一次</td>
                  <td class="px-6 py-4">@yearly</td>
                  <td class="px-6 py-4">0 0 1 1 *</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@annually</td>
                  <td class="px-6 py-4">与@yearly相同</td>
                  <td class="px-6 py-4">@annually</td>
                  <td class="px-6 py-4">0 0 1 1 *</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@monthly</td>
                  <td class="px-6 py-4">每月1日午夜执行一次</td>
                  <td class="px-6 py-4">@monthly</td>
                  <td class="px-6 py-4">0 0 1 * *</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@weekly</td>
                  <td class="px-6 py-4">每周日午夜执行一次</td>
                  <td class="px-6 py-4">@weekly</td>
                  <td class="px-6 py-4">0 0 * * 0</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@daily</td>
                  <td class="px-6 py-4">每天午夜执行一次</td>
                  <td class="px-6 py-4">@daily</td>
                  <td class="px-6 py-4">0 0 * * *</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@midnight</td>
                  <td class="px-6 py-4">与@daily相同</td>
                  <td class="px-6 py-4">@midnight</td>
                  <td class="px-6 py-4">0 0 * * *</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323">
                  <td class="px-6 py-4">@hourly</td>
                  <td class="px-6 py-4">每小时开始时执行一次</td>
                  <td class="px-6 py-4">@hourly</td>
                  <td class="px-6 py-4">0 * * * *</td>
                </tr>
                <tr border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323 important:border-b-none">
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
