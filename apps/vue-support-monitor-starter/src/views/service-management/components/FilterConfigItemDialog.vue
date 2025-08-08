<template>
  <el-dialog v-model="dialogVisible" :title="`配置 ${filterName}`" width="800px" :close-on-click-modal="false" @close="handleClose">
    <div class="config-container">
      <div class="config-header">
        <div class="filter-info">
          <h4>{{ filterName }}</h4>
          <p v-if="filterDescription">{{ filterDescription }}</p>
        </div>
      </div>

      <div class="config-content" v-loading="loading">
        <el-form ref="formRef" :model="formData" label-width="150px" label-position="right">
          <el-form-item
            v-for="item in configItems"
            :key="item.systemServerSettingItemId"
            :label="item.systemServerSettingItemName"
            :prop="item.systemServerSettingItemName"
            :rules="getItemRules(item)"
          >
            <!-- 字符串类型 -->
            <el-input
              v-if="item.systemServerSettingItemType === 'string' || !item.systemServerSettingItemType"
              v-model="formData[item.systemServerSettingItemName]"
              :placeholder="item.systemServerSettingItemDescription || `请输入${item.systemServerSettingItemName}`"
              clearable
            />

            <!-- 数字类型 -->
            <el-input-number
              v-else-if="item.systemServerSettingItemType === 'number' || item.systemServerSettingItemType === 'integer'"
              v-model="formData[item.systemServerSettingItemName]"
              :placeholder="item.systemServerSettingItemDescription || `请输入${item.systemServerSettingItemName}`"
              style="width: 100%"
            />

            <!-- 浮点数类型 -->
            <el-input-number
              v-else-if="item.systemServerSettingItemType === 'double' || item.systemServerSettingItemType === 'float'"
              v-model="formData[item.systemServerSettingItemName]"
              :precision="2"
              :step="0.1"
              :placeholder="item.systemServerSettingItemDescription || `请输入${item.systemServerSettingItemName}`"
              style="width: 100%"
            />

            <!-- 布尔类型 -->
            <el-switch v-else-if="item.systemServerSettingItemType === 'boolean'" v-model="formData[item.systemServerSettingItemName]" active-text="是" inactive-text="否" />

            <!-- JSON类型 -->
            <el-input
              v-else-if="item.systemServerSettingItemType === 'json'"
              v-model="formData[item.systemServerSettingItemName]"
              type="textarea"
              :rows="4"
              :placeholder="item.systemServerSettingItemDescription || `请输入JSON格式的${item.systemServerSettingItemName}`"
            />

            <!-- 其他类型默认为字符串 -->
            <el-input v-else v-model="formData[item.systemServerSettingItemName]" :placeholder="item.systemServerSettingItemDescription || `请输入${item.systemServerSettingItemName}`" clearable />

            <!-- 配置项描述 -->
            <div v-if="item.systemServerSettingItemDescription" class="item-description">
              {{ item.systemServerSettingItemDescription }}
            </div>

            <!-- 默认值提示 -->
            <div v-if="item.systemServerSettingItemDefaultValue" class="item-default">默认值: {{ item.systemServerSettingItemDefaultValue }}</div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="resetToDefaults">重置为默认值</el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  getSystemServerSettingItemBySettingId,
  batchUpdateSystemServerSettingItemValues,
  batchResetSystemServerSettingItemsToDefault,
  type SystemServerSettingItem,
  type ItemValueUpdate
} from "@/api/system-server-setting-item";

// Props
interface Props {
  visible: boolean;
  settingId?: number | null;
  filterName?: string;
  filterDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  settingId: null,
  filterName: "",
  filterDescription: ""
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const configItems = ref<SystemServerSettingItem[]>([]);
const formData = reactive<Record<string, any>>({});

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 获取配置项验证规则
const getItemRules = (item: SystemServerSettingItem): FormRules[string] => {
  const rules: any[] = [];

  if (item.systemServerSettingItemRequired) {
    rules.push({
      required: true,
      message: `${item.systemServerSettingItemName}为必填项`,
      trigger: "blur"
    });
  }

  if (item.systemServerSettingItemValidationRule) {
    rules.push({
      pattern: new RegExp(item.systemServerSettingItemValidationRule),
      message: `${item.systemServerSettingItemName}格式不正确`,
      trigger: "blur"
    });
  }

  return rules;
};

// 加载配置项
const loadConfigItems = async () => {
  if (!props.settingId) return;

  loading.value = true;
  try {
    const response = await getSystemServerSettingItemBySettingId(props.settingId);
    if (response.success) {
      configItems.value = response.data || [];

      // 初始化表单数据
      const newFormData: Record<string, any> = {};
      configItems.value.forEach(item => {
        let value = item.systemServerSettingItemValue as any;

        // 根据类型转换值
        if (item.systemServerSettingItemType === "boolean") {
          value = value === "true" || value === true;
        } else if (item.systemServerSettingItemType === "number" || item.systemServerSettingItemType === "integer") {
          value = value ? Number(value) : undefined;
        } else if (item.systemServerSettingItemType === "double" || item.systemServerSettingItemType === "float") {
          value = value ? parseFloat(value) : undefined;
        }

        newFormData[item.systemServerSettingItemName] = value;
      });

      Object.assign(formData, newFormData);
    } else {
      ElMessage.error(response.msg || "加载配置项失败");
    }
  } catch (error) {
    console.error("加载配置项失败:", error);
    ElMessage.error("加载配置项失败");
  } finally {
    loading.value = false;
  }
};

// 监听settingId变化
watch(
  () => props.settingId,
  newSettingId => {
    if (newSettingId && props.visible) {
      loadConfigItems();
    }
  },
  { immediate: true }
);

// 监听对话框显示状态
watch(
  () => props.visible,
  visible => {
    if (visible && props.settingId) {
      loadConfigItems();
    }
  }
);

// 重置为默认值
const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm("确定要重置所有配置项为默认值吗？", "确认重置", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const itemIds = configItems.value.map(item => item.systemServerSettingItemId!);
    const response = await batchResetSystemServerSettingItemsToDefault(itemIds);

    if (response.success) {
      ElMessage.success("重置成功");
      loadConfigItems(); // 重新加载数据
    } else {
      ElMessage.error(response.msg || "重置失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重置失败:", error);
      ElMessage.error("重置失败");
    }
  }
};

// 保存配置
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;

    // 构建更新数据
    const updates: ItemValueUpdate[] = configItems.value.map(item => ({
      itemId: item.systemServerSettingItemId!,
      value: String(formData[item.systemServerSettingItemName] || "")
    }));

    const response = await batchUpdateSystemServerSettingItemValues(updates);

    if (response.success) {
      ElMessage.success("保存成功");
      emit("success");
    } else {
      ElMessage.error(response.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存配置失败:", error);
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};
</script>

<style lang="scss" scoped>
.config-container {
  .config-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    .filter-info {
      h4 {
        margin: 0 0 8px 0;
        color: #303133;
        font-size: 16px;
        font-weight: 600;
      }

      p {
        margin: 0;
        color: #606266;
        font-size: 14px;
      }
    }
  }

  .config-content {
    max-height: 500px;
    overflow-y: auto;

    .item-description {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      line-height: 1.4;
    }

    .item-default {
      font-size: 12px;
      color: #67c23a;
      margin-top: 4px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
