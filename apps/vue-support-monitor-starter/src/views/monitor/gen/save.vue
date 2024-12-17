<template>
  <div>
    <el-dialog v-model="visible" :title="mode == 'edit' ? '更新' + form.genName : '新增'" width="600px" draggable @close="onClose">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="genName">
          <el-input v-model="form.genName" placeholder="请输入名称" :maxLength="20" />
        </el-form-item>

        <el-form-item label="类型" prop="genType">
          <el-select v-model="form.genType" placeholder="请选择类型" @change="handleChangeGenType">
            <el-option value="JDBC" />
            <el-option value="ZOOKEEPER" />
            <el-option value="WEBRTC" />
            <el-option value="VNC">
              <span class="flex">
                <span>VNC</span>
                <span class="el-form-item-msg justify-end">虚拟网络控制台</span>
              </span>
            </el-option>
            <el-option value="REDIS" />
            <el-option value="MONGODB" />
            <el-option value="MQTT" disabled readonly />
            <el-option value="SHELL" label="终端" />
            <el-option value="INFLUXDB" label="INFLUXDB ver2+" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.genType == 'JDBC'" label="JDBC类型" prop="genJdbcCustomType">
          <el-select v-model="form.genJdbcCustomType" placeholder="请选择JDBC类型">
            <el-option value="FILE" label="文件" />
            <el-option value="URL" label="远程地址" />
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
            <el-option value="com.chua.calcite.Driver" label="文件" />
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

        <el-form-item v-if="form.genJdbcCustomType != 'FILE'" label="备份时间" prop="genBackupPeriod">
          <el-input v-model="form.genBackupPeriod" clearable placeholder="请输入数据库备份时间" type="number" />
        </el-form-item>

        <el-form-item v-if="form.genJdbcCustomType != 'FILE'" label="备份事件" prop="genBackupEvent">
          <el-select v-model="form.genBackupEvent" placeholder="请选择数据库备份事件" multiple style="width: 100%">
            <el-option label="更新" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="新增" value="CREATE" />
          </el-select>
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
import { message } from "@repo/utils";
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
    handleChangeGenType() {
      if (this.form.genType === "ZOOKEEPER") {
        this.form.genJdbcCustomType = "URL";
        this.form.genPort = 2181;
      }
      if (this.form.genType === "SHELL") {
        this.form.genJdbcCustomType = "URL";
        this.form.genPort = 22;
      }
      if (this.form.genType === "REDIS") {
        this.form.genJdbcCustomType = "URL";
        this.form.genPort = 6379;
      }
      if (this.form.genType === "MQTT") {
        this.form.genJdbcCustomType = "URL";
        this.form.genPort = 8084;
      }
    },
    open(mode = "add") {
      this.visible = true;
      this.mode = mode;
    },
    onClose() {
      this.visible = false;
      this.confirmLoading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.genBackupEvent = !this.form.genBackupEvent ? null : this.form.genBackupEvent.split(",");
      if (this.form.genType === "VNC" || this.form.genType === "ZOOKEEPER" || this.form.genType === "SHELL" || this.form.genType === "MQTT" || this.form.genType === "REDIS") {
        this.form.genJdbcCustomType = "URL";
      }
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
