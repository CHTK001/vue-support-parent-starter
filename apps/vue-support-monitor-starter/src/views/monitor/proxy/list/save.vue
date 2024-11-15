<template>
  <div>
    <el-dialog v-model="visible" draggable :title="title" width="50%" destroy-on-close @closed="close">
      <el-form ref="dialogForm" :status-icon="true" :model="form" :rules="rules1" :disabled="mode == 'show'" label-width="160px" label-position="left">
        <el-form-item label="限流地址" prop="proxyConfigList">
          <ip-input v-model="form.proxyConfigList" clearable placeholder="请输入限流地址" />
        </el-form-item>
        <el-form-item label="是否开启" prop="proxyConfigListDisabled">
          <el-switch v-model="form.proxyConfigListDisabled" clearable :active-value="1" :inactive-value="0" />
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
import { fetchProxyListUpdate, fetchProxyListSave, fetchProxyListPage } from "@/api/monitor/proxy";
import IpInput from "@repo/components/scInput/IpInput.vue";

export default {
  components: { IpInput },
  data() {
    return {
      form: {},
      limitType: null,
      mode: "add",
      visible: !1,
      rules1: {}
    };
  },
  methods: {
    setData(row, listType) {
      Object.assign(this.form, row);
      this.listType = listType;
      this.form.listType = listType;
      this.rules1.proxyConfigList = [{ required: true, message: "请输入限流地址", trigger: "blur" }];
      return this;
    },
    open(mode = "add") {
      this.mode = mode;
      this.visible = !0;
      var action = "新增";
      if ("add" == mode) {
        this.form.proxyConfigListDisabled = 1;
      } else {
        action = "编辑";
      }
      this.title = this.listType == "WHITE" ? action + "白名单" : action + "黑名单";
    },
    close() {
      this.visible = !1;
      this.form = {};
      this.mode = "add";
      this.$emit("closed");
    },
    submitFormUpdate(row) {
      row.proxyConfigListType = this.listType;
      this.$refs.dialogForm.validate(valid => {
        if (valid) {
          if (this.mode === "add") {
            fetchProxyListSave(row)
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
          fetchProxyListUpdate(row)
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
