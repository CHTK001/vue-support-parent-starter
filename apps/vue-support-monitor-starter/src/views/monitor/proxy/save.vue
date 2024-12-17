<template>
  <div>
    <el-dialog v-model="visible" :title="title" :width="700" destroy-on-close draggable :close-on-click-modal="false" @closed="$emit('closed')">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px" label-position="left">
        <el-form-item label="代理名称" prop="proxyName">
          <el-input v-model="form.proxyName" clearable placeholder="请输入代理名称" />
        </el-form-item>

        <el-form-item label="代理地址" prop="proxy">
          <el-row>
            <el-col :span="12">
              <el-input v-model="form.proxyHost" placeholder="请输入代理地址" />
            </el-col>
            <el-col :span="12">
              <el-input v-model="form.proxyPort" type="number" placeholder="请输入代理端口" />
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="协议" prop="proxyProtocol">
          <el-select v-model="form.proxyProtocol" placeholder="请选择协议">
            <el-option label="HTTP代理" value="http-proxy" />
            <el-option label="TCP代理" value="tcp-proxy" />
            <el-option label="WebSockify代理" value="websockify" />
          </el-select>
        </el-form-item>

        <el-form-item label="说明" prop="proxyDesc">
          <el-input v-model="form.proxyDesc" clearable placeholder="请输入说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { pinyin } from "pinyin-pro";
import { fetchProxySave, fetchProxyUpdate } from "@/api/monitor/proxy";

export default {
  emits: ["success", "closed"],
  data() {
    return {
      visible: false,
      isSaveing: false,
      configList: [],
      title: "",
      mode: "",
      //表单数据
      form: {
        proxyHost: "127.0.0.1",
        proxyProtocol: "http-proxy",
        proxyStatus: 0
      },
      //验证规则
      rules: {
        proxyName: [{ required: true, message: "请输入代理名称", trigger: "blur" }],
        proxyPort: [{ required: true, message: "请输入说明", trigger: "blur" }],
        proxyProtocol: [{ required: true, message: "请选择协议", trigger: "blur" }]
      }
    };
  },
  methods: {
    //显示
    open(mode = "add") {
      this.mode = mode;
      if (mode == "add") {
        this.title = "新增";
      }
      this.visible = true;
      return this;
    },
    //表单提交方法
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          var res;
          this.isSaveing = true;
          if (this.mode === "add") {
            res = await fetchProxySave(this.form);
          } else if (this.mode === "edit") {
            res = await fetchProxyUpdate(this.form);
          }

          this.isSaveing = false;
          if (res.code == "00000") {
            this.$emit("success", res, this.mode);
            this.visible = false;
          } else {
            this.$message.error(res.msg);
          }
        }
      });
    },
    //表单注入数据
    setData(data) {
      //可以和上面一样单个注入，也可以像下面一样直接合并进去
      this.isSaveing = false;
      Object.assign(this.form, data);
      if (this.mode == "edit") {
        this.title = "修改" + this.form.proxyName;
        return this;
      }

      if (this.mode == "add") {
        this.form = {};
        this.form.proxyStatus = 1;
        this.form.proxyHost = "127.0.0.1";
        this.form.proxyProtocol = "http-proxy";
      }

      return this;
    }
  }
};
</script>

<style></style>
