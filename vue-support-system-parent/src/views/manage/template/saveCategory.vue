<script>
import { defineComponent } from "vue";
import { fetchUpdateTemplateCategory, fetchSaveTemplateCategory } from "@/api/template";
import { message } from "@/utils/message";
import { pinyin } from "pinyin-pro";
import { useI18n } from "vue-i18n";

export default defineComponent({
  props: {
    category: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      form: {
        sysTemplateCategoryId: "",
        sysTemplateCategoryCode: "",
        sysTemplateCategorySort: 0,
        sysTemplateCategoryInSystem: 0,
        sysTemplateCategoryName: "",
        sysTemplateCategoryI18n: "",
        sysTemplateCategoryRemark: ""
      },
      visible: false,
      rules: {
        sysTemplateCategoryName: [
          { required: true, message: "请输入模板分组名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ],
        sysTemplateCategoryCode: [
          { required: true, message: "请输入模板分组编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ]
      },
      options: [
        { label: "是", value: 1 },
        { label: "否", value: 0 }
      ],
      loading: false,
      title: "",
      mode: "save",
      treeData: [],
      t: null
    };
  },
  watch: {
    "form.sysTemplateCategoryName": {
      immediate: true,
      deep: true,
      handler(val) {
        this.form.sysTemplateCategoryName = val;
        if (!val) {
          return;
        }
        const py = pinyin(val, { toneType: "none", type: "array" }) || [];
        this.form.sysTemplateCategoryCode = py.map(it => String(it.slice(0, 1)).toUpperCase()).join("");
      }
    }
  },
  mounted() {
    const { t } = useI18n();
    this.t = t;
  },
  methods: {
    useI18n(v) {
      return this.t(v);
    },
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
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
      return node.data?.sysTemplateCategoryName;
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveTemplateCategory(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateTemplateCategory(this.form);
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
            <el-form-item label="分组ID" prop="sysTemplateCategoryId">
              <el-input v-model="form.sysTemplateCategoryId" placeholder="请输入分组ID" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="分组名称" prop="sysTemplateCategoryName">
              <el-input v-model="form.sysTemplateCategoryName" placeholder="请输入模板分组名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="分组编码" prop="sysTemplateCategoryCode">
              <el-input v-model="form.sysTemplateCategoryCode" placeholder="请输入模板分组编码" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="优先级" prop="sysTemplateCategorySort">
              <el-input-number v-model="form.sysTemplateCategorySort" />
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
