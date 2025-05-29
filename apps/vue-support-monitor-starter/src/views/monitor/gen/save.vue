<template>
  <div class="gen-save">
    <el-dialog v-model="visible" :title="mode == 'edit' ? '更新' + form.genName : '新增数据源'" width="600px" draggable
      destroy-on-close @close="onClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="gen-save__form">
        <!-- 数据源名称 -->
        <el-form-item label="名称" prop="genName">
          <el-input v-model="form.genName" placeholder="请输入数据源名称" :maxlength="20" clearable>
            <template #prefix>
              <IconifyIconOnline icon="ri:database-2-line" />
            </template>
          </el-input>
        </el-form-item>

        <!-- 数据源类型 -->
        <el-form-item label="类型" prop="genType">
          <el-select v-model="form.genType" placeholder="请选择数据源类型" class="gen-save__select"
            @change="handleChangeGenType">
            <el-option value="JDBC">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:database-2-line" class="mr-2" />
                <span>JDBC</span>
              </div>
            </el-option>
            <el-option value="ZOOKEEPER">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:electron" class="mr-2" />
                <span>ZOOKEEPER</span>
              </div>
            </el-option>
            <el-option value="Prometheus">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:prometheus" class="mr-2" />
                <span>Prometheus</span>
              </div>
            </el-option>

            <el-option value="WEBRTC">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:video-chat-line" class="mr-2" />
                <span>WEBRTC</span>
              </div>
            </el-option>
            <el-option value="VNC">
              <div class="gen-save__option">
                <IconifyIconOnline icon="simple-icons:victronenergy" class="mr-2" />
                <span>VNC</span>
                <span class="gen-save__option-desc">虚拟网络控制台</span>
              </div>
            </el-option>
            <el-option value="REDIS">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:redis" class="mr-2" />
                <span>REDIS</span>
              </div>
            </el-option>
            <el-option value="MONGODB">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:mongodb" class="mr-2" />
                <span>MONGODB</span>
              </div>
            </el-option>
            <el-option value="MQTT" disabled readonly>
              <div class="gen-save__option gen-save__option--disabled">
                <IconifyIconOnline icon="simple-icons:mqtt" class="mr-2" />
                <span>MQTT</span>
              </div>
            </el-option>
            <el-option value="SHELL" label="终端">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:powershell" class="mr-2" />
                <span>终端</span>
              </div>
            </el-option>
            <el-option value="INFLUXDB" label="INFLUXDB ver2+">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:influxdb" class="mr-2" />
                <span>INFLUXDB ver2+</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- JDBC类型选择 -->
        <el-form-item v-if="form.genType == 'JDBC'" label="JDBC类型" prop="genJdbcCustomType">
          <el-select v-model="form.genJdbcCustomType" placeholder="请选择JDBC类型" class="gen-save__select">
            <el-option value="FILE" label="文件">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:file-line" class="mr-2" />
                <span>文件</span>
              </div>
            </el-option>
            <el-option value="URL" label="远程地址">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:link" class="mr-2" />
                <span>远程地址</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 数据库驱动选择 -->
        <el-form-item v-if="form.genType == 'JDBC'" label="驱动" prop="genDriver">
          <el-select v-model="form.genDriver" placeholder="请选择驱动" clearable allow-create filterable
            class="gen-save__select">
            <el-option value="org.sqlite.JDBC" label="sqlite">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:sqlite" class="mr-2" />
                <span>sqlite</span>
              </div>
            </el-option>
            <el-option value="oracle.jdbc.OracleDriver" label="Oracle">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:oracle" class="mr-2" />
                <span>Oracle</span>
              </div>
            </el-option>
            <el-option value="com.mysql.jdbc.Driver" label="mysql 5+">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:mysql" class="mr-2" />
                <span>mysql 5+</span>
              </div>
            </el-option>
            <el-option value="com.ibm.db2.jcc.DB2Driver" label="DB2">
              <div class="gen-save__option">
                <IconifyIconOnline icon="simple-icons:ibm" class="mr-2" />
                <span>DB2</span>
              </div>
            </el-option>
            <el-option value="com.sybase.jdbc.SybDriver" label="sybase">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:database-2-line" class="mr-2" />
                <span>sybase</span>
              </div>
            </el-option>
            <el-option value="org.postgresql.Driver" label="PostgreSQL">
              <div class="gen-save__option">
                <IconifyIconOnline icon="devicon:postgresql" class="mr-2" />
                <span>PostgreSQL</span>
              </div>
            </el-option>
            <el-option value="org.hsqldb.jdbcDriver" label="hsqldb">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:database-2-line" class="mr-2" />
                <span>hsqldb</span>
              </div>
            </el-option>
            <el-option value="com.chua.calcite.Driver" label="文件">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:file-line" class="mr-2" />
                <span>文件</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 远程地址和端口 -->
        <el-form-item v-if="form.genJdbcCustomType == 'URL'" label="地址" prop="genHost">
          <div class="gen-save__host-group">
            <el-input v-model="form.genHost" placeholder="请输入地址" class="gen-save__host">
              <template #prefix>
                <IconifyIconOnline icon="ri:global-line" />
              </template>
            </el-input>
            <el-input v-model="form.genPort" placeholder="请输入端口" type="number" class="gen-save__port">
              <template #prefix>
                <IconifyIconOnline icon="ri:door-lock-line" />
              </template>
            </el-input>
          </div>
        </el-form-item>

        <!-- 账号 -->
        <el-form-item label="账号" prop="genUser">
          <el-input v-model="form.genUser" placeholder="请输入账号" clearable>
            <template #prefix>
              <IconifyIconOnline icon="ri:user-3-line" />
            </template>
          </el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="genPassword">
          <el-input v-model="form.genPassword" placeholder="请输入密码" show-password type="password">
            <template #prefix>
              <IconifyIconOnline icon="ri:lock-password-line" />
            </template>
          </el-input>
        </el-form-item>

        <!-- 备份时间 -->
        <el-form-item v-if="form.genJdbcCustomType != 'FILE'" label="备份时间" prop="genBackupPeriod">
          <el-input v-model="form.genBackupPeriod" clearable placeholder="请输入数据库备份时间(分钟)" type="number">
            <template #prefix>
              <IconifyIconOnline icon="ri:time-line" />
            </template>
            <template #suffix>
              <span class="gen-save__unit">分钟</span>
            </template>
          </el-input>
        </el-form-item>

        <!-- 备份事件 -->
        <el-form-item v-if="form.genJdbcCustomType != 'FILE'" label="备份事件" prop="genBackupEvent">
          <el-select v-model="form.genBackupEvent" placeholder="请选择数据库备份事件" multiple class="gen-save__select">
            <el-option label="更新" value="UPDATE">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:edit-line" class="mr-2" />
                <span>更新</span>
              </div>
            </el-option>
            <el-option label="删除" value="DELETE">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-2" />
                <span>删除</span>
              </div>
            </el-option>
            <el-option label="新增" value="CREATE">
              <div class="gen-save__option">
                <IconifyIconOnline icon="ri:add-line" class="mr-2" />
                <span>新增</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述" prop="genDesc">
          <el-input v-model="form.genDesc" placeholder="请输入描述" type="textarea" maxlength="200" :show-word-limit="true"
            :rows="4" class="gen-save__textarea" />
        </el-form-item>
      </el-form>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <div class="gen-save__footer">
          <el-button @click="onClose">取 消</el-button>
          <el-button type="primary" :loading="confirmLoading" @click="onSubmit">
            <IconifyIconOnline v-if="!confirmLoading" icon="ri:save-line" class="mr-1" />
            <span>{{ mode === "edit" ? "更 新" : "保 存" }}</span>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchGenDatabaseSave, fetchGenDatabaseUpdate } from "@/api/monitor/gen/database";
import { message } from "@repo/utils";
import { reactive, ref } from "vue";

// 表单引用
const formRef = ref(null);

// 对话框可见性
const visible = ref(false);

// 提交按钮加载状态
const confirmLoading = ref(false);

// 操作模式：add-新增，edit-编辑
const mode = ref("add");

// 表单数据
const form = reactive({
  genName: "",
  genType: "",
  genJdbcCustomType: "",
  genDriver: "",
  genHost: "",
  genPort: "",
  genUser: "",
  genPassword: "",
  genBackupPeriod: "",
  genBackupEvent: [],
  genDesc: ""
});

// 表单验证规则
const rules = reactive({
  genName: [
    { required: true, message: "请输入数据源名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
  ],
  genType: [{ required: true, message: "请选择数据源类型", trigger: "change" }],
  genJdbcCustomType: [{ required: true, message: "请选择JDBC类型", trigger: "change" }],
  genHost: [{ required: true, message: "请输入地址", trigger: "blur" }],
  genPort: [{ required: true, message: "请输入端口", trigger: "blur" }]
});

/**
 * 根据数据源类型自动设置默认端口
 */
const handleChangeGenType = () => {
  // 根据不同的数据源类型设置默认值
  if (form.genType === "ZOOKEEPER") {
    form.genJdbcCustomType = "URL";
    form.genPort = 2181;
  } else if (form.genType === "SHELL") {
    form.genJdbcCustomType = "URL";
    form.genPort = 22;
  } else if (form.genType === "REDIS") {
    form.genJdbcCustomType = "URL";
    form.genPort = 6379;
  } else if (form.genType === "MQTT") {
    form.genJdbcCustomType = "URL";
    form.genPort = 8084;
  } else if (form.genType === "VNC") {
    form.genJdbcCustomType = "URL";
    form.genPort = 5900;
  } else if (form.genType === "MONGODB") {
    form.genJdbcCustomType = "URL";
    form.genPort = 27017;
  }
};

/**
 * 打开对话框
 * @param {string} operationMode - 操作模式：add-新增，edit-编辑
 */
const open = (operationMode = "add") => {
  visible.value = true;
  mode.value = operationMode;
};

/**
 * 关闭对话框并重置表单
 */
const onClose = () => {
  visible.value = false;
  confirmLoading.value = false;
  // 重置表单
  Object.keys(form).forEach(key => {
    form[key] = "";
  });
  form.genBackupEvent = [];
  // 重置表单验证
  formRef.value?.resetFields();
};

/**
 * 设置表单数据
 * @param {Object} data - 数据源信息
 * @returns {Object} - 当前实例，支持链式调用
 */
const setData = data => {
  // 复制数据到表单
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      form[key] = data[key];
    }
  });

  // 处理备份事件数组
  form.genBackupEvent = !form.genBackupEvent ? [] : typeof form.genBackupEvent === "string" ? form.genBackupEvent.split(",") : form.genBackupEvent;

  // 设置特定类型的默认值
  if (["VNC", "ZOOKEEPER", "SHELL", "MQTT", "REDIS", "MONGODB"].includes(form.genType)) {
    form.genJdbcCustomType = "URL";
  }

  return { open };
};

/**
 * 提交表单
 */
const onSubmit = () => {
  formRef.value.validate(async valid => {
    if (valid) {
      confirmLoading.value = true;

      try {
        // 创建新表单对象，避免修改原始表单
        const submitForm = { ...form };

        // 设置远程URL
        if (submitForm.genHost && submitForm.genPort) {
          submitForm.genDriverRemoteUrl = `${submitForm.genHost}:${submitForm.genPort}`;
        }

        // 处理备份事件数组
        if (Array.isArray(submitForm.genBackupEvent)) {
          submitForm.genBackupEvent = submitForm.genBackupEvent.join(",");
        }

        // 根据模式选择API
        let res;
        if (mode.value === "add") {
          res = await fetchGenDatabaseSave(submitForm);
        } else {
          res = await fetchGenDatabaseUpdate(submitForm);
        }

        // 处理响应
        if (res.code === "00000") {
          message(`${mode.value === "add" ? "新增" : "更新"}成功`, { type: "success" });
          // 触发成功事件
          emit("success", res, mode.value);
          // 关闭对话框
          visible.value = false;
        } else {
          message(res.msg || `${mode.value === "add" ? "新增" : "更新"}失败`, { type: "error" });
        }
      } catch (error) {
        message(`操作失败: ${error.message}`, { type: "error" });
      } finally {
        confirmLoading.value = false;
      }
    }
  });
};

// 定义组件事件
const emit = defineEmits(["success"]);

// 导出组件方法
defineExpose({
  open,
  setData
});
</script>

<style lang="scss" scoped>
.gen-save {
  &__form {
    max-height: 60vh;
    padding-right: 10px;
  }

  &__select {
    width: 100%;
  }

  &__option {
    display: flex;
    align-items: center;

    &-desc {
      margin-left: auto;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &--disabled {
      opacity: 0.6;
    }
  }

  &__host-group {
    display: flex;
    gap: 10px;
  }

  &__host {
    flex: 3;
  }

  &__port {
    flex: 1;
  }

  &__unit {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__textarea {
    font-family: var(--el-font-family);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

:deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

:deep(.el-select-dropdown__item) {
  padding: 0 12px;
}
</style>
