<script>
import { defineComponent } from "vue";
import { fetchUpdateDept, fetchSaveDept } from "@/api/dept";
import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";

export default defineComponent({
  data() {
    return {
      form: {
        sysDeptId: "",
        sysDeptName: "",
        sysDeptPid: "",
        sysDeptTreeId: ""
      },
      visible: false,
      rules: {
        sysDeptName: [
          { required: true, message: "请输入机构名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ],
        sysDeptCode: [
          { required: true, message: "请输入机构编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
        ]
      },
      loading: false,
      title: "",
      mode: "save",
      treeData: [],
      defaultProps: {
        value: "sysDeptId",
        label: "sysDeptName",
        children: "children"
      },
      checked: []
    };
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.$nextTick(() => {
        this.$refs?.dialogForm.resetFields();
      });
      clearObject(this.form);
    },
    setData(data) {
      Object.assign(this.form, data);
      this.checked.push(data.sysDeptPid);
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
      return node.data?.sysDeptName;
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveDept(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateDept(this.form);
          }

          this.loading = false;
          if (res.code == "00000") {
            this.$emit("success");
            this.visible = false;
          } else {
            message(res.msg, { type: "error" });
          }
        }
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
        <el-form-item label="父级机构" prop="sysDeptPid">
          <el-tree-select
            v-model="form.sysDeptPid"
            placeholder="请选择父级机构"
            :props="defaultProps"
            :data="treeData"
            check-strictly
            :render-after-expand="false"
            :render-content="renderContent"
            style="width: 240px"
          >
            <template #label="scope">
              <span v-if="!scope?.label">
                <span v-if="scope.value == '0'">-</span>
                <del v-else>已删除</del>
              </span>
              <span v-else>{{ scope?.label }}</span>
            </template>
          </el-tree-select>
        </el-form-item>

        <el-form-item label="机构名称" prop="sysDeptName">
          <el-input v-model="form.sysDeptName" placeholder="请输入机构名称" />
        </el-form-item>

        <el-form-item label="机构编码" prop="sysDeptCode">
          <el-input v-model="form.sysDeptCode" placeholder="请输入机构编码" />
        </el-form-item>
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
