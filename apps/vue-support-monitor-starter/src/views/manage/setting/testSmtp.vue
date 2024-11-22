<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineComponent } from "vue";
import { fetchEmailSender } from "@/api/email";
import ScEditor from "@repo/components/ScEditor/index.vue";

export default defineComponent({
  components: { ScEditor },
  data() {
    return {
      form: {
        title: "主题",
        content: "测试邮件"
      },
      visible: false
    };
  },
  methods: {
    useRenderIcon,
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    open(mode) {
      this.visible = true;
    },
    close() {
      this.visible = false;
      this.form = {};
    },
    async submit() {
      fetchEmailSender(this.form).then(res => {
        message("发送成功", { type: "success" });
      });
    }
  }
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" title="测试" top="10px" :close-on-click-modal="false" draggable @close="close">
      <el-form :model="form" label-width="80px">
        <el-form-item prop="title" label="主题">
          <el-input v-model="form.title" placeholder="请输入主题" />
        </el-form-item>
        <el-form-item prop="to" label="收件人">
          <el-input v-model="form.to" placeholder="请输入收件人" />
        </el-form-item>
        <el-form-item prop="content" label="收件内容">
          <ScEditor v-model="form.content" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" size="default" :icon="useRenderIcon('ep:refresh')" @click="submit">
          {{ $t("buttons.test") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
