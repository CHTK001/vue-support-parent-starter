<script lang="ts">
import { defineComponent } from "vue";
import { fetchUpdateRole, fetchSaveRole } from "@/api/manage/role";

import { $t } from "@repo/config";
import { message } from "@repo/utils";
import { clearObject } from "@repo/config";

export default defineComponent({
  data() {
    return {
      form: {
        sysRoleName: "",
        sysRoleCode: "",
        sysRoleSort: 0,
        sysRoleStatus: 1,
        sysRoleRemark: "",
      },
      visible: false,
      rules: {
        sysRoleName: [
          { required: true, message: "请输入角色名称", trigger: "blur" },
        ],
        sysRoleCode: [
          { required: true, message: "请输入角色编码", trigger: "blur" },
        ],
      },
      loading: false,
      title: "",
      mode: "save",
    };
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.$nextTick(() => {
        this.$refs?.dialogForm.resetFields();
      });
    },
    setData(data) {
      this.form = data;
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
      if (mode == "save") {
        this.form.sysRoleSort = 0;
        this.form.sysRoleReableable = 0x0000_0001;
        this.form.sysRoleWriteable = 0x0000_0010;
        this.form.sysRoleExecutable = 0x0000_0100;
      }
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
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
    },
  },
});
</script>
<template>
  <div>
    <sc-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      :title="title"
      @close="close"
    >
      <ScForm
        ref="dialogForm"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="100px"
        class="modern-form"
      >
        <ScFormItem label="角色名称" prop="sysRoleName">
          <ScInput v-model="form.sysRoleName" placeholder="请输入角色名称" />
        </ScFormItem>

        <ScFormItem label="角色编码" prop="sysRoleCode">
          <ScInput v-model="form.sysRoleCode" placeholder="请输入角色编码" />
        </ScFormItem>

        <ScFormItem label="角色状态" prop="sysRoleStatus">
          <el-segmented
            v-model="form.sysRoleStatus"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </ScFormItem>

        <ScFormItem label="角色优先级" prop="sysRoleSort">
          <ScInputNumber
            v-model="form.sysRoleSort"
            placeholder="请输入角色优先级"
          />
        </ScFormItem>

        <ScFormItem label="备注" prop="sysRoleRemark">
          <ScInput
            v-model="form.sysRoleRemark"
            placeholder="请输入备注"
            type="textarea"
          />
        </ScFormItem>
      </ScForm>

      <template #footer>
        <ScButton @click="visible = false">取 消</ScButton>
        <ScButton
          v-if="mode != 'show'"
          type="primary"
          :loading="loading"
          @click="submit()"
          >保 存</el-button
        >
      </template>
    </sc-dialog>
  </div>
</template>
