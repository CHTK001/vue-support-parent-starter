<template>
  <el-dialog v-model="dialogVisible" :title="`配置 ${filterSetting?.systemServerSettingName}`" width="800px" :close-on-click-modal="false" @close="handleClose">
    <div class="config-content" v-if="filterSetting">
      <el-alert :title="`正在配置 ${filterSetting.systemServerSettingType} 类型的ServletFilter`" type="info" :closable="false" show-icon style="margin-bottom: 20px" />

      <el-form ref="formRef" :model="configData" label-width="150px" label-position="right">
        <el-form-item label="Filter名称">
          <el-input v-model="filterSetting.systemServerSettingName" disabled />
        </el-form-item>

        <el-form-item label="Filter类型">
          <el-input v-model="filterSetting.systemServerSettingType" disabled />
        </el-form-item>

        <el-form-item label="Filter描述">
          <el-input v-model="filterSetting.systemServerSettingDescription" type="textarea" :rows="2" placeholder="请输入Filter描述" />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="filterSetting.systemServerSettingEnabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>

        <el-divider content-position="left">配置参数</el-divider>

        <!-- 动态配置项 -->
        <div class="config-items">
          <div v-for="(item, index) in configItems" :key="index" class="config-item">
            <el-form-item :label="item.name" :required="item.required">
              <el-input v-if="item.type === 'String'" v-model="item.value" :placeholder="item.description || `请输入${item.name}`" />
              <el-input-number v-else-if="item.type === 'Integer'" v-model="item.value" :placeholder="item.description || `请输入${item.name}`" style="width: 100%" />
              <el-switch v-else-if="item.type === 'Boolean'" v-model="item.value" :active-text="item.name" />
              <el-input v-else v-model="item.value" :placeholder="item.description || `请输入${item.name}`" />
              <div class="config-item-description" v-if="item.description">
                {{ item.description }}
              </div>
            </el-form-item>

            <div class="config-item-actions">
              <el-button type="danger" size="small" @click="removeConfigItem(index)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>
        </div>

        <!-- 添加配置项 -->
        <el-form-item>
          <el-button type="primary" @click="addConfigItem">
            <IconifyIconOnline icon="ri:add-line" />
            添加配置项
          </el-button>
          <el-button @click="resetToDefault">
            <IconifyIconOnline icon="ri:refresh-line" />
            重置为默认值
          </el-button>
        </el-form-item>

        <!-- JSON配置预览 -->
        <el-divider content-position="left">JSON配置预览</el-divider>
        <el-form-item>
          <el-input v-model="jsonConfig" type="textarea" :rows="6" placeholder="JSON格式的配置参数" readonly />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">保存配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import { updateServletFilterConfig, resetServletFilterConfig, type SystemServerSetting } from "@/api/system-server-setting";

// Props
interface Props {
  visible: boolean;
  filterSetting?: SystemServerSetting | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  filterSetting: null
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 配置项接口
interface ConfigItem {
  name: string;
  type: string;
  value: any;
  description?: string;
  required?: boolean;
}

// 响应式数据
const formRef = ref<FormInstance>();
const loading = ref(false);

const configData = reactive({
  description: "",
  enabled: true
});

const configItems = ref<ConfigItem[]>([]);

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const jsonConfig = computed(() => {
  const config: Record<string, any> = {};
  configItems.value.forEach(item => {
    if (item.value !== undefined && item.value !== "") {
      config[item.name] = item.value;
    }
  });
  return JSON.stringify(config, null, 2);
});

// 监听filterSetting变化
watch(
  () => props.filterSetting,
  newSetting => {
    if (newSetting) {
      configData.description = newSetting.systemServerSettingDescription || "";
      configData.enabled = newSetting.systemServerSettingEnabled || false;

      // 解析现有配置
      parseExistingConfig(newSetting.systemServerSettingConfig);
    }
  },
  { immediate: true }
);

// 解析现有配置
const parseExistingConfig = (configStr?: string) => {
  configItems.value = [];

  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      Object.entries(config).forEach(([key, value]) => {
        configItems.value.push({
          name: key,
          type: typeof value === "number" ? "Integer" : typeof value === "boolean" ? "Boolean" : "String",
          value: value,
          description: `${key}配置项`
        });
      });
    } catch (error) {
      console.error("解析配置失败:", error);
    }
  }

  // 如果没有配置项，添加一个默认的
  if (configItems.value.length === 0) {
    addConfigItem();
  }
};

// 添加配置项
const addConfigItem = () => {
  configItems.value.push({
    name: "",
    type: "String",
    value: "",
    description: "",
    required: false
  });
};

// 删除配置项
const removeConfigItem = (index: number) => {
  configItems.value.splice(index, 1);
};

// 重置为默认值
const resetToDefault = async () => {
  if (!props.filterSetting?.systemServerSettingId) return;

  try {
    const response = await resetServletFilterConfig(props.filterSetting.systemServerSettingId);
    if (response.success) {
      ElMessage.success("重置成功");
      parseExistingConfig("{}");
    } else {
      ElMessage.error(response.msg || "重置失败");
    }
  } catch (error) {
    console.error("重置配置失败:", error);
    ElMessage.error("重置失败");
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 提交配置
const handleSubmit = async () => {
  if (!props.filterSetting?.systemServerSettingId) return;

  loading.value = true;
  try {
    const config: Record<string, any> = {};

    // 构建配置对象
    configItems.value.forEach(item => {
      if (item.name && item.value !== undefined && item.value !== "") {
        config[item.name] = item.value;
      }
    });

    const response = await updateServletFilterConfig(props.filterSetting.systemServerSettingId, config);

    if (response.success) {
      ElMessage.success("配置保存成功");
      emit("success");
    } else {
      ElMessage.error(response.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存配置失败:", error);
    ElMessage.error("保存失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.config-content {
  max-height: 600px;
  overflow-y: auto;

  /* 统一的细滚动条样式 */
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(140, 140, 140, 0.3);
    border-radius: 2px;
    box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);

    &:hover {
      background: rgba(140, 140, 140, 0.5);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(140, 140, 140, 0);
    border-radius: 2px;
    box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
  }
}

.config-items {
  .config-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background: #fafafa;

    .el-form-item {
      flex: 1;
      margin-bottom: 0;
    }

    .config-item-description {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      line-height: 1.4;
    }

    .config-item-actions {
      display: flex;
      align-items: center;
      margin-top: 32px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
