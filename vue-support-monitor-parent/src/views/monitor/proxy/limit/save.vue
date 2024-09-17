<template>
  <div>
    <el-dialog v-model="visible" draggable title="配置" width="50%" destroy-on-close @closed="close">
      <el-form ref="dialogForm" :status-icon="true" :model="form" :rules="rules1" :disabled="mode == 'show'" label-width="160px" label-position="left">
        <div v-if="limitType == 'PATH'">
          <el-form-item label="限流地址" prop="limitUrl">
            <el-input v-model="form.proxyConfigLimitPathOrIp" clearable placeholder="请输入限流地址" />
          </el-form-item>
        </div>
        <div v-else>
          <el-form-item label="限流地址" prop="limitAddress">
            <ip-input v-model="form.proxyConfigLimitPathOrIp" />
          </el-form-item>
        </div>
        <el-form-item label="每秒访问次数" prop="proxyConfigLimitPerSeconds">
          <el-input v-model="form.proxyConfigLimitPerSeconds" type="number" clearable placeholder="请输入限流次数" />
        </el-form-item>
        <el-form-item label="是否开启" prop="proxyConfigLimitDisabled">
          <el-switch v-model="form.proxyConfigLimitDisabled" clearable :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(form)">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { fetchProxyLimitSave, fetchProxyLimitPage, fetchProxyLimitUpdate } from "@/api/monitor/proxy";
import IpInput from "@/components/scInput/IpInput.vue";
export default {
  components: { IpInput },
  data() {
    return {
      form: {},
      limitType: null,
      mode: "add",
      visible: !1,
      rules1: {
        proxyConfigLimitPerSeconds: [{ required: true, message: "请输入限流次数", trigger: "blur" }]
      }
    };
  },
  methods: {
    setData(row, limitType) {
      Object.assign(this.form, row);
      this.limitType = limitType;
      console.log(limitType);
      this.form.proxyConfigLimitType = limitType;
      this.rules1.proxyConfigLimitPathOrIp = [{ required: true, message: "请输入限流地址", trigger: "blur" }];
      return this;
    },
    open(mode = "add") {
      this.mode = mode;
      this.visible = !0;
      this.rules1 = {
        limitPermitsPerSecond: [{ required: true, message: "请输入限流次数", trigger: "blur" }]
      };
      if ("add" == mode) {
        this.form.proxyConfigLimitDisabled = 1;
      }
    },
    close() {
      this.visible = !1;
      this.form = {};
      this.limitType = "add";
      this.mode = "add";
      this.$emit("closed");
    },
    submitFormUpdate(row) {
      this.$refs.dialogForm.validate(valid => {
        if (valid) {
          if (!row.proxyConfigLimitId) {
            fetchProxyLimitSave(row)
              .then(res => {
                if (res.code === "00000") {
                  this.visible = !1;
                  this.$emit("success");
                  return 0;
                }
                this.$message.error(res.msg);
              })
              .finally(() => {});
            return false;
          }
          fetchProxyLimitUpdate(row)
            .then(res => {
              if (res.code === "00000") {
                this.visible = !1;
                this.$emit("success");
                return 0;
              }
              this.$message.error(res.msg);
            })
            .finally(() => {});
        }
      });
      return;
    }
  }
};
</script>
