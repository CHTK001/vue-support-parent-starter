<template>
  <div class="h-full">
    <el-dialog v-model="visible" :title="title" draggable class="!h-[90vh] !min-h-[700px]" top="10px">
      <div class="relative flex flex-1 justify-end" style="top: -30px">
        <el-button plain text :loading="isLoadDatabase" :icon="useRenderIcon('ep:refresh')" @click="doRefreshDatabase">刷新</el-button>
        <el-button plain text :loading="isLoadDatabaseDownload" :icon="useRenderIcon('ep:download')" @click="doDownload('MD')">下载MD</el-button>
        <el-button plain text :loading="isLoadDatabaseDownload" :icon="useRenderIcon('ep:download')" @click="doDownload('DOC')">下载DOC</el-button>
      </div>
      <div class="h-full">
        <el-empty v-if="!showStatus" />
        <iframe v-else id="bdIframe" class="!h-[700px] iframe-view" :src="src" frameborder="0" style="height: 100%; overflow: hidden" height="100%" width="100%" />
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { fetchGenDatabaseDownloadDoc, fetchGenDatabasePreviewDoc, fetchGenDatabaseSyncDoc } from "@/api/monitor/gen/database";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default {
  data() {
    return {
      visible: false,
      isLoadDatabase: false,
      isLoadDatabaseDownload: false,
      showStatus: false,
      src: "",
      title: "",
      form: {}
    };
  },
  methods: {
    useRenderIcon,
    onClose() {
      this.visible = false;
      URL.revokeObjectURL(this.src);
    },
    open() {
      this.visible = true;
    },
    setData(data) {
      Object.assign(this.form, data);
      if (this.form.genId) {
        this.showStatus = true;
        this.title = this.form.genName + " [数据库文档]";
        const newForm = {};
        Object.assign(newForm, this.form);
        newForm.type = "html";
        fetchGenDatabasePreviewDoc(newForm).then(res => {
          this.src = URL.createObjectURL(res?.response.data);
        });
      }
      return this;
    },
    doRefreshDatabase() {
      this.isLoadDatabase = true;
      fetchGenDatabaseSyncDoc(this.form)
        .then(res => {
          if (res.code == "00000") {
            this.$message.success("同步成功");
            return;
          }
          this.$message.error(res.msg);
        })
        .finally(() => (this.isLoadDatabase = false));
    },
    doDownload(type) {
      const newForm = {};
      Object.assign(newForm, this.form);
      newForm.type = type;
      fetchGenDatabaseDownloadDoc(newForm).then(res => {
        const fileUrl = URL.createObjectURL(res?.response.data);
        const tmpLink = document.createElement("a");
        tmpLink.href = fileUrl;
        tmpLink.download = this.form.genName + "数据库文档." + type?.toLowerCase();
        document.body.appendChild(tmpLink);
        tmpLink.click();

        document.body.removeChild(tmpLink);
        URL.revokeObjectURL(fileUrl);
      });
    }
  }
};
</script>
