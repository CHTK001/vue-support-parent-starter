<template>
  <div class="list-input">
    <div class="list-items">
      <div v-for="(item, index) in items" :key="index" class="list-item">
        <el-input
          v-model="items[index]"
          :placeholder="placeholder || '请输入内容'"
          class="item-input"
          :disabled="disabled"
          :size="size"
          @input="handleInput"
        />
        <el-button
          v-if="items.length > 1"
          type="danger"
          circle
          :size="size"
          class="remove-btn"
          :disabled="disabled"
          @click="removeItem(index)"
        >
          <IconifyIconOnline icon="ep:delete" />
        </el-button>
      </div>
      <el-button type="primary" class="add-btn w-full" :size="size" :disabled="disabled" @click="addItem">
        <IconifyIconOnline icon="ep:plus" />
        <span style="margin-left: 4px">添加</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: "large" | "default" | "small";
  }>(),
  {
    modelValue: "",
    placeholder: "请输入内容",
    disabled: false,
    size: "default"
  }
);

const emit = defineEmits(["update:modelValue"]);

// 将逗号分隔的字符串转换为数组
const parseValue = (value: string) => {
  if (!value || typeof value !== "string") return [""];
  return value
    .split(",")
    .map(item => item.trim())
    .filter(item => item !== "");
};

// 初始化items
const items = ref<string[]>(parseValue(props.modelValue) || [""]);

// 监听modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    const parsed = parseValue(newValue);
    if (parsed.length === 0) {
      items.value = [""];
    } else {
      // 只有当解析后的值与当前值不同时才更新，避免输入时的光标跳动问题
      // 这里简单比较长度，更严谨的应该比较内容
      if (parsed.length !== items.value.length || !parsed.every((val, index) => val === items.value[index])) {
        items.value = parsed;
      }
    }
  },
  { immediate: true }
);

// 添加新项
const addItem = () => {
  if (props.disabled) return;
  items.value.push("");
  handleInput();
};

// 删除项
const removeItem = (index: number) => {
  if (props.disabled) return;
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
      margin-left: 4px;
    }
  }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 8px;

    &.w-full {
      width: 100%;
    }
  }
}
</style>
