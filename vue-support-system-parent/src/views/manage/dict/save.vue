<script>
import { defineComponent } from "vue";
import { fetchUpdateDict, fetchSaveDict } from "@/api/dict";
import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";

export default defineComponent({
  data() {
    return {
      form: {
        sysDictId: "",
        sysDictCode: "",
        sysDictName: "",
        sysDictI18n: "",
        sysDictRemark: ""
      },
      visible: false,
      rules: {
        sysDictName: [
          { required: true, message: "请输入字典名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ],
        sysDictCode: [
          { required: true, message: "请输入字典编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ]
      },
      loading: false,
      title: "",
      mode: "save",
      treeData: []
    };
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      console.log(this.checked);
      return this;
    },
    setTableData(data) {
      Object.assign(this.treeData, data);
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
    },
    renderContent(h, { node, data }) {
      return node.data?.sysDictName;
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveDict(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateDict(this.form);
          }

          if (res.code == "00000") {
            this.$emit("success");
            this.visible = false;
          } else {
            message(res.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    }
  }
});
</script>
<template>
  <div>
    <el-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      @close="close"
    >
      <el-form
        ref="dialogForm"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="100px"
      >
        <el-row>
          <el-col :span="24">
            <el-form-item label="字典名称" prop="sysDictName">
              <el-input
                v-model="form.sysDictName"
                placeholder="请输入字典名称"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典编码" prop="sysDictCode">
              <el-input
                v-model="form.sysDictCode"
                placeholder="请输入字典编码"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典i18n" prop="sysDictI18n">
              <el-input
                v-model="form.sysDictI18n"
                placeholder="请输入字典i18n"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="sysDictRemark">
              <el-input v-model="form.sysDictRemark" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button
          v-if="mode != 'show'"
          type="primary"
          :loading="loading"
          @click="submit()"
        >
          保 存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
