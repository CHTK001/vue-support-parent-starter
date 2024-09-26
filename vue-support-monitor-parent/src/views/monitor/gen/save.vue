<template>
  <div>
    <el-dialog v-model="visible" title="title" width="600px" @close="onClose">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请填写姓名" :maxLength="20" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-select v-model="form.sex" placeholder="请选择性别" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="small" @click="onClose">取 消</el-button>
          <el-button size="small" type="primary" :loading="confirmLoading" @click="onSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { fetchGenDatabaseSave, fetchGenDatabaseUpdate } from "@/api/monitor/gen/database";
import { message } from "@/utils/message";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      visible: false,
      confirmLoading: false,
      form: {},
      mode: "add"
    };
  },
  methods: {
    open(mode = "add") {
      this.mode = mode;
    },
    onClose() {
      this.visible = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    onSubmit() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          this.confirmLoading = true;
          let res;
          if (this.mode === "add") {
            res = await fetchGenDatabaseSave(this.form);
          } else if (this.mode === "edit") {
            res = await fetchGenDatabaseUpdate(this.form);
          }
          this.confirmLoading = false;
          if (res.code == "00000") {
            this.$emit("success", res, this.mode);
            this.visible = false;
          } else {
            message(res.msg, { type: "error" });
          }
        }
      });
    }
  }
});
</script>
