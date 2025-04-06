<template>
  <div class="cron-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础Cron表达式编辑器</h3>
        <p class="example-desc">基础的Cron表达式编辑器，支持可视化编辑Cron表达式</p>

        <div class="example-row">
          <div class="cron-demo">
            <ScCron v-model="basicCron" />
          </div>
          <div class="cron-result">
            <h4>当前表达式:</h4>
            <el-input v-model="basicCron" readonly />
            <h4>表达式说明:</h4>
            <div class="cron-description">
              {{ basicCronDescription }}
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCron v-model="basicCron" /&gt;

&lt;script setup&gt;
import { ref, computed } from 'vue';

const basicCron = ref('0 0 12 * * ?');

// 这里只是示例，实际项目中可能需要一个函数来解析cron表达式
const basicCronDescription = computed(() => {
  if (basicCron.value === '0 0 12 * * ?') {
    return '每天中午12点触发';
  }
  return '自定义触发规则';
});
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义选项">
        <h3>自定义选项</h3>
        <p class="example-desc">可以自定义Cron编辑器的可选项和显示方式</p>

        <div class="example-row">
          <div class="cron-demo">
            <ScCron v-model="customCron" :hide-second="true" :hide-year="true" />
          </div>
          <div class="cron-result">
            <h4>当前表达式 (无秒和年):</h4>
            <el-input v-model="customCron" readonly />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCron 
  v-model="customCron" 
  :hide-second="true"
  :hide-year="true"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const customCron = ref('0 30 9 ? * MON-FRI');
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="事件处理">
        <h3>事件处理</h3>
        <p class="example-desc">监听Cron表达式变化事件</p>

        <div class="example-row">
          <div class="cron-demo">
            <ScCron v-model="eventCron" @change="handleCronChange" />
          </div>
          <div class="cron-result">
            <h4>当前表达式:</h4>
            <el-input v-model="eventCron" readonly />
            <h4>变更记录:</h4>
            <div class="change-log">
              <div v-for="(log, index) in changeLogs" :key="index" class="log-item">
                {{ log }}
              </div>
              <el-empty v-if="changeLogs.length === 0" description="暂无变更记录" />
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCron 
  v-model="eventCron" 
  @change="handleCronChange"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const eventCron = ref('0 0 0 1 * ?');
const changeLogs = ref([]);

const handleCronChange = (newValue, oldValue) => {
  changeLogs.value.unshift(`${new Date().toLocaleTimeString()}: ${oldValue} -> ${newValue}`);
  // 只保留最近5条记录
  if (changeLogs.value.length > 5) {
    changeLogs.value = changeLogs.value.slice(0, 5);
  }
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="表达式验证">
        <h3>表达式验证</h3>
        <p class="example-desc">手动输入Cron表达式并验证</p>

        <div class="example-row">
          <div class="cron-validation">
            <el-input v-model="manualCron" placeholder="请输入Cron表达式" :status="cronValid ? '' : 'error'">
              <template #append>
                <el-button @click="validateCron">验证</el-button>
              </template>
            </el-input>

            <div class="validation-result" v-if="validationMessage">
              <el-alert :title="validationMessage" :type="cronValid ? 'success' : 'error'" :closable="false" show-icon />
            </div>

            <div class="cron-editor-container" v-if="cronValid">
              <h4>可视化编辑:</h4>
              <ScCron v-model="manualCron" />
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;el-input 
  v-model="manualCron" 
  placeholder="请输入Cron表达式" 
  :status="cronValid ? '' : 'error'"
&gt;
  &lt;template #append&gt;
    &lt;el-button @click="validateCron"&gt;验证&lt;/el-button&gt;
  &lt;/template&gt;
&lt;/el-input&gt;

&lt;div class="validation-result" v-if="validationMessage"&gt;
  &lt;el-alert 
    :title="validationMessage" 
    :type="cronValid ? 'success' : 'error'" 
    :closable="false"
    show-icon
  /&gt;
&lt;/div&gt;

&lt;div class="cron-editor-container" v-if="cronValid"&gt;
  &lt;h4&gt;可视化编辑:&lt;/h4&gt;
  &lt;ScCron v-model="manualCron" /&gt;
&lt;/div&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const manualCron = ref('');
const cronValid = ref(false);
const validationMessage = ref('');

const validateCron = () => {
  // 这里使用一个简单的正则表达式验证，实际项目中可能需要更复杂的验证逻辑
  const cronRegex = /^(\S+\s){5}\S+$/;
  cronValid.value = cronRegex.test(manualCron.value.trim());
  
  if (cronValid.value) {
    validationMessage.value = 'Cron表达式有效';
  } else {
    validationMessage.value = 'Cron表达式无效，请检查格式';
  }
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { message } from "@repo/utils";
import ScCron from "@repo/components/ScCron/index.vue";

// 基础Cron
const basicCron = ref("0 0 12 * * ?");

// 这里只是示例，实际项目中可能需要一个函数来解析cron表达式
const basicCronDescription = computed(() => {
  if (basicCron.value === "0 0 12 * * ?") {
    return "每天中午12点触发";
  } else if (basicCron.value === "0 0 0 * * ?") {
    return "每天0点触发";
  } else if (basicCron.value === "0 0 0 ? * MON") {
    return "每周一0点触发";
  } else if (basicCron.value === "0 0 0 1 * ?") {
    return "每月1日0点触发";
  }
  return "自定义触发规则";
});

// 自定义选项Cron
const customCron = ref("0 30 9 ? * MON-FRI");

// 事件处理Cron
const eventCron = ref("0 0 0 1 * ?");
const changeLogs = ref([]);

const handleCronChange = (newValue, oldValue) => {
  changeLogs.value.unshift(`${new Date().toLocaleTimeString()}: ${oldValue} -> ${newValue}`);
  // 只保留最近5条记录
  if (changeLogs.value.length > 5) {
    changeLogs.value = changeLogs.value.slice(0, 5);
  }
  message(`Cron表达式已更新: ${newValue}`, { type: "info" });
};

// 表达式验证
const manualCron = ref("");
const cronValid = ref(false);
const validationMessage = ref("");

const validateCron = () => {
  // 这里使用一个简单的正则表达式验证，实际项目中可能需要更复杂的验证逻辑
  const cronRegex = /^(\S+\s){5}\S+$/;
  cronValid.value = cronRegex.test(manualCron.value.trim());

  if (cronValid.value) {
    validationMessage.value = "Cron表达式有效";
    message("Cron表达式验证通过", { type: "success" });
  } else {
    validationMessage.value = "Cron表达式无效，请检查格式";
    message("Cron表达式验证失败", { type: "error" });
  }
};
</script>

<style lang="scss" scoped>
.cron-example {
  padding: 20px;

  .example-desc {
    color: #666;
    margin-bottom: 20px;
  }

  .example-row {
    margin-bottom: 20px;
  }

  .cron-demo {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 8px;
  }

  .cron-result {
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 20px;

    h4 {
      margin-top: 10px;
      margin-bottom: 10px;
      font-weight: 500;
      color: #606266;
    }

    .cron-description {
      padding: 10px;
      background-color: #fff;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
      color: #606266;
    }

    .change-log {
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      background-color: #fff;
      border-radius: 4px;
      border: 1px solid #dcdfe6;

      .log-item {
        padding: 5px 0;
        border-bottom: 1px dashed #ebeef5;
        font-size: 14px;
        color: #606266;

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .cron-validation {
    .validation-result {
      margin-top: 15px;
      margin-bottom: 15px;
    }

    .cron-editor-container {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 8px;

      h4 {
        margin-top: 0;
        margin-bottom: 15px;
        font-weight: 500;
        color: #606266;
      }
    }
  }

  pre {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
}
</style>
