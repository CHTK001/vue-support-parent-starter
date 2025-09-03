<template>
  <div class="list-input">
    <div class="list-items">
      <div v-for="(item, index) in items" :key="index" class="list-item">
        <el-input v-model="items[index]" :placeholder="placeholder || '请输入内容'" class="item-input" @input="handleInput" />
        <el-button v-if="items.length > 1" type="danger" circle size="small" class="remove-btn" @click="removeItem(index)">
          <IconifyIconOnline icon="ep:delete" />
        </el-button>
      </div>
      <el-button type="primary" class="add-btn w-full" size="small" @click="addItem">
        <IconifyIconOnline icon="ep:plus" />
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  placeholder: {
    type: String,
    default: "请输入内容"
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue"]);

// 将逗号分隔的字符串转换为数组
const parseValue = value => {
  if (!value || typeof value !== "string") return [""];
  return value
    .split(",")
    .map(item => item.trim())
    .filter(item => item !== "");
};

// 初始化items
const items = ref(parseValue(props.modelValue) || [""]);

// 监听modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    const parsed = parseValue(newValue);
    if (parsed.length === 0) {
      items.value = [""];
    } else {
      items.value = parsed;
    }
  },
  { immediate: true }
);

// 添加新项
const addItem = () => {
  items.value.push("");
};

// 删除项
const removeItem = index => {
  if (items.value.length > 1) {
    items.value.splice(index, 1);
    handleInput();
  }
};

// 处理输入变化
const handleInput = () => {
  // 过滤空值并用逗号连接
  const filteredItems = items.value.filter(item => item && item.trim() !== "");
  const value = filteredItems.join(",");
  emit("update:modelValue", value);
};
</script>

<style lang="scss" scoped>
.list-input {
  .list-items {
    margin-bottom: 12px;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .item-input {
      flex: 1;
    }

    .remove-btn {
      flex-shrink: 0;
      width: 28px;
      height: 28px;

      :deep(.el-button) {
        padding: 0;
      }
    }
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 6px 12px;
    height: 28px;

    :deep(.el-icon) {
      font-size: 12px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .list-input {
    .list-item {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;

      .remove-btn {
        align-self: flex-end;
      }
    }
  }
}
</style>
