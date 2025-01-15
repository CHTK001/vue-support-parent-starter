<template>
  <div>
    <el-drawer v-model="visible" draggable title="nginx配置文件" :close-on-click-modal="false" size="50%" @close="handleClose">
      <div class="sticky top-[-20px] z-[10] bg-transparent">
        <el-button :icon="useRenderIcon('bi:database-up')" title="导入数据库" @click="handleIntoDataSource" />
      </div>
      <el-divider />
      <div>
        <pre><code class="language-nginx line-numbers inline-color">{{ configData }}</code></pre>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "highlight.js/styles/atom-one-light.css";
import "prismjs/components/prism-sql.min.js";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/themes/prism-tomorrow.min.css";
import { fetchAnalysisNginxConfig, fetchAnalysisConfigNginxConfig } from "@/api/monitor/nginx";
import { defineExpose, reactive, ref, defineAsyncComponent } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
const form = reactive({});
const configData = ref("");

const visible = ref(false);

const handleIntoDataSource = async () => {
  fetchAnalysisConfigNginxConfig({
    monitorNginxConfigId: form.monitorNginxConfigId
  }).then(res => {
    if (res.code == "00000") {
      message("导入成功", { type: "success" });
    }
  });
};

const handleGetConfig = async () => {
  const { data } = await fetchAnalysisNginxConfig({
    nginxConfigId: form.monitorNginxConfigId
  });
  configData.value = data;
  setTimeout(async () => {
    Prism.highlightAll();
    this.$nextTick(() => {
      try {
        Prism.highlightElement(document.querySelectorAll("pre code"));
      } catch (error) {}
    });
  }, 300);
};
const handleClose = async () => {
  visible.value = false;
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  Object.assign(form, data);
  await handleGetConfig();
};

defineExpose({
  handleOpen
});
</script>
