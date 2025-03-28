<template>
  <div>
    <el-dialog @close="close" v-model="visible" :title="title" width="650px" destroy-on-close draggable
      :close-on-click-modal="false" @closed="$emit('closed')" class="proxy-dialog">
      <div class="dialog-content">
        <!-- 协议类型选择器 -->
        <div class="protocol-selector">
          <div v-for="protocol in protocols" :key="protocol.value" class="protocol-item"
            :class="{ 'active': form.proxyProtocol === protocol.value }" @click="selectProtocol(protocol.value)">
            <div class="protocol-icon">
              <IconifyIconOnline :icon="protocol.icon" />
            </div>
            <div class="protocol-info">
              <div class="protocol-name">{{ protocol.label }}</div>
              <div class="protocol-desc">{{ protocol.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 表单内容 -->
        <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px"
          label-position="right" class="proxy-form">
          <el-form-item label="代理名称" prop="proxyName">
            <el-input v-model="form.proxyName" clearable placeholder="请输入代理名称"
              prefix-icon="IconifyIconOnline:ep:service" />
          </el-form-item>

          <el-form-item label="代理地址" prop="proxy">
            <div class="address-inputs">
              <el-input v-model="form.proxyHost" placeholder="请输入代理地址" prefix-icon="IconifyIconOnline:ep:position" />
              <el-input v-model="form.proxyPort" type="number" placeholder="请输入代理端口"
                prefix-icon="IconifyIconOnline:ep:connection" />
            </div>
          </el-form-item>

          <el-form-item label="说明" prop="proxyDesc">
            <el-input v-model="form.proxyDesc" type="textarea" :rows="3" placeholder="请输入代理服务说明信息" resize="none" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取 消</el-button>
          <el-button v-if="mode != 'show'" type="primary" :loading="isSaving" @click="submit()">
            <IconifyIconOnline icon="ep:check" v-if="!isSaving" />
            保 存
          </el-button>
        </div>
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
      // 对话框控制
      visible: false,
      isSaving: false,
      title: "",
      mode: "",

      // 协议配置
      protocols: [
        {
          label: "HTTP代理",
          value: "http-proxy",
          icon: "simple-icons:apache",
          desc: "支持HTTP/HTTPS协议代理转发"
        },
        {
          label: "TCP代理",
          value: "tcp-proxy",
          icon: "simple-icons:lineageos",
          desc: "支持TCP协议代理转发"
        },
        {
          label: "WebSockify代理",
          value: "websockify",
          icon: "simple-icons:proxmox",
          desc: "支持WebSocket协议代理转发"
        }
      ],

      // 表单数据
      form: {
        proxyHost: "127.0.0.1",
        proxyProtocol: "http-proxy",
        proxyStatus: 0
      },

      // 验证规则
      rules: {
        proxyName: [
          { required: true, message: "请输入代理名称", trigger: "blur" },
          { min: 2, max: 50, message: "长度在2到50个字符之间", trigger: "blur" }
        ],
        proxyPort: [
          { required: true, message: "请输入代理端口", trigger: "blur" },
          { pattern: /^([1-9]\d{0,4})$/, message: "端口范围为1-65535", trigger: "blur" }
        ],
        proxyProtocol: [
          { required: true, message: "请选择协议", trigger: "change" }
        ]
      }
    };
  },
  methods: {
    /**
     * 选择协议类型
     * @param {String} protocol - 协议类型
     */
    selectProtocol(protocol) {
      if (this.mode !== 'show') {
        this.form.proxyProtocol = protocol;
      }
    },

    close() {
      this.visible = false;
      this.$emit("closed");
      this.form = {};
    },
    /**
     * 打开对话框
     * @param {String} mode - 对话框模式：add/edit/show
     * @returns {Object} - 当前实例，用于链式调用
     */
    open(mode = "add") {
      this.mode = mode;

      // 设置对话框标题
      if (mode === "add") {
        this.title = "新增代理服务";
      } else if (mode === "edit") {
        this.title = "编辑代理服务";
      } else {
        this.title = "查看代理服务";
      }

      this.visible = true;

      // 表单重置
      this.$nextTick(() => {
        this.$refs.dialogForm?.resetFields();
      });

      return this;
    },

    /**
     * 表单提交方法
     */
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          let res;
          this.isSaving = true;

          try {
            // 根据模式选择不同的API
            if (this.mode === "add") {
              res = await fetchProxySave(this.form);
            } else if (this.mode === "edit") {
              res = await fetchProxyUpdate(this.form);
            }

            // 处理响应结果
            if (res.code === "00000") {
              this.$message.success(this.mode === "add" ? "代理服务创建成功" : "代理服务更新成功");
              this.$emit("success", res, this.mode);
              this.visible = false;
            } else {
              this.$message.error(res.msg || "操作失败");
            }
          } catch (error) {
            console.error("保存代理服务失败:", error);
            this.$message.error("操作失败，请稍后重试");
          } finally {
            this.isSaving = false;
          }
        }
      });
    },

    /**
     * 设置表单数据
     * @param {Object} data - 要设置的数据
     * @returns {Object} - 当前实例，用于链式调用
     */
    setData(data) {
      this.isSaving = false;

      if (this.mode === "edit" || this.mode === "show") {
        // 编辑或查看模式，使用传入的数据
        Object.assign(this.form, data);

        if (this.mode === "edit") {
          this.title = `编辑 - ${this.form.proxyName}`;
        } else {
          this.title = `查看 - ${this.form.proxyName}`;
        }
      } else if (this.mode === "add") {
        // 新增模式，使用默认值
        this.form = {
          proxyHost: "127.0.0.1",
          proxyProtocol: "http-proxy",
          proxyStatus: 0
        };
      }

      return this;
    }
  }
};
</script>

<style lang="scss" scoped>
.proxy-dialog {
  :deep(.el-dialog__header) {
    padding: 20px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 15px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.protocol-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.protocol-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-page);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);

    .protocol-icon {
      color: var(--el-color-primary);
    }

    .protocol-name {
      color: var(--el-color-primary);
    }
  }
}

.protocol-icon {
  font-size: 24px;
  color: var(--el-text-color-secondary);

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.protocol-info {
  flex: 1;
}

.protocol-name {
  font-weight: 600;
  margin-bottom: 5px;
}

.protocol-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.proxy-form {
  margin-top: 10px;
}

.address-inputs {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 动画效果 */
.protocol-item {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.proxy-form {
  animation: fadeIn 0.5s ease-out 0.2s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 表单项动画 */
:deep(.el-form-item) {
  animation: slideIn 0.4s ease-out;
  animation-fill-mode: both;
}

:deep(.el-form-item:nth-child(1)) {
  animation-delay: 0.1s;
}

:deep(.el-form-item:nth-child(2)) {
  animation-delay: 0.2s;
}

:deep(.el-form-item:nth-child(3)) {
  animation-delay: 0.3s;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
