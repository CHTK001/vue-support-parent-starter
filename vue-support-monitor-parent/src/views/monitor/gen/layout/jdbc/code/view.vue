<template>
  <el-dialog v-model="dialogStatus" title="预览" :close-on-click-modal="false" width="70%" top="20px" destroy-on-close draggable @closed="$emit('closed')">
    <el-skeleton :rows="5" :animated="true" :loading="codeLoading">
      <el-tabs v-if="viewData.length > 0" v-model="activeName" class="demo-tabs" @tab-click="handleClick">
        <el-tab-pane v-for="item in viewData" :key="item" :label="item.name" :name="item.name" class="!min-h-[600px]">
          <el-button style="position: absolute; right: 10px" text plain :icon="useRenderIcon('ep:document-copy')" @click="seccendCopy(item.content)">复制</el-button>
          <el-tag v-if="item.path">{{ item.path }}</el-tag>
          <highlightjs :language="item.type" :autodetect="false" :code="item.content" class="code-box !min-h-[600px]" />
        </el-tab-pane>
      </el-tabs>
      <el-empty v-else />
    </el-skeleton>
  </el-dialog>
</template>

<script>
import { fetchGenTableTemplate } from "@/api/monitor/gen/table";
import "highlight.js/styles/atom-one-light.css";
import hljsVuePlugin from "@highlightjs/vue-plugin";
import "highlight.js/lib/common";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@/utils/message";

export default {
  name: "importCodeVue",
  components: { highlightjs: hljsVuePlugin.component },
  data() {
    return {
      codeLoading: !0,
      activeName: "second",
      dialogStatus: 0,
      downloadForm: {},
      viewData: []
    };
  },
  methods: {
    useRenderIcon,
    seccendCopy(value) {
      copyTextToClipboard(value);
      message("复制成功", { type: "success" });
    },
    open(data) {
      this.dialogStatus = !0;
      Object.assign(this.downloadForm, data);
      fetchGenTableTemplate(data)
        .then(res => {
          if (res.code === "00000") {
            this.viewData = res.data;
            if (this.viewData.length > 0) {
              this.activeName = this.viewData[0]["name"];
            }
            return;
          }

          this.$message.error(res.msg);
        })
        .finally(() => (this.codeLoading = false));
    }
  }
};
</script>
<style lang="scss" scoped>
.code-box {
  overflow-y: auto;
  height: 600px;
  font-size: 14px;
  font-family:
    Microsoft YaHei,
    Consolas,
    Monaco,
    Menlo,
    Consolas,
    "Courier New",
    monospace;
}
</style>
