<script lang="ts">
import { defineComponent } from "vue";
import { querySetting, updateSetting } from "./setting";

export default defineComponent({
  prop: {
    mode: { type: String, default: "save" },
    title: { type: String, default: "新增" }
  },

  data() {
    return {
      form: {
        sysSettingName: "",
        sysSettingValue: "",
        sysSettingValueType: "",
        sysSettingRemark: ""
      },
      visible: false,
      rules: {},
      loading: false,
      dataTitle: "",
      dataMode: "save"
    };
  },
  mounted() {
    this.dataTitle = this.title;
    this.dataMode = this.mode;
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.$nextTick(() => {
        this.$refs.formRef.resetFields();
      });
    },
    async open() {
      this.visible = true;
    }
  }
});
</script>
<template>
  <el-dialog
    v-model="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :title="dataTitle"
    @close="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :disabled="dataMode == 'show'"
      label-width="100px"
    >
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
