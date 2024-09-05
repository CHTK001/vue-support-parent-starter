<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";
import { defineComponent } from "vue";
import { Html as EHtml, Button as EButton, Preview as EPreview } from "@vue-email/components";

export default defineComponent({
  components: {
    EHtml,
    EButton,
    EPreview
  },
  data() {
    return {
      form: {},
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
      message("发送成功", { type: "success" });
    }
  }
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" title="smtp测试" :close-on-click-modal="false" draggable @close="close">
      <el-form :model="form" label-width="120px">
        <el-form-item prop="to" label="收件人">
          <el-input v-model="form.to" placeholder="请输入收件人" />
        </el-form-item>
        <el-form-item prop="content" label="收件内容">
          <el-input v-model="form.content" placeholder="请输入收件内容" />
          <EPreview>
            <EHtml lang="en" dir="ltr">
              <EButton href="https://example.com" style="color: #61dafb">Click me</EButton>
            </EHtml>
          </EPreview>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" size="default" :icon="useRenderIcon('ep:refresh')" @click="submit">
          {{ $t("button.test") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
