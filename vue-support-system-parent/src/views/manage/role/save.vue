<script lang="ts">
import { defineComponent } from "vue";
import { fetchUpdateRole, fetchSaveRole } from "@/api/role";

import { $t } from "@/plugins/i18n";
import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";

export default defineComponent({
  data() {
    return {
      form: {
        sysRoleName: "",
        sysRoleCode: "",
        sysRoleSort: 0,
        sysRoleStatus: 1,
        sysRoleRemark: ""
      },
      visible: false,
      rules: {
        sysRoleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
        sysRoleCode: [{ required: true, message: "请输入角色编码", trigger: "blur" }]
      },
      loading: false,
      title: "",
      mode: "save"
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
      this.form.sysRoleStatus = 1;
    },
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res: any = {};
          if (this.mode === "save") {
            res = await fetchSaveRole(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateRole(this.form);
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
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-form-item label="角色名称" prop="sysRoleName">
          <el-input v-model="form.sysRoleName" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="sysRoleCode">
          <el-input v-model="form.sysRoleCode" placeholder="请输入角色编码" />
        </el-form-item>

        <el-form-item label="角色状态" prop="sysRoleStatus">
          <el-segmented
            v-model="form.sysRoleStatus"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 }
            ]"
          />
        </el-form-item>

        <el-form-item label="角色优先级" prop="sysRoleSort">
          <el-input-number v-model="form.sysRoleSort" placeholder="请输入角色优先级" />
        </el-form-item>

        <el-form-item label="备注" prop="sysRoleRemark">
          <el-input v-model="form.sysRoleRemark" placeholder="请输入备注" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
