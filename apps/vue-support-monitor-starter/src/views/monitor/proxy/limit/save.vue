<template>
  <div>
    <el-dialog v-model="visible" :title="getDialogTitle()" width="550px" destroy-on-close draggable
      :close-on-click-modal="false" :append-to-body="true" class="limit-dialog" @closed="close">
      <!-- 限流类型图标 -->
      <div class="limit-type-icon">
        <IconifyIconOnline :icon="limitType === 'PATH' ? 'ep:link' : 'ep:location'" class="type-icon" />
      </div>

      <!-- 表单内容 -->
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode === 'show'" label-width="120px"
        label-position="right" class="limit-form">
        <!-- 路径限流表单项 -->
        <template v-if="limitType === 'PATH'">
          <el-form-item label="限流路径" prop="proxyConfigLimitPathOrIp">
            <el-input v-model="form.proxyConfigLimitPathOrIp" clearable placeholder="请输入限流路径，例如: /api/users/*">
              <template #prefix>
                <IconifyIconOnline icon="ep:link" />
              </template>
              <template #append>
                <el-tooltip content="路径支持通配符 * 匹配" placement="top">
                  <IconifyIconOnline icon="ep:question-filled" />
                </el-tooltip>
              </template>
            </el-input>
            <div class="form-tip">路径示例: /api/users/* 表示匹配所有 /api/users/ 下的路径</div>
          </el-form-item>
        </template>

        <!-- IP限流表单项 -->
        <template v-else>
          <el-form-item label="限流IP地址" prop="proxyConfigLimitPathOrIp">
            <ip-input type="ip" v-model="form.proxyConfigLimitPathOrIp" class="ip-input" />
            <div class="form-tip">支持单个IP地址或CIDR格式的IP段，如: 192.168.1.1 或 192.168.1.0/24</div>
          </el-form-item>
        </template>

        <!-- 限流频率设置 -->
        <el-form-item label="限流频率" prop="proxyConfigLimitPerSeconds">
          <el-input-number v-model="form.proxyConfigLimitPerSeconds" :min="1" :max="10000" :step="1"
            controls-position="right" placeholder="请输入每秒允许的请求次数" class="rate-input" />
          <div class="form-tip">每秒允许通过的最大请求数量，超过限制的请求将被拒绝</div>
        </el-form-item>

        <!-- QPS限流设置，仅在路径限流时显示 -->
        <el-form-item v-if="limitType === 'PATH'" label="QPS限流" prop="proxyConfigLimitQps">
          <el-input-number v-model="form.proxyConfigLimitQps" :min="0" :max="10000" :step="1"
            controls-position="right" placeholder="请输入每秒查询次数限制" class="rate-input" />
          <div class="form-tip">每秒查询请求(Query Per Second)限制，设置为0表示不限制</div>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="mt-2"
          >
            <div class="qps-info">
              <p><strong>QPS限流与普通限流的区别：</strong></p>
              <p>- 普通限流：针对所有请求类型，控制总体流量</p>
              <p>- QPS限流：仅针对查询(GET)请求，适用于保护数据查询接口</p>
            </div>
          </el-alert>
        </el-form-item>

        <!-- 启用状态设置 -->
        <el-form-item label="启用状态" prop="proxyConfigLimitDisabled">
          <div class="status-switch">
            <el-switch v-model="form.proxyConfigLimitDisabled" :active-value="0" :inactive-value="1" active-text="启用"
              inactive-text="禁用" :active-color="'var(--el-color-success)'" :inactive-color="'var(--el-color-danger)'" />
            <span class="status-text" :class="form.proxyConfigLimitDisabled ? 'disabled' : 'enabled'">
              {{ form.proxyConfigLimitDisabled ? '规则已禁用' : '规则已启用' }}
            </span>
          </div>
        </el-form-item>
      </el-form>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">
            <IconifyIconOnline icon="ep:close" />
            取 消
          </el-button>
          <el-button v-if="mode !== 'show'" type="primary" :loading="isSaving" @click="submitForm">
            <IconifyIconOnline icon="ep:check" v-if="!isSaving" />
            保 存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { fetchProxyLimitSave, fetchProxyLimitUpdate } from "@/api/monitor/proxy";
import IpInput from "@repo/components/ScInput/index.vue";
export default {
  emits: ["success", "closed"],
  components: {
    IpInput
  },
  data() {
    return {
      // 表单数据
      form: {
        proxyConfigLimitDisabled: 0,
        proxyConfigLimitQps: 0 // 默认QPS限流为0，表示不限制
      },

      // 限流类型：PATH 或 IP
      limitType: null,

      // 对话框模式：add, edit, show
      mode: "add",

      // 对话框显示状态
      visible: false,

      // 保存状态
      isSaving: false,

      // 表单验证规则
      rules: {
        proxyConfigLimitPathOrIp: [
          { required: true, message: "请输入限流地址", trigger: "blur" }
        ],
        proxyConfigLimitPerSeconds: [
          { required: true, message: "请输入限流频率", trigger: "blur" },
          { type: 'number', min: 1, message: "频率必须大于0", trigger: "blur" }
        ],
        proxyConfigLimitQps: [
          { type: 'number', min: 0, message: "QPS必须大于等于0", trigger: "blur" }
        ]
      }
    };
  },
  methods: {
    /**
     * 获取对话框标题
     * @returns {String} 对话框标题
     */
    getDialogTitle() {
      const typeText = this.limitType === 'PATH' ? '路径限流' : 'IP限流';
      const modeText = this.mode === 'add' ? '新增' : this.mode === 'edit' ? '编辑' : '查看';
      return `${modeText}${typeText}规则`;
    },

    /**
     * 设置表单数据
     * @param {Object} row - 行数据
     * @param {String} limitType - 限流类型：PATH 或 IP
     * @returns {Object} - 当前实例，用于链式调用
     */
    setData(row, limitType) {
      // 清空表单
      this.form = {};

      // 设置限流类型
      this.limitType = limitType;

      // 合并数据
      Object.assign(this.form, row);

      // 设置限流类型
      this.form.proxyConfigLimitType = limitType;

      return this;
    },

    /**
     * 打开对话框
     * @param {String} mode - 对话框模式：add, edit, show
     */
    open(mode = "add") {
      this.mode = mode;
      this.visible = true;

      // 新增模式默认启用规则
      if (mode === "add") {
        this.form.proxyConfigLimitDisabled = 0;
      }
    },

    /**
     * 关闭对话框
     */
    close() {
      this.visible = false;
      this.form = {
        proxyConfigLimitDisabled: 0,
        proxyConfigLimitQps: 0 // 默认QPS限流为0，表示不限制
      };
      this.limitType = null;
      this.mode = "add";
      this.isSaving = false;
      this.$emit("closed");
    },

    /**
     * 提交表单
     */
    submitForm() {
      this.$refs.dialogForm.validate(valid => {
        if (valid) {
          this.isSaving = true;

          // 根据是否有ID决定是新增还是更新
          const request = this.form.proxyConfigLimitId
            ? fetchProxyLimitUpdate(this.form)
            : fetchProxyLimitSave(this.form);

          request
            .then(res => {
              if (res.code === "00000") {
                this.$message.success(this.form.proxyConfigLimitId ? "更新成功" : "添加成功");
                this.visible = false;
                this.$emit("success");
              } else {
                this.$message.error(res.msg || "操作失败");
              }
            })
            .catch(error => {
              console.error("保存限流规则失败:", error);
              this.$message.error("操作失败，请稍后重试");
            })
            .finally(() => {
              this.isSaving = false;
            });
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.limit-dialog {
  :deep(.el-dialog__header) {
    padding: 20px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-light);
    position: relative;
  }

  :deep(.el-dialog__body) {
    padding: 30px 20px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 15px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }
}

.limit-type-icon {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  animation: bounce 1s ease-out;

  .type-icon {
    font-size: 24px;
    color: white;
  }
}

.limit-form {
  animation: fadeIn 0.5s ease-out;

  :deep(.el-form-item) {
    margin-bottom: 25px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__wrapper),
  :deep(.el-input-number__wrapper) {
    box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
    transition: all 0.3s ease;

    &:hover,
    &:focus {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-3) inset;
    }
  }
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
  padding-left: 5px;
  border-left: 2px solid var(--el-color-primary-light-5);
}

.status-switch {
  display: flex;
  align-items: center;
  gap: 15px;

  .status-text {
    font-size: 14px;

    &.enabled {
      color: var(--el-color-success);
    }

    &.disabled {
      color: var(--el-color-danger);
    }
  }
}

.ip-input {
  width: 100%;
}

.rate-input {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  .el-button {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  40% {
    transform: translateX(-50%) translateY(-20px);
  }

  60% {
    transform: translateX(-50%) translateY(-10px);
  }
}

:deep(.el-form-item:nth-child(1)) {
  animation: slideIn 0.4s ease-out 0.1s both;
}

:deep(.el-form-item:nth-child(2)) {
  animation: slideIn 0.4s ease-out 0.2s both;
}

:deep(.el-form-item:nth-child(3)) {
  animation: slideIn 0.4s ease-out 0.3s both;
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

.qps-info {
  font-size: 12px;
  line-height: 1.5;
  
  p {
    margin: 2px 0;
  }
}
</style>
