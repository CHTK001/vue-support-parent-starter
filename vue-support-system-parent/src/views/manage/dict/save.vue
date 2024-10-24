<script>
import { defineComponent } from "vue";
import { fetchUpdateDict, fetchSaveDict } from "@/api/manage/dict";
import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";
import { pinyin } from "pinyin-pro";
import ReSegmented from "@/components/ReSegmented";
import { useI18n } from "vue-i18n";

export default defineComponent({
  components: { ReSegmented },
  data() {
    return {
      form: {
        sysDictId: "",
        sysDictCode: "",
        sysDictInSystem: 0,
        sysDictPid: 0,
        sysDictName: "",
        sysDictI18n: "",
        sysDictRemark: ""
      },
      defaultProps: {
        value: "sysDictId",
        label: "sysDictName",
        children: "children"
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
    "form.sysDictName": {
      immediate: true,
      deep: true,
      handler(val) {
        this.form.sysDictName = val;
        if (!val && !!this.form.sysDictCode) {
          return;
        }
        const py = pinyin(val, { toneType: "none", type: "array" }) || [];
        this.form.sysDictCode = py.map(it => String(it).toUpperCase()).join("_");
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
      return node.data?.sysDictName || "-";
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
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="字典父节点" prop="sysDictPid">
              <el-tree-select v-model="form.sysDictPid" :props="defaultProps" check-strictly style="width: 240px" :data="treeData">
                <template #label="scope">
                  <span v-if="!scope?.label">
                    <span v-if="scope.value == '0'">-</span>
                    <del v-else>已删除</del>
                  </span>
                  <span v-else>{{ scope?.label }}</span>
                </template>
              </el-tree-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="字典名称" prop="sysDictName">
              <el-input v-model="form.sysDictName" placeholder="请输入字典名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典编码" prop="sysDictCode">
              <el-input v-model="form.sysDictCode" placeholder="请输入字典编码" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="字典i18n" prop="sysDictI18n">
              <el-input v-model="form.sysDictI18n" placeholder="请输入字典i18n" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="系统变量" prop="sysDictInSystem">
              <ReSegmented v-model="form.sysDictInSystem" :options="options" />
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
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
