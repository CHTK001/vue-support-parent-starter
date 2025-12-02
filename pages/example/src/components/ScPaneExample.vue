<template>
  <div class="p-4 flex flex-col gap-6">
    <section>
      <h3 class="mb-2">默认布局（上/中/下 + 左/中/右）</h3>
      <div class="border rounded overflow-hidden" style="height: 300px">
        <ScPane
          :headerSize="50"
          :footerSize="40"
          :leftSize="180"
          :rightSize="200"
          :headerResizable="true"
          :leftResizable="true"
          :rightResizable="true"
        >
          <template #header>
            <div
              class="h-full flex items-center px-3 bg-[var(--el-fill-color-light)]"
            >
              Header
            </div>
          </template>
          <template #left>
            <div class="h-full p-3">Left</div>
          </template>
          <template #center>
            <div class="h-full p-3">Center</div>
          </template>
          <template #right>
            <div class="h-full p-3 bg-[var(--el-fill-color-light)]">Right</div>
          </template>
          <template #footer>
            <div class="h-full flex items-center justify-end px-3">Footer</div>
          </template>
        </ScPane>
      </div>
    </section>

    <section>
      <h3 class="mb-2">左右布局，右侧上/中/下（layout=lr-right-3）</h3>
      <div class="border rounded overflow-hidden" style="height: 360px">
        <ScPane
          layout="lr-right-3"
          :leftSize="200"
          :rightSize="320"
          :rightTopSize="100"
          :rightBottomSize="80"
          :leftResizable="true"
          :rightResizable="true"
          :rightTopResizable="true"
          :rightBottomResizable="true"
        >
          <template #left>
            <div class="h-full p-3">左侧导航区域</div>
          </template>
          <template #right-top>
            <div class="h-full p-3 bg-[var(--el-fill-color-light)]">
              右侧-上
            </div>
          </template>
          <template #right-middle>
            <div class="h-full p-3">右侧-中（自适应）</div>
          </template>
          <template #right-bottom>
            <div class="h-full p-3 bg-[var(--el-fill-color-light)]">
              右侧-下
            </div>
          </template>
        </ScPane>
      </div>
    </section>

    <el-divider />
    <CodePreview
      :tabs="[
        {
          key: 'template',
          label: '模板',
          icon: 'ri:code-s-slash-line',
          language: 'vue',
          code: code,
        },
      ]"
    />
  </div>
</template>
<script setup>
import { computed } from "vue";
import ScPane from "@repo/components/ScPane/index.vue";
import CodePreview from "./CodePreview.vue";

const code = computed(
  () =>
    `<ScPane layout=\"lr-right-3\" :leftSize=\"200\" :rightSize=\"320\" :rightTopSize=\"100\" :rightBottomSize=\"80\">\n  <template #left>左侧</template>\n  <template #right-top>上</template>\n  <template #right-middle>中</template>\n  <template #right-bottom>下</template>\n</ScPane>`
);
</script>
