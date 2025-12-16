<script>
import { defineComponent } from "vue";
import { fetchSaveDept, fetchUpdateDept } from "@/api/manage/dept";
import { message } from "@repo/utils";
import { IconSelect, IconifyIconOnline } from "@repo/components/ReIcon";

export default defineComponent({
  components: { IconSelect, IconifyIconOnline },
  data() {
    return {
      form: {
        sysDeptId: "",
        sysDeptName: "",
        sysDeptPid: "",
        sysDeptTreeId: "",
        sysDeptIcon: "",
      },
      visible: false,
      rules: {
        sysDeptName: [
          { required: true, message: "请输入机构名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDeptCode: [
          { required: true, message: "请输入机构编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDeptStatus: [{ required: true, message: "请选择是否禁用", trigger: "blur" }],
      },
      loading: false,
      title: "",
      mode: "save",
      treeData: [],
      defaultProps: {
        value: "sysDeptId",
        label: "sysDeptName",
        children: "children",
        emitPath: false,
        checkStrictly: true,
      },
      checked: [],
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
      if (this.mode == "save") {
        this.form.sysDeptSort = 0;
      }
    },
    renderContent(h, { node, data }) {
      return node.data?.sysDeptName;
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveDept(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateDept(this.form);
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
            <el-form-item label="父级机构" prop="sysDeptPid">
              <el-cascader v-model="form.sysDeptPid" class="w-full" :options="treeData" :props="defaultProps" clearable filterable placeholder="请选择上级菜单">
                <template #default="{ node, data }">
                  <div>
                    <span v-if="data.sysDeptI18n">
                      {{ transformI18nValue(data.sysDeptI18n) }}
                    </span>
                    <span v-else>{{ data.sysDeptName }}</span>
                    <span v-if="!node.isLeaf">({{ data.children.length }})</span>
                  </div>
                </template>
              </el-cascader>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构名称" prop="sysDeptName">
              <el-input v-model="form.sysDeptName" placeholder="请输入机构名称" :maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="机构编码" prop="sysDeptCode">
              <el-input v-model="form.sysDeptCode" placeholder="请输入机构编码" :maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="机构图标" prop="sysDeptIcon">
              <IconSelect v-model="form.sysDeptIcon" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="负责人" prop="sysDeptPrincipal">
              <el-input v-model="form.sysDeptPrincipal" placeholder="请输入负责人" :maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="联系方式" prop="sysDeptContact">
              <el-input v-model="form.sysDeptContact" placeholder="请输入负责人联系方式" :maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="优先级" prop="sysDeptSort">
              <el-input-number v-model="form.sysDeptSort" placeholder="优先级" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="是否禁用" prop="sysDeptStatus">
              <el-segmented
                v-model="form.sysDeptStatus"
                :options="[
                  {
                    label: '启用',
                    value: 0,
                  },
                  {
                    label: '禁用',
                    value: 1,
                  },
                ]"
              >
              </el-segmented>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="优备注" prop="sysDeptRemark">
              <el-input v-model="form.sysDeptRemark" placeholder="请输入备注" :maxlength="240" show-word-limit type="textarea" />
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
