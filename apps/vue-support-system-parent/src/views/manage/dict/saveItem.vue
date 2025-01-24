<script>
import { fetchSaveDictItem, fetchUpdateDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { pinyin } from "pinyin-pro";
import { defineComponent } from "vue";
import { IconSelect } from "@repo/components/ReIcon";

export default defineComponent({
  components: { IconSelect },
  data() {
    return {
      form: {
        sysDictItemId: "",
        sysDictItemCode: "",
        sysDictItemName: "",
        sysDictItemI18n: "",
        sysDictItemSort: 1,
        sysDictId: null,
        sysDictItemIcon: null,
        sysDictItemRemark: "",
      },
      visible: false,
      rules: {
        sysDictItemName: [
          { required: true, message: "请输入字典项名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDictItemCode: [
          { required: true, message: "请输入字典项编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
      },
      loading: false,
      title: "",
      mode: "save",
      treeData: [],
    };
  },
  watch: {
    "form.sysDictItemName": {
      immediate: true,
      deep: true,
      handler(val) {
        this.form.sysDictItemName = val;
        if (!val && !!this.form.sysDictItemCode) {
          return;
        }
        const py = pinyin(val, { toneType: "none", type: "array" }) || [];
        this.form.sysDictItemCode = py.map((it) => String(it).toUpperCase()).join("_");
      },
    },
  },
  methods: {
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
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveDictItem(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateDictItem(this.form);
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
    },
  },
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="字典项名称" prop="sysDictItemName">
              <el-input v-model="form.sysDictItemName" placeholder="请输入字典项名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典项图标" prop="sysDictItemIcon">
              <IconSelect v-model="form.sysDictItemIcon" class="w-full" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典项编码" prop="sysDictItemCode">
              <el-input v-model="form.sysDictItemCode" placeholder="请输入字典项编码" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典项优先级" prop="sysDictItemSort">
              <el-input-number v-model="form.sysDictItemSort" placeholder="请输入字典项优先级" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典项i18n" prop="sysDictItemI18n">
              <el-input v-model="form.sysDictItemI18n" placeholder="请输入字典项i18n" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="sysDictItemRemark">
              <el-input v-model="form.sysDictItemRemark" placeholder="请输入描述" />
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
