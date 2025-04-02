<template>
  <div class="sc-array-input">
    <el-input v-model="jsonString" type="textarea" :rows="rows" :disabled="disabled" :placeholder="placeholder" @blur="validateAndUpdate" class="array-textarea" />

    <div class="array-error" v-if="error">
      {{ error }}
    </div>

    <div class="array-items" v-if="isValidArray && showItems">
      <draggable v-model="arrayItems" item-key="id" handle=".item-drag-handle" :disabled="disabled" @end="handleDragEnd" class="array-draggable">
        <template #item="{ element, index }">
          <div class="array-item">
            <div class="item-drag-handle" v-if="!disabled">
              <IconifyIconOnline icon="ep:d-arrow-right" />
            </div>
            <div class="item-content">{{ element.value }}</div>
            <div class="item-actions" v-if="!disabled">
              <el-button type="danger" size="small" circle @click="removeItem(index)" class="delete-btn">
                <IconifyIconOnline icon="ep:delete" />
              </el-button>
            </div>
          </div>
        </template>
      </draggable>

      <div class="array-empty" v-if="arrayItems.length === 0">数组为空，请添加项目</div>

      <div class="array-add" v-if="!disabled">
        <el-input v-model="newItem" placeholder="输入新项目，多个项目用逗号分隔" @keyup.enter="addItem" class="add-input">
          <template #append>
            <el-button @click="addItem">
              <IconifyIconOnline icon="ep:plus" />
              添加
            </el-button>
          </template>
        </el-input>
        <div class="add-tip">
          <IconifyIconOnline icon="ep:info-filled" class="info-icon" />
          <span>提示：可以使用{{ props.separator }}分隔添加多个项目</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { message } from "@repo/utils";
import draggable from "vuedraggable";

/**
 * 组件属性定义
 */
const props = defineProps({
  modelValue: {
    type: String,
    default: "[]",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '请输入数组，如: ["item1", "item2"]',
  },
  rows: {
    type: Number,
    default: 3,
  },
  showItems: {
    type: Boolean,
    default: true,
  },
  separator: {
    type: String,
    default: ",",
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 错误信息
 */
const error = ref("");

/**
 * 新项目输入
 */
const newItem = ref("");

/**
 * JSON字符串
 */
const jsonString = ref(props.modelValue);

/**
 * 数组项目
 */
const arrayItems = ref([]);

/**
 * 是否为有效数组
 */
const isValidArray = ref(true);

/**
 * 初始化数组项目
 */
const initArrayItems = () => {
  try {
    // 尝试解析JSON字符串
    const parsed = JSON.parse(props.modelValue);

    // 检查是否为数组
    if (!Array.isArray(parsed)) {
      error.value = "输入的不是有效的数组格式";
      isValidArray.value = false;
      return;
    }

    // 转换为内部数组项目格式
    arrayItems.value = parsed.map((item, index) => ({
      id: `item-${index}`,
      value: item,
    }));

    error.value = "";
    isValidArray.value = true;
  } catch (e) {
    error.value = "解析数组失败，请检查格式";
    isValidArray.value = false;
  }
};

/**
 * 验证并更新数组
 */
const validateAndUpdate = () => {
  try {
    // 尝试解析JSON字符串
    const parsed = JSON.parse(jsonString.value);

    // 检查是否为数组
    if (!Array.isArray(parsed)) {
      error.value = "输入的不是有效的数组格式";
      isValidArray.value = false;
      return;
    }

    // 更新内部数组项目
    arrayItems.value = parsed.map((item, index) => ({
      id: `item-${index}`,
      value: item,
    }));

    // 更新绑定值
    emit("update:modelValue", jsonString.value);
    error.value = "";
    isValidArray.value = true;
  } catch (e) {
    error.value = "解析数组失败，请检查格式";
    isValidArray.value = false;
  }
};

/**
 * 添加新项目
 */
const addItem = () => {
  if (!newItem.value.trim()) return;

  // 使用分隔符拆分输入，支持添加多个项目
  const items = newItem.value
    .split(props.separator)
    .map((item) => item.trim())
    .filter((item) => item);

  if (items.length === 0) return;

  // 添加所有项目
  items.forEach((item) => {
    arrayItems.value.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: item,
    });
  });

  // 更新JSON字符串
  updateJsonString();

  // 清空输入
  newItem.value = "";

  // 显示成功消息
  if (items.length > 1) {
    message(`已添加${items.length}个项目`, { type: "success" });
  } else {
    message("已添加新项目", { type: "success" });
  }
};

/**
 * 移除项目
 */
const removeItem = (index) => {
  arrayItems.value.splice(index, 1);
  updateJsonString();
  message("已移除项目", { type: "success" });
};

/**
 * 处理拖拽结束
 */
const handleDragEnd = () => {
  updateJsonString();
  message("已重新排序", { type: "success" });
};

/**
 * 更新JSON字符串
 */
const updateJsonString = () => {
  // 提取值数组
  const values = arrayItems.value.map((item) => item.value);

  // 转换为JSON字符串
  jsonString.value = JSON.stringify(values);

  // 更新绑定值
  emit("update:modelValue", jsonString.value);
};

/**
 * 监听modelValue变化
 */
watch(
  () => props.modelValue,
  () => {
    jsonString.value = props.modelValue;
    initArrayItems();
  }
);

// 初始化
initArrayItems();
</script>

<style lang="scss">
.sc-array-input {
  .array-textarea {
    font-family: monospace;

    .el-textarea__inner {
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
      }

      &:focus {
        box-shadow: 0 0 0 1px var(--el-color-primary);
      }
    }
  }

  .array-error {
    margin-top: 8px;
    color: var(--el-color-danger);
    font-size: 12px;
  }

  .array-items {
    margin-top: 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;

    .array-draggable {
      min-height: 50px;
    }

    .array-item {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      &:nth-child(odd) {
        background-color: var(--el-fill-color-light);
      }

      .item-drag-handle {
        cursor: move;
        padding: 5px;
        margin-right: 10px;
        color: var(--el-text-color-secondary);

        &:hover {
          color: var(--el-color-primary);
        }
      }

      .item-content {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-actions {
        margin-left: 10px;

        .delete-btn {
          padding: 5px;
          font-size: 12px;
        }
      }
    }

    .array-empty {
      padding: 15px;
      text-align: center;
      color: var(--el-text-color-secondary);
      font-style: italic;
    }

    .array-add {
      padding: 10px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-lighter);

      .add-input {
        .el-input-group__append {
          .el-button {
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }
      }

      .add-tip {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 5px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .info-icon {
          font-size: 14px;
          color: var(--el-color-info);
        }
      }
    }
  }
}
</style>
