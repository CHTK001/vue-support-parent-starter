<template>
  <el-dialog v-model="dialogStatus" :title="title" :close-on-click-modal="false" width="90%" :destroy-on-close="true" draggable @closed="$emit('closed')">
    <el-form ref="formRef" :model="form" label-width="80px" status-icon :rules="rules">
      <el-form-item label="模板名称" prop="templateName">
        <el-input v-model="form.templateName" />
        <span class="el-form-item-msg" style="margin-left: 10px">模板名称</span>
      </el-form-item>

      <el-form-item label="模板路径" prop="templatePath">
        <el-input v-model="form.templatePath" />
        <span class="el-form-item-msg" style="margin-left: 10px">模板路径.e.g. {}/controller/{}Controller</span>
      </el-form-item>

      <el-form-item label="模板类型" prop="templateType">
        <el-select v-model="form.templateType">
          <el-option value="java" />
          <el-option value="xml" />
          <el-option value="sql" />
          <el-option value="vue" />
          <el-option value="js" />
        </el-select>
        <span class="el-form-item-msg" style="margin-left: 10px">模板类型</span>
      </el-form-item>

      <el-form-item label="模板" prop="templateContent">
        <sc-code-editor v-model="form.templateContent" style="width: 100%" :options="options" mode="groovy" />
        <span class="el-form-item-msg" style="margin-left: 10px">模板</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogStatus = false">取消</el-button>
        <el-button type="primary" :loading="isSave" @click="onsubmit">提交</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script>
import { defineAsyncComponent } from "vue";
import { fetchGenTemplateSave } from "@/api/monitor/gen/template";
const scCodeEditor = defineAsyncComponent(() => import("@repo/components/scCodeEditor/index.vue"));
export default {
  name: "templateSave",
  components: {
    scCodeEditor
  },
  data() {
    return {
      dialogStatus: false,
      isSave: false,
      title: "新增模板",
      form: {},
      rules: {
        templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
        templateType: [{ required: true, message: "请选择模板类型", trigger: "change" }],
        templateContent: [{ required: true, message: "请输入模板内容", trigger: "blur" }],
        templatePath: [{ required: true, message: "请输入模板路径", trigger: "blur" }]
      },
      options: {
        col: 300,
        height: 1000,
        hintOptions: {
          // 自定义提示选项
          completeSingle: false
        }
      }
    };
  },
  unmounted() {
    window.removeEventListener("keydown", this.handleEvent);
  },
  mounted() {
    this.form.genId = this.$route.params.genId;
    if (!this.form.genId || this.form.genId === "null") {
      delete this.form.genId;
    }
    window.addEventListener("keydown", this.handleEvent);
  },
  methods: {
    open() {
      this.dialogStatus = true;
    },
    async handleEvent(event) {
      console.log(event.keyCode);
      switch (event.keyCode) {
      }
    },
    onsubmit() {
      this.$refs.formRef.validate(v => {
        if (v) {
          this.isSave = true;
          fetchGenTemplateSave(this.form)
            .then(res => {
              if (res.code == "00000") {
                this.dialogStatus = false;
                this.$emit("success");
                this.$message.success("新增成功");
                return;
              }
              this.$message.error(res.msg);
            })
            .finally(() => (this.isSave = false));
        }
      });
    }
  }
};
</script>
