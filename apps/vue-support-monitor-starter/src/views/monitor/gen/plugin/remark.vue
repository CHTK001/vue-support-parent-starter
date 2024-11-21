<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" title="更新备注" draggable @close="onClose">
      <el-form :model="form">
        <el-form-item :disabled="true">{{ data.genName }} ({{ data.genId }})</el-form-item>
        <el-form-item :disabled="true" prop="注释表">
          <el-input v-model="form.remarkTable" :disabled="true" :readonly="true" />
        </el-form-item>
        <el-form-item :disabled="true" prop="注释字段">
          <el-input v-model="form.remarkColumn" :disabled="true" :readonly="true" />
        </el-form-item>
        <el-form-item prop="注释">
          <el-input v-model="form.remarkName" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onClose">取 消</el-button>
          <el-button type="primary" :loading="confirmLoading" @click="onSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { fetchGenRemarkSave } from "@/api/monitor/gen/remark";
import { message } from "@repo/utils";
export default {
  name: "Remark",
  props: {
    data: Object
  },
  data() {
    return {
      visible: false,
      confirmLoading: false,
      mode: "add",
      node: {},
      form: {}
    };
  },
  methods: {
    setData(data) {
      Object.assign(this.form, data);
      this.form.genId = data.genId;
      this.form.remarkName = data.nodeComment;
      this.form.remarkTable = data.nodePid;
      this.form.remarkColumn = data.nodeName;
      return this;
    },
    setNode(node) {
      this.node = node;
      return this;
    },
    onClose() {
      this.visible = false;
      this.form = {};
      this.confirmLoading = false;
      this.$emit("close");
    },
    open(mode) {
      this.mode = mode;
      this.visible = true;
      return this;
    },
    async onSubmit() {
      this.confirmLoading = true;
      const newForm = {};
      Object.assign(newForm, this.form);
      newForm.genId = this.data.genId;
      let res = await fetchGenRemarkSave(newForm);
      if (res.code == "00000") {
        message(res.msg, { type: "success" });
        this.onClose();
        this.$emit("success", this.node);
      }
    }
  }
};
</script>
