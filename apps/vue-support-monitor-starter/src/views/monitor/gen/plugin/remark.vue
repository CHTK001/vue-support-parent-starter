<template>
  <div class="remark-container">
    <el-dialog v-model="visible" :close-on-click-modal="false" title="更新备注" draggable width="550px" class="remark-dialog" @close="onClose">
      <template #header>
        <div class="remark-header">
          <IconifyIconOnline icon="ri:edit-line" class="remark-header__icon" />
          <span class="remark-header__title">编辑数据库对象注释</span>
        </div>
      </template>

      <el-form :model="form" label-width="90px" class="remark-form">
        <el-form-item label="数据源">
          <el-input v-model="dataSourceInfo" disabled readonly class="remark-form__input" prefix-icon="ri:database-2-line" />
        </el-form-item>
        <el-form-item label="注释表">
          <el-input v-model="form.remarkTable" disabled readonly class="remark-form__input" prefix-icon="ri:table-line" />
        </el-form-item>
        <el-form-item label="注释字段">
          <el-input v-model="form.remarkColumn" disabled readonly class="remark-form__input" prefix-icon="ri:key-line" />
        </el-form-item>
        <el-form-item label="注释内容" required>
          <el-input v-model="form.remarkName" type="textarea" :rows="4" placeholder="请输入注释内容" class="remark-form__textarea" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="remark-footer">
          <el-button class="remark-footer__btn" @click="onClose">
            <IconifyIconOnline icon="ri:close-line" class="remark-footer__icon" />
            取 消
          </el-button>
          <el-button type="primary" :loading="confirmLoading" class="remark-footer__btn" @click="onSubmit">
            <IconifyIconOnline icon="ri:check-line" class="remark-footer__icon" />
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchGenRemarkSave } from "@/api/monitor/gen/remark";
import { message } from "@repo/utils";
import { ref, reactive, computed, defineProps, defineEmits } from "vue";

// 定义组件属性
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

// 定义组件事件
const emit = defineEmits(["close", "success"]);

// 组件状态
const visible = ref(false);
const confirmLoading = ref(false);
const mode = ref("add");
const node = ref({});
const form = reactive({
  genId: "",
  remarkName: "",
  remarkTable: "",
  remarkColumn: ""
});

/**
 * 计算属性：数据源信息
 * 格式化显示数据源名称和ID
 */
const dataSourceInfo = computed(() => {
  return `${props.data.genName || ""} (${props.data.genId || ""})`;
});

/**
 * 设置表单数据
 * @param {Object} data - 数据对象
 * @returns {Object} - 当前实例，支持链式调用
 */
const setData = data => {
  form.genId = data.genId;
  form.remarkName = data.nodeComment;
  form.remarkTable = data.nodePid;
  form.remarkColumn = data.nodeName;
  return { setNode, open };
};

/**
 * 设置节点数据
 * @param {Object} nodeData - 节点对象
 * @returns {Object} - 当前实例，支持链式调用
 */
const setNode = nodeData => {
  node.value = nodeData;
  return { setData, open };
};

/**
 * 关闭对话框
 * 重置表单状态并触发关闭事件
 */
const onClose = () => {
  visible.value = false;
  confirmLoading.value = false;
  // 重置表单
  form.remarkName = "";
  form.remarkTable = "";
  form.remarkColumn = "";
  emit("close");
};

/**
 * 打开对话框
 * @param {String} modeType - 模式类型
 * @returns {Object} - 当前实例，支持链式调用
 */
const open = (modeType = "add") => {
  mode.value = modeType;
  visible.value = true;
  return { setData, setNode };
};

/**
 * 提交表单
 * 验证并保存注释信息
 */
const onSubmit = async () => {
  if (!form.remarkName) {
    message("请输入注释内容", { type: "warning" });
    return;
  }

  confirmLoading.value = true;
  try {
    const newForm = {
      ...form,
      genId: props.data.genId
    };

    const res = await fetchGenRemarkSave(newForm);
    if (res.code === "00000") {
      message(res.msg || "保存成功", { type: "success" });
      onClose();
      emit("success", node.value);
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存注释失败:", error);
    message("操作失败", { type: "error" });
  } finally {
    confirmLoading.value = false;
  }
};

// 导出组件方法
defineExpose({
  setData,
  setNode,
  open
});
</script>

<style lang="scss" scoped>
.remark-container {
  width: 100%;
}

.remark-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.remark-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  &__icon {
    font-size: 22px;
    color: var(--el-color-primary);
    margin-right: 10px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.remark-form {
  &__input {
    background-color: var(--el-fill-color-light);

    :deep(.el-input__wrapper) {
      box-shadow: none;
    }

    :deep(.el-input__prefix-inner) {
      display: flex;
      align-items: center;
    }
  }

  &__textarea {
    font-family: inherit;

    :deep(.el-textarea__inner) {
      min-height: 100px !important;
      resize: vertical;
      transition: all 0.3s;

      &:focus {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
      }
    }
  }
}

.remark-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }

  &__icon {
    margin-right: 4px;
  }
}
</style>
