<template>
  <sc-dialog
    v-model="dialogVisible"
    title="同步软件信息"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="sync-content">
      <!-- 同步配置 -->
      <ScForm ref="formRef" :model="form" :rules="rules" label-width="120px">
        <div class="form-section">
          <div class="section-title">同步配置</div>

          <ScFormItem label="镜像仓库" prop="registryIds">
            <ScSelect
              v-model="form.registryIds"
              placeholder="选择要同步的镜像仓库"
              multiple
              style="width: 100%"
            >
              <ScOption
                v-for="registry in registryOptions"
                :key="registry.systemSoftRegistryId"
                :label="registry.systemSoftRegistryName"
                :value="registry.systemSoftRegistryId"
              >
                <div class="registry-option">
                  <span class="registry-name">{{
                    registry.systemSoftRegistryName
                  }}</span>
                  <span class="registry-type"
                    >({{
                      getRegistryTypeText(registry.systemSoftRegistryType)
                    }})</span
                  >
                </div>
              </ScOption>
            </ScSelect>
            <div class="form-tip">
              选择要同步软件信息的镜像仓库，可以选择多个
            </div>
          </ScFormItem>

          <ScFormItem label="同步类型">
            <ScRadioGroup v-model="form.syncType">
              <ScRadio label="popular">热门软件</ScRadio>
              <ScRadio label="official">官方镜像</ScRadio>
              <ScRadio label="custom">自定义搜索</ScRadio>
            </ScRadioGroup>
          </ScFormItem>

          <ScFormItem v-if="form.syncType === 'custom'" label="搜索关键词">
            <ScInput
              v-model="form.searchKeywords"
              placeholder="输入要搜索的软件关键词，多个关键词用逗号分隔"
              type="textarea"
              :rows="3"
            />
            <div class="form-tip">例如: nginx,mysql,redis,mongodb</div>
          </ScFormItem>

          <ScFormItem label="同步数量限制">
            <ScInputNumber
              v-model="form.limitCount"
              :min="10"
              :max="500"
              :step="10"
              style="width: 200px"
            />
            <div class="form-tip">每个仓库最多同步的软件数量</div>
          </ScFormItem>

          <ScFormItem label="版本信息">
            <ScCheckbox v-model="form.includeVersions"
              >同步版本标签信息</ScCheckbox
            >
            <div class="form-tip">
              是否同步每个软件的版本标签列表（会增加同步时间）
            </div>
          </ScFormItem>
        </div>

        <div class="form-section">
          <div class="section-title">高级选项</div>

          <ScFormItem label="覆盖策略">
            <ScRadioGroup v-model="form.overwritePolicy">
              <ScRadio label="skip">跳过已存在</ScRadio>
              <ScRadio label="update">更新已存在</ScRadio>
              <ScRadio label="merge">合并信息</ScRadio>
            </ScRadioGroup>
            <div class="form-tip">当软件已存在时的处理策略</div>
          </ScFormItem>

          <ScFormItem label="并发数量">
            <ScInputNumber
              v-model="form.concurrency"
              :min="1"
              :max="10"
              style="width: 200px"
            />
            <div class="form-tip">同时同步的软件数量，建议不超过5个</div>
          </ScFormItem>

          <ScFormItem label="超时时间">
            <ScInputNumber
              v-model="form.timeout"
              :min="30"
              :max="300"
              :step="30"
              style="width: 200px"
            />
            <span style="margin-left: 8px">秒</span>
            <div class="form-tip">单个软件信息同步的超时时间</div>
          </ScFormItem>
        </div>
      </ScForm>

      <!-- 预览信息 -->
      <div class="preview-section">
        <div class="section-title">同步预览</div>
        <div class="preview-info">
          <div class="preview-item">
            <span class="preview-label">选择仓库：</span>
            <span class="preview-value">{{ getSelectedRegistryNames() }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">同步类型：</span>
            <span class="preview-value">{{ getSyncTypeText() }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">预计数量：</span>
            <span class="preview-value">{{ getEstimatedCount() }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSubmit">
          开始同步
        </ScButton>
      </span>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import { type FormInstance, type FormRules } from "element-plus";
import { softwareApi, registryApi } from "@/api/docker";

interface Props {
  visible: boolean;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const registryOptions = ref<any[]>([]);

const form = reactive({
  registryIds: [] as number[],
  syncType: "popular",
  searchKeywords: "",
  limitCount: 50,
  includeVersions: true,
  overwritePolicy: "merge",
  concurrency: 3,
  timeout: 120,
});

const rules: FormRules = {
  registryIds: [
    { required: true, message: "请选择至少一个镜像仓库", trigger: "change" },
  ],
};

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    loadData();
  }
});

const loadData = async () => {
  try {
    // 加载镜像仓库列表
    const registryResponse = await registryApi.getAllRegistries();
    if (registryResponse.code === "00000") {
      registryOptions.value = registryResponse.data || [];
    }
  } catch (error) {
    console.error("加载数据失败:", error);
  }
};

const getRegistryTypeText = (type?: string) => {
  const map = {
    docker_hub: "Docker Hub",
    aliyun: "阿里云",
    harbor: "Harbor",
    custom: "自定义",
  };
  return map[type] || "未知";
};

const getSelectedRegistryNames = () => {
  if (form.registryIds.length === 0) return "未选择";
  const names = form.registryIds.map((id) => {
    const registry = registryOptions.value.find(
      (r: any) => r.systemSoftRegistryId === id,
    );
    return registry?.systemSoftRegistryName || "未知";
  });
  return names.join(", ");
};

const getSyncTypeText = () => {
  const map = {
    popular: "热门软件",
    official: "官方镜像",
    custom: "自定义搜索",
  };
  return map[form.syncType] || "未知";
};

const getEstimatedCount = () => {
  const registryCount = form.registryIds.length;
  if (registryCount === 0) return "0";

  let baseCount = form.limitCount;
  if (form.syncType === "custom" && form.searchKeywords) {
    const keywordCount = form.searchKeywords
      .split(",")
      .filter((k) => k.trim()).length;
    baseCount = Math.min(baseCount, keywordCount * 10); // 每个关键词预计10个结果
  }

  return `约 ${registryCount * baseCount} 个软件`;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 构建同步参数
    const params = {
      registryIds: form.registryIds,
      syncType: form.syncType,
      searchKeywords:
        form.syncType === "custom" ? form.searchKeywords : undefined,
      limitCount: form.limitCount,
      includeVersions: form.includeVersions,
      overwritePolicy: form.overwritePolicy,
      concurrency: form.concurrency,
      timeout: form.timeout,
    };

    const response = await softwareApi.syncSoftwareFromRegistry(params);
    if (response.code === "00000") {
      message("软件同步任务已启动，请查看进度", { type: "success" });
      emit("success");
      handleClose();
    } else {
      message(response.message || "软件同步失败", { type: "error" });
    }
  } catch (error) {
    message("软件同步失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  if (!loading.value) {
    dialogVisible.value = false;
    resetForm();
  }
};

const resetForm = () => {
  form.registryIds = [];
  form.syncType = "popular";
  form.searchKeywords = "";
  form.limitCount = 50;
  form.includeVersions = true;
  form.overwritePolicy = "merge";
  form.concurrency = 3;
  form.timeout = 120;
  formRef.value?.resetFields();
};
</script>

<style scoped lang="scss">
.sync-content {
  max-height: 600px;
  overflow-y: auto;
}

.form-section,
.preview-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.registry-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.registry-name {
  font-weight: 500;
}

.registry-type {
  font-size: 12px;
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.preview-info {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 16px;
}

.preview-item {
  display: flex;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  width: 100px;
  color: #374151;
  font-weight: 500;
}

.preview-value {
  color: #1f2937;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
