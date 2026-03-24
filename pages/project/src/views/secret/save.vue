<script>
import { fetchListDictItem } from "@repo/core";
import { defineComponent } from "vue";
import { fetchSaveSecret, fetchUpdateSecret } from "../../api/manage/secret";

import { debounce } from "@pureadmin/utils";
import { clearObject } from "@repo/config";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

export default defineComponent({
  props: {
    sysSecretFunctions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {
        sysSecretGroup: null,
        sysSecretCode: null,
        sysSecretEndpoint: null,
        sysSecretAppId: null,
        sysSecretAppSecret: null,
        sysSecretSign: null,
        sysSecretDictItemId: null,
        sysSecretCdn: null,
        sysSecretFunctions: [],
        sysSecretFunction: null,
        sysSecretRemark: null,
      },
      visible: false,
      rules: {
        sysSecretDictItemId: [
          { required: true, message: "请选择厂家", trigger: "blur" },
        ],
        sysSecretGroup: [
          { required: true, message: "请输入密钥分组", trigger: "blur" },
        ],
        sysSecretCode: [
          {
            required: true,
            message: "请输入编码, 可自行唯一",
            trigger: "blur",
          },
        ],
      },
      loading: false,
      title: "",
      mode: "save",

      dictItem: [],
      t: null,
    };
  },
  mounted() {
    const { t } = useI18n();
    this.initialize();
    this.t = t;
  },
  methods: {
    async initialize() {
      fetchListDictItem({
        sysDictId: 1,
      }).then((res) => {
        this.dictItem = res?.data;
      });
    },
    async close() {
      this.visible = false;
      this.loading = false;
      clearObject(this.form);
    },
    setData(data) {
      Object.assign(this.form, data);
      if (data?.sysSecretFunction) {
        this.form.sysSecretFunctions = data?.sysSecretFunction.split(",");
      }
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "保存" : "编辑";
    },
    debounce(fn, time, immediate) {
      return debounce(fn, time, immediate);
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          Object.assign(newForm, this.form);
          newForm.sysSecretFunction = (this.form.sysSecretFunctions || []).join(
            ","
          );
          if (this.mode === "save") {
            res = await fetchSaveSecret(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateSecret(newForm);
          }

          if (res.code == "00000") {
            this.$emit("success", newForm);
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
      :destroy-on-close="true"
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
      >
        <ScRow>
          <ScCol :span="12">
            <ScFormItem label="密钥分组" prop="sysSecretGroup">
              <ScInput 
                v-model="form.sysSecretGroup"
                placeholder="请输入密钥分组"
              />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="密钥标识" prop="sysSecretCode">
              <ScInput 
                v-model="form.sysSecretCode"
                placeholder="请输入密码标识"
              />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="适用厂家" prop="sysSecretDictItemId">
              <ScSelect 
                v-model="form.sysSecretDictItemId"
                placeholder="请选择厂家"
                filterable
              >
                <ScOption 
                  v-for="item in dictItem"
                  :key="item.sysDictItemId"
                  :label="item.sysDictItemName"
                  :value="item.sysDictItemId"
                />
              </ScSelect>
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="同步功能" prop="sysSecretFunction">
              <ScSelect 
                v-model="form.sysSecretFunctions"
                placeholder="请选择支持同步功能"
                filterable
                multiple
              >
                <ScOption 
                  v-for="item in sysSecretFunctions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ScSelect>
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="appId" prop="sysSecretAppId">
              <ScInput 
                v-model="form.sysSecretAppId"
                placeholder="请输入AppId"
              />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="appSecret" prop="sysSecretAppSecret">
              <ScInput 
                v-model="form.sysSecretAppSecret"
                placeholder="请输入appSecret"
              />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="签名" prop="sysSecretSign">
              <ScInput v-model="form.sysSecretSign" placeholder="请输入签名" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="endpoint" prop="sysSecretEndpoint">
              <ScInput 
                v-model="form.sysSecretEndpoint"
                placeholder="请输入endpoint"
              />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="cdn" prop="sysSecretCdn">
              <ScInput v-model="form.sysSecretCdn" placeholder="请输入cdn" />
            </ScFormItem>
          </ScCol>

          <ScCol :span="24">
            <ScFormItem label="备注" prop="sysSecretRemark">
              <ScInput 
                v-model="form.sysSecretRemark"
                placeholder="请输入备注"
                type="textarea"
              />
            </ScFormItem>
          </ScCol>
        </ScRow>
      </ScForm>

      <template #footer>
        <ScButton @click="visible = false">取 消</ScButton>
        <ScButton 
          v-if="mode != 'show'"
          type="primary"
          :loading="loading"
          @click="debounce(submit(), 1000, true)"
          >保 存</el-button
        >
      </template>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 16px 20px;
    margin: 0;
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.el-form {
  padding: 0;
}

.el-form-item {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
}

.el-row {
  margin: 0;
}

.el-col {
  padding: 0 10px;
}

:deep(.el-button) {
  border-radius: 8px;
}
</style>
