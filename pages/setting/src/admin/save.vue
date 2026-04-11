<script setup>
import {
  computed,
  defineAsyncComponent,
  defineExpose,
  reactive,
  ref,
} from "vue";
import { fetchUpdateSetting, fetchSaveSetting } from "../api";
import { message } from "@repo/utils";
import { ScDialog } from "@repo/components/ScDialog";
const ConfigValueInput = defineAsyncComponent(
  () => import("./ConfigValueInput.vue"),
);

// 配置对象，包含所有状态和数据
const config = reactive({
  visible: false,
  mode: "edit",
  rules: {
    sysSettingName: [
      { required: true, message: "请输入配置名称", trigger: "blur" },
    ],
    sysSettingValueType: [
      { required: true, message: "请输入配置值类型", trigger: "blur" },
    ],
    sysSettingGroup: [
      { required: true, message: "请输入配置所属分组", trigger: "blur" },
    ],
  },
  valueType: [
    { value: "String", label: "字符串" },
    { value: "Number", label: "数字" },
    { value: "Boolean", label: "布尔" },
    { value: "Array", label: "数组" },
    { value: "TextArea", label: "文本" },
    { value: "Dict", label: "字典" },
    { value: "Color", label: "颜色" },
    { value: "Mail", label: "邮件" },
    { value: "Password", label: "密码" },
    { value: "AppSecret", label: "密钥" },
    { value: "Object", label: "对象" },
  ],
  data: {
    sysSettingValue: null,
    sysSettingValueType: null,
  },
  title: "配置项管理",
});

const dialogTitle = computed(() =>
  config.mode === "add" ? "新增配置项" : "编辑配置项",
);

const emit = defineEmits(["close", "success"]);
const itemSaveRef = ref();

const validateForm = async () => {
  try {
    return Boolean(await itemSaveRef.value?.validate?.());
  } catch (error) {
    return false;
  }
};

/**
 * 获取类型对应的图标名称
 * @param {string} type - 配置类型
 * @returns {string} - 图标名称
 */
const getTypeIconName = (type) => {
  // 类型到图标的映射关系
  const iconMap = {
    String: "ep:document",
    Number: "ep:data-line",
    Boolean: "ep:switch",
    Array: "ep:collection",
    TextArea: "ep:document-copy",
    Dict: "ep:collection-tag",
    Color: "ep:brush",
    Mail: "ep:message",
    Password: "ep:lock",
    AppSecret: "ep:key",
    Object: "ep:box",
  };
  // 返回对应图标，如果没有则返回问号图标
  return iconMap[type] || "ep:question";
};

/**
 * 获取类型的描述文本
 * @param {string} type - 配置类型
 * @returns {string} - 描述文本
 */
const getTypeDescription = (type) => {
  // 类型到描述的映射关系
  const descMap = {
    String: "适用于短文本，如名称、标识符等",
    Number: "适用于数值类型，如数量、大小等",
    Boolean: "适用于开关类型，值为是或否",
    Array: "适用于数组类型，如列表、集合等",
    TextArea: "适用于长文本，如描述、说明等",
    Dict: "适用于字典类型，如下拉选项等",
    Color: "适用于颜色选择，如主题色等",
    Mail: "适用于邮件配置，如SMTP设置等",
    Password: "适用于密码类型，显示为掩码",
    AppSecret: "适用于密钥类型，如API密钥等",
    Object: "适用于对象类型，如JSON配置等",
  };
  // 返回对应描述，如果没有则返回未知类型
  return descMap[type] || "未知类型";
};

/**
 * 获取类型的显示标签
 * @param {string} type - 配置类型
 * @returns {string} - 显示标签
 */
const getTypeLabel = (type) => {
  // 在valueType数组中查找对应类型
  const item = config.valueType.find((item) => item.value === type);
  // 返回找到的标签，如果没有则返回类型本身
  return item ? item.label : type;
};

/**
 * 选择配置类型
 * @param {string} type - 选择的类型
 */
const selectType = (type) => {
  // 设置选择的类型
  config.data.sysSettingValueType = type;

  // 根据类型设置默认值
  if (type === "Boolean") {
    // 布尔类型默认为false
    config.data.sysSettingValue = "false";
  } else if (type === "Number") {
    // 数字类型默认为0
    config.data.sysSettingValue = "0";
  } else if (type === "Array" || type === "Object") {
    // 数组和对象类型默认为空数组
    config.data.sysSettingValue = "[]";
  } else {
    // 其他类型默认为空字符串
    config.data.sysSettingValue = "";
  }
};

/**
 * 重置类型选择
 */
const resetTypeSelection = () => {
  // 清空类型和值
  config.data.sysSettingValueType = null;
  config.data.sysSettingValue = null;
};

/**
 * 切换布尔值
 */
const toggleBooleanValue = () => {
  // 如果当前是true则改为false，反之亦然
  config.data.sysSettingValue =
    config.data.sysSettingValue === "true" ? "false" : "true";
};

/**
 * 打开对话框
 * @param {string} mode - 对话框模式：edit或add
 */
const open = (mode) => {
  config.visible = true;
  config.mode = mode;

  // 如果是添加模式，初始化数据
  if (mode === "add") {
    config.data = {
      sysSettingValue: null,
      sysSettingValueType: null,
      sysSettingSort: 0, // 默认优先级为0
    };
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  config.visible = false;
  emit("close");
};

/**
 * 更新配置
 */
const handleUpdate = async () => {
  const valid = await validateForm();
  if (!valid) return;

  const res = await fetchUpdateSetting(config.data);
  if (res.code == "00000") {
    message("更新成功", { type: "success" });
    config.visible = false;
    emit("success");
  }
};

/**
 * 保存配置
 */
const handleSave = async () => {
  const valid = await validateForm();
  if (!valid) return;

  const res = await fetchSaveSetting(config.data);
  if (res.code == "00000") {
    message("保存成功", { type: "success" });
    config.visible = false;
    emit("success");
  }
};

/**
 * 根据模式处理表单提交
 */
const handle = () => {
  if (config.mode == "edit") {
    handleUpdate();
  } else {
    handleSave();
  }
};

/**
 * 设置表单数据
 * @param {Object} data - 表单数据
 */
const setData = async (data) => {
  config.data = JSON.parse(JSON.stringify(data || {}));
};

/**
 * 获取配置值的占位文本
 * @returns {string} 占位文本
 */
const getValuePlaceholder = () => {
  const type = config.data.sysSettingValueType;
  const placeholderMap = {
    String: "请输入字符串值",
    Number: "请输入数字值",
    Boolean: "",
    Array: '请输入数组，如: ["item1", "item2"]',
    TextArea: "请输入长文本内容",
    Dict: '请输入字典数据，如: {"key1": "value1"}',
    Color: "请选择颜色",
    Mail: "请配置邮件服务器信息",
    Password: "请输入密码",
    AppSecret: "请输入或生成密钥",
    Object: "请输入JSON对象",
  };

  return placeholderMap[type] || "请输入配置值";
};

/**
 * 获取配置值的描述文本
 * @returns {string} 描述文本
 */
const getValueDescription = () => {
  const type = config.data.sysSettingValueType;
  if (!type) return "请先选择配置类型";

  return getTypeDescription(type);
};

// 暴露组件方法
defineExpose({
  setData,
  open,
});
</script>

<template>
  <div>
    <ScDialog
      v-model="config.visible"
      :title="dialogTitle || config.title"
      width="820px"
      draggable
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      class="setting-save-dialog"
      @close="handleClose"
    >
      <ScForm
        v-if="config.mode == 'edit'"
        ref="itemSaveRef"
        :rules="config.rules"
        :model="config.data"
        class="w-full modern-form"
        label-position="top"
      >
        <div class="modern-form-grid">
          <ScFormItem
            label="数据分组"
            prop="sysSettingGroup"
            class="modern-form-item"
          >
            <ScInput
              v-model="config.data.sysSettingGroup"
              placeholder="请输入配置所属分组"
            >
              <template #prefix>
                <IconifyIconOnline icon="ep:folder" />
              </template>
            </ScInput>
            <div class="form-tip">配置项所属的功能分组，用于组织和管理配置</div>
          </ScFormItem>

          <ScFormItem
            label="名称"
            prop="sysSettingName"
            class="modern-form-item"
          >
            <ScInput
              v-model="config.data.sysSettingName"
              placeholder="请输入配置名称"
            >
              <template #prefix>
                <IconifyIconOnline icon="ep:edit" />
              </template>
            </ScInput>
            <div class="form-tip">配置项的唯一标识名称，建议使用英文</div>
          </ScFormItem>

          <ScFormItem
            label="数据类型"
            prop="sysSettingValueType"
            class="modern-form-item"
          >
            <ScSelect
              v-model="config.data.sysSettingValueType"
              placeholder="请选择"
            >
              <ScOption
                v-for="item in config.valueType"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="type-option">
                  <IconifyIconOnline
                    :icon="getTypeIconName(item.value)"
                    class="type-icon"
                  />
                  <span>{{ item.label }}</span>
                </div>
              </ScOption>
            </ScSelect>
            <div class="form-tip">
              选择配置项的数据类型，不同类型有不同的编辑方式
            </div>
          </ScFormItem>

          <ScFormItem
            label="数据优先级"
            prop="sysSettingSort"
            class="modern-form-item"
          >
            <ScInput
              v-model="config.data.sysSettingSort"
              placeholder="请输入数据优先级"
              type="number"
            >
              <template #prefix>
                <IconifyIconOnline icon="ep:sort" />
              </template>
            </ScInput>
            <div class="form-tip">数字越小优先级越高，影响配置项的显示顺序</div>
          </ScFormItem>

          <ScFormItem
            label="配置值"
            prop="sysSettingValue"
            class="modern-form-item modern-form-item--wide"
          >
            <div class="value-editor-shell">
              <config-value-input
                v-model="config.data.sysSettingValue"
                :type="config.data.sysSettingValueType"
                :placeholder="getValuePlaceholder()"
              />
            </div>
            <div class="form-tip">{{ getValueDescription() }}</div>
          </ScFormItem>

          <ScFormItem
            label="描述"
            prop="sysSettingRemark"
            class="modern-form-item modern-form-item--wide"
          >
            <ScInput
              v-model="config.data.sysSettingRemark"
              placeholder="请输入描述"
              type="textarea"
              :rows="3"
            />
            <div class="form-tip">
              配置项的详细描述，帮助其他用户理解该配置的用途
            </div>
          </ScFormItem>
        </div>
      </ScForm>

      <!-- 新增表单 - 先选择类型 -->
      <ScForm
        v-else-if="config.mode == 'add'"
        ref="itemSaveRef"
        :rules="config.rules"
        :model="config.data"
        class="w-full modern-form"
        label-position="top"
      >
        <!-- 类型选择步骤 -->
        <div
          v-if="!config.data.sysSettingValueType"
          class="type-selection-container"
        >
          <h3 class="type-selection-title">请选择配置类型</h3>
          <p class="type-selection-subtitle">
            先确定值类型，再填写分组、名称和配置值，新增表单会保持统一对齐。
          </p>
          <div class="type-cards">
            <div
              v-for="item in config.valueType"
              :key="item.value"
              class="type-card"
              @click="selectType(item.value)"
            >
              <div class="type-card-icon">
                <IconifyIconOnline :icon="getTypeIconName(item.value)" />
              </div>
              <div class="type-card-label">{{ item.label }}</div>
              <div class="type-card-desc">
                {{ getTypeDescription(item.value) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 类型选择后的表单 -->
        <template v-else>
          <div class="form-header">
            <div class="selected-type">
              <IconifyIconOnline
                :icon="getTypeIconName(config.data.sysSettingValueType)"
              />
              <span>{{ getTypeLabel(config.data.sysSettingValueType) }}</span>
            </div>
            <ScButton type="text" @click="resetTypeSelection">
              <IconifyIconOnline icon="ep:refresh-right" />
              重新选择
            </ScButton>
          </div>

          <div class="modern-form-grid">
            <ScFormItem
              label="数据分组"
              prop="sysSettingGroup"
              class="modern-form-item"
            >
              <ScInput
                v-model="config.data.sysSettingGroup"
                placeholder="请输入配置所属分组"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ep:folder" />
                </template>
              </ScInput>
              <div class="form-tip">
                配置项所属的功能分组，用于组织和管理配置
              </div>
            </ScFormItem>

            <ScFormItem
              label="名称"
              prop="sysSettingName"
              class="modern-form-item"
            >
              <ScInput
                v-model="config.data.sysSettingName"
                placeholder="请输入配置名称"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ep:edit" />
                </template>
              </ScInput>
              <div class="form-tip">配置项的唯一标识名称，建议使用英文</div>
            </ScFormItem>

            <ScFormItem
              label="配置值"
              prop="sysSettingValue"
              class="modern-form-item modern-form-item--wide"
            >
              <div class="value-editor-shell">
                <config-value-input
                  v-model="config.data.sysSettingValue"
                  :type="config.data.sysSettingValueType"
                  :placeholder="getValuePlaceholder()"
                />
              </div>
              <div class="form-tip">{{ getValueDescription() }}</div>
            </ScFormItem>

            <ScFormItem
              label="描述"
              prop="sysSettingRemark"
              class="modern-form-item modern-form-item--wide"
            >
              <ScInput
                v-model="config.data.sysSettingRemark"
                placeholder="请输入描述"
                type="textarea"
                :rows="3"
              />
              <div class="form-tip">
                配置项的详细描述，帮助其他用户理解该配置的用途
              </div>
            </ScFormItem>

            <ScFormItem
              label="数据优先级"
              prop="sysSettingSort"
              class="modern-form-item"
            >
              <ScInput
                v-model="config.data.sysSettingSort"
                placeholder="请输入数据优先级"
                type="number"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ep:sort" />
                </template>
              </ScInput>
              <div class="form-tip">
                数字越小优先级越高，影响配置项的显示顺序
              </div>
            </ScFormItem>
          </div>
        </template>
      </ScForm>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="config.visible = false">
            <IconifyIconOnline icon="ep:close" />
            取 消
          </ScButton>
          <ScButton
            v-if="config.mode == 'edit'"
            type="primary"
            @click="handleUpdate"
          >
            <IconifyIconOnline icon="ep:check" />
            更 新
          </ScButton>
          <ScButton
            v-if="config.mode == 'add' && config.data.sysSettingValueType"
            type="primary"
            @click="handleSave"
          >
            <IconifyIconOnline icon="ep:plus" />
            保 存
          </ScButton>
        </div>
      </template>
    </ScDialog>
  </div>
</template>

<style lang="scss" scoped>
.setting-save-dialog {
  :deep(.el-dialog) {
    width: min(820px, calc(100vw - 24px)) !important;
    max-height: min(820px, calc(100vh - 32px));
    margin: 16px auto !important;
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__body) {
    padding: 16px 18px 16px;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 0 18px 16px;
  }
}

.modern-form {
  animation: fadeIn 0.24s ease-out;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    padding: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25;
    color: #334155;
  }

  :deep(.el-form-item__content) {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: stretch;
    margin-left: 0 !important;
  }

  :deep(.el-input),
  :deep(.el-select),
  :deep(.el-input-number),
  :deep(.sc-config-value-input) {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 0 0 1px rgba(203, 213, 225, 0.92) inset;
    transition: all 0.3s ease;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-select__wrapper:hover),
  :deep(.el-textarea__inner:hover) {
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.96) inset;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focused),
  :deep(.el-textarea__inner:focus) {
    box-shadow:
      0 0 0 1px rgba(37, 99, 235, 0.92) inset,
      0 0 0 3px rgba(191, 219, 254, 0.28);
  }

  :deep(.el-textarea__inner) {
    min-height: 110px;
    padding: 12px 14px;
  }
}

.modern-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
  align-items: start;
}

.modern-form-item {
  min-width: 0;
}

.modern-form-item--wide {
  grid-column: 1 / -1;
}

.form-tip {
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
  margin-top: 8px;
}

.value-editor-shell {
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(248, 250, 252, 0.7);
  padding: 8px 10px;
}

.value-editor-shell :deep(.el-input__wrapper),
.value-editor-shell :deep(.el-select__wrapper),
.value-editor-shell :deep(.el-textarea__inner) {
  background: #fff;
  box-shadow: 0 0 0 1px rgba(203, 213, 225, 0.9) inset;
}

.value-editor-shell :deep(.el-input__wrapper.is-focus),
.value-editor-shell :deep(.el-select__wrapper.is-focused),
.value-editor-shell :deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.94) inset,
    0 0 0 2px rgba(191, 219, 254, 0.24);
}

.type-selection-container {
  text-align: left;
  animation: fadeIn 0.5s ease-out;
}

.type-selection-title {
  font-size: 20px;
  color: #0f172a;
  margin-bottom: 6px;
  font-weight: 700;
}

.type-selection-subtitle {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.type-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.type-card {
  padding: 16px 14px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);

    .type-card-icon {
      transform: scale(1.1);
    }
  }

  .type-card-icon {
    width: 50px;
    height: 50px;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    transition: all 0.3s;

    :deep(svg) {
      font-size: 24px;
    }
  }

  .type-card-label {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }

  .type-card-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(219, 234, 254, 0.92);
  background: linear-gradient(
    135deg,
    rgba(239, 246, 255, 0.82) 0%,
    rgba(248, 250, 252, 0.96) 100%
  );

  .selected-type {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
    color: #1d4ed8;

    :deep(svg) {
      font-size: 20px;
    }
  }
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .type-icon {
    color: var(--el-color-primary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.85);

  .el-button {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 108px;
    justify-content: center;
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

@media (max-width: 768px) {
  .setting-save-dialog {
    :deep(.el-dialog__body) {
      padding: 18px 16px 14px;
    }

    :deep(.el-dialog__footer) {
      padding: 0 16px 16px;
    }
  }

  .modern-form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
