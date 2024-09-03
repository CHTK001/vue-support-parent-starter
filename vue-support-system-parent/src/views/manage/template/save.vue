<script>
import { defineComponent } from "vue";
import { fetchUpdateTemplateGroup, fetchSaveTemplateGroup } from "@/api/template";
import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";
import { pinyin } from "pinyin-pro";
import { useI18n } from "vue-i18n";

export default defineComponent({
  data() {
    return {
      form: {
        sysTemplateGroupId: "",
        sysTemplateGroupCode: "",
        sysTemplateGroupSort: 0,
        sysTemplateGroupInSystem: 0,
        sysTemplateGroupName: "",
        sysTemplateGroupI18n: "",
        sysTemplateGroupRemark: ""
      },
      visible: false,
      rules: {
        sysTemplateGroupName: [
          { required: true, message: "请输入模板分组名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ],
        sysTemplateGroupCode: [
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
    "form.sysTemplateGroupName": {
      immediate: true,
      deep: true,
      handler(val) {
        this.form.sysTemplateGroupName = val;
        if (!val) {
          return;
        }
        const py = pinyin(val, { toneType: "none", type: "array" }) || [];
        this.form.sysTemplateGroupCode = py.map(it => String(it.slice(0, 1)).toUpperCase()).join("");
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
      return node.data?.sysTemplateGroupName;
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveTemplateGroup(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateTemplateGroup(this.form);
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
            <el-form-item label="分组ID" prop="sysTemplateGroupId">
              <el-input v-model="form.sysTemplateGroupId" placeholder="请输入分组ID" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="分组名称" prop="sysTemplateGroupName">
              <el-input v-model="form.sysTemplateGroupName" placeholder="请输入模板分组名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="分组编码" prop="sysTemplateGroupCode">
              <el-input v-model="form.sysTemplateGroupCode" placeholder="请输入模板分组编码" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="优先级" prop="sysTemplateGroupSort">
              <el-input-number v-model="form.sysTemplateGroupSort" />
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
