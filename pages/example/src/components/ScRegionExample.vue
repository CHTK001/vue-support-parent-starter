<template>
  <div class="sc-region-example">
    <!-- 基础用法 -->
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScRegion v-model="region1" style="width: 320px" />
        <span class="demo-result">选中: {{ region1.length ? region1.join(' / ') : '(未选择)' }}</span>
      </div>
    </DemoBlock>

    <!-- 任意级选择 -->
    <DemoBlock title="任意级选择" :code="codes.checkStrictly">
      <p class="demo-tip">启用 checkStrictly 后，可以选择任意层级（省、市、区）</p>
      <div class="demo-row">
        <ScRegion v-model="region2" check-strictly style="width: 320px" />
        <span class="demo-result">选中: {{ region2.length ? region2.join(' / ') : '(未选择)' }}</span>
      </div>
    </DemoBlock>

    <!-- 多选 -->
    <DemoBlock title="多选" :code="codes.multiple">
      <p class="demo-tip">支持选择多个地区</p>
      <div class="demo-row">
        <ScRegion v-model="region6" multiple style="width: 400px" />
      </div>
      <div class="demo-result-block">
        选中: {{ region6.length ? JSON.stringify(region6) : '(未选择)' }}
      </div>
    </DemoBlock>

    <!-- 多选 + 折叠标签 -->
    <DemoBlock title="多选折叠标签" :code="codes.multipleCollapse">
      <p class="demo-tip">多选时折叠标签，只显示指定数量</p>
      <div class="demo-row">
        <ScRegion 
          v-model="region7" 
          multiple 
          collapse-tags 
          :max-collapse-tags="2"
          style="width: 400px" 
        />
      </div>
    </DemoBlock>

    <!-- 多选 + 任意级 -->
    <DemoBlock title="多选 + 任意级选择" :code="codes.multipleCheckStrictly">
      <p class="demo-tip">可以选择多个任意层级的地区</p>
      <div class="demo-row">
        <ScRegion 
          v-model="region8" 
          multiple 
          check-strictly
          collapse-tags
          style="width: 400px" 
        />
      </div>
    </DemoBlock>

    <!-- 显示编码 -->
    <DemoBlock title="显示编码" :code="codes.showCode">
      <p class="demo-tip">在选项下方显示编码（灰色小字）</p>
      <div class="demo-row">
        <ScRegion v-model="region3" show-code style="width: 320px" />
        <span class="demo-result">选中: {{ region3.length ? region3.join(' / ') : '(未选择)' }}</span>
      </div>
    </DemoBlock>

    <!-- 只显示编码 -->
    <DemoBlock title="只显示编码" :code="codes.showCodeOnly">
      <p class="demo-tip">选择后输入框只显示编码</p>
      <div class="demo-row">
        <ScRegion v-model="region4" show-code-only style="width: 320px" />
        <span class="demo-result">选中: {{ region4.length ? region4.join(' / ') : '(未选择)' }}</span>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScRegion from "@repo/components/ScRegion/src/index.vue";
import DemoBlock from "./DemoBlock.vue";

/**
 * ScRegion 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

const region1 = ref<string[]>([]);
const region2 = ref<string[]>([]);
const region3 = ref<string[]>([]);
const region4 = ref<string[]>([]);
const region6 = ref<string[][]>([]);
const region7 = ref<string[][]>([]);
const region8 = ref<string[][]>([]);

// 代码模板
const codes = {
  basic: `<ScRegion v-model="region" />

<script setup>
import { ref } from "vue";
const region = ref([]);
<\/script>`,

  checkStrictly: `<!-- 任意级选择：可以只选省或市 -->
<ScRegion v-model="region" check-strictly />`,

  multiple: `<!-- 多选 -->
<ScRegion v-model="regions" multiple />

<script setup>
import { ref } from "vue";
// 多选时值为二维数组
const regions = ref([]);
<\/script>`,

  multipleCollapse: `<!-- 多选 + 折叠标签 -->
<ScRegion 
  v-model="regions" 
  multiple 
  collapse-tags 
  :max-collapse-tags="2"
/>`,

  multipleCheckStrictly: `<!-- 多选 + 任意级选择 -->
<ScRegion 
  v-model="regions" 
  multiple 
  check-strictly
  collapse-tags
/>`,

  showCode: `<!-- 在选项下方显示编码 -->
<ScRegion v-model="region" show-code />`,

  showCodeOnly: `<!-- 选择后只显示编码 -->
<ScRegion v-model="region" show-code-only />`
};
</script>

<style scoped lang="scss">
.sc-region-example {
  padding: 20px;
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.demo-result {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
}

.demo-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demo-result-block {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 12px;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
</style>
