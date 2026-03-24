<script>
// @ts-nocheck
import ScEditor from "@repo/components/ScEditor/index.vue";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineComponent } from "vue";
import { fetchSaveProjectForEmail, fetchUpdateProjectForEmail } from "../../../api/manage/project-email";

export default defineComponent({
  components: { ScEditor },
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
      envLoading: {
        send: false,
      },
      dictItem1: [],
      dictItem2: [],
      dictItem3: [],
      form: {
        sysEmailTemplateId: null,
        sysEmailTemplateCode: null,
        sysEmailTemplateCategory: null,
        sysEmailTemplateName: null,
        sysEmailTemplateI18n: null,
        sysEmailTemplateSort: 1,
        sysEmailTemplateDisabled: 0,
        sysEmailTemplateGroupId: null,
        sysEmailTemplateCallbackUrl: null,
        sysEmailTemplateRemark: null,
      },
      visible: false,
      rules: {
        sysEmailTemplateName: [
          { required: true, message: "请输入模板项名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysEmailTemplateCode: [
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
          newForm.sysProjectId = this.treeData.sysProjectId;
          newForm.sysEmailTemplateStatus = 1;
          if (this.mode === "save") {
            res = await fetchSaveProjectForEmail(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateProjectForEmail(newForm);
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
    <sc-dialog v-model="visible" top="10px" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <ScForm ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <ScRow>
          <ScCol :span="24">
            <ScFormItem label="模板项名称" prop="sysEmailTemplateName">
              <ScInput v-model="form.sysEmailTemplateName" placeholder="请输入模板项名称" :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="模板项编码" prop="sysEmailTemplateCode">
              <ScInput v-model="form.sysEmailTemplateCode" placeholder="请输入模板项编码" :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="模板类型" prop="sysEmailTemplateCategory">
              <ScSelect v-model="form.sysEmailTemplateCategory" placeholder="请选择模板类型" filterable :disabled="form.sysTemplateDisabled == 1" :readonly="form.sysTemplateDisabled == 1">
                <ScOption v-for="item in dictItem2" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </ScSelect>
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="模板项优先级" prop="sysTemplateSort">
              <ScInputNumber v-model="form.sysEmailTemplateSort" placeholder="请输入模板项优先级" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="模板内容" prop="sysTemplateContent">
              <ScEditor v-model="form.sysEmailTemplateContent" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="回调地址" prop="sysEmailTemplateCallbackUrl">
              <ScInput type="textarea" autocomplete="on" v-model="form.sysEmailTemplateCallbackUrl" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="描述" prop="sysTemplateRemark">
              <ScInput v-model="form.sysEmailTemplateRemark" placeholder="请输入描述" />
            </ScFormItem>
          </ScCol>
        </ScRow>
      </ScForm>

      <template #footer>
        <ScButton @click="visible = false">取 消</ScButton>
        <ScButton v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</ScButton>
      </template>
    </sc-dialog>
  </div>
</template>
