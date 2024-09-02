<script>
import { defineComponent } from "vue";
import { fetchUpdateTemplate, fetchSaveTemplate } from "@/api/template";
import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";
import { fetchListDictItem } from "@/api/dict";

export default defineComponent({
  data() {
    return {
      dictItem: [],
      form: {
        sysTemplateId: "",
        sysTemplateCode: "",
        sysTemplateName: "",
        sysTemplateI18n: "",
        sysTemplateSort: 1,
        sysTemplateGroupId: null,
        sysTemplateRemark: ""
      },
      visible: false,
      rules: {
        sysTemplateName: [
          { required: true, message: "请输入模板项名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ],
        sysTemplateCode: [
          { required: true, message: "请输入模板项编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ]
      },
      loading: false,
      title: "",
      mode: "save",
      treeData: []
    };
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.dictItem.length = 0;
      fetchListDictItem({
        sysDictId: 1
      }).then(res => {
        this.dictItem.push(...res?.data);
      });
    },
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.sysDictId = data?.sysDictId;
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
            res = await fetchSaveTemplate(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateTemplate(this.form);
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
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模板项名称" prop="sysTemplateName">
              <el-input v-model="form.sysTemplateName" placeholder="请输入模板项名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板项编码" prop="sysTemplateCode">
              <el-input v-model="form.sysTemplateCode" placeholder="请输入模板项编码" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="厂家" prop="sysDictItemId">
              <el-select v-model="form.sysDictItemId" placeholder="请选择厂家" filterable>
                <el-option v-for="item in dictItem" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板项优先级" prop="sysTemplateSort">
              <el-input-number v-model="form.sysTemplateSort" placeholder="请输入模板项优先级" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板内容" prop="sysTemplateContent">
              <el-input v-model="form.sysTemplateContent" placeholder="请输入模板内容" type="textarea" :rows="6" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="sysTemplateRemark">
              <el-input v-model="form.sysTemplateRemark" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
