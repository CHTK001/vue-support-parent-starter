<script lang="ts">
import { defineComponent } from "vue";
import {
  fetchSettingPage,
  fetchUpdateSetting,
  fetchSaveSetting
} from "@/api/setting";
import { transformI18n } from "@/plugins/i18n";

import { message } from "@/utils/message";
export default defineComponent({
  data() {
    return {
      form: {
        sysSettingName: "",
        sysSettingValue: "",
        sysSettingValueType: "",
        sysSettingRemark: "",
        sysSettingStatus: "",
        sysSettingConfig: "",
        sysSettingGroup: ""
      },
      valueType: [
        { value: "string", label: "字符串" },
        { value: "number", label: "数字" },
        { value: "bool", label: "布尔" },
        { value: "array", label: "数组" },
        { value: "object", label: "对象" }
      ],
      visible: false,
      rules: {
        sysSettingName: [
          { required: true, message: "请输入配置名称", trigger: "blur" }
        ],
        sysSettingValue: [
          { required: true, message: "请输入配置值", trigger: "blur" }
        ],
        sysSettingValueType: [
          { required: true, message: "请输入配置值类型", trigger: "blur" }
        ],
        sysSettingGroup: [
          { required: true, message: "请输入配置所属分组", trigger: "blur" }
        ]
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
    },
    transformI18nValue(val) {
      return transformI18n(val);
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
            res = await fetchSaveSetting(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateSetting(this.form);
          }

          this.loading = false;
          if (res.code == "00000") {
            this.form.roleId = this.form.rowId || res.data.roleId;
            this.$emit("success", this.form, this.mode);
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
        <el-form-item label="所属分组" prop="sysSettingGroup">
          <el-input
            v-model="form.sysSettingGroup"
            placeholder="请输入配置所属分组"
          />
        </el-form-item>

        <el-form-item label="配置名称" prop="sysSettingName">
          <el-input
            v-model="form.sysSettingName"
            placeholder="请输入配置名称"
          />
        </el-form-item>

        <el-form-item label="配置值" prop="sysSettingValue">
          <el-input
            v-model="form.sysSettingValue"
            placeholder="请输入配置名称"
          />
        </el-form-item>

        <el-form-item label="配置值类型" prop="sysSettingValueType">
          <el-select
            v-model="form.sysSettingValueType"
            clearable
            allow-create
            filterable
          >
            <el-option
              v-for="item in valueType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="是否启用" prop="sysSettingStatus">
          <el-switch
            v-model="form.sysSettingStatus"
            style="
              --el-switch-on-color: #13ce66;
              --el-switch-off-color: #ff4949;
            "
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
        <el-form-item label="配置参数" prop="sysSettingConfig">
          <el-input
            v-model="form.sysSettingConfig"
            placeholder="请输入配置参数"
            type="textarea"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button
          v-if="mode != 'show'"
          type="primary"
          :loading="loading"
          @click="submit()"
          >保 存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>
