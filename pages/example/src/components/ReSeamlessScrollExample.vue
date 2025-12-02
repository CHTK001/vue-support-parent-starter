<template>
  <div class="example-container">
    <h2 class="example-title">ReSeamlessScroll 无缝滚动示例</h2>
    <p class="example-desc">无缝滚动组件，支持上下左右滚动、自动播放等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="addItem">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加条目
        </el-button>
        <el-button @click="resetList">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
      </div>

      <div class="scroll-wrapper">
        <ReSeamlessScroll :data="list" :classOption="scrollOption">
          <ul class="scroll-list">
            <li v-for="(it, i) in list" :key="i" class="scroll-item">
              {{ it }}
            </li>
          </ul>
        </ReSeamlessScroll>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="滚动方向">
              <el-select v-model="config.direction" style="width: 100%">
                <el-option label="向上" value="top" />
                <el-option label="向下" value="bottom" />
                <el-option label="向左" value="left" />
                <el-option label="向右" value="right" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="滚动速度">
              <el-input-number
                v-model="config.step"
                :min="1"
                :max="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="自动播放">
              <el-switch v-model="config.autoPlay" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ReSeamlessScroll from "@repo/components/ReSeamlessScroll/src/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ReSeamlessScroll 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const list = ref(["条目 1", "条目 2", "条目 3", "条目 4", "条目 5", "条目 6"]);
let itemCount = 6;

const config = reactive({
  direction: "top",
  step: 1,
  autoPlay: true,
});

const scrollOption = computed(() => ({
  key: 1,
  direction: config.direction,
  step: config.step,
  autoPlay: config.autoPlay,
  limitMoveNum: 3,
}));

// 属性说明
const propsData = [
  { name: "data", type: "array", default: "[]", description: "滚动数据列表" },
  {
    name: "classOption",
    type: "object",
    default: "{}",
    description: "滚动配置项",
  },
  {
    name: "classOption.direction",
    type: "string",
    default: "'top'",
    description: "滚动方向",
  },
  {
    name: "classOption.step",
    type: "number",
    default: "1",
    description: "滚动速度",
  },
  {
    name: "classOption.autoPlay",
    type: "boolean",
    default: "true",
    description: "是否自动播放",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ReSeamlessScroll :data="list" :classOption="scrollOption">
  <ul>
    <li v-for="(it, i) in list" :key="i">{{ it }}</li>
  </ul>
</ReSeamlessScroll>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ReSeamlessScroll from "@repo/components/ReSeamlessScroll/src/index.vue";

const list = ref(["条目 1", "条目 2", "条目 3"]);

const scrollOption = {
  direction: "${config.direction}",
  step: ${config.step},
  autoPlay: ${config.autoPlay}
};`,
  },
]);

function addItem() {
  itemCount++;
  list.value.push(`条目 ${itemCount}`);
}

function resetList() {
  itemCount = 6;
  list.value = ["条目 1", "条目 2", "条目 3", "条目 4", "条目 5", "条目 6"];
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.scroll-wrapper {
  height: 200px;
  overflow: hidden;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.scroll-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.scroll-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>
