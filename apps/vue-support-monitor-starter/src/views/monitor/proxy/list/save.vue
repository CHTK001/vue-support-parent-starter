<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="550px" destroy-on-close draggable :close-on-click-modal="false"
      class="list-dialog" @closed="close">
      <!-- 列表类型图标 -->
      <div class="list-type-icon">
        <IconifyIconOnline :icon="listType === 'WHITE' ? 'ep:circle-check' : 'ep:circle-close'" class="type-icon"
          :class="listType === 'WHITE' ? 'white-icon' : 'black-icon'" />
      </div>

      <!-- 表单内容 -->
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode === 'show'" label-width="120px"
        label-position="left" class="list-form">
        <el-form-item label="限流地址" prop="proxyConfigList">
          <ip-input v-model="form.proxyConfigList" clearable placeholder="请输入限流地址" class="ip-input" />
          <div class="form-tip">
            {{ listType === 'WHITE' ? '白名单地址将被允许访问，支持IP或CIDR格式' : '黑名单地址将被禁止访问，支持IP或CIDR格式' }}
          </div>
        </el-form-item>

        <el-form-item label="启用状态" prop="proxyConfigListDisabled">
          <div class="status-switch">
            <el-switch v-model="form.proxyConfigListDisabled" :active-value="0" :inactive-value="1" active-text="启用"
              inactive-text="禁用" :active-color="'var(--el-color-success)'" :inactive-color="'var(--el-color-danger)'" />
            <span class="status-text" :class="form.proxyConfigListDisabled ? 'disabled' : 'enabled'">
              {{ form.proxyConfigListDisabled ? '规则已禁用' : '规则已启用' }}
            </span>
          </div>
          <div class="form-tip">
            {{ listType === 'WHITE' ? '禁用后，该白名单地址将不再被允许访问' : '禁用后，该黑名单地址将不再被拦截' }}
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
import { fetchProxyListUpdate, fetchProxyListSave } from "@/api/monitor/proxy";
import IpInput from "@repo/components/ScInput/IpInput.vue";

export default {
  components: {
    IpInput
  },
  emits: ["success", "closed"],
  data() {
    return {
      // 表单数据
      form: {
        proxyConfigListDisabled: 0
      },

      // 列表类型：WHITE 或 BLACK
      listType: null,

      // 对话框模式：add, edit, show
      mode: "add",

      // 对话框标题
      title: "",

      // 对话框显示状态
      visible: false,

      // 保存状态
      isSaving: false,

      // 表单验证规则
      rules: {
        proxyConfigList: [
          { required: true, message: "请输入限流地址", trigger: "blur" }
        ]
      }
    };
  },
  methods: {
    /**
     * 设置表单数据
     * @param {Object} row - 行数据
     * @param {String} listType - 列表类型：WHITE 或 BLACK
     * @returns {Object} - 当前实例，用于链式调用
     */
    setData(row, listType) {
      // 清空表单
      this.form = {};

      // 设置列表类型
      this.listType = listType;

      // 合并数据
      Object.assign(this.form, row);

      // 设置列表类型
      this.form.proxyConfigListType = listType;

      return this;
    },

    /**
     * 打开对话框
     * @param {String} mode - 对话框模式：add, edit, show
     */
    open(mode = "add") {
      this.mode = mode;

      // 设置对话框标题
      const action = mode === "add" ? "新增" : mode === "edit" ? "编辑" : "查看";
      this.title = `${action}${this.listType === "WHITE" ? "白名单" : "黑名单"}`;

      // 新增模式默认启用规则
      if (mode === "add") {
        this.form.proxyConfigListDisabled = 0;
      }

      this.visible = true;
    },

    /**
     * 关闭对话框
     */
    close() {
      this.visible = false;
      this.form = {
        proxyConfigListDisabled: 0
      };
      this.listType = null;
      this.mode = "add";
      this.isSaving = false;
      this.$emit("closed");
    },

    /**
     * 提交表单
     */
    submitForm() {
      // 设置列表类型
      this.form.proxyConfigListType = this.listType;

      this.$refs.dialogForm.validate(valid => {
        if (valid) {
          this.isSaving = true;

          // 根据是否有ID决定是新增还是更新
          const request = this.form.proxyConfigListId
            ? fetchProxyListUpdate(this.form)
            : fetchProxyListSave(this.form);

          request
            .then(res => {
              if (res.code === "00000") {
                this.$message.success(this.form.proxyConfigListId ? "更新成功" : "添加成功");
                this.visible = false;
                this.$emit("success");
              } else {
                this.$message.error(res.msg || "操作失败");
              }
            })
            .catch(error => {
              console.error("保存列表项失败:", error);
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
.list-dialog {
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

.list-type-icon {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  animation: bounce 1s ease-out;

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: white;
    z-index: -1;
  }

  .type-icon {
    font-size: 30px;

    &.white-icon {
      color: var(--el-color-success);
    }

    &.black-icon {
      color: var(--el-color-danger);
    }
  }
}

.list-form {
  animation: fadeIn 0.5s ease-out;

  :deep(.el-form-item) {
    margin-bottom: 25px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
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
