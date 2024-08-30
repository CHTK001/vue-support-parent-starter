<script lang="ts">
import { defineComponent, toRaw } from "vue";
import { fetchUpdateSecret, fetchSaveSecret } from "@/api/secret";

import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";
import { debounce, throttle } from "@pureadmin/utils";
import { clearObject } from "@/utils/objects";

export default defineComponent({
  data() {
    return {
      form: {
        sysSecretGroup: null,
        sysSecretCode: null,
        sysSecretEndpoint: null,
        sysSecretAppId: null,
        sysSecretAppSecret: null,
        sysSecretCdn: null,
        sysSecretRemark: null
      },
      visible: false,
      rules: {
        sysSecretGroup: [{ required: true, message: "请输入密钥分组", trigger: "blur" }],
        sysSecretCode: [{ required: true, message: "请输入编码, 可自行唯一", trigger: "blur" }]
      },
      loading: false,
      title: "",
      mode: "save",
      t: null
    };
  },
  mounted() {
    const { t } = useI18n();
    this.t = t;
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      clearObject(this.form);
    },
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? this.t("message.save") : this.t("message.edit");
    },
    debounce(fn, time, immediate) {
      return debounce(fn, time, immediate);
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res: any = {};
          if (this.mode === "save") {
            res = await fetchSaveSecret(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateSecret(this.form);
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
          <el-col :span="12">
            <el-form-item label="密钥分组" prop="sysSecretGroup">
              <el-input v-model="form.sysSecretGroup" placeholder="请输入密钥分组" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码标识" prop="sysSecretCode">
              <el-input v-model="form.sysSecretCode" placeholder="请输入密码标识" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="appId" prop="sysSecretAppId">
              <el-input v-model="form.sysSecretAppId" placeholder="请输入AppId" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="appSecret" prop="sysSecretAppSecret">
              <el-input v-model="form.sysSecretAppSecret" placeholder="请输入appSecret" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="endpoint" prop="sysSecretEndpoint">
              <el-input v-model="form.sysSecretEndpoint" placeholder="请输入endpoint" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="cdn" prop="sysSecretCdn">
              <el-input v-model="form.sysSecretCdn" placeholder="请输入cdn" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注" prop="sysSecretRemark">
              <el-input v-model="form.sysSecretRemark" placeholder="请输入备注" type="textarea" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="debounce(submit(), 1000, true)">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
