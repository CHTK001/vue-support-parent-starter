<template>
  <div class="countdown-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础倒计时</h3>
        <p class="example-desc">基础的倒计时组件，支持设置目标时间</p>

        <div class="example-row">
          <div class="countdown-demo">
            <ScCountDown :time="basicTime" />
          </div>
          <div class="countdown-controls">
            <el-button type="primary" @click="resetBasicTime">重置倒计时</el-button>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCountDown :time="basicTime" /&gt;

&lt;script setup&gt;
import { ref } from 'vue';

// 设置10分钟的倒计时（毫秒）
const basicTime = ref(10 * 60 * 1000);

const resetBasicTime = () => {
  basicTime.value = 10 * 60 * 1000;
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义格式">
        <h3>自定义格式</h3>
        <p class="example-desc">可以自定义倒计时的显示格式</p>

        <div class="example-row">
          <div class="countdown-demo">
            <ScCountDown :time="formatTime" format="DD天HH时mm分ss秒" />
          </div>
          <div class="countdown-controls">
            <el-button type="primary" @click="resetFormatTime">重置倒计时</el-button>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCountDown :time="formatTime" format="DD天HH时mm分ss秒" /&gt;

&lt;script setup&gt;
import { ref } from 'vue';

// 设置1天2小时的倒计时（毫秒）
const formatTime = ref(26 * 60 * 60 * 1000);

const resetFormatTime = () => {
  formatTime.value = 26 * 60 * 60 * 1000;
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="事件处理">
        <h3>事件处理</h3>
        <p class="example-desc">倒计时结束时触发事件</p>

        <div class="example-row">
          <div class="countdown-demo">
            <ScCountDown :time="eventTime" @finish="handleCountdownFinish" />
          </div>
          <div class="countdown-controls">
            <el-button type="primary" @click="resetEventTime">重置倒计时</el-button>
          </div>
          <div class="countdown-message" v-if="finishMessage">
            <el-alert :title="finishMessage" type="success" :closable="false" show-icon />
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCountDown :time="eventTime" @finish="handleCountdownFinish" /&gt;

&lt;script setup&gt;
import { ref } from 'vue';

// 设置5秒的倒计时（毫秒）
const eventTime = ref(5 * 1000);
const finishMessage = ref('');

const resetEventTime = () => {
  eventTime.value = 5 * 1000;
  finishMessage.value = '';
};

const handleCountdownFinish = () => {
  finishMessage.value = '倒计时结束！';
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义样式">
        <h3>自定义样式</h3>
        <p class="example-desc">可以自定义倒计时的样式</p>

        <div class="example-row">
          <div class="countdown-demo">
            <ScCountDown :time="styleTime" class="custom-countdown" />
          </div>
          <div class="countdown-controls">
            <el-button type="primary" @click="resetStyleTime">重置倒计时</el-button>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCountDown :time="styleTime" class="custom-countdown" /&gt;

&lt;style scoped&gt;
.custom-countdown {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  background-color: #ecf5ff;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
&lt;/style&gt;
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "@repo/utils";

// 基础倒计时
const basicTime = ref(10 * 60 * 1000); // 10分钟

const resetBasicTime = () => {
  basicTime.value = 10 * 60 * 1000;
  message("倒计时已重置", { type: "success" });
};

// 自定义格式倒计时
const formatTime = ref(26 * 60 * 60 * 1000); // 1天2小时

const resetFormatTime = () => {
  formatTime.value = 26 * 60 * 60 * 1000;
  message("倒计时已重置", { type: "success" });
};

// 事件处理倒计时
const eventTime = ref(5 * 1000); // 5秒
const finishMessage = ref("");

const resetEventTime = () => {
  eventTime.value = 5 * 1000;
  finishMessage.value = "";
  message("倒计时已重置", { type: "success" });
};

const handleCountdownFinish = () => {
  finishMessage.value = "倒计时结束！";
  message("倒计时结束！", { type: "warning" });
};

// 自定义样式倒计时
const styleTime = ref(15 * 60 * 1000); // 15分钟

const resetStyleTime = () => {
  styleTime.value = 15 * 60 * 1000;
  message("倒计时已重置", { type: "success" });
};
</script>

<style lang="scss" scoped>
.countdown-example {
  padding: 20px;

  .example-desc {
    color: #666;
    margin-bottom: 20px;
  }

  .example-row {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .countdown-demo {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 30px;
    background-color: #f5f7fa;
    border-radius: 8px;
  }

  .countdown-controls {
    display: flex;
    justify-content: center;
  }

  .countdown-message {
    margin-top: 10px;
  }

  pre {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }

  .custom-countdown {
    font-size: 24px;
    font-weight: bold;
    color: #409eff;
    background-color: #ecf5ff;
    padding: 10px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}
</style>
