<script lang="ts">
import { defineComponent } from "vue";
import { querySetting, updateSetting } from "./setting";

export default defineComponent({
  data() {
    return {
      form: {
        sysSettingName: "",
        sysSettingValue: "",
        sysSettingValueType: "",
        sysSettingRemark: "",
        sysSettingStatus: "",
        sysSettingGroup: ""
      },
      visible: false,
      rules: {},
      loading: false,
      title: "",
      mode: "save"
    };
  },
  mounted() {},
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.$nextTick(() => {
        this.$refs.formRef.resetFields();
      });
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
    }
  }
});
</script>
<template>
  <el-dialog
    v-model="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :title="title"
    @close="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :disabled="mode == 'show'"
      label-width="100px"
    >
      <el-form-item label="配置所属分组" prop="sysSettingGroup">
        <el-input
          v-model="form.sysSettingGroup"
          placeholder="请输入配置所属分组"
        />
      </el-form-item>

      <el-form-item label="配置名称" prop="sysSettingName">
        <el-input v-model="form.sysSettingName" placeholder="请输入配置名称" />
      </el-form-item>

      <el-form-item label="配置值" prop="sysSettingValue">
        <el-input v-model="form.sysSettingValue" placeholder="请输入配置名称" />
      </el-form-item>

      <el-form-item label="配置值类型" prop="sysSettingValueType">
        <el-input
          v-model="form.sysSettingValueType"
          placeholder="请输入配置值类型"
        />
      </el-form-item>

      <el-form-item label="是否启用" prop="sysSettingStatus">
        <el-switch
          v-model="form.sysSettingStatus"
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>

      <el-form-item label="配置备注" prop="sysSettingRemark">
        <el-input
          v-model="form.sysSettingRemark"
          placeholder="请输入配置备注"
          type="textarea"
        />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
