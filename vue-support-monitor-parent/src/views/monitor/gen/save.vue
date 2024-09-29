<template>
  <div>
    <el-dialog v-model="visible" :title="mode == 'edit' ? '更新' + form.genName : '新增'" width="600px" draggable @close="onClose">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="genName">
          <el-input v-model="form.genName" placeholder="请输入名称" :maxLength="20" />
        </el-form-item>

        <el-form-item label="类型" prop="genType">
          <el-select v-model="form.genType" placeholder="请选择类型">
            <el-option value="JDBC" />
            <el-option value="JDBC" label="INFLUXDB ver2+" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.genType == 'JDBC'" label="JDBC类型" prop="genJdbcCustomType">
          <el-select v-model="form.genJdbcCustomType" placeholder="请选择JDBC类型">
            <el-option value="FILE" />
            <el-option value="URL" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.genType == 'JDBC'" label="驱动" prop="genDriver">
          <el-select v-model="form.genDriver" placeholder="请选择驱动" clearable allow-create filterable>
            <el-option value="org.sqlite.JDBC" label="sqlite">
              <span>sqlite</span>
            </el-option>
            <el-option value="oracle.jdbc.OracleDriver" label="Oracle" />
            <el-option value="com.mysql.jdbc.Driver" label="mysql 5+" />
            <el-option value="com.ibm.db2.jcc.DB2Driver" label="DB2" />
            <el-option value="com.sybase.jdbc.SybDriver" label="sybase" />
            <el-option value="org.postgresql.Driver" label="PostgreSQL " />
            <el-option value="org.hsqldb.jdbcDriver" label="hsqldb" />
            <el-option value="File" label="文件" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.genJdbcCustomType == 'URL'" label="地址" prop="genHost">
          <div class="flex flex-1 gap-1">
            <el-input v-model="form.genHost" placeholder="请输入地址" />
            <el-input v-model="form.genPort" placeholder="请输入账号" type="number" />
          </div>
        </el-form-item>

        <el-form-item label="账号" prop="genUser">
          <el-input v-model="form.genUser" placeholder="请输入账号" />
        </el-form-item>

        <el-form-item label="密码" prop="genPassword">
          <el-input v-model="form.genPassword" placeholder="请输入密码" show-password type="password" />
        </el-form-item>

        <el-form-item label="描述" prop="genDesc">
          <el-input v-model="form.genDesc" placeholder="请输入描述" show-password type="textarea" maxlength="200" :show-word-limit="true" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onClose">取 消</el-button>
          <el-button type="primary" :loading="confirmLoading" @click="onSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { fetchGenDatabaseSave, fetchGenDatabaseUpdate } from "@/api/monitor/gen/database";
import { message } from "@/utils/message";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      visible: false,
      confirmLoading: false,
      form: {},
      mode: "add"
    };
  },
  methods: {
    open(mode = "add") {
      this.visible = true;
      this.mode = mode;
    },
    onClose() {
      this.visible = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    onSubmit() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          this.confirmLoading = true;
          const newForm = {};
          Object.assign(newForm, this.form);
          newForm.genDriverRemoteUrl = newForm.genHost + ":" + newForm.genPort;
          let res;
          if (this.mode === "add") {
            res = await fetchGenDatabaseSave(newForm);
          } else if (this.mode === "edit") {
            res = await fetchGenDatabaseUpdate(newForm);
          }
          this.confirmLoading = false;
          if (res.code == "00000") {
            this.$emit("success", res, this.mode);
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
