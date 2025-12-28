<script>
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineComponent } from "vue";
import { fetchSaveProjectForSms, fetchUpdateProjectForSms } from "../../../api/manage/project-sms";

export default defineComponent({
  props: {
    category: {
      type: Array,
      default: () => [],
    },
    categoryKinds: {
      type: Array,
      default: () => [],
    },
    renderContent: {
      type: Function,
      default: () => {},
    },
    categoryProp: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      dictItem1: [],
      dictItem2: [],
      dictItem3: [],
      form: {
        sysSmsTemplateId: null,
        sysSmsTemplateCode: null,
        sysSmsTemplateCategory: null,
        sysSmsTemplateName: null,
        sysSmsTemplateI18n: null,
        sysSmsTemplateSort: 1,
        sysSmsTemplateDisabled: 0,
        sysSmsTemplateGroupId: null,
        sysSmsTemplateRemark: null,
      },
      visible: false,
      rules: {
        sysSmsTemplateName: [
          { required: true, message: "请输入模板项名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysSmsTemplateCode: [
          { required: true, message: "请输入模板项编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
      },

      loading: false,
      title: "",
      mode: "save",
      treeData: [],
    };
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      fetchListDictItem({
        sysDictId: 1,
      }).then((res) => {
        this.dictItem1 = res?.data;
      });
      this.dictItem2 = this.category;
      this.dictItem3 = this.categoryKinds;
    },
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.sysDictId = data?.sysDictId;
      console.log("data", data);
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
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          Object.assign(newForm, this.form);
          if (this.mode === "save") {
            res = await fetchSaveProjectForSms(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateProjectForSms(newForm);
          }

          if (res.code == "00000") {
            this.$emit("success", newForm);
            this.visible = false;
          } else {
            message(res.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    },
  },
});
</script>
<template>
  <div>
    <sc-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模板项名称" prop="sysSmsTemplateName">
              <el-input v-model="form.sysSmsTemplateName" placeholder="请输入模板项名称" :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板项编码" prop="sysTemplateCode">
              <el-input v-model="form.sysSmsTemplateCode" placeholder="请输入模板项编码" :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板类型" prop="sysSmsTemplateCategory">
              <el-select v-model="form.sysSmsTemplateCategory" placeholder="请选择模板类型" filterable :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1">
                <el-option v-for="item in dictItem2" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板项优先级" prop="sysTemplateSort">
              <el-input-number v-model="form.sysSmsTemplateSort" placeholder="请输入模板项优先级" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板内容" prop="sysTemplateContent">
              <el-input v-model="form.sysSmsTemplateContent" placeholder="请输入模板内容" type="textarea" :rows="6" :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="sysTemplateRemark">
              <el-input v-model="form.sysSmsTemplateRemark" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</el-button>
      </template>
    </sc-dialog>
  </div>
</template>
