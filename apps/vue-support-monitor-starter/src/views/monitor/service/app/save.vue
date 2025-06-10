<template>
  <ScDialog v-model="visible" :title="title" :width="700" destroy-on-close draggable :close-on-click-modal="false"
    @closed="$emit('closed')">
    <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px"
      label-position="left">
      <el-form-item label="应用名称" prop="monitorApplicationName">
        <el-input v-model="form.monitorApplicationName" clearable placeholder="请输入应用名称" />
      </el-form-item>

      <el-form-item label="prometheus" prop="monitorPrometheusAddress">
        <el-input v-model="form.monitorPrometheusAddress" clearable placeholder="prometheus地址" />
      </el-form-item>

      <el-form-item label="说明" prop="monitorName">
        <el-input v-model="form.monitorName" clearable placeholder="请输入说明" />
      </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
      </template>
  </ScDialog>
</template>

<script>
import { fetchAppUpdate, fetchAppSave } from "@/api/monitor/app";
import { defineComponent } from "vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
export default defineComponent({
  emits: ["success", "closed"],
  components: {
    ScDialog
  },
  data() {
    return {
      visible: false,
      isSaveing: false,
      configList: [],
      title: "",
      mode: "",
      //表单数据
      form: {},
      //验证规则
      rules: {
        monitorApplicationName: [{ required: true, message: "请输入应用名称", trigger: "blur" }],
      }
    };
  },
  unmounted() {
    this.visible = false;
  },
  mounted() {},
  methods: {
    //显示
    open(mode = "add") {
      this.mode = mode;
      if (mode == "add") {
        this.title = "新增";
      }
      this.visible = true;
      return this;
    },
    //表单提交方法
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          var res;
          this.isSaveing = true;
          if (this.mode === "add") {
            res = await fetchAppSave(this.form);
          } else if (this.mode === "edit") {
            res = await fetchAppUpdate(this.form);
          }

          this.isSaveing = false;
          if (res.code == "00000") {
            this.$emit("success", res, this.mode);
            this.visible = false;
          } else {
            this.$message.error(res.msg);
          }
        }
      });
    },
    //表单注入数据
    setData(data) {
      //可以和上面一样单个注入，也可以像下面一样直接合并进去
      Object.assign(this.form, data);
      if (this.mode == "edit") {
        this.title = "修改" + this.form.monitorName;
        return this;
      }

      if (this.mode == "add") {
        this.form = {};
      }
      return this;
    }
  }
});
</script>

<style></style>
